/**
 * @module tree-layout
 * @description Tree layout engine: stratified model, bottom-up absolute positioning.
 *
 * Dependencies:
 *   - tree-state.js    (reads/writes `treeState.stratifiedGraphModel`,
 *                      `treeState.treeCompactFocusDepth`, `TREE_COMPACT_PASSES`,
 *                      `treeState.activePrintSizeConfig`, `treeState.treeResizeObserver`)
 *   - print-config.js (reads `DEFAULT_PRINT_SIZE_CONFIG`)
 *   - css-units.js    (reads `cssCmToPxFactor`)
 *   - tree-edges.js   (calls `scheduleDrawTreeEdges`)
 *
 * BOTTOM-UP ABSOLUTE LAYOUT ALGORITHM (computeAbsoluteLayout):
 *
 *   Phase 1 — Focus row (densest generation):
 *     Nodes placed at x = i * (W + G), uniformly, non-overlapping.
 *
 *   Phase 2 — Ancestors (d = focus-1 → 0):
 *     Each ancestor centered over its subtree bbox (Reingold–Tilford "tight"),
 *     then swept left→right to ensure gap ≥ G between siblings.
 *
 *   Phase 2b — Ancestor right-clamp:
 *     If a pre-ancestor row overflows past the focus row's right edge,
 *     the entire row is shifted left uniformly (bounded by x=0).
 *
 *   Phase 2c — Cascading left-pack:
 *     For rows still overflowing after Phase 2b, compact from right-to-left:
 *     at each gap, shift the suffix left by min(slack, remaining_overflow).
 *     Trade-off: intra-row gaps are no longer uniform.
 *
 *   Phase 2d — Parent cx clamp (MATHEMATICAL NON-CROSSING GUARANTEE):
 *     Clamp every ancestor.cx to [leftmost child cx, rightmost child cx].
 *     This makes each parent's bus interval equal its children's range.
 *     Since children of different parents are disjoint in preorder,
 *     buses are disjoint → zero crossings between edges of different parents.
 *
 *   Phase 3 — Descendants (d = focus+1 → maxDepth):
 *     Each child cluster centered around its parent, then swept to avoid overlap.
 *
 *   Phase 3b — Descendant right-clamp (mirror of 2b):
 *     Each row d > focus: if row right edge exceeds R_focus, shift entire row left
 *     (bounded by x ≥ 0), same formula as Phase 2b.
 *
 *   Phase 3c — Descendant cascading left-pack (mirror of 2c):
 *     Suffix shifts on descendant rows still past R_focus after 3b.
 */

import { treeState, TREE_COMPACT_PASSES } from './tree-state-v2.js';
import { DEFAULT_PRINT_SIZE_CONFIG, giaPhaLog } from './print-config-v2.js';
import { cssCmToPxFactor } from './css-units-v2.js';
import { scheduleDrawTreeEdges } from './tree-edges-v2.js';

// ── Stratified model builder ──────────────────────────────────────────────────

/**
 * Preorder traversal: group nodes by depth, assign synthetic IDs, collect edges.
 *
 * @param {object} root - The tree root node object.
 * @returns {{levels: Array<Array<{id, nodeRef, parentId}>>, edges: Array<{parentId, childId}>}}
 */
function buildStratifiedModel(root) {
    const levels  = [];
    const edges   = [];
    let idCounter = 0;

    function visit(node, parentId) {
        const id    = 'gp-' + idCounter++;
        const depth = Number.isFinite(node.depth) ? Math.max(0, Number(node.depth)) : 0;
        while (levels.length <= depth) levels.push([]);
        levels[depth].push({ id: id, nodeRef: node, parentId: parentId });

        if (parentId !== null && parentId !== undefined) {
            edges.push({ parentId: parentId, childId: id });
        }

        const children = Array.isArray(node.children) ? node.children : [];
        for (let i = 0; i < children.length; i++) {
            visit(children[i], id);
        }
    }

    visit(root, null);
    return { levels: levels, edges: edges };
}

/**
 * Find the depth (0-based) of the generation with the most nodes.
 * This is used as the "focus" depth for bottom-up absolute layout.
 *
 * @param {{levels: Array}} model - Stratified graph model.
 * @returns {number|null}
 */
