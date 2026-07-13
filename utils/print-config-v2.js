/**
 * @module print-config
 * @description Print size configuration: defaults, validation, CSS application.
 *
 * Dependencies:
 *   - tree-state.js (writes `treeState.activePrintSizeConfig`,
 *                    `treeState.activeTypographyPx`, `treeState.connectorPaddingPx`)
 *
 * Side effects:
 *   - Sets CSS custom properties on :root (--node-width, --node-height, etc.)
 *   - Injects/updates a <style id="dynamicPrintPageStyle"> in <head>
 *   - Adds/removes class "print-size-config-active" on <body>
 *
 * Layout-related custom properties are set in **px** (from cm/mm in config)
 * so they stay consistent with computeAbsoluteLayout and :root defaults in index.html.
 *
 * Debug console (bật một trong hai):
 *   - Thêm `?giaPhaDebug=1` vào URL, hoặc
 *   - `localStorage.setItem('giaPhaDebug', '1')` rồi reload.
 * Log có tiền tố `[GiaPha:…]` — lọc trong tab Console.
 */

import { treeState } from './tree-state-v2.js';
import { cssCmToPxFactor, mmToCssPx } from './css-units-v2.js';

// ── Debug logging ───────────────────────────────────────────────────────────

/**
 * @returns {boolean}
 */
function giaPhaDebugEnabled() {
    if (typeof window === 'undefined' || !window.location) return false;
    try {
        if (new URLSearchParams(window.location.search).get('giaPhaDebug') === '1') {
            return true;
        }
    } catch (e) { /* ignore */ }
    try {
        return typeof localStorage !== 'undefined' && localStorage.getItem('giaPhaDebug') === '1';
    } catch (e) {
        return false;
    }
}

/**
 * @param {string} scope - Short tag, e.g. "print-config".
 * @param {object} [data] - Serializable fields only.
 */
export function giaPhaLog(scope, data) {
    if (!giaPhaDebugEnabled()) return;
    if (data !== undefined) {
        console.info('[GiaPha:' + scope + ']', data);
    } else {
        console.info('[GiaPha:' + scope + ']');
    }
}

// ── Defaults ─────────────────────────────────────────────────────────────────

