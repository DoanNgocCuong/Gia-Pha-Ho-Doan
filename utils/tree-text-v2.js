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
 *
 * Đối với Đời 3 (depth === 2): đồng bộ cỡ chữ tất cả ô Đời 3 về cùng min.
 * Đối với Đời 4+ (depth >= 3): CỠ CHỮ ĐỒNG NHẤT = BASE_MAX_FONT_SIZE cho TẤT CẢ ô.
 *   Ô nào tràn đã được measureFitWidths nới rộng + chuyển sang wrap text.
 *   Ô nào KHÔNG tràn giữ nguyên word-per-line.
 */
function fitNodeText() {
    const labels = document.querySelectorAll('.node .nm');
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

    const d2FittedSizes = [];

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

        // ─── Đời 1-3+: fit riêng từng ô ───
        // Ô đã được measureFitWidths nới rộng (nm-wrap) → box rộng hơn
        // → fitNodeText tự nhiên giữ font lớn (vì text vừa box rộng).
        // Ô bình thường → fit như cũ, KHÔNG thay đổi gì.
        let scale = 1;
        if (depth <= 1) {
            scale = getNodeWidthScale(label);
        }

        let maxFontSize = Math.max(MIN_FONT_SIZE, BASE_MAX_FONT_SIZE * scale);
        if (depth === 2) {
            maxFontSize = 18; // Trần tối đa Đời 3
        }

        label.style.fontSize = maxFontSize + 'px';
        if (!isOverflow(label)) {
            if (depth === 2) d2FittedSizes.push(maxFontSize);
            return;
        }

        label.style.fontSize = MIN_FONT_SIZE + 'px';
        if (isOverflow(label)) {
            let s = MIN_FONT_SIZE;
            while (s > FONT_FLOOR_WHEN_OVERFLOW && isOverflow(label)) {
                s -= 0.25;
                label.style.fontSize = s + 'px';
            }
            if (depth === 2) d2FittedSizes.push(s);
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
        const finalSize = lo;
        label.style.fontSize = finalSize + 'px';
        if (depth === 2) d2FittedSizes.push(finalSize);
    });

    // Đồng bộ cỡ chữ Đời 3 (depth === 2): tất cả các ô Đời 3 dùng chung 1 cỡ chữ bằng nhau
    if (d2FittedSizes.length > 0) {
        const minD2Size = Math.min(...d2FittedSizes);
        document.querySelectorAll('.node.d2 .nm').forEach(function (label) {
            label.style.fontSize = minD2Size + 'px';
        });
    }
}

/**
 * Đo đạc chiều rộng cho Đời 4+ (depth >= 3).
 * Logic:
 *   1. Đặt cỡ chữ = BASE_MAX_FONT_SIZE (đồng nhất).
 *   2. Nếu text VỪA ô ở default width (word-per-line) → giữ nguyên.
 *   3. Nếu text TRÀN → chuyển .nm-line sang display:inline (wrap text)
 *      rồi binary-search chiều rộng tối thiểu để text vừa.
 *   4. Ô được nới rộng sẽ thêm class "nm-wrap" để CSS biết chuyển sang wrap.
 *
 * @param {number} defaultWidthPx - Baseline node width from config (W).
 * @returns {Map<string, number>}
 */
function measureFitWidths(defaultWidthPx) {
    const result = new Map();
    const nodes  = document.querySelectorAll('.node[data-node-id]');
    const MIN_FONT_SIZE = treeState.activeTypographyPx ? treeState.activeTypographyPx.min : 7;
    const BASE_MAX_FONT_SIZE = Math.max(MIN_FONT_SIZE, treeState.activeTypographyPx ? treeState.activeTypographyPx.default : 12);
    const MAX_W  = defaultWidthPx * 4; // Giới hạn nới rộng tối đa 4x

    nodes.forEach(function (node) {
        const id         = node.getAttribute('data-node-id');
        const depthMatch = node.className.match(/\bd(\d+)\b/);
        const depth      = depthMatch ? parseInt(depthMatch[1], 10) : 0;

        // Đời 1-3: giữ nguyên default width
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
        const nmLines = nmEl.querySelectorAll('.nm-line');

        // Đặt font chuẩn đồng nhất
        nmEl.style.fontSize = BASE_MAX_FONT_SIZE + 'px';

        function fits(w) {
            node.style.width = w + 'px';
            return nmEl.scrollHeight <= fixedH + 1 && nmEl.scrollWidth <= nmEl.clientWidth + 1;
        }

        // ── Bước 1: Kiểm tra word-per-line ở default width ──
        if (fits(defaultWidthPx)) {
            // Text vừa vặn → giữ nguyên, KHÔNG cần nới
            result.set(id, defaultWidthPx);
            node.style.width    = savedW;
            nmEl.style.fontSize = savedFs;
            return;
        }

        // ── Bước 2: Chuyển sang wrap text (display:inline) ──
        // Để khi nới rộng ô, nhiều từ xếp trên 1 dòng → giảm số dòng → vừa chiều cao
        nmLines.forEach(function (ln) {
            ln.style.display = 'inline';
            ln.style.whiteSpace = 'normal';
        });

        // ── Bước 3: Kiểm tra wrap ở MAX_W — nếu vẫn tràn → không cứu được ──
        if (!fits(MAX_W)) {
            // Quá nhiều chữ, kể cả wrap + MAX_W vẫn tràn → giữ default, chấp nhận clip
            nmLines.forEach(function (ln) {
                ln.style.display = '';
                ln.style.whiteSpace = '';
            });
            result.set(id, defaultWidthPx);
            node.style.width    = savedW;
            nmEl.style.fontSize = savedFs;
            return;
        }

        // ── Bước 4: Binary search chiều rộng tối thiểu (wrap mode) ──
        let lo = defaultWidthPx, hi = MAX_W;
        for (let i = 0; i < 20; i++) {
            if (hi - lo < 1) break;
            const mid = (lo + hi) / 2;
            if (!fits(mid)) lo = mid;
            else hi = mid;
        }
        const expandedW = Math.ceil(hi);

        // Đánh dấu node này cần wrap text (CSS class)
        node.classList.add('nm-wrap');

        // Reset inline styles — CSS class .nm-wrap sẽ override display/white-space
        nmLines.forEach(function (ln) {
            ln.style.display = '';
            ln.style.whiteSpace = '';
        });

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