function computeBusiestGenerationDepth(model) {
    if (!model || !model.levels || !model.levels.length) return null;
    let best = 0, maxN = -1;
    for (let d = 0; d < model.levels.length; d++) {
        const n = model.levels[d].length;
        if (n > maxN) { maxN = n; best = d; }
    }
    return best;
}

// ── Contour-based compaction (legacy — does not affect absolute layout) ────────

/**
 * Cluster consecutive nodes sharing the same parentId.
 * Note: this is currently dead code — it is defined but not called anywhere.
 * Kept for future use.
 *
 * @param {Array} row - Level row entries.
 * @returns {Array<{parentId, entries: Array}>}
 */
function clusterLevelRowByParent(row) {
    if (!row || !row.length) return [];
    const clusters = [];
    let cur = { parentId: row[0].parentId, entries: [row[0]] };
    for (let i = 1; i < row.length; i++) {
        const e = row[i];
        if (e.parentId === cur.parentId) {
            cur.entries.push(e);
        } else {
            clusters.push(cur);
            cur = { parentId: e.parentId, entries: [e] };
        }
    }
    clusters.push(cur);
    return clusters;
}

/**
 * Contour-based left-compaction of the tree.
 * Note: when .absolute-layout is active, .node uses position:absolute
 * and margin adjustments on <li> have no effect. This function is
 * preserved for compatibility but does not alter absolute positions.
 */
function compactTreeLayout() {
    const strat = document.querySelector('.tree.svg-edges-active');
    if (!strat) return;

    const allLis = strat.querySelectorAll('li');
    for (let i = 0; i < allLis.length; i++) {
        allLis[i].style.marginLeft  = '';
        allLis[i].style.marginRight = '';
    }

    const rootStyle = getComputedStyle(document.documentElement);
    let SAFE_GAP  = parseFloat(rootStyle.getPropertyValue('--tree-compact-safe-gap'));
    if (!Number.isFinite(SAFE_GAP))  SAFE_GAP  = 4;
    let FOCUS_GAP = parseFloat(rootStyle.getPropertyValue('--tree-compact-focus-gap'));
    if (!Number.isFinite(FOCUS_GAP)) FOCUS_GAP = 0;

    // currentScale: not defined in this project — guard ensures it falls back to 1
    const scale = (typeof currentScale !== 'undefined') ? currentScale : 1;
    const focusDepthStr = treeState.treeCompactFocusDepth !== null && treeState.treeCompactFocusDepth !== undefined
        ? String(treeState.treeCompactFocusDepth)
        : null;

    for (let pass = 0; pass < TREE_COMPACT_PASSES; pass++) {
        const uls = Array.from(strat.querySelectorAll('ul')).reverse();
        uls.forEach(function (ul) {
            const lis = Array.from(ul.children);
            if (lis.length <= 1) return;

            for (let i = 1; i < lis.length; i++) {
                const currentLi = lis[i];

                const leftNodes  = [];
                const rightNodes = Array.from(currentLi.querySelectorAll('.node'));
                for (let j = 0; j < i; j++) {
                    leftNodes.push(...lis[j].querySelectorAll('.node'));
                }
                if (leftNodes.length === 0 || rightNodes.length === 0) continue;

                const rightContour = {};
                leftNodes.forEach(function (n) {
                    const rect   = n.getBoundingClientRect();
                    const dMatch = n.className.match(/d(\d+)/);
                    if (!dMatch) return;
                    const depth = dMatch[1];
                    if (!rightContour[depth] || rect.right > rightContour[depth]) {
                        rightContour[depth] = rect.right;
                    }
                });

                const leftContour = {};
                rightNodes.forEach(function (n) {
                    const rect   = n.getBoundingClientRect();
                    const dMatch = n.className.match(/d(\d+)/);
                    if (!dMatch) return;
                    const depth = dMatch[1];
                    if (!leftContour[depth] || rect.left < leftContour[depth]) {
                        leftContour[depth] = rect.left;
                    }
                });

                let minDistanceAllDepths = Infinity;
                for (let depth in leftContour) {
                    if (rightContour[depth] !== undefined) {
                        const d = (leftContour[depth] - rightContour[depth]) / scale;
                        if (d < minDistanceAllDepths) minDistanceAllDepths = d;
                    }
                }
                if (minDistanceAllDepths === Infinity) continue;

                let focusDistance = null;
                if (focusDepthStr !== null &&
                    leftContour[focusDepthStr] !== undefined &&
                    rightContour[focusDepthStr] !== undefined) {
                    focusDistance = (leftContour[focusDepthStr] - rightContour[focusDepthStr]) / scale;
                }

                const idealShift   = focusDistance !== null
                    ? focusDistance - FOCUS_GAP
                    : minDistanceAllDepths - SAFE_GAP;
                const maxSafeShift = minDistanceAllDepths - SAFE_GAP;
                const actualShift  = Math.min(idealShift, maxSafeShift);

                if (Math.abs(actualShift) > 0.5) {
                    const currentMarginLeft = parseFloat(window.getComputedStyle(currentLi).marginLeft) || 0;
                    currentLi.style.marginLeft = (currentMarginLeft - actualShift) + 'px';
                }
            }
        });
    }
}