/** @type {object} Default print size configuration (paper, nodes, spacing, typography) */
const DEFAULT_PRINT_SIZE_CONFIG = {
    canvas: {
        width_cm: 230,
        height_cm: 270,
        orientation: 'landscape',
        safe_margin_cm: { top: 1, right: 1, bottom: 1, left: 1 }
    },
    node: {
        default: { width_cm: 2.0, height_cm: 12, corner_radius_mm: 2, border_width_mm: 0.25 },
        generation_overrides: {
            '1': { enabled: false, scale: 1 },
            '2': { enabled: false, scale: 1 },
            '3': { enabled: false, scale: 1 },
            '4': { enabled: false, scale: 1 }
        }
    },
    spacing: {
        same_generation_gap_cm: 0.2,
        between_generations_gap_cm: 0.25,
        between_generations_gap_landscape_cm: 0.25,
        connector_padding_mm: 2
    },
    typography: {
        default_font_pt: 9,
        min_font_pt: 7
    },
    print_output: {
        max_size_tolerance_mm: 2,
        target_dpi: 300
    },
    couplet: {
        word_gap_cm: 7.5,
        narrow_word_gap_rem: 0.65,
        font_size_rem: 1.375,
        font_size_narrow_rem: 1.1,
        column_min_width_rem: 5.25,
        column_max_width_rem: 7,
        padding_vertical_px: 14,
        padding_horizontal_px: 10,
        padding_narrow_vertical_px: 12,
        padding_narrow_horizontal_px: 14,
        font_weight: 600,
        letter_spacing_em: 0.06,
        line_height_outer: 1.25,
        line_height_word: 1.2
    }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Return `value` if it is a finite number, otherwise `fallback`.
 * @param {*} value
 * @param {number} fallback
 * @returns {number}
 */
function finiteNumberOr(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

/**
 * Deep-clone DEFAULT_PRINT_SIZE_CONFIG.
 * @returns {object}
 */
function cloneDefaultPrintConfig() {
    return JSON.parse(JSON.stringify(DEFAULT_PRINT_SIZE_CONFIG));
}

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Merge a raw config object into a cloned default, producing a safe config.
 * Missing or invalid fields fall back to defaults.
 * @param {object} raw - Raw config (may be null/undefined/malformed).
 * @returns {object} Validated config.
 */
function validatePrintConfig(rawConfig) {
    const safe = cloneDefaultPrintConfig();
    if (!rawConfig || typeof rawConfig !== 'object') return safe;

    safe.canvas.width_cm      = finiteNumberOr(rawConfig?.canvas?.width_cm,      safe.canvas.width_cm);
    safe.canvas.height_cm     = finiteNumberOr(rawConfig?.canvas?.height_cm,     safe.canvas.height_cm);
    safe.canvas.orientation   = typeof rawConfig?.canvas?.orientation === 'string'
        ? rawConfig.canvas.orientation
        : safe.canvas.orientation;

    safe.canvas.safe_margin_cm.top    = finiteNumberOr(rawConfig?.canvas?.safe_margin_cm?.top,    safe.canvas.safe_margin_cm.top);
    safe.canvas.safe_margin_cm.right  = finiteNumberOr(rawConfig?.canvas?.safe_margin_cm?.right,  safe.canvas.safe_margin_cm.right);
    safe.canvas.safe_margin_cm.bottom = finiteNumberOr(rawConfig?.canvas?.safe_margin_cm?.bottom, safe.canvas.safe_margin_cm.bottom);
    safe.canvas.safe_margin_cm.left   = finiteNumberOr(rawConfig?.canvas?.safe_margin_cm?.left,   safe.canvas.safe_margin_cm.left);

    safe.node.default.width_cm         = finiteNumberOr(rawConfig?.node?.default?.width_cm,         safe.node.default.width_cm);
    safe.node.default.height_cm        = finiteNumberOr(rawConfig?.node?.default?.height_cm,        safe.node.default.height_cm);
    safe.node.default.corner_radius_mm = finiteNumberOr(rawConfig?.node?.default?.corner_radius_mm, safe.node.default.corner_radius_mm);
    safe.node.default.border_width_mm  = finiteNumberOr(rawConfig?.node?.default?.border_width_mm,  safe.node.default.border_width_mm);

    safe.spacing.same_generation_gap_cm     = finiteNumberOr(rawConfig?.spacing?.same_generation_gap_cm,     safe.spacing.same_generation_gap_cm);
    safe.spacing.between_generations_gap_cm  = finiteNumberOr(rawConfig?.spacing?.between_generations_gap_cm,  safe.spacing.between_generations_gap_cm);
    safe.spacing.between_generations_gap_landscape_cm = finiteNumberOr(rawConfig?.spacing?.between_generations_gap_landscape_cm, safe.spacing.between_generations_gap_landscape_cm);
    safe.spacing.connector_padding_mm        = finiteNumberOr(rawConfig?.spacing?.connector_padding_mm,        safe.spacing.connector_padding_mm);

    ['1', '2', '3', '4'].forEach(function (k) {
        const raw = rawConfig?.node?.generation_overrides?.[k];
        if (!raw || typeof raw !== 'object') return;
        safe.node.generation_overrides[k].enabled = Boolean(raw.enabled);
        safe.node.generation_overrides[k].scale   = finiteNumberOr(raw.scale, safe.node.generation_overrides[k].scale);
    });

    safe.typography.default_font_pt = finiteNumberOr(rawConfig?.typography?.default_font_pt, safe.typography.default_font_pt);
    safe.typography.min_font_pt     = finiteNumberOr(rawConfig?.typography?.min_font_pt,     safe.typography.min_font_pt);
    safe.print_output.max_size_tolerance_mm = finiteNumberOr(rawConfig?.print_output?.max_size_tolerance_mm, safe.print_output.max_size_tolerance_mm);
    safe.print_output.target_dpi           = finiteNumberOr(rawConfig?.print_output?.target_dpi,           safe.print_output.target_dpi);

    const rawCp = rawConfig?.couplet;
    if (rawCp && typeof rawCp === 'object') {
        const cp = safe.couplet;
        cp.word_gap_cm                 = finiteNumberOr(rawCp.word_gap_cm,                 cp.word_gap_cm);
        cp.narrow_word_gap_rem         = finiteNumberOr(rawCp.narrow_word_gap_rem,         cp.narrow_word_gap_rem);
        cp.font_size_rem               = finiteNumberOr(rawCp.font_size_rem,               cp.font_size_rem);
        cp.font_size_narrow_rem        = finiteNumberOr(rawCp.font_size_narrow_rem,        cp.font_size_narrow_rem);
        cp.column_min_width_rem        = finiteNumberOr(rawCp.column_min_width_rem,        cp.column_min_width_rem);
        cp.column_max_width_rem        = finiteNumberOr(rawCp.column_max_width_rem,        cp.column_max_width_rem);
        cp.padding_vertical_px         = finiteNumberOr(rawCp.padding_vertical_px,         cp.padding_vertical_px);
        cp.padding_horizontal_px       = finiteNumberOr(rawCp.padding_horizontal_px,       cp.padding_horizontal_px);
        cp.padding_narrow_vertical_px  = finiteNumberOr(rawCp.padding_narrow_vertical_px,  cp.padding_narrow_vertical_px);
        cp.padding_narrow_horizontal_px = finiteNumberOr(rawCp.padding_narrow_horizontal_px, cp.padding_narrow_horizontal_px);
        cp.font_weight                 = finiteNumberOr(rawCp.font_weight,                 cp.font_weight);
        cp.letter_spacing_em           = finiteNumberOr(rawCp.letter_spacing_em,           cp.letter_spacing_em);
        cp.line_height_outer           = finiteNumberOr(rawCp.line_height_outer,           cp.line_height_outer);
        cp.line_height_word            = finiteNumberOr(rawCp.line_height_word,            cp.line_height_word);
    }

    return safe;
}

// ── CSS application ────────────────────────────────────────────────────────────

/**
 * Set a CSS custom property on the document root.
 * @param {string} name  - Property name (with or without --).
 * @param {string} value - Property value.
 */
function setRootCssVar(name, value) {
    document.documentElement.style.setProperty(name, value);
}

/**
 * Inject or update the @page CSS rule for print output.
 * @param {object} config - Validated print config.
 */
/**
 * Áp thông số câu đối từ print-size-config.json lên :root (đồng bộ với index.html).
 * @param {object} couplet - config.couplet đã validate.
 */
function applyCoupletConfigToCss(couplet) {
    if (!couplet || typeof couplet !== 'object') return;
    const c = couplet;
    setRootCssVar('--couplet-word-gap', c.word_gap_cm + 'cm');
    setRootCssVar('--couplet-font-size', c.font_size_rem + 'rem');
    setRootCssVar('--couplet-font-size-narrow', c.font_size_narrow_rem + 'rem');
    setRootCssVar('--couplet-narrow-word-gap', c.narrow_word_gap_rem + 'rem');
    setRootCssVar('--couplet-column-min-width', c.column_min_width_rem + 'rem');
    setRootCssVar('--couplet-column-max-width', c.column_max_width_rem + 'rem');
    setRootCssVar('--couplet-padding-y', c.padding_vertical_px + 'px');
    setRootCssVar('--couplet-padding-x', c.padding_horizontal_px + 'px');
    setRootCssVar('--couplet-padding-narrow-y', c.padding_narrow_vertical_px + 'px');
    setRootCssVar('--couplet-padding-narrow-x', c.padding_narrow_horizontal_px + 'px');
    setRootCssVar('--couplet-font-weight', String(c.font_weight));
    setRootCssVar('--couplet-letter-spacing', c.letter_spacing_em + 'em');
    setRootCssVar('--couplet-line-height-outer', String(c.line_height_outer));
    setRootCssVar('--couplet-line-height-word', String(c.line_height_word));
}

function applyPrintPageStyle(config) {
    let styleEl = document.getElementById('dynamicPrintPageStyle');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dynamicPrintPageStyle';
        document.head.appendChild(styleEl);
    }

    const w = config.canvas.width_cm.toFixed(2);
    const h = config.canvas.height_cm.toFixed(2);
    const m = config.canvas.safe_margin_cm;
    styleEl.textContent =
        '@media print {' +
        '  @page { size: ' + w + 'cm ' + h + 'cm; margin: ' +
        m.top + 'cm ' + m.right + 'cm ' + m.bottom + 'cm ' + m.left + 'cm; }' +
        '}';
}

/**
 * Apply a validated config to all CSS custom properties and module state.
 * @param {object} config - Validated print config.
 */
function applyPrintConfigToCss(config) {
    treeState.activePrintSizeConfig = config;

    const cmToPx = cssCmToPxFactor();
    const px = (cm) => (cm * cmToPx) + 'px';

    setRootCssVar('--node-width',  px(config.node.default.width_cm));
    setRootCssVar('--node-height', px(config.node.default.height_cm));
    setRootCssVar('--node-radius', mmToCssPx(config.node.default.corner_radius_mm) + 'px');
    setRootCssVar('--node-border', mmToCssPx(config.node.default.border_width_mm) + 'px');
    setRootCssVar('--node-padding', '2px');
    setRootCssVar('--stratum-gap-x', px(config.spacing.same_generation_gap_cm));
    setRootCssVar('--stratum-gap-y', px(config.spacing.between_generations_gap_cm));
    setRootCssVar('--stratum-gap-y-landscape', px(config.spacing.between_generations_gap_landscape_cm !== undefined ? config.spacing.between_generations_gap_landscape_cm : config.spacing.between_generations_gap_cm));
    setRootCssVar('--cluster-gap-between', px(config.spacing.same_generation_gap_cm));

    const g1 = config.node.generation_overrides['1'];
    const g2 = config.node.generation_overrides['2'];
    const g3 = config.node.generation_overrides['3'];
    const g4 = config.node.generation_overrides['4'];
    setRootCssVar('--node-scale-d0', (g1.enabled ? g1.scale : 1));
    setRootCssVar('--node-scale-d1', (g2.enabled ? g2.scale : 1));
    setRootCssVar('--node-scale-d2', (g3.enabled ? g3.scale : 1));
    setRootCssVar('--node-scale-d3', (g4.enabled ? g4.scale : 1));

    // Write to shared state object (live binding — all importers see the update)
    treeState.activeTypographyPx.default = Math.max(6, config.typography.default_font_pt * (96 / 72));
    treeState.activeTypographyPx.min     = Math.max(5, config.typography.min_font_pt * (96 / 72));
    treeState.connectorPaddingPx         = Math.max(2, config.spacing.connector_padding_mm * (96 / 25.4));

    applyPrintPageStyle(config);
    applyCoupletConfigToCss(config.couplet);
    document.body.classList.add('print-size-config-active');

    giaPhaLog('applyPrintConfigToCss', {
        activePrintSizeConfigSet: treeState.activePrintSizeConfig === config,
        cmToPx: cmToPx,
        between_generations_gap_cm: config.spacing.between_generations_gap_cm,
        stratum_gap_y_px: config.spacing.between_generations_gap_cm * cmToPx,
        node_height_cm: config.node.default.height_cm,
        node_height_px: config.node.default.height_cm * cmToPx
    });
}

// ── Config loader ─────────────────────────────────────────────────────────────

/**
 * Fetch and validate print-size-config.json from the server.
 * Falls back to defaults if the file is missing or malformed.
 * @returns {Promise<object>} Validated print config.
 */
async function loadPrintSizeConfig() {
    const fallback = cloneDefaultPrintConfig();
    try {
        const response = await fetch('./data/print-size-config.json', { cache: 'no-store' });
        if (!response.ok) {
            console.warn('Khong doc duoc print-size-config.json, dung fallback.');
            giaPhaLog('loadPrintSizeConfig', {
                source: 'fallback',
                status: response.status,
                between_generations_gap_cm: fallback.spacing.between_generations_gap_cm
            });
            return fallback;
        }
        const raw = await response.json();
        const validated = validatePrintConfig(raw);
        giaPhaLog('loadPrintSizeConfig', {
            source: 'network',
            status: response.status,
            between_generations_gap_cm: validated.spacing.between_generations_gap_cm,
            node_height_cm: validated.node.default.height_cm
        });
        return validated;
    } catch (error) {
        console.warn('Loi parse print-size-config.json, dung fallback.', error);
        giaPhaLog('loadPrintSizeConfig', {
            source: 'fallback-catch',
            error: String(error && error.message ? error.message : error),
            between_generations_gap_cm: fallback.spacing.between_generations_gap_cm
        });
        return fallback;
    }
}

// ── Module exports ────────────────────────────────────────────────────────────

export {
    DEFAULT_PRINT_SIZE_CONFIG,
    finiteNumberOr,
    cloneDefaultPrintConfig,
    validatePrintConfig,
    setRootCssVar,
    applyPrintPageStyle,
    applyPrintConfigToCss,
    loadPrintSizeConfig
};