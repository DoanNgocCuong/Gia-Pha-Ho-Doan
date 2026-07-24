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
 * Dùng cho các ô tên ngắn / 1 vợ (95% tổng số ô).
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

/** Regex phát hiện ô nhiều vợ: BẮT BUỘC có digit sau BÀ (BÀ1, BÀ2, BÀ3...)
 * KHÔNG match standalone "BÀ" (title nữ = Bà) để tránh false positive. */
const MULTI_WIFE_RE = /BÀ\d/;

/**
 * Nhóm cụm dòng thông minh cho ô Nhiều Vợ (Clause-based Grouping).
 * Thay vì tách từng từ (35 dòng), nhóm theo cụm logic:
 *   Dòng 1: Tên Chồng ("Ô. ĐOÀN VĂN TỰ NM 16/8")
 *   Dòng 2: Bà 1 ("BÀ1 ĐỖ THỊ GẮT NM 24/6")
 *   Dòng 3: Bà 2 ("BÀ2 NGUYỄN THỊ NIÊN NM")
 *   ...
 * Giảm số dòng từ 25-35 xuống 3-5 dòng, giải phóng cơ chế nới chiều ngang ô.
 *
 * @param {string} text - Đã qua normalizeNodeLabel.
 * @returns {string[]} Mảng các clause, mỗi phần tử là 1 cụm logic.
 */
function clauseTokenize(text) {
    const s = String(text || '')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim();
    if (!s) return [];

    // Tách tại các điểm bắt đầu mỗi bà vợ hoặc phần thông tin phụ
    // Pattern: trước "- BÀ", ", BÀ", " BÀ1", " BÀ2", " PHẦN MỘ"
    // BẮT BUỘC BÀ + digit (BÀ1, BÀ2...). KHÔNG match standalone "BÀ" (title nữ).
    var parts = s.split(/((?:\s*[-–—,]\s*)?BÀ\d(?:\s|$))/);

    var clauses = [];
    var cur = '';
    for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (!p) continue;
        // Nếu part này match đầu clause bà vợ (BÀ1, BÀ2, - BÀ...)
        if (/^(?:\s*[-–—,]\s*)?BÀ\d\s*$/.test(p)) {
            if (cur.trim()) clauses.push(cur.trim());
            cur = p.replace(/^[\s,]+/, '').trim(); // Bỏ dấu phẩy/space đầu
        } else {
            cur += ' ' + p;
        }
    }
    if (cur.trim()) clauses.push(cur.trim());

    // Nếu clause có thêm "PHẦN MỘ" đính kèm, tách riêng
    var result = [];
    for (var j = 0; j < clauses.length; j++) {
        var c = clauses[j];
        var pmIdx = c.indexOf('PHẦN MỘ');
        if (pmIdx > 0) {
            result.push(c.substring(0, pmIdx).trim());
            result.push(c.substring(pmIdx).trim());
        } else {
            result.push(c);
        }
    }

    return result.filter(Boolean);
}

/**
 * Chọn chiến lược tokenize phù hợp:
 * - Ô nhiều vợ → clauseTokenize (nhóm cụm)
 * - Ô thường → tokenizeToLines (mỗi từ 1 dòng)
 * @param {string} text - Đã qua normalizeNodeLabel.
 * @returns {string[]}
 */
function smartTokenize(text) {
    if (MULTI_WIFE_RE.test(text)) {
        return clauseTokenize(text);
    }
    return tokenizeToLines(text);
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
    el.innerHTML = tokensToInnerHtml(smartTokenize(base));
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
 * Đối với Đời 3 (depth === 2): tự động đồng bộ cỡ chữ của tất cả các ô Đời 3
 * (Cụ Hán, Cụ Quyết, Cụ Huấn) về cùng một cỡ chữ tối thiểu chung để nhìn cân đối 100%.
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
            label.innerHTML = tokensToInnerHtml(smartTokenize(base));
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
 * Đo đạc chiều rộng cần nới sang 2 bên cho các ô nhiều vợ / tên dài ở Đời 4+ (depth >= 3)
 * để ĐẢM BẢO CỠ CHỮ VẪN GIỮ Ở MỨC CHUẨN (BASE_MAX_FONT_SIZE ~12px) và chiều cao giữ nguyên 150px.
 * Các ô 1 vợ / tên ngắn (95% số ô) giữ nguyên kích thước chuẩn defaultWidthPx (1.5cm).
 *
 * @param {number} defaultWidthPx - Baseline node width from config (W).
 * @returns {Map<string, number>}
 */
function measureFitWidths(defaultWidthPx) {
    const result = new Map();
    const nodes  = document.querySelectorAll('.node[data-node-id]');
    const MIN_FONT_SIZE = treeState.activeTypographyPx ? treeState.activeTypographyPx.min : 7;
    const BASE_MAX_FONT_SIZE = Math.max(MIN_FONT_SIZE, treeState.activeTypographyPx ? treeState.activeTypographyPx.default : 12);
    const MAX_W  = defaultWidthPx * 4; // Giới hạn nới rộng tối đa 4x (~227px) để cover clause dài nhất

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

        const savedW    = node.style.width;
        const savedFs   = nmEl.style.fontSize;

        // GIỮ overflow: hidden (CSS mặc định) — KHÔNG set overflow: visible!
        // Lý do: Chrome trả scrollWidth === clientWidth khi overflow: visible,
        // khiến thuật toán TƯỞNG ô đủ rộng → KHÔNG nới → clause bị cắt sạch.
        // Với overflow: hidden, scrollWidth luôn trả đúng chiều rộng nội dung thực.
        nmEl.style.fontSize = BASE_MAX_FONT_SIZE + 'px';

        function fitsAtNormalFont(w) {
            node.style.width = w + 'px';
            return nmEl.scrollHeight <= fixedH + 1 && nmEl.scrollWidth <= nmEl.clientWidth + 1;
        }

        if (fitsAtNormalFont(defaultWidthPx)) {
            // Ô thường: chữ vừa vặn → giữ nguyên kích thước chuẩn
            result.set(id, defaultWidthPx);
        } else if (!fitsAtNormalFont(MAX_W)) {
            // Tràn CHIỀU CAO thuần túy (nới rộng cũng không giúp) → giữ nguyên,
            // để fitNodeText xử lý co chữ như cũ. KHÔNG nới rộng vô ích.
            result.set(id, defaultWidthPx);
        } else {
            // Tràn CHIỀU RỘNG (clause dài hơn ô) → nới rộng vừa đủ
            let lo = defaultWidthPx, hi = MAX_W;
            for (let i = 0; i < 20; i++) {
                if (hi - lo < 1) break;
                const mid = (lo + hi) / 2;
                if (!fitsAtNormalFont(mid)) lo = mid;
                else hi = mid;
            }
            result.set(id, Math.ceil(hi));
        }

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
