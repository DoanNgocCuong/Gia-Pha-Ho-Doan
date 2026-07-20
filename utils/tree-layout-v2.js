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
function computeAbsoluteLayout(model, focusDepth, layoutConfig, nodeWidthsMap) {
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
    const VG_landscape = (cfg.spacing.between_generations_gap_landscape_cm !== undefined
        ? cfg.spacing.between_generations_gap_landscape_cm
        : cfg.spacing.between_generations_gap_cm) * cmPx;

    // Width thực của node theo đời:
    // - d0, d1, d2 (đời 1-3): CSS swap width/height → ô landscape, width = height_cm (~454px)
    // - d3+: ô portrait mặc định, width = width_cm (~57px)
    // Cần phân biệt để Phase 2/2b/2c tính bbox + minCx đúng, tránh ô cụ tổ dôi ra ngoài canvas.
    function widthAtDepth(d) {
        return (d <= 2) ? (H * 1.5) : W;
    }

    // Per-node width: d<=2 always use landscape H; d3+ look up nodeWidthsMap or fall back to W
    const usedWidths = new Map();
    function getWd(entry, d) {
        if (d <= 2) return widthAtDepth(d);
        if (nodeWidthsMap) {
            const w = nodeWidthsMap.get(entry.id);
            if (w != null && w > 0) return w;
        }
        return W;
    }

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
    // Landscape nodes (d0-d2) are visually (W * scale) px tall, not H px.
    // Use compact step so đời 1-2 and 2-3 gaps match actual node size.
    function yOf(d) {
        const g1_scale = cfg.node.generation_overrides['1'].enabled ? cfg.node.generation_overrides['1'].scale : 1;
        const g2_scale = cfg.node.generation_overrides['2'].enabled ? cfg.node.generation_overrides['2'].scale : 1;
        const g3_scale = cfg.node.generation_overrides['3'].enabled ? cfg.node.generation_overrides['3'].scale : 1;

        const h0 = W * g1_scale;
        const h1 = W * g2_scale;
        const h2 = W * g3_scale;

        // Khoảng cách đời 1-2 ngắn lại (mặc định 3.0cm), đời 2-3 kéo dài ra như cũ (bằng between_generations_gap_cm)
        const gap_landscape_cm = cfg.spacing.between_generations_gap_landscape_cm !== undefined
            ? cfg.spacing.between_generations_gap_landscape_cm
            : 3.0;
        const vg0 = gap_landscape_cm * cmPx;
        const vg1 = VG; // Kéo dài ra như cũ
        const vg2 = VG; // gap giữa đời 3 và 4 (landscape và portrait)

        if (d === 0) return 0;
        if (d === 1) return h0 + vg0;
        if (d === 2) return h0 + vg0 + h1 + vg1;
        if (d === 3) return h0 + vg0 + h1 + vg1 + h2 + vg2;
        return (h0 + vg0 + h1 + vg1 + h2 + vg2) + (d - 3) * (H + VG);
    }

    // ── Phase 1: Focus row, placed left-to-right with per-node widths ─────
    const focusRow = levels[focus];
    const focusY   = yOf(focus);
    {
        let cumX = 0;
        focusRow.forEach(function (entry) {
            const wi = getWd(entry, focus);
            const cx = cumX + wi / 2;
            positions.set(entry.id, { x: cx, y: focusY });
            usedWidths.set(entry.id, wi);
            cumX += wi + G;
        });
    }

    // Bbox (left/right) per node: union of self and subtree bbox (reaches down to focus)
    const bboxX = new Map();
    focusRow.forEach(function (entry) {
        const cp = positions.get(entry.id);
        const wi = usedWidths.get(entry.id) || W;
        bboxX.set(entry.id, { left: cp.x - wi / 2, right: cp.x + wi / 2 });
    });

    // ── Phase 2: Ancestors (d = focus-1 → 0) — bbox-midpoint ─────────────
    for (let d = focus - 1; d >= 0; d--) {
        const dY    = yOf(d);
        const dRow  = levels[d];
        const Wd    = widthAtDepth(d);

        // Aggregate per parentId:
        //   childBboxByParent — subtree bbox (cho bboxX.set, collision avoidance)
        //   childCxByParent   — cx của các con trực tiếp (cho desiredCx centering)
        // Tách 2 metric để parent nằm giữa con TRỰC TIẾP, không bị kéo lệch bởi
        // subtree một bên có nhiều cháu chắt lan rộng.
        const childBboxByParent = new Map();
        const childCxByParent   = new Map();
        levels[d + 1].forEach(function (childEntry) {
            const cp = positions.get(childEntry.id);
            const cb = bboxX.get(childEntry.id);
            if (!cp) return;
            const pid = childEntry.parentId;

            if (cb) {
                const curBbox = childBboxByParent.get(pid);
                if (!curBbox) {
                    childBboxByParent.set(pid, { left: cb.left, right: cb.right });
                } else {
                    if (cb.left  < curBbox.left)  curBbox.left  = cb.left;
                    if (cb.right > curBbox.right) curBbox.right = cb.right;
                }
            }

            const curCx = childCxByParent.get(pid);
            if (!curCx) {
                childCxByParent.set(pid, { left: cp.x, right: cp.x });
            } else {
                if (cp.x < curCx.left)  curCx.left  = cp.x;
                if (cp.x > curCx.right) curCx.right = cp.x;
            }
        });

        // Sweep left→right: center each ancestor over MIDPOINT of direct children cx,
        // enforce G gap. bboxX vẫn dùng subtree bbox để các đời trên biết phạm vi.
        let prevRight = -Infinity;
        dRow.forEach(function (entry) {
            const cc        = childCxByParent.get(entry.id);
            const desiredCx = cc ? (cc.left + cc.right) / 2 : null;
            const minCx     = (prevRight === -Infinity) ? (Wd / 2) : (prevRight + G + Wd / 2);
            const cx        = (desiredCx !== null) ? Math.max(desiredCx, minCx) : minCx;
            positions.set(entry.id, { x: cx, y: dY });
            prevRight = cx + Wd / 2;

            const cb = childBboxByParent.get(entry.id);
            const myLeft   = cx - Wd / 2;
            const myRight  = cx + Wd / 2;
            const finalLeft  = cb ? Math.min(cb.left,  myLeft)  : myLeft;
            const finalRight = cb ? Math.max(cb.right, myRight) : myRight;
            bboxX.set(entry.id, { left: finalLeft, right: finalRight });
            usedWidths.set(entry.id, Wd);
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
                const Wd = widthAtDepth(d);
                let rRow = -Infinity, lRow = Infinity;
                levels[d].forEach(function (entry) {
                    const p = positions.get(entry.id);
                    if (!p) return;
                    const right = p.x + Wd / 2;
                    const left  = p.x - Wd / 2;
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
    // ANCESTOR_RIGHT_MARGIN: pull ancestor target right edge in by N px so
    // các đời 1-3 (ô landscape rộng 454px) không dính sát mép phải canvas.
    // Tăng giá trị này nếu muốn ancestor lùi sâu hơn về trái.
    const ANCESTOR_RIGHT_MARGIN = 333;
    if (focus > 0) {
        let rFocusC = -Infinity;
        focusRow.forEach(function (entry) {
            const p = positions.get(entry.id);
            if (p) rFocusC = Math.max(rFocusC, p.x + W / 2);
        });
        rFocusC -= ANCESTOR_RIGHT_MARGIN;

        if (Number.isFinite(rFocusC)) {
            for (let d = 0; d < focus; d++) {
                const Wd = widthAtDepth(d);
                const row = levels[d];
                if (!row.length) continue;

                let rRow = -Infinity;
                row.forEach(function (e) {
                    const p = positions.get(e.id);
                    if (p) rRow = Math.max(rRow, p.x + Wd / 2);
                });
                const overflow = rRow - rFocusC;
                if (overflow <= 0.5) continue;

                let remaining = overflow;
                for (let i = row.length - 1; i >= 0 && remaining > 0.5; i--) {
                    const p = positions.get(row[i].id);
                    if (!p) continue;
                    let maxShift;
                    if (i === 0) {
                        maxShift = p.x - Wd / 2;
                    } else {
                        const prev = positions.get(row[i - 1].id);
                        if (!prev) continue;
                        const gap = (p.x - Wd / 2) - (prev.x + Wd / 2);
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

    // ── Phase 2e: Re-center ancestors over their children after shifting (only for d0 & d1) ──
    for (let d = 1; d >= 0; d--) {
        const dRow = levels[d];
        if (!dRow || !dRow.length) continue;

        const childCxByParent = new Map();
        levels[d + 1].forEach(function (childEntry) {
            const cp = positions.get(childEntry.id);
            if (!cp) return;
            const pid = childEntry.parentId;
            const curCx = childCxByParent.get(pid);
            if (!curCx) {
                childCxByParent.set(pid, { left: cp.x, right: cp.x });
            } else {
                if (cp.x < curCx.left)  curCx.left  = cp.x;
                if (cp.x > curCx.right) curCx.right = cp.x;
            }
        });

        dRow.forEach(function (entry) {
            const cc = childCxByParent.get(entry.id);
            if (cc) {
                const newCx = (cc.left + cc.right) / 2;
                positions.set(entry.id, { x: newCx, y: positions.get(entry.id).y });
            }
        });
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

            const clW       = cluster.map(function (e) { return getWd(e, d); });
            const totalSpan = clW.reduce(function (s, w) { return s + w; }, 0) + (n - 1) * G;

            let desiredFirstCx;
            if (parent) {
                desiredFirstCx = parent.x - totalSpan / 2 + clW[0] / 2;
            } else {
                desiredFirstCx = (prevRight === -Infinity) ? (clW[0] / 2) : (prevRight + G + clW[0] / 2);
            }

            const minFirstCx = (prevRight === -Infinity) ? (clW[0] / 2) : (prevRight + G + clW[0] / 2);
            const firstCx    = Math.max(desiredFirstCx, minFirstCx);

            let cx = firstCx;
            for (let k = 0; k < n; k++) {
                positions.set(cluster[k].id, { x: cx, y: dY });
                usedWidths.set(cluster[k].id, clW[k]);
                if (k < n - 1) cx += clW[k] / 2 + G + clW[k + 1] / 2;
            }
            prevRight = cx + clW[n - 1] / 2;

            i = j;
        }
    }

    // ── Phase 3b: Clamp descendant rows to not overflow focus row (mirror 2b)
    if (focus + 1 < D) {
        let rFocusDesc = -Infinity;
        focusRow.forEach(function (entry) {
            const p = positions.get(entry.id);
            if (!p) return;
            const right = p.x + (usedWidths.get(entry.id) || W) / 2;
            if (right > rFocusDesc) rFocusDesc = right;
        });

        if (Number.isFinite(rFocusDesc)) {
            for (let d = focus + 1; d < D; d++) {
                let rRow = -Infinity, lRow = Infinity;
                levels[d].forEach(function (entry) {
                    const p  = positions.get(entry.id);
                    if (!p) return;
                    const ew = (usedWidths.get(entry.id) || W) / 2;
                    if (p.x + ew > rRow) rRow = p.x + ew;
                    if (p.x - ew < lRow) lRow = p.x - ew;
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
            if (p) rFocusDescC = Math.max(rFocusDescC, p.x + (usedWidths.get(entry.id) || W) / 2);
        });

        if (Number.isFinite(rFocusDescC)) {
            for (let d = focus + 1; d < D; d++) {
                const row = levels[d];
                if (!row.length) continue;

                let rRow = -Infinity;
                row.forEach(function (e) {
                    const p = positions.get(e.id);
                    if (p) rRow = Math.max(rRow, p.x + (usedWidths.get(e.id) || W) / 2);
                });
                const overflow = rRow - rFocusDescC;
                if (overflow <= 0.5) continue;

                let remaining = overflow;
                for (let i = row.length - 1; i >= 0 && remaining > 0.5; i--) {
                    const p  = positions.get(row[i].id);
                    if (!p) continue;
                    const wi = (usedWidths.get(row[i].id) || W) / 2;
                    let maxShift;
                    if (i === 0) {
                        maxShift = p.x - wi;
                    } else {
                        const prev = positions.get(row[i - 1].id);
                        if (!prev) continue;
                        const prevW = (usedWidths.get(row[i - 1].id) || W) / 2;
                        const gap = (p.x - wi) - (prev.x + prevW);
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
    positions.forEach(function (p, id) {
        const right = p.x + (usedWidths.get(id) || W) / 2;
        if (right > maxRight) maxRight = right;
    });
    const totalWidth  = Math.ceil(maxRight);
    const lastRowVisualH = (function (d) {
        if (d === 0) return W * (cfg.node.generation_overrides['1'].enabled ? cfg.node.generation_overrides['1'].scale : 1);
        if (d === 1) return W * (cfg.node.generation_overrides['2'].enabled ? cfg.node.generation_overrides['2'].scale : 1);
        if (d === 2) return W * (cfg.node.generation_overrides['3'].enabled ? cfg.node.generation_overrides['3'].scale : 1);
        return H;
    })(D - 1);
    const totalHeight = Math.ceil(yOf(D - 1) + lastRowVisualH);

    // ── DEBUG: log focus row + đời 3 + đời 4 positions ───────────────────────
    // Remove this block sau khi xác minh vị trí III/HỖ/SƠN có thực sự thò ra không.
    try {
        let rFocusDbg = -Infinity;
        levels[focus].forEach(function (e) {
            const p = positions.get(e.id);
            if (p) rFocusDbg = Math.max(rFocusDbg, p.x + W / 2);
        });
        console.log('[layout-debug] focus depth =', focus, '(đời ' + (focus + 1) + ')');
        console.log('[layout-debug] rFocus =', rFocusDbg.toFixed(1), 'px  | totalWidth =', totalWidth, 'px  | W =', W, 'G =', G);
        [2, 3].forEach(function (d) {
            console.log('[layout-debug] === đời ' + (d + 1) + ' (depth=' + d + ') ===');
            (levels[d] || []).forEach(function (e) {
                const p = positions.get(e.id);
                if (!p) return;
                const name = (e.nodeRef && e.nodeRef.name) || '?';
                const right = p.x + W / 2;
                const pct = rFocusDbg > 0 ? (p.x / rFocusDbg * 100).toFixed(1) : '?';
                const thora = right > rFocusDbg + 0.5 ? '  ⚠️ THÒ RA ' + (right - rFocusDbg).toFixed(1) + 'px' : '';
                console.log('  ' + name.slice(0, 50) + '  x=' + p.x.toFixed(1) + 'px (' + pct + '%) right=' + right.toFixed(1) + thora);
            });
        });
    } catch (e) { console.warn('[layout-debug] error', e); }

    return { positions: positions, totalWidth: totalWidth, totalHeight: totalHeight, W: W, H: H, usedWidths: usedWidths };
}

/**
 * Apply computed absolute positions to the DOM:
 *   1. Add .absolute-layout class (switches ul/li to display:contents).
 *   2. Set width/height on the container.
 *   3. Set left/top on each .node via [data-node-id] attribute.
 *
 * @param {object} [layoutConfig] - Optional validated print config (same as bootstrap).
 */
function applyAbsoluteLayout(layoutConfig, nodeWidthsMap) {
    const strat = document.querySelector('.tree.svg-edges-active');
    if (!strat || !treeState.stratifiedGraphModel) return;

    const layout = computeAbsoluteLayout(
        treeState.stratifiedGraphModel,
        treeState.treeCompactFocusDepth,
        layoutConfig,
        nodeWidthsMap
    );
    if (!layout.positions || layout.positions.size === 0) return;

    strat.classList.add('absolute-layout');
    strat.style.width  = layout.totalWidth  + 'px';
    strat.style.height = layout.totalHeight + 'px';

    layout.positions.forEach(function (pos, id) {
        const el = strat.querySelector('[data-node-id="' + id + '"]');
        if (!el) return;
        const w = (layout.usedWidths && layout.usedWidths.get(id)) || layout.W;
        el.style.left  = (pos.x - w / 2) + 'px';
        el.style.top   = pos.y + 'px';
        // Set per-element CSS variable so CSS `width: var(--node-width) !important`
        // resolves to the measured per-node width (landscape nodes use --node-height, skip).
        const isLandscape = el.classList.contains('d0') || el.classList.contains('d1') || el.classList.contains('d2');
        if (!isLandscape) {
            el.style.setProperty('--node-width', w + 'px');
        }
        el.style.width = w + 'px';
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
