/**
 * @module rong-phung
 * @description Hình con rồng & con phượng cho header gia phả (line-art SVG).
 *
 * Tả Long (rồng bên trái) đầu quay vào tâm tiêu đề.
 * Hữu Phụng (phượng bên phải) đầu quay vào tâm tiêu đề.
 * Mắt đỏ #d00000 đồng bộ với .nm-dash trong CSS.
 *
 * mountRongPhung() tìm 2 placeholder span trong .header
 * (.header-emblem-dragon / .header-emblem-phoenix) và inject SVG.
 * Không tạo thẻ mới — placeholder đã giữ chỗ flex trước khi JS chạy.
 */

const RONG_SVG = `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 52 Q12 44 20 46 Q30 49 34 40 Q38 30 48 30 Q56 30 55 21" />
    <path d="M55 21 Q60 19 60 14 Q60 9 55 9 Q50 9 50 14 Q50 17 52 19" />
    <path d="M55 9 L58 3 M50 11 L46 5 M50 14 L44 13" />
    <path d="M52 19 Q47 22 44 28" />
    <path d="M34 38 L34 33 M28 42 L26 37 M20 46 L17 42" />
    <path d="M6 52 L2 53 M6 52 L4 56 M6 52 L8 57" />
    <circle cx="55" cy="13" r="1.3" fill="#d00000" stroke="none" />
</svg>`.trim();

const PHUNG_SVG = `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M58 52 Q52 44 44 46 Q34 49 30 40 Q26 30 16 30 Q8 30 9 21" />
    <path d="M9 21 Q4 19 4 14 Q4 9 9 9 Q14 9 14 14 Q14 17 12 19" />
    <path d="M9 9 L7 2 M9 9 L12 3 M9 9 L4 4" />
    <path d="M6 16 L2 17 L5 19" />
    <path d="M58 52 Q63 50 63 44 Q63 38 57 37" />
    <path d="M58 52 Q62 55 61 60 Q60 62 56 61" />
    <path d="M58 52 Q56 58 50 58" />
    <path d="M32 39 Q36 32 42 32 Q46 32 46 36" />
    <circle cx="9" cy="13" r="1.3" fill="#d00000" stroke="none" />
</svg>`.trim();

/**
 * Inject SVG rồng–phượng vào 2 placeholder trong .header.
 * Idempotent: nếu placeholder đã có SVG, bỏ qua.
 */
export function mountRongPhung() {
    const rongSlot  = document.querySelector('.header-emblem-dragon');
    const phungSlot = document.querySelector('.header-emblem-phoenix');

    if (rongSlot && !rongSlot.querySelector('svg')) {
        rongSlot.innerHTML = RONG_SVG;
    }
    if (phungSlot && !phungSlot.querySelector('svg')) {
        phungSlot.innerHTML = PHUNG_SVG;
    }
}

export { RONG_SVG, PHUNG_SVG };