// ── Absolute layout computation ────────────────────────────────────────────────

/**
 * Bottom-up absolute layout from the focus generation.
 *
 * @param {{levels: Array<Array>, edges: Array}} model - Stratified graph model.
 * @param {number|null} focusDepth - 0-based depth of the densest generation.
 * @param {object} [layoutConfig] - Validated print config; if omitted, uses
 *   `treeState.activePrintSizeConfig` then `DEFAULT_PRINT_SIZE_CONFIG`.
 * @returns {{positions: Map<string,{x:number,y:number}>, totalWidth: number,
 *            totalHeight: number, W: number, H: number}}
 */
function computeAbsoluteLayout(model, focusDepth, layoutConfig) {
    if (!model || !model.levels || !model.levels.length) {
        return { positions: new Map(), totalWidth: 0, totalHeight: 0 };
    }

    const cmPx = cssCmToPxFactor();
    const cfg  = (layoutConfig && typeof layoutConfig === 'object')
        ? layoutConfig
        : (treeState.activePrintSizeConfig || DEFAULT_PRINT_SIZE_CONFIG);
    const W    = cfg.node.default.width_cm * cmPx;
    const H    = cfg.node.default.height_cm * cmPx;
    const G    = cfg.spacing.same_generation_gap_cm * cmPx;
    const VG   = cfg.spacing.between_generations_gap_cm * cmPx;

    giaPhaLog('computeAbsoluteLayout', {
        configSource: layoutConfig && typeof layoutConfig === 'object'
            ? 'argument'
            : (treeState.activePrintSizeConfig ? 'treeState.activePrintSizeConfig' : 'DEFAULT_PRINT_SIZE_CONFIG'),
        generations: model.levels.length,
        focusDepth: focusDepth,
        width_px: W,
        height_px: H,
        same_gen_gap_px: G,
        between_gen_gap_px: VG,
        row_step_px: H + VG,
        between_generations_gap_cm: cfg.spacing.between_generations_gap_cm
    });

    const levels = model.levels;
    const D      = levels.length;
    const focus  = (focusDepth !== null && focusDepth !== undefined &&
                    focusDepth >= 0 && focusDepth < D)
        ? focusDepth
        : 0;

    /** positions.get(id) = {x: center-x px, y: top-y px} */
    const positions = new Map();
    function yOf(d) { return d * (H + VG); }

    // ── Phase 1: Focus row, uniformly spaced ──────────────────────────────
    const focusRow = levels[focus];
    const focusY   = yOf(focus);
    focusRow.forEach(function (entry, i) {
        positions.set(entry.id, { x: i * (W + G) + W / 2, y: focusY });
    });

    // Bbox (left/right) per node: union of self and subtree bbox (reaches down to focus)
    const bboxX = new Map();
    focusRow.forEach(function (entry) {
        const cp = positions.get(entry.id);
        bboxX.set(entry.id, { left: cp.x - W / 2, right: cp.x + W / 2 });
    });

    // ── Phase 2: Ancestors (d = focus-1 → 0) — bbox-midpoint ─────────────
    for (let d = focus - 1; d >= 0; d--) {
        const dY    = yOf(d);
        const dRow  = levels[d];

        // Aggregate child bbox by parentId
        const childBboxByParent = new Map();
        levels[d + 1].forEach(function (childEntry) {
            const cb = bboxX.get(childEntry.id);
            if (!cb) return;
            const pid = childEntry.parentId;
            const cur = childBboxByParent.get(pid);
            if (!cur) {
                childBboxByParent.set(pid, { left: cb.left, right: cb.right });
            } else {
                if (cb.left  < cur.left)  cur.left  = cb.left;
                if (cb.right > cur.right) cur.right = cb.right;
            }
        });

        // Sweep left→right: center each ancestor over its subtree, enforce G gap
        let prevRight = -Infinity;
        dRow.forEach(function (entry) {
            const cb        = childBboxByParent.get(entry.id);
            const desiredCx = cb ? (cb.left + cb.right) / 2 : null;
            const minCx     = (prevRight === -Infinity) ? (W / 2) : (prevRight + G + W / 2);
            const cx        = (desiredCx !== null) ? Math.max(desiredCx, minCx) : minCx;
            positions.set(entry.id, { x: cx, y: dY });
            prevRight = cx + W / 2;

            const myLeft   = cx - W / 2;
            const myRight  = cx + W / 2;
            const finalLeft  = cb ? Math.min(cb.left,  myLeft)  : myLeft;
            const finalRight = cb ? Math.max(cb.right, myRight) : myRight;
            bboxX.set(entry.id, { left: finalLeft, right: finalRight });
        });
    }

    // ── Phase 2b: Clamp ancestor rows to not overflow focus row ───────────
    if (focus > 0) {
        let rFocus = -Infinity;
        focusRow.forEach(function (entry) {
            const p = positions.get(entry.id);
            if (!p) return;
            const right = p.x + W / 2;
            if (right > rFocus) rFocus = right;
        });

        if (Number.isFinite(rFocus)) {
            for (let d = 0; d < focus; d++) {
                let rRow = -Infinity, lRow = Infinity;
                levels[d].forEach(function (entry) {
                    const p = positions.get(entry.id);
                    if (!p) return;
                    const right = p.x + W / 2;
                    const left  = p.x - W / 2;
                    if (right > rRow) rRow = right;
                    if (left  < lRow) lRow = left;
                });
                if (!Number.isFinite(rRow) || !Number.isFinite(lRow)) continue;

                const overflow = rRow - rFocus;
                if (overflow <= 0.5) continue;

                const shift = Math.min(overflow, Math.max(0, lRow));
                if (shift <= 0.5) continue;

                levels[d].forEach(function (entry) {
                    const p = positions.get(entry.id);
                    if (!p) return;
                    positions.set(entry.id, { x: p.x - shift, y: p.y });
                });
            }
        }
    }

    // ── Phase 2c: Cascading left-pack for rows still overflowing ──────────
    if (focus > 0) {
        let rFocusC = -Infinity;
        focusRow.forEach(function (entry) {
            const p = positions.get(entry.id);
            if (p) rFocusC = Math.max(rFocusC, p.x + W / 2);
        });

        if (Number.isFinite(rFocusC)) {
            for (let d = 0; d < focus; d++) {
                const row = levels[d];
                if (!row.length) continue;

                let rRow = -Infinity;
                row.forEach(function (e) {
                    const p = positions.get(e.id);
                    if (p) rRow = Math.max(rRow, p.x + W / 2);
                });
                const overflow = rRow - rFocusC;
                if (overflow <= 0.5) continue;

                let remaining = overflow;
                for (let i = row.length - 1; i >= 0 && remaining > 0.5; i--) {
                    const p = positions.get(row[i].id);
                    if (!p) continue;
                    let maxShift;
                    if (i === 0) {
                        maxShift = p.x - W / 2;
                    } else {
                        const prev = positions.get(row[i - 1].id);
                        if (!prev) continue;
                        const gap = (p.x - W / 2) - (prev.x + W / 2);
                        maxShift = Math.max(0, gap - G);
                    }
                    const myShift = Math.min(remaining, maxShift);
                    if (myShift > 0.01) {
                        for (let j = i; j < row.length; j++) {
                            const pj = positions.get(row[j].id);
                            if (pj) positions.set(row[j].id, { x: pj.x - myShift, y: pj.y });
                        }
                        remaining -= myShift;
                    }
                }
            }
        }
    }

    // ── Phase 3: Descendants (d = focus+1 → maxDepth) ───────────────────
    for (let d = focus + 1; d < D; d++) {
        const dY    = yOf(d);
        const dRow  = levels[d];

        let prevRight = -Infinity;
        let i = 0;
        while (i < dRow.length) {
            const parentId = dRow[i].parentId;
            const parent   = positions.get(parentId);

            // Gather consecutive entries sharing the same parentId
            let j = i;
            while (j < dRow.length && dRow[j].parentId === parentId) j++;
            const cluster = dRow.slice(i, j);
            const n       = cluster.length;

            let desiredFirstCx;
            if (parent) {
                const span = n * W + (n - 1) * G;
                desiredFirstCx = parent.x - span / 2 + W / 2;
            } else {
                desiredFirstCx = (prevRight === -Infinity) ? (W / 2) : (prevRight + G + W / 2);
            }

            const minFirstCx = (prevRight === -Infinity) ? (W / 2) : (prevRight + G + W / 2);
            const firstCx    = Math.max(desiredFirstCx, minFirstCx);

            for (let k = 0; k < n; k++) {
                positions.set(cluster[k].id, { x: firstCx + k * (W + G), y: dY });
            }
            prevRight = firstCx + (n - 1) * (W + G) + W / 2;

            i = j;
        }
    }

    // ── Phase 3b: Clamp descendant rows to not overflow focus row (mirror 2b)
    if (focus + 1 < D) {
        let rFocusDesc = -Infinity;
        focusRow.forEach(function (entry) {
            const p = positions.get(entry.id);
            if (!p) return;
            const right = p.x + W / 2;
            if (right > rFocusDesc) rFocusDesc = right;
        });

        if (Number.isFinite(rFocusDesc)) {
            for (let d = focus + 1; d < D; d++) {
                let rRow = -Infinity, lRow = Infinity;
                levels[d].forEach(function (entry) {
                    const p = positions.get(entry.id);
                    if (!p) return;
                    const right = p.x + W / 2;
                    const left  = p.x - W / 2;
                    if (right > rRow) rRow = right;
                    if (left  < lRow) lRow = left;
                });
                if (!Number.isFinite(rRow) || !Number.isFinite(lRow)) continue;

                const overflow = rRow - rFocusDesc;
                if (overflow <= 0.5) continue;

                const shift = Math.min(overflow, Math.max(0, lRow));
                if (shift <= 0.5) continue;

                levels[d].forEach(function (entry) {
                    const p = positions.get(entry.id);
                    if (!p) return;
                    positions.set(entry.id, { x: p.x - shift, y: p.y });
                });
            }
        }
    }

    // ── Phase 3c: Cascading left-pack on descendant rows (mirror 2c) ───────
    if (focus + 1 < D) {
        let rFocusDescC = -Infinity;
        focusRow.forEach(function (entry) {
            const p = positions.get(entry.id);
            if (p) rFocusDescC = Math.max(rFocusDescC, p.x + W / 2);
        });

        if (Number.isFinite(rFocusDescC)) {
            for (let d = focus + 1; d < D; d++) {
                const row = levels[d];
                if (!row.length) continue;

                let rRow = -Infinity;
                row.forEach(function (e) {
                    const p = positions.get(e.id);
                    if (p) rRow = Math.max(rRow, p.x + W / 2);
                });
                const overflow = rRow - rFocusDescC;
                if (overflow <= 0.5) continue;

                let remaining = overflow;
                for (let i = row.length - 1; i >= 0 && remaining > 0.5; i--) {
                    const p = positions.get(row[i].id);
                    if (!p) continue;
                    let maxShift;
                    if (i === 0) {
                        maxShift = p.x - W / 2;
                    } else {
                        const prev = positions.get(row[i - 1].id);
                        if (!prev) continue;
                        const gap = (p.x - W / 2) - (prev.x + W / 2);
                        maxShift = Math.max(0, gap - G);
                    }
                    const myShift = Math.min(remaining, maxShift);
                    if (myShift > 0.01) {
                        for (let j = i; j < row.length; j++) {
                            const pj = positions.get(row[j].id);
                            if (pj) positions.set(row[j].id, { x: pj.x - myShift, y: pj.y });
                        }
                        remaining -= myShift;
                    }
                }
            }
        }
    }

    // Phase 2d (Parent.cx clamp into children's [L, R] for non-crossing edges)
    // was REMOVED. Cascading bottom-up clamp caused width overflow (>270cm)
    // and didn't fully eliminate crossings due to interaction with preorder
    // bbox-midpoint placement. The simpler approach below trusts the bbox
    // layout and keeps width within budget; per-parent edge stagger (in the
    // edges drawer) will handle visual cleanliness.

    // ── Compute total dimensions ─────────────────────────────────────────────
    let maxRight = 0;
    positions.forEach(function (p) {
        const right = p.x + W / 2;
        if (right > maxRight) maxRight = right;
    });
    const totalWidth  = Math.ceil(maxRight);
    const totalHeight = Math.ceil(D * H + (D - 1) * VG);

    return { positions: positions, totalWidth: totalWidth, totalHeight: totalHeight, W: W, H: H };
}

