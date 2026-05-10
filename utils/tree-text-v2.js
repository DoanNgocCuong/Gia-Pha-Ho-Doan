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

/** Mirror utils/migrate_wife_name.py: strip ZWSP, collapse spaces (for split only). */
function normalizeNameForHyphenSplit(name) {
    return String(name || '')
        .replace(/\u200b/g, '')
        .replace(/[ \t]+/g, ' ')
        .trim();
}

/**
 * Phần "chồng" (trước dấu phân tách đầu tiên whitespace-hyphen-whitespace), khớp migrate wifeName.
 * @param {string} fullName
 * @returns {string|null} head hoặc null nếu không tách được / đuôi rỗng.
 */
function getMalePrimaryLabelFromFullName(fullName) {
    const norm = normalizeNameForHyphenSplit(fullName);
    if (!norm) return null;
    const re = /\s*-\s*/;
    const m  = re.exec(norm);
    if (!m) return null;
    const head = norm.slice(0, m.index).trim();
    const tail = norm.slice(m.index + m[0].length).trim();
    if (!tail) return null;
    return head || null;
}

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
            return '<span class="nm-line">' + escapeHtml(t) + '</span>';
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
        .querySelectorAll('.node .nm, .node .nm-primary, .node .nm-spouse')
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
 * Auto-fit: largest font size in [min, upper] so content fits inside .node.
 * Uses binary search (monotone: larger font → more overflow).
 */
function fitNodeText() {
    const labels = document.querySelectorAll(
        '.node .nm, .node .nm-primary, .node .nm-spouse'
    );
    const MIN_FONT_SIZE = treeState.activeTypographyPx.min;
    const DEFAULT_FONT = treeState.activeTypographyPx.default;
    const UPPER = Math.min(88, Math.max(DEFAULT_FONT * 3.5, 28));

    function isOverflow(el) {
        return (
            el.scrollHeight > el.clientHeight + 0.75 ||
            el.scrollWidth > el.clientWidth + 0.75
        );
    }

    labels.forEach(function (label) {
        const base = label.dataset.gpNm;
        if (!base) {
            setNodeLabelDisplay(label, label.textContent || '');
        } else {
            label.innerHTML = tokensToInnerHtml(tokenizeToLines(base));
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
        let hi = UPPER;
        for (let i = 0; i < 56; i++) {
            if (hi - lo < 0.25) break;
            const mid = (lo + hi) / 2;
            label.style.fontSize = mid + 'px';
            if (isOverflow(label)) hi = mid;
            else lo = mid;
        }
        label.style.fontSize = lo + 'px';

        if (isOverflow(label)) {
            let s = lo;
            while (s > FONT_FLOOR_WHEN_OVERFLOW && isOverflow(label)) {
                s -= 0.25;
                label.style.fontSize = s + 'px';
            }
        }
    });
}

export {
    normalizeNodeLabel,
    getMalePrimaryLabelFromFullName,
    setNodeLabelDisplay,
    normalizeAllNodeLabels,
    fitNodeText
};
