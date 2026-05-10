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
 * no horizontal segments. Curves from different parents naturally separate.
 *
 * Each parent's edges use a DISTINCT, VIBRANT color (not gray shades),
 * making it trivially easy to trace which children belong to which parent.
 */

import { treeState } from './tree-state.js';
import { giaPhaLog } from './print-config.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const EDGE_COLOR_PALETTE = [
    '#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c',
    '#0891b2', '#be123c', '#4f46e5', '#ca8a04', '#0d9488',
    '#7c3aed', '#c026d3', '#65a30d', '#0284c7', '#e11d48',
    '#d97706', '#059669', '#7c2d12', '#6d28d9', '#0e7490',
    '#b91c1c',
];

const EDGE_STROKE_WIDTH = 1.4;
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

function drawTreeEdges() {
    var strat = document.querySelector('.tree.svg-edges-active');
    var svg   = strat && strat.querySelector('svg.tree-edges');
    if (!svg || !treeState.stratifiedGraphModel) return;

    var w = Math.max(strat.scrollWidth, strat.offsetWidth);
    var h = Math.max(strat.scrollHeight, strat.offsetHeight);
    svg.setAttribute('width',  String(w));
    svg.setAttribute('height', String(h));
    svg.style.width  = w + 'px';
    svg.style.height = h + 'px';
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var stratRect = strat.getBoundingClientRect();

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
            var x1 = p.cx, y1 = p.cyBot;
            var x2 = c.cx, y2 = c.cyTop;
            var gap = y2 - y1;

            var cp1x = x1, cp1y = y1 + gap * CURVE_TENSION;
            var cp2x = x2, cp2y = y2 - gap * CURVE_TENSION;

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