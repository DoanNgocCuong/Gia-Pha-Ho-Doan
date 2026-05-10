/**
 * @module tree-edges
 * @description SVG edge (arrow) drawing for the family tree.
 *
 * Dependencies:
 *   - tree-state.js (reads `treeState.stratifiedGraphModel`,
 *                    reads/writes `treeState.edgesRedrawScheduled`)
 *
 * APPROACH: "Smooth Direct" — NO horizontal bus lines, NO trunk-bus-drop.
 *
 * Each parent→child connection is a single **cubic Bézier curve** that:
 *   - Starts going straight DOWN from parent bottom center
 *   - Smoothly bends toward child
 *   - Arrives going straight DOWN into child top center
 *
 * This eliminates ALL horizontal line overlap problems because there are
 * no horizontal segments. Curves from different parents naturally separate
 * because they have different curvatures and endpoints.
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

/** Curve tension: 0 = straight line, 0.5 = gentle S-curve, 1.0 = extreme. */
const CURVE_TENSION = 0.45;

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
 * Draw all family-tree edges as smooth Bézier curves.
 *
 * Each parent→child edge is a single cubic Bézier:
 *   M  parentCx  parentCyBot
 *   C  parentCx  (parentCyBot + tension*gap)
 *      childCx   (childCyTop  - tension*gap)
 *      childCx   childCyTop
 *
 * The curve starts pointing straight down, bends smoothly, and arrives
 * pointing straight down — so the arrowhead always points into the child.
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

    // ── Step 3: draw smooth Bézier curves ─────────────────────────────────

    function fmt(n) {
        return (Number.isFinite(n) ? n : 0).toFixed(1);
    }

    parentOrder.forEach(function (parentId) {
        var siblings = byParent[parentId];
        var p        = siblings[0].p;
        var color    = parentColor[parentId];
        var markerId = markerIdForEdge(color);

        siblings.forEach(function (edge) {
            var c = edge.c;

            // Start: parent bottom center
            var x1 = p.cx;
            var y1 = p.cyBot;
            // End: child top center
            var x2 = c.cx;
            var y2 = c.cyTop;

            // Vertical gap between parent bottom and child top
            var gap = y2 - y1;

            // Control points for cubic Bézier:
            // cp1: same X as parent, pushed DOWN by tension * gap
            //       → curve starts going straight down from parent
            // cp2: same X as child, pulled UP by tension * gap
            //       → curve arrives going straight down into child
            var cp1x = x1;
            var cp1y = y1 + gap * CURVE_TENSION;
            var cp2x = x2;
            var cp2y = y2 - gap * CURVE_TENSION;

            var d = 'M ' + fmt(x1) + ' ' + fmt(y1) +
                    ' C ' + fmt(cp1x) + ' ' + fmt(cp1y) +
                    ' ' + fmt(cp2x) + ' ' + fmt(cp2y) +
                    ' ' + fmt(x2) + ' ' + fmt(y2);

            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', color);
            path.setAttribute('stroke-width', EDGE_STROKE_WIDTH);
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
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