/**
 * Apply computed absolute positions to the DOM:
 *   1. Add .absolute-layout class (switches ul/li to display:contents).
 *   2. Set width/height on the container.
 *   3. Set left/top on each .node via [data-node-id] attribute.
 *
 * @param {object} [layoutConfig] - Optional validated print config (same as bootstrap).
 */
function applyAbsoluteLayout(layoutConfig) {
    const strat = document.querySelector('.tree.svg-edges-active');
    if (!strat || !treeState.stratifiedGraphModel) return;

    const layout = computeAbsoluteLayout(
        treeState.stratifiedGraphModel,
        treeState.treeCompactFocusDepth,
        layoutConfig
    );
    if (!layout.positions || layout.positions.size === 0) return;

    strat.classList.add('absolute-layout');
    strat.style.width  = layout.totalWidth  + 'px';
    strat.style.height = layout.totalHeight + 'px';

    const halfW = layout.W / 2;
    layout.positions.forEach(function (pos, id) {
        const el = strat.querySelector('[data-node-id="' + id + '"]');
        if (!el) return;
        el.style.left = (pos.x - halfW) + 'px';
        el.style.top  = pos.y + 'px';
    });
}

// ── ResizeObserver ────────────────────────────────────────────────────────────

/**
 * Detach scroll listener used to keep generation labels aligned when panning the tree.
 */
