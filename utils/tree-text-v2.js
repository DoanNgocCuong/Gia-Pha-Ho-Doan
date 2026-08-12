/**
 * @module tree-text-v2
 * @description Text normalization, layout, and auto-fit for tree node labels.
 *
 * - Đời 1-2 (d0, d1): word-per-line (mỗi từ 1 dòng) + fit riêng từng ô.
 * - Đời 3 (d2): word-per-line + fit riêng, rồi ĐỒNG BỘ về MIN chung.
 * - Đời 4+ (d3+): WRAP TEXT (nhiều từ/dòng) + CỠ CHỮ ĐỒNG NHẤT.
 *     Chỉ ô cực dài tràn ở default width mới được nới rộng.
 *
 * Dependencies:
 *   - tree-state-v2.js (reads `treeState.activeTypographyPx`)
 */

import { treeState } from './tree-state-v2.js';

/**
 * Normalize a node label string for display.
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

function highlightDashMarks(escapedToken) {
    return String(escapedToken).replace(/[-‐‑‒–—]/g, '<span class="nm-dash">$&</span>');
}

/**
 * Mỗi từ một dòng (cho Đời 1-3).
 */
function tokenizeToLines(text) {
    const s = String(text || '')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim();
    if (!s) return [];
    return s.split(/\s+/).filter(Boolean);
}

/**
 * Build innerHTML từ tokens — mỗi token = 1 span.nm-line.
 * Đời 1-3: display:block (word-per-line).
 * Đời 4+: CSS override display:inline (wrap text).
 */
function tokensToInnerHtml(tokens) {
    return tokens
        .map(function (t) {
            return '<span class="nm-line">' + highlightDashMarks(escapeHtml(t)) + '</span>';
        })
        .join(' ');
}

/**
 * Set dataset + inner HTML for a .nm element.
 */
function setNodeLabelDisplay(el, rawText) {
    const base = normalizeNodeLabel(String(rawText || '').trim());
    el.dataset.gpNm = base;
    el.innerHTML = tokensToInnerHtml(tokenizeToLines(base));
}

/**
 * Apply labels to all .node .nm elements.
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

/** Floor khi tràn nặng */
const FONT_FLOOR_WHEN_OVERFLOW = 1.5;

/**
 * Cỡ chữ ĐỒNG NHẤT cho Đời 4+ (depth >= 3).
 * Nâng từ 10px lên 13.5px để chữ to rõ hơn 35% trên phả đồ.
 */
const D4_UNIFORM_FONT_PX = 13.5;

/**
 * Cỡ chữ ĐỒNG NHẤT cho Đời 1-3 (depth 0-2).
 * Nâng từ 18px lên 22px để danh xưng Cụ to rõ, dễ đọc từ xa.
 */
const D13_UNIFORM_FONT_PX = 22;

/**
 * fitNodeText:
 * - Tất cả đời dùng WRAP TEXT (inline-block).
 * - Đời 1-3 (depth 0-2): font cố định 22px.
 * - Đời 4+ (depth 3+): font cố định 13.5px.
 */
function fitNodeText() {
    const labels = document.querySelectorAll('.node .nm');

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

        // Đời 4+ (depth >= 3): font đồng nhất 13.5px
        if (depth >= 3) {
            label.style.fontSize = D4_UNIFORM_FONT_PX + 'px';
            return;
        }

        // Đời 1-3 (depth 0-2): font đồng nhất 22px (wrap text)
        label.style.fontSize = D13_UNIFORM_FONT_PX + 'px';
    });
}

/**
 * measureFitWidths: Đo chiều rộng cho D4+ nodes dùng WRAP TEXT.
 *
 * Vì D4+ dùng wrap text (display:inline), hầu hết ô VỪA VẶN ở default width.
 * Chỉ ô cực dài (25-33 từ) mới cần nới rộng.
 *
 * @param {number} defaultWidthPx
 * @returns {Map<string, number>}
 */
function measureFitWidths(defaultWidthPx) {
    const result = new Map();
    const nodes  = document.querySelectorAll('.node[data-node-id]');
    const MIN_FONT_SIZE = treeState.activeTypographyPx ? treeState.activeTypographyPx.min : 7;
    const BASE_MAX_FONT_SIZE = Math.max(MIN_FONT_SIZE, treeState.activeTypographyPx ? treeState.activeTypographyPx.default : 12);
    const MAX_W  = defaultWidthPx * 4;

    nodes.forEach(function (node) {
        const id         = node.getAttribute('data-node-id');
        const depthMatch = node.className.match(/\bd(\d+)\b/);
        const depth      = depthMatch ? parseInt(depthMatch[1], 10) : 0;

        if (!id || depth <= 2) {
            if (id) result.set(id, defaultWidthPx);
            return;
        }

        const fixedH = node.clientHeight || 0;
        const nmEl   = node.querySelector('.nm');
        if (fixedH <= 0 || !nmEl) {
            result.set(id, defaultWidthPx);
            return;
        }

        const savedW  = node.style.width;
        const savedFs = nmEl.style.fontSize;

        // Set font đồng nhất D4+
        nmEl.style.fontSize = D4_UNIFORM_FONT_PX + 'px';

        // D4+ đã có CSS wrap text (display:inline trên .nm-line).
        // Chỉ cần check scrollHeight vs fixedH.
        function fits(w) {
            node.style.width = w + 'px';
            return nmEl.scrollHeight <= fixedH + 1 && nmEl.scrollWidth <= nmEl.clientWidth + 1;
        }

        // Bước 1: Vừa ô default?
        if (fits(defaultWidthPx)) {
            result.set(id, defaultWidthPx);
            node.style.width    = savedW;
            nmEl.style.fontSize = savedFs;
            return;
        }

        // Bước 2: Vừa ở MAX_W?
        if (!fits(MAX_W)) {
            result.set(id, defaultWidthPx);
            node.style.width    = savedW;
            nmEl.style.fontSize = savedFs;
            return;
        }

        // Bước 3: Binary search chiều rộng tối thiểu
        let lo = defaultWidthPx, hi = MAX_W;
        for (let i = 0; i < 20; i++) {
            if (hi - lo < 1) break;
            const mid = (lo + hi) / 2;
            if (!fits(mid)) lo = mid;
            else hi = mid;
        }
        const expandedW = Math.ceil(hi);

        // Đánh dấu ô nới rộng
        node.classList.add('nm-expanded');

        result.set(id, expandedW);
        node.style.width    = savedW;
        nmEl.style.fontSize = savedFs;
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
