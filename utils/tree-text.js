/**
 * @module tree-text
 * @deprecated Runtime dùng tree-text-v2.js (xem index.html và utils/README.md mục 9).
 * @description Text normalization and auto-fit for tree node labels.
 *
 * Dependencies:
 *   - tree-state.js (reads `treeState.activeTypographyPx`)
 *
 * Text normalization includes Vietnamese-specific abbreviation rules for
 * honorific prefixes (ông., ô., b.) and double-barrelled name formatting.
 */

import { treeState } from './tree-state.js';

/**
 * Normalize a node label string for display.
 * @param {string} text - Raw label text.
 * @returns {string} Normalized text.
 */
function normalizeNodeLabel(text) {
    return String(text || '')
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/(^|\s)ông\.?(?=\s+[A-ZÀ-Ỹ])/g, '$1Ô.')
        .replace(/(^|\s)ô\.?(?=\s+[A-ZÀ-Ỹ])/g, '$1Ô.')
        .replace(/(^|\s)b\.?(?=\s+[A-ZÀ-Ỹ])/g, '$1B.')
        .replace(/(Ô\.[^\s()\-]+)-(?=B\.)/g, '$1\n-');
}

/**
 * Apply label normalization to all .node .nm elements in the DOM.
 * Called once after the tree is rendered, before fitNodeText.
 */
function normalizeAllNodeLabels() {
    document.querySelectorAll('.node .nm').forEach(function (label) {
        const text = (label.textContent || '').trim();
        if (!text) return;
        label.textContent = normalizeNodeLabel(text);
    });
}

/**
 * Auto-fit text inside each .node .nm by binary-searching font size.
 * Uses `activeTypographyPx.default` as the ceiling and `activeTypographyPx.min`
 * as the floor, decrementing by 0.25px steps.
 *
 * Note: If font-size changes after edges are drawn, edges will NOT
 * automatically update. This is acceptable when node dimensions are fixed
 * by CSS variables.
 */
function fitNodeText() {
    const labels = document.querySelectorAll('.node .nm');
    const MAX_FONT_SIZE = treeState.activeTypographyPx.default;
    const MIN_FONT_SIZE = treeState.activeTypographyPx.min;
    const FONT_STEP = 0.25;

    function isOverflow(el) {
        return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    }

    function normalizeForDisplay(text) {
        return text.replace(/-/g, '-​');
    }

    labels.forEach(function (label) {
        const originalText = (label.textContent || '').trim();
        if (!originalText) return;

        label.textContent = normalizeForDisplay(originalText);
        let fontSize = MAX_FONT_SIZE;
        label.style.fontSize = fontSize + 'px';

        while (fontSize > MIN_FONT_SIZE && isOverflow(label)) {
            fontSize = Math.max(MIN_FONT_SIZE, fontSize - FONT_STEP);
            label.style.fontSize = fontSize + 'px';
        }
    });
}

export { normalizeNodeLabel, normalizeAllNodeLabels, fitNodeText };