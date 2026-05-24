/**
 * @module tree-edges
 * @description SVG edge (arrow) drawing for the family tree.
 *
 * Dependencies:
 *   - tree-state.js (reads `treeState.stratifiedGraphModel`,
 *                    reads/writes `treeState.edgesRedrawScheduled`)
 *
 * APPROACH: "Orthogonal bus" — classic org-chart routing.
 *
 * Each parent→child connection is a 3-segment orthogonal path:
 *   1. Vertical drop from parent bottom center to a horizontal bus line
 *   2. Horizontal bus segment to the child's X position
 *   3. Vertical drop from bus into child top center (arrowhead lands here)
 *
 * The bus Y for each parent's children sits midway between the parent's
 * bottom and the topmost child's top. Because sibling/parent ordering is
 * monotonic (eldest → youngest, left → right), the X-ranges of different
 * parents' children are DISJOINT — so all buses on the same generation
 * can share Y without overlapping.
 *
 * Each parent's edges use a DISTINCT, VIBRANT color (not gray shades),
 * making it trivially easy to trace which children belong to which parent.
 */

import { treeState } from './tree-state-v2.js';
import { giaPhaLog } from './print-config-v2.js';

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Vibrant, print-friendly palette. Adjacent parents get maximally
 * different colors so overlapping curves are easily distinguishable.
 */
const EDGE_COLOR_PALETTE = [
    '#2563eb', // blue
    '#dc2626', // red
    '#16a34a', // green
    '#9333ea', // purple
    '#ea580c', // orange
    '#0891b2', // cyan
    '#be123c', // rose
    '#4f46e5', // indigo
    '#ca8a04', // amber
    '#0d9488', // teal
    '#7c3aed', // violet
    '#c026d3', // fuchsia
    '#65a30d', // lime
    '#0284c7', // sky
    '#e11d48', // pink
    '#d97706', // yellow-dark
    '#059669', // emerald
    '#7c2d12', // brown
    '#6d28d9', // purple-dark
    '#0e7490', // cyan-dark
    '#b91c1c', // red-dark
];

/** SVG stroke width for all edges (px). */
const EDGE_STROKE_WIDTH = 1.4;

/** Vertical offset (px) from parent bottom to the first lane (lane 0). */
const LANE_BASE_OFFSET = 12;

/** Vertical step (px) between adjacent lanes — lane i sits LANE_STEP px below lane i-1. */
const LANE_STEP = 8;

/** Lanes wrap modulo this number. Caps the vertical footprint of the lane stack. */
const MAX_LANES = 25;

/** Minimum px gap required between the last lane and the topmost child. */
const LANE_TAIL_CLEARANCE = 12;

// ── Arrow markers ────────────────────────────────────────────────────────────

function markerIdForEdge(hex) {
    return 'gp-arrow-' + String(hex).replace(/#/g, '');
}

function ensureArrowMarkersForColors(svg, colors) {
    var defs = svg.querySelector('defs');
    if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.insertBefore(defs, svg.firstChild);
    }
    colors.forEach(function (color) {
        var id = markerIdForEdge(color);
        if (defs.querySelector('[id="' + id + '"]')) return;

        var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', id);
        marker.setAttribute('markerWidth', '8');
        marker.setAttribute('markerHeight', '8');
        marker.setAttribute('refX', '7');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        marker.setAttribute('markerUnits', 'strokeWidth');
        var arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrowPath.setAttribute('d', 'M0,0 L0,6 L7,3 z');
        arrowPath.setAttribute('fill', color);
        marker.appendChild(arrowPath);
        defs.appendChild(marker);
    });
}

// ── Core drawing ──────────────────────────────────────────────────────────────

function nodeMetrics(el, stratRect) {
    var r = el.getBoundingClientRect();
    return {
        cx:    r.left - stratRect.left + r.width / 2,
        cyTop: r.top  - stratRect.top,
        cyBot: r.top  - stratRect.top + r.height,
        width:  r.width,
        height: r.height
    };
}

/**
 * Draw all family-tree edges as orthogonal (right-angle) paths.
 *
 * Each parent→child edge is a 3-segment path:
 *   M parentCx parentCyBot   V busY   H childCx   V childCyTop
 *
 * busY = midway between parent bottom and topmost child top of the group.
 * When parentCx === childCx the H segment is zero-length and the path
 * renders as a straight vertical line — so the single-child case needs
 * no special branch.
 */