function detachGenLabelScrollListener() {
    if (treeState.genLabelsScrollUnsub) {
        treeState.genLabelsScrollUnsub();
        treeState.genLabelsScrollUnsub = null;
    }
}

/**
 * Attach (or reattach) ResizeObserver on the tree container.
 * Fires measureAndPublishTreeLayoutSize + scheduleDrawTreeEdges on resize.
 * Rebinds scroll → renderGenerationLabels so rails stay aligned when .tree-wrapper scrolls.
 */
function attachTreeLayoutObservers() {
    const wrapper = document.querySelector('.tree-wrapper');
    const strat   = document.querySelector('.tree.svg-edges-active');
    if (!wrapper || !strat) return;

    detachGenLabelScrollListener();
    let scrollRaf = null;
    function onWrapperScroll() {
        if (scrollRaf !== null) return;
        scrollRaf = requestAnimationFrame(function () {
            scrollRaf = null;
            renderGenerationLabels();
        });
    }
    wrapper.addEventListener('scroll', onWrapperScroll, { passive: true });
    treeState.genLabelsScrollUnsub = function () {
        wrapper.removeEventListener('scroll', onWrapperScroll);
    };

    if (treeState.treeResizeObserver) treeState.treeResizeObserver.disconnect();
    treeState.treeResizeObserver = new ResizeObserver(function () {
        measureAndPublishTreeLayoutSize();
        scheduleDrawTreeEdges();
        requestAnimationFrame(function () {
            renderGenerationLabels();
        });
    });
    treeState.treeResizeObserver.observe(strat);
    treeState.treeResizeObserver.observe(wrapper);
}

