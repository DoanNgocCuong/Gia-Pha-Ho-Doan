/**
 * @module tree-bootstrap
 * @description Bootstrap, orchestration, tree rendering, and DOM initialization.
 *
 * Dependencies:
 *   - tree-state.js    (reads/writes `treeState.currentTreePayload`,
 *                      `treeState.stratifiedGraphModel`, `treeState.treeResizeObserver`,
 *                      `treeState.treeCompactFocusDepth`)
 *   - print-config.js (calls `loadPrintSizeConfig`, `applyPrintConfigToCss`)
 *   - tree-text-v2.js (calls `normalizeAllNodeLabels`, `fitNodeText`)
 *   - tree-edges.js   (calls `scheduleDrawTreeEdges`, `drawTreeEdges`)
 *   - tree-layout.js  (calls `buildStratifiedModel`, `computeBusiestGenerationDepth`,
 *                      `applyAbsoluteLayout`, `attachTreeLayoutObservers`,
 *                      `measureAndPublishTreeLayoutSize`)
 *   - tree-pan.js     (calls `initTreePan`)
 *   - tree-export.js  (imported for side effects: window.* for HTML onclick)
 *
 * This is the entry point module. It orchestrates all others.
 * The only code that runs at module load time is the window.addEventListener
 * for 'DOMContentLoaded', which kicks off the full render pipeline.
 *
 * Also imports ./tree-export.js for side effects: bridges exportImage, exportPdf,
 * JSON drawer helpers, etc. onto window for inline onclick handlers in index.html.
 */

import './tree-export.js';
import { treeState } from './tree-state-v2.js';
import { loadPrintSizeConfig, applyPrintConfigToCss, giaPhaLog, DEFAULT_PRINT_SIZE_CONFIG } from './print-config-v2.js';
import { cssCmToPxFactor } from './css-units-v2.js';
import {
    setNodeLabelDisplay,
    normalizeAllNodeLabels,
    fitNodeText,
    measureFitWidths
} from './tree-text-v2.js';
import { scheduleDrawTreeEdges, drawTreeEdges } from './tree-edges-v2.js';
import {
    buildStratifiedModel,
    computeBusiestGenerationDepth,
    applyAbsoluteLayout,
    attachTreeLayoutObservers,
    detachGenLabelScrollListener,
    measureAndPublishTreeLayoutSize,
    renderGenerationLabels,
    resetGenLabelRailWidthCssVars
} from './tree-layout-v2.js';
import { initTreePan } from './tree-pan-v2.js';
import { loadTreeShellConfig, applyTreeShellConfigToCss } from './tree-shell-config.js';
import { mountRongPhung } from './rong-phung.js';

// ── Status display ────────────────────────────────────────────────────────────

/**
 * Show a status message in the tree area and reset all shared state.
 * Used during loading and on error.
 *
 * @param {string} message
 */
function showTreeStatus(message) {
    const treeRoot = document.getElementById('treeRoot');
    if (!treeRoot) return;

    treeRoot.innerHTML = '';
    treeRoot.className = 'tree';
    treeState.stratifiedGraphModel      = null;
    treeState.treeCompactFocusDepth     = null;
    if (treeState.treeResizeObserver) {
        treeState.treeResizeObserver.disconnect();
        treeState.treeResizeObserver = null;
    }
    detachGenLabelScrollListener();

    const leftEl  = document.getElementById('genLabelsLeft');
    const rightEl = document.getElementById('genLabelsRight');
    if (leftEl)  leftEl.innerHTML  = '';
    if (rightEl) rightEl.innerHTML = '';
    resetGenLabelRailWidthCssVars();

    const status = document.createElement('div');
    status.id          = 'treeStatus';
    status.textContent = message;
    treeRoot.appendChild(status);
}

// ── Node DOM factory ─────────────────────────────────────────────────────────

/**
 * Create a .node div element for a given tree node.
 *
 * @param {object} node   - Tree node data.
 * @param {string} nodeId - Synthetic ID (gp-{counter}).
 * @returns {HTMLElement}
 */
function createTreeNodeElement(node, nodeId) {
    const div    = document.createElement('div');
    const gender = ['ancestor', 'male', 'female', 'other'].includes(node.gender) ? node.gender : 'other';
    const depth  = Number.isFinite(node.depth) ? Math.max(0, Number(node.depth)) : 0;

    div.className = 'node ' + gender + ' d' + depth;
    if (nodeId) div.setAttribute('data-node-id', nodeId);

    const span = document.createElement('span');
    span.className = 'nm';
    setNodeLabelDisplay(span, node.name || '');
    div.appendChild(span);
    return div;
}

/**
 * Validate that an object is a well-formed tree node.
 *
 * @param {object} node
 * @returns {boolean}
 */
function isValidTreeNode(node) {
    return Boolean(
        node &&
        typeof node === 'object' &&
        typeof node.name === 'string' &&
        typeof node.gender === 'string' &&
        typeof node.depth === 'number' &&
        Array.isArray(node.children)
    );
}

// ── Recursive tree renderer ──────────────────────────────────────────────────

let _idCounter = 0;

/**
 * Recursively build the UL/LI tree DOM.
 *
 * @param {object} node
 * @returns {HTMLElement} <li> element.
 */
