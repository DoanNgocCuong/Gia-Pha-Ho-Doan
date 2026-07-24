/**
 * @module tree-text-v2
 * @description Text normalization, one word per line, and auto-fit for tree node labels.
 *
 * Sau `normalizeNodeLabel`, mỗi từ (cụm `split(/\s+/)`) một dòng `.nm-line`.
 *
 * Dependencies:
 *   - tree-state-v2.js (reads `treeState.activeTypographyPx`)
 */

import { treeState } from './tree-state-v2.js';

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

/** @param {string} s */
function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Tô màu riêng các dấu gạch ngang trong token để dễ kiểm tra tên chồng/vợ.
 * @param {string} escapedToken - Token đã escape HTML.
 * @returns {string}
 */
function highlightDashMarks(escapedToken) {
    return String(escapedToken).replace(/[-‐‑‒–—]/g, '<span class="nm-dash">$&</span>');
}

/**
 * Mỗi từ một dòng: tách theo khoảng trắng (gồm xuống dòng từ normalize).
 * @param {string} text - Đã qua normalizeNodeLabel.
 * @returns {string[]}
 */
function tokenizeToLines(text) {
    const s = String(text || '')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim();
    if (!s) return [];
    return s.split(/\s+/).filter(Boolean);
}

/**
 * @param {string[]} tokens
 * @returns {string}
 */
function tokensToInnerHtml(tokens) {
    return tokens
        .map(function (t) {
            return '<span class="nm-line">' + highlightDashMarks(escapeHtml(t)) + '</span>';
        })
        .join('');
}

/**
 * Set dataset + inner HTML for a .nm element from raw name.
 * @param {HTMLElement} el
 * @param {string} rawText
 */
function setNodeLabelDisplay(el, rawText) {
    const base = normalizeNodeLabel(String(rawText || '').trim());
    el.dataset.gpNm = base;
    el.innerHTML = tokensToInnerHtml(tokenizeToLines(base));
}

/**
 * Apply label normalization + token lines to all .node .nm elements in the DOM.
 * Called once after the tree is rendered, before fitNodeText.
 */
function normalizeAllNodeLabels() {
    document
        .querySelectorAll('.node .nm')
        .forEach(function (label) {
            const fromData = label.dataset.gpNm;
            const raw =
                fromData != null && fromData !== ''
                    ? fromData
                    : (label.textContent || '').replace(/\s+/g, ' ').trim();
            if (!raw) return;
            setNodeLabelDisplay(label, raw);
        });
}

/** Cỡ chữ tối thiểu khi vẫn tràn (px) — thấp hơn 4px để tránh cắt chữ khi có thể. */
const FONT_FLOOR_WHEN_OVERFLOW = 1.5;

/**
 * Auto-fit: mỗi nhãn bắt đầu từ cỡ chữ tối đa theo scale ngang của ô,
 * rồi chỉ thu nhỏ riêng khi chính nhãn đó bị tràn khỏi ô.
 */
function fitNodeText() {
    const labels = document.querySelectorAll(
        '.node .nm'
    );
    const MIN_FONT_SIZE = treeState.activeTypographyPx.min;
    const BASE_MAX_FONT_SIZE = Math.max(MIN_FONT_SIZE, treeState.activeTypographyPx.default);
    const rootStyle = getComputedStyle(document.documentElement);
    const baseNodeWidthPx = parseFloat(rootStyle.getPropertyValue('--node-width'));

    function isOverflow(el) {
        return (
            el.scrollHeight > el.clientHeight + 0.75 ||
            el.scrollWidth > el.clientWidth + 0.75
        );
    }

    function getNodeWidthScale(label) {
        const node = label.closest('.node');
        if (!node || !Number.isFinite(baseNodeWidthPx) || baseNodeWidthPx <= 0) return 1;

        const width = node.getBoundingClientRect().width;
        return Number.isFinite(width) && width > 0 ? width / baseNodeWidthPx : 1;
    }

    function calculateSingleFittedFontSize(label) {
        const base = label.dataset.gpNm;
        if (!base) {
            setNodeLabelDisplay(label, label.textContent || '');
        } else {
            label.innerHTML = tokensToInnerHtml(tokenizeToLines(base));
        }

        const node = label.closest('.node');
        const depthMatch = node ? node.className.match(/\bd(\d+)\b/) : null;
        const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0;

        let scale = 1;
        if (depth <= 1) {
            scale = getNodeWidthScale(label);
        }
        let maxFontSize = Math.max(MIN_FONT_SIZE, BASE_MAX_FONT_SIZE * scale);
        if (depth === 2) {
            maxFontSize = 18; // Khống chế trần font-size đời 3 ở 18px
        }

        label.style.fontSize = maxFontSize + 'px';
        if (!isOverflow(label)) {
            return { depth: depth, fontSize: maxFontSize };
        }

        label.style.fontSize = MIN_FONT_SIZE + 'px';
        if (isOverflow(label)) {
            let s = MIN_FONT_SIZE;
            while (s > FONT_FLOOR_WHEN_OVERFLOW && isOverflow(label)) {
                s -= 0.25;
                label.style.fontSize = s + 'px';
            }
            return { depth: depth, fontSize: s };
        }

        let lo = MIN_FONT_SIZE;
        let hi = maxFontSize;
        for (let i = 0; i < 56; i++) {
            if (hi - lo < 0.25) break;
            const mid = (lo + hi) / 2;
            label.style.fontSize = mid + 'px';
            if (isOverflow(label)) hi = mid;
            else lo = mid;
        }
        return { depth: depth, fontSize: lo };
    }

    const results = [];
    labels.forEach(function (label) {
        const res = calculateSingleFittedFontSize(label);
        results.push({ label: label, depth: res.depth, fontSize: res.fontSize });
    });

    // Đồng bộ cỡ chữ Đời 3 (depth 2: cụ Hán, cụ Quyết, cụ Huấn) theo cỡ chữ nhỏ nhất để cân đối 100%
    let minD2FontSize = Infinity;
    results.forEach(function (r) {
        if (r.depth === 2) {
            if (r.fontSize < minD2FontSize) {
                minD2FontSize = r.fontSize;
            }
        }
    });

    results.forEach(function (r) {
        if (r.depth === 2 && Number.isFinite(minD2FontSize) && minD2FontSize > 0) {
            r.label.style.fontSize = minD2FontSize + 'px';
        } else {
            r.label.style.fontSize = r.fontSize + 'px';
        }
    });
}

/**
 * Binary-search minimum width per d3+ node so all text fits within the node's
 * current clientHeight (fixed by CSS). d0/d1/d2 landscape nodes are skipped.
 * Returns Map<nodeId, widthPx>.
 *
 * @param {number} defaultWidthPx - Baseline node width from config (W).
 * @returns {Map<string, number>}
 */
function measureFitWidths(defaultWidthPx) {
    const result = new Map();
    const nodes  = document.querySelectorAll('.node[data-node-id]');

    nodes.forEach(function (node) {
        const id = node.getAttribute('data-node-id');
        if (id) {
            result.set(id, defaultWidthPx);
        }
    });

    return result;
}

export {
    normalizeNodeLabel,
    setNodeLabelDisplay,
    normalizeAllNodeLabels,
    fitNodeText,
    measureFitWidths
};