// ── Measurement ───────────────────────────────────────────────────────────────

/**
 * Estimate minimum tree height in px given the number of generations.
 * Falls back to CSS variable --node-height if no DOM sample is found.
 *
 * @param {number} generationCount - Number of generations (G).
 * @returns {number} Estimated px.
 */
function estimateTreeMinHeightPx(generationCount) {
    const cmPx = cssCmToPxFactor();
    const cfg  = treeState.activePrintSizeConfig || DEFAULT_PRINT_SIZE_CONFIG;
    const nhCfg = cfg.node.default.height_cm * cmPx;
    const gapCfg = cfg.spacing.between_generations_gap_cm * cmPx;

    const strat = document.querySelector('.tree.svg-edges-active');
    const G    = Math.max(1, Math.floor(Number(generationCount) || 1));
    if (!strat) {
        return 20 + G * nhCfg + (G - 1) * gapCfg;
    }
    let gapY = gapCfg;
    const nestedUl = strat.querySelector('ul ul');
    if (nestedUl) {
        const pt = parseFloat(getComputedStyle(nestedUl).paddingTop);
        if (Number.isFinite(pt) && pt > 0) gapY = pt;
    }
    let sumRow = 0;
    for (let d = 0; d < G; d++) {
        const sample = strat.querySelector('.node.d' + d);
        if (sample) {
            sumRow += sample.getBoundingClientRect().height;
        } else {
            sumRow += nhCfg;
        }
    }
    return 20 + sumRow + (G - 1) * gapY;
}