function renderNodeRecursive(node) {
    const id = 'gp-' + _idCounter++;
    const li = document.createElement('li');
    const el = createTreeNodeElement(node, id);

    if (id === 'gp-0') el.classList.add('stratified-root');

    li.appendChild(el);

    if (node.children && node.children.length > 0) {
        const ul = document.createElement('ul');
        node.children.forEach(function (child) {
            ul.appendChild(renderNodeRecursive(child));
        });
        li.appendChild(ul);
    }
    return li;
}

// ── Main render pipeline ─────────────────────────────────────────────────────

/**
 * Orchestrator: wipe DOM, build stratified model, render UL/LI, apply absolute
 * layout, normalize labels, fit text, attach observers, schedule edge draw.
 *
 * @param {object} payload - The full tree data payload.
 * @param {object} [printConfig] - Validated print-size config (must match CSS).
 */
function renderTreeFromData(payload, printConfig) {
    const treeRoot = document.getElementById('treeRoot');
    if (!treeRoot) return;

    if (printConfig && typeof printConfig === 'object') {
        treeState.activePrintSizeConfig = printConfig;
    }

    giaPhaLog('renderTreeFromData', {
        hasPrintConfigArg: Boolean(printConfig && typeof printConfig === 'object'),
        activePrintSizeConfig: Boolean(treeState.activePrintSizeConfig),
        between_generations_gap_cm: treeState.activePrintSizeConfig
            ? treeState.activePrintSizeConfig.spacing.between_generations_gap_cm
            : null
    });

    // Teardown previous observer
    if (treeState.treeResizeObserver) {
        treeState.treeResizeObserver.disconnect();
        treeState.treeResizeObserver = null;
    }

    treeRoot.innerHTML = '';
    treeRoot.className = 'tree svg-edges-active';

    treeState.stratifiedGraphModel  = buildStratifiedModel(payload.root);
    treeState.treeCompactFocusDepth = computeBusiestGenerationDepth(treeState.stratifiedGraphModel);

    // Create SVG overlay for edges
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class',        'tree-edges');
    svg.setAttribute('aria-hidden', 'true');
    treeRoot.appendChild(svg);

    // Reset counter and build tree
    _idCounter = 0;
    const mainUl = document.createElement('ul');
    mainUl.appendChild(renderNodeRecursive(payload.root));
    treeRoot.appendChild(mainUl);

    normalizeAllNodeLabels();

    // Measure each d3+ node's minimum width to fit text at fixed height
    const cfg       = treeState.activePrintSizeConfig || DEFAULT_PRINT_SIZE_CONFIG;
    const cmPx      = cssCmToPxFactor();
    const defaultW  = cfg.node.default.width_cm * cmPx;
    const nodeWidthsMap = measureFitWidths(defaultW);

    attachTreeLayoutObservers();

    // Bottom-up absolute layout: fix focus row → place ancestors → place descendants
    applyAbsoluteLayout(printConfig, nodeWidthsMap);

    // Double rAF: wait for layout to settle before drawing edges
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            drawTreeEdges();
            measureAndPublishTreeLayoutSize();
            renderGenerationLabels();
        });
    });
}

// ── Data loading ─────────────────────────────────────────────────────────────

/**
 * Fetch and validate GiaPhaHoDoan.json, then render the tree.
 */
/**
 * @param {object} [printConfig] - Same object passed to applyPrintConfigToCss (validated).
 */
async function loadTreeData(printConfig) {
    const response = await fetch('./data/GiaPhaHoDoan.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Không đọc được file GiaPhaHoDoan.json.');

    const payload = await response.json();
    if (!payload || typeof payload !== 'object' || !isValidTreeNode(payload.root)) {
        throw new Error('Dữ liệu JSON không đúng định dạng yêu cầu.');
    }

    treeState.currentTreePayload = payload;
    renderTreeFromData(payload, printConfig);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

/**
 * Entry point: show loading status, then sequentially load print config
 * and tree data.
 */
async function bootstrapTree() {
    showTreeStatus('Đang tải dữ liệu gia phả...');
    mountRongPhung();
    try {
        const [config, shellConfig] = await Promise.all([
            loadPrintSizeConfig(),
            loadTreeShellConfig()
        ]);
        applyPrintConfigToCss(config);
        applyTreeShellConfigToCss(shellConfig);
        await loadTreeData(config);
        initTreePan();
        giaPhaLog('bootstrapTree', {
            done: true,
            between_generations_gap_cm: config.spacing.between_generations_gap_cm,
            activeConfigMatches: treeState.activePrintSizeConfig === config
        });
    } catch (error) {
        giaPhaLog('bootstrapTree', {
            done: false,
            error: String(error && error.message ? error.message : error)
        });
        console.error('[GiaPha:bootstrapTree] error', error);
        showTreeStatus(error && error.message ? error.message : 'Không thể tải dữ liệu gia phả.');
    }
}

// ── Event listeners ──────────────────────────────────────────────────────────

window.addEventListener('resize', function () {
    measureAndPublishTreeLayoutSize();
    scheduleDrawTreeEdges();
});

window.addEventListener('DOMContentLoaded', bootstrapTree);
