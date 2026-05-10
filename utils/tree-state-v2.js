/**
 * @module tree-state
 * @description Global mutable state for the Gia Phả Họ Đoàn tree renderer.
 *
 * All state is exported as properties of a single `treeState` object.
 * ES module live bindings mean that when one module mutates a property
 * (e.g., `treeState.activePrintSizeConfig = config`), all importing modules
 * see the update immediately — no re-assignment of the import binding needed.
 *
 * Invariant: `activePrintSizeConfig` must be loaded and applied BEFORE
 * `loadTreeData` runs, because `computeAbsoluteLayout` reads it.
 *
 * NOTE: `currentScale` is referenced in `compactTreeLayout` with a typeof
 * guard (`typeof currentScale !== 'undefined' ? currentScale : 1`). It is
 * never defined in this project — the guard ensures the code works regardless.
 */

export const treeState = {
    /** @type {object|null} Raw JSON payload loaded from ./data/GiaPhaHoDoan.json */
    currentTreePayload: null,

    /** @type {{levels: Array, edges: Array}|null} Stratified graph model */
    stratifiedGraphModel: null,

    /** @type {ResizeObserver|null} Observer on .tree-wrapper and .tree.svg-edges-active */
    treeResizeObserver: null,

    /**
     * Removes `.tree-wrapper` scroll listener for generation labels (set by attachTreeLayoutObservers).
     * @type {function|null}
     */
    genLabelsScrollUnsub: null,

    /** @type {boolean} Debounce flag preventing concurrent edge redraws */
    edgesRedrawScheduled: false,

    /** @type {object|null} Parsed & validated print-size-config.json */
    activePrintSizeConfig: null,

    /**
     * Pixel font sizes derived from the print config.
     * @type {{default: number, min: number}}
     */
    activeTypographyPx: { default: 12, min: 9.333 },

    /** @type {number} Pixel padding used by edge routing (from connector_padding_mm in config) */
    connectorPaddingPx: 8,

    /**
     * 0-based depth of the generation with the most nodes.
     * Used as the "focus" depth for bottom-up absolute layout.
     * @type {number|null}
     */
    treeCompactFocusDepth: null
};

/** Number of contour-compaction passes in compactTreeLayout */
export const TREE_COMPACT_PASSES = 3;