/**
 * Measure the scroll size of the rendered tree and publish it as CSS variables.
 *
 * Sets on :root:
 *   --tree-scroll-width-px
 *   --tree-scroll-height-px
 *   --tree-height-cm-measured
 *
 * @returns {{scrollWidthPx: number, scrollHeightPx: number, heightCmMeasured: number,
 *            generationCount: number, estimatedMinHeightPx: number,
 *            canvasHeightCm: number|null, safeInnerHeightCm: number|null,
 *            heightFitsPrintCanvas: boolean|null}|null}
 */
function measureAndPublishTreeLayoutSize() {
    const strat = document.querySelector('.tree.svg-edges-active');
    const root  = document.documentElement;
    if (!strat) {
        root.style.setProperty('--tree-scroll-width-px',  '0px');
        root.style.setProperty('--tree-scroll-height-px', '0px');
        root.style.setProperty('--tree-height-cm-measured', '0cm');
        return null;
    }

    const w = strat.scrollWidth;
    const h = strat.scrollHeight;
    root.style.setProperty('--tree-scroll-width-px',  w + 'px');
    root.style.setProperty('--tree-scroll-height-px', h + 'px');

    const cmPx = cssCmToPxFactor();
    root.style.setProperty('--tree-height-cm-measured', (h / cmPx).toFixed(3) + 'cm');

    let generations    = 0;
    let estimatePx     = null;
    let heightFits     = null;
    let safeInnerH     = null;
    if (treeState.stratifiedGraphModel && treeState.stratifiedGraphModel.levels) {
        generations = treeState.stratifiedGraphModel.levels.length;
        estimatePx  = estimateTreeMinHeightPx(generations);
    }
    if (treeState.activePrintSizeConfig && treeState.activePrintSizeConfig.canvas) {
        const c = treeState.activePrintSizeConfig.canvas;
        const m = c.safe_margin_cm || { top: 0, bottom: 0 };
        const n = (v) => (Number.isFinite(v) ? v : 0);
        safeInnerH = n(c.height_cm) - n(m.top) - n(m.bottom);
        heightFits = h / cmPx <= safeInnerH + 0.01;
    }

    return {
        scrollWidthPx:        w,
        scrollHeightPx:       h,
        heightCmMeasured:     h / cmPx,
        generationCount:      generations,
        estimatedMinHeightPx: estimatePx,
        canvasHeightCm:       treeState.activePrintSizeConfig ? treeState.activePrintSizeConfig.canvas.height_cm : null,
        safeInnerHeightCm:    safeInnerH,
        heightFitsPrintCanvas: heightFits
    };
}

// Expose for external callers (e.g. browser console)
window.getTreeLayoutMetrics = measureAndPublishTreeLayoutSize;

// ── Generation labels ──────────────────────────────────────────────────────────

/** Gỡ width rail tùy chỉnh (px) để dùng lại rem từ tree-shell-config / fallback CSS. */
function resetGenLabelRailWidthCssVars() {
    document.documentElement.style.removeProperty('--tree-rail-left-width');
    document.documentElement.style.removeProperty('--tree-rail-right-width');
}

/**
 * Thu hẹp rail Đời / Nam–Nữ theo nhãn rộng nhất + slack (thay cho chỉ cố định rem).
 */