function drawTreeEdges() {
    var strat = document.querySelector('.tree.svg-edges-active');
    var svg   = strat && strat.querySelector('svg.tree-edges');
    if (!svg || !treeState.stratifiedGraphModel) return;

    // Size SVG
    var w = Math.max(strat.scrollWidth, strat.offsetWidth);
    var h = Math.max(strat.scrollHeight, strat.offsetHeight);
    svg.setAttribute('width',  String(w));
    svg.setAttribute('height', String(h));
    svg.style.width  = w + 'px';
    svg.style.height = h + 'px';
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var stratRect = strat.getBoundingClientRect();

    // ── Step 1: collect all edges with node metrics ────────────────────────
    var allEdges  = [];
    var nodeCache = Object.create(null);

    treeState.stratifiedGraphModel.edges.forEach(function (edge) {
        if (!nodeCache[edge.parentId]) {
            var pEl = strat.querySelector('[data-node-id="' + edge.parentId + '"]');
            if (pEl) nodeCache[edge.parentId] = nodeMetrics(pEl, stratRect);
        }
        if (!nodeCache[edge.childId]) {
            var cEl = strat.querySelector('[data-node-id="' + edge.childId + '"]');
            if (cEl) nodeCache[edge.childId] = nodeMetrics(cEl, stratRect);
        }

        var p = nodeCache[edge.parentId];
        var c = nodeCache[edge.childId];
        if (!p || !c) return;

        allEdges.push({ parentId: edge.parentId, childId: edge.childId, p: p, c: c });
    });

    // ── Step 2: group by parent, assign colors ────────────────────────────
    var byParent = Object.create(null);
    allEdges.forEach(function (e) {
        if (!byParent[e.parentId]) byParent[e.parentId] = [];
        byParent[e.parentId].push(e);
    });

    var parentOrder = Object.keys(byParent);
    var usedColors  = [];
    var parentColor = Object.create(null);
    parentOrder.forEach(function (pid, idx) {
        var col = EDGE_COLOR_PALETTE[idx % EDGE_COLOR_PALETTE.length];
        parentColor[pid] = col;
        if (usedColors.indexOf(col) < 0) usedColors.push(col);
    });

    ensureArrowMarkersForColors(svg, usedColors);

    // ── Step 2b: assign each parent a lane index (per generation) ─────────
    // Split parents into two groups by bus direction:
    //   - L-extending (children mostly to LEFT of parent): sort L→R,
    //     leftmost gets lane 0 (highest busY, closest to parent row).
    //     Bus extends LEFT into empty space, no crossings.
    //   - R-extending (children mostly to RIGHT of parent): sort R→L,
    //     RIGHTMOST gets lane 0. Bus extends RIGHT into empty space.
    //     Reversed order prevents leftmost R-extending bus from running
    //     over rightward parents' vertical stems.
    var parentsByGen = Object.create(null);
    parentOrder.forEach(function (pid) {
        var key = Math.round(byParent[pid][0].p.cyBot);
        if (!parentsByGen[key]) parentsByGen[key] = [];
        parentsByGen[key].push(pid);
    });

    var parentLane = Object.create(null);
    Object.keys(parentsByGen).forEach(function (key) {
        var pids = parentsByGen[key];

        var leftExt  = [];
        var rightExt = [];
        pids.forEach(function (pid) {
            var siblings = byParent[pid];
            var px       = siblings[0].p.cx;
            var sum = 0;
            for (var i = 0; i < siblings.length; i++) sum += siblings[i].c.cx;
            var centroid = sum / siblings.length;
            // Bus direction = where children sit relative to parent.
            if (centroid <= px) leftExt.push(pid);
            else                rightExt.push(pid);
        });

        // L-extending: leftmost parent → lane 0 (bus extends left into void).
        leftExt.sort(function (a, b) {
            return byParent[a][0].p.cx - byParent[b][0].p.cx;
        });
        leftExt.forEach(function (pid, idx) {
            parentLane[pid] = idx % MAX_LANES;
        });

        // R-extending: RIGHTMOST parent → lane 0 (bus extends right into void).
        rightExt.sort(function (a, b) {
            return byParent[b][0].p.cx - byParent[a][0].p.cx;
        });
        rightExt.forEach(function (pid, idx) {
            parentLane[pid] = idx % MAX_LANES;
        });
    });

    // ── Step 3: draw orthogonal (parent → bus → child) paths ──────────────

    function fmt(n) {
        return (Number.isFinite(n) ? n : 0).toFixed(1);
    }

    parentOrder.forEach(function (parentId) {
        var siblings = byParent[parentId];
        var p        = siblings[0].p;
        var color    = parentColor[parentId];
        var markerId = markerIdForEdge(color);
        var lane     = parentLane[parentId] || 0;

        // Topmost child top — busY must stay above this with clearance.
        var minChildTop = siblings[0].c.cyTop;
        for (var i = 1; i < siblings.length; i++) {
            if (siblings[i].c.cyTop < minChildTop) minChildTop = siblings[i].c.cyTop;
        }

        // Bus Y for this parent: parent bottom + base offset + lane offset.
        // Clamp so the bus never crashes into the child row.
        var busY = p.cyBot + LANE_BASE_OFFSET + lane * LANE_STEP;
        var maxBusY = minChildTop - LANE_TAIL_CLEARANCE;
        if (busY > maxBusY) busY = maxBusY;
        if (busY < p.cyBot + 4) busY = p.cyBot + 4;

        siblings.forEach(function (edge) {
            var c  = edge.c;
            var x1 = p.cx;
            var y1 = p.cyBot;
            var x2 = c.cx;
            var y2 = c.cyTop;

            // Đường chéo 1 đoạn từ tâm-đáy cha → tâm-đỉnh con.
            // (busY/lane phía trên hiện không dùng trong d nhưng giữ tạm
            //  để dễ rollback về phong cách gấp khúc nếu cần.)
            var d = 'M ' + fmt(x1) + ' ' + fmt(y1) +
                    ' L ' + fmt(x2) + ' ' + fmt(y2);

            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', color);
            path.setAttribute('stroke-width', EDGE_STROKE_WIDTH);
            path.setAttribute('stroke-linecap', 'square');
            path.setAttribute('stroke-linejoin', 'miter');
            path.setAttribute('marker-end', 'url(#' + markerId + ')');
            path.setAttribute('data-pid', parentId);
            path.setAttribute('data-cid', edge.childId || '');

            svg.appendChild(path);
        });
    });
}

/**
 * Debounced edge redraw using requestAnimationFrame.
 */
function scheduleDrawTreeEdges() {
    if (treeState.edgesRedrawScheduled) return;
    treeState.edgesRedrawScheduled = true;

    requestAnimationFrame(function () {
        treeState.edgesRedrawScheduled = false;
        drawTreeEdges();
    });
}

export {
    EDGE_COLOR_PALETTE,
    markerIdForEdge,
    ensureArrowMarkersForColors,
    drawTreeEdges,
    scheduleDrawTreeEdges
};