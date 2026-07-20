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

    labels.forEach(function (label) {
        const base = label.dataset.gpNm;
        if (!base) {
            setNodeLabelDisplay(label, label.textContent || '');
        } else {
            label.innerHTML = tokensToInnerHtml(tokenizeToLines(base));
        }

        const node = label.closest('.node');
        const depthMatch = node ? node.className.match(/\bd(\d+)\b/) : null;
        const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0;

        // Chỉ cho phép tăng font size theo tỷ lệ scale đối với thế hệ landscape đời 1-2 (d0-d1)
        // Thế hệ dọc d3+ (đời 4+) và Đời 3 (d2) giữ nguyên trần font size mặc định để tránh chênh lệch to nhỏ
        let scale = 1;
        if (depth <= 1) {
            scale = getNodeWidthScale(label);
        }
        let maxFontSize = Math.max(MIN_FONT_SIZE, BASE_MAX_FONT_SIZE * scale);
        if (depth === 2) {
            maxFontSize = 18; // Khống chế trần font-size đời 3 ở 18px để chữ bằng nhau cân đối
        }

        label.style.fontSize = maxFontSize + 'px';
        if (!isOverflow(label)) {
            return;
        }

        label.style.fontSize = MIN_FONT_SIZE + 'px';
        if (isOverflow(label)) {
            let s = MIN_FONT_SIZE;
            while (s > FONT_FLOOR_WHEN_OVERFLOW && isOverflow(label)) {
                s -= 0.25;
                label.style.fontSize = s + 'px';
            }
            return;
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
        label.style.fontSize = lo + 'px';
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
    const MAX_W  = defaultWidthPx * 7;  // cap at 7× default để tránh node quá rộng hoặc bị tràn chữ

    nodes.forEach(function (node) {
        const id         = node.getAttribute('data-node-id');
        const depthMatch = node.className.match(/\bd(\d+)\b/);
        const depth      = depthMatch ? parseInt(depthMatch[1], 10) : 0;

        if (depth <= 2) return; // landscape d0/d1/d2: CSS controls width

        const fixedH = node.clientHeight || 0;
        if (fixedH <= 0) { result.set(id, defaultWidthPx); return; }

        const nmEl = node.querySelector('.nm');
        if (!nmEl) { result.set(id, defaultWidthPx); return; }

        const savedW    = node.style.width;
        const savedNmOf = nmEl.style.overflow;
        // .nm has overflow:hidden from CSS — must expose true scrollHeight for measurement
        nmEl.style.overflow = 'visible';

        function fits(w) {
            node.style.width = w + 'px';
            return nmEl.scrollHeight <= fixedH + 1 && nmEl.scrollWidth <= nmEl.clientWidth + 1;
        }

        if (fits(defaultWidthPx)) {
            result.set(id, defaultWidthPx);
        } else {
            let lo = defaultWidthPx, hi = MAX_W;
            for (let i = 0; i < 20; i++) {
                if (hi - lo < 1) break;
                const mid = (lo + hi) / 2;
                if (!fits(mid)) lo = mid;
                else hi = mid;
            }
            result.set(id, Math.ceil(hi));
        }

        node.style.width    = savedW;
        nmEl.style.overflow = savedNmOf;
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