function fitGenLabelRailWidthsToContent() {
    const leftLabels  = document.querySelectorAll('.gen-labels-left .gen-label');
    const rightLabels = document.querySelectorAll('.gen-labels-right .gen-label');
    if (!leftLabels.length && !rightLabels.length) {
        resetGenLabelRailWidthCssVars();
        return;
    }

    const slackPx = 10;
    const minLeftPx  = 36;
    const minRightPx = 44;

    let maxL = 0;
    leftLabels.forEach(function (el) {
        maxL = Math.max(maxL, el.offsetWidth);
    });
    let maxR = 0;
    rightLabels.forEach(function (el) {
        maxR = Math.max(maxR, el.offsetWidth);
    });

    const wL = leftLabels.length ? Math.max(minLeftPx, Math.ceil(maxL + slackPx)) : minLeftPx;
    const wR = rightLabels.length ? Math.max(minRightPx, Math.ceil(maxR + slackPx)) : minRightPx;

    document.documentElement.style.setProperty('--tree-rail-left-width', wL + 'px');
    document.documentElement.style.setProperty('--tree-rail-right-width', wR + 'px');
}

/**
 * Render generation number labels (left) and gender counts (right) beside each tree row.
 * Must be called after applyAbsoluteLayout() so positions are known.
 * Uses actual rendered DOM positions to avoid mismatch with config-based math.
 */
function renderGenerationLabels() {
    const leftEl  = document.getElementById('genLabelsLeft');
    const rightEl = document.getElementById('genLabelsRight');
    const strat   = document.querySelector('.tree.svg-edges-active');
    if (!leftEl || !rightEl || !strat) return;

    leftEl.innerHTML  = '';
    rightEl.innerHTML = '';

    const model = treeState.stratifiedGraphModel;
    if (!model || !model.levels || !model.levels.length) {
        resetGenLabelRailWidthCssVars();
        return;
    }

    model.levels.forEach(function (level, depth) {
        if (!level || !level.length) return;

        // Measure actual rendered Y position from DOM — this is the single source of truth
        const sampleNode = strat.querySelector('.node.d' + depth);
        if (!sampleNode) return;
        const rect     = sampleNode.getBoundingClientRect();
        const railRect = leftEl.parentElement.getBoundingClientRect();
        const yCenter  = rect.top - railRect.top + rect.height / 2;

        // Left: đời số — căn giữa cả ngang lẫn dọc trong rail
        const leftDiv = document.createElement('div');
        leftDiv.className = 'gen-label';
        leftDiv.style.position = 'absolute';
        leftDiv.style.top = yCenter + 'px';
        leftDiv.style.left = '50%';
        leftDiv.style.transform = 'translate(-50%, -50%)';
        leftDiv.textContent = 'Đời ' + (depth + 1);
        leftEl.appendChild(leftDiv);

        // Right: Nam / Nữ count
        let maleCount   = 0;
        let femaleCount = 0;
        level.forEach(function (entry) {
            const g = entry.nodeRef && entry.nodeRef.gender;
            if (g === 'male')   maleCount++;
            if (g === 'female') femaleCount++;
        });

        const rightDiv = document.createElement('div');
        rightDiv.className = 'gen-label';
        rightDiv.style.position = 'absolute';
        rightDiv.style.top = yCenter + 'px';
        rightDiv.style.left = '50%';
        rightDiv.style.transform = 'translate(-50%, -50%)';
        const maleStr   = String(maleCount);
        const femaleStr = String(femaleCount);
        rightDiv.innerHTML =
            '<strong>Nam:</strong> ' + maleStr +
            '<br><strong>Nữ:</strong> ' + femaleStr;
        rightEl.appendChild(rightDiv);
    });

    requestAnimationFrame(function () {
        fitGenLabelRailWidthsToContent();
    });
}

export {
    buildStratifiedModel,
    computeBusiestGenerationDepth,
    clusterLevelRowByParent,
    computeAbsoluteLayout,
    applyAbsoluteLayout,
    attachTreeLayoutObservers,
    detachGenLabelScrollListener,
    cssCmToPxFactor,
    estimateTreeMinHeightPx,
    measureAndPublishTreeLayoutSize,
    renderGenerationLabels,
    resetGenLabelRailWidthCssVars
};
