/**
 * @module css-units
 * @description Browser CSS length probes shared by layout and print-config (no deps).
 *
 * Used to convert config dimensions in cm/mm to px for :root variables and
 * for computeAbsoluteLayout, keeping one physical scale per viewport.
 */

/**
 * 1 CSS cm ≈ this many px on the current display (depends on DPI/zoom).
 * @returns {number}
 */
export function cssCmToPxFactor() {
    const probe = document.createElement('div');
    probe.style.cssText =
        'position:absolute;left:-9999px;height:1cm;width:1cm;visibility:hidden;pointer-events:none;';
    document.body.appendChild(probe);
    const h = probe.offsetHeight || 37.8;
    probe.remove();
    return h > 0 ? h : 37.8;
}

/**
 * Convert millimeters to CSS pixels (96 px per inch).
 * @param {number} mm
 * @returns {number}
 */
export function mmToCssPx(mm) {
    const n = Number(mm);
    if (!Number.isFinite(n)) return 0;
    return n * (96 / 25.4);
}
