/**
 * @module tree-pan
 * @description Drag-to-pan interaction for the tree viewport.
 *
 * Dependencies: none (pure DOM interaction).
 *
 * Supports both mouse and touch input. Exports `initTreePan()` which
 * must be called AFTER the DOM is ready (after bootstrapTree has rendered
 * the tree, or at least after `.tree-wrapper` exists in the DOM).
 */

/**
 * Initialize drag-to-pan on `.tree-wrapper`.
 * Safe to call multiple times — attaches fresh listeners each time.
 */
export function initTreePan() {
    const wrapper = document.querySelector('.tree-wrapper');
    if (!wrapper) return;

    let isDown = false;
    let startX = 0, startY = 0;
    let scrollLeft = 0, scrollTop = 0;

    // ── Mouse events ─────────────────────────────────────────────────────────
    wrapper.addEventListener('mousedown', function (e) {
        isDown = true;
        startX = e.pageX - wrapper.offsetLeft;
        startY = e.pageY - wrapper.offsetTop;
        scrollLeft = wrapper.scrollLeft;
        scrollTop = wrapper.scrollTop;
        wrapper.style.cursor = 'grabbing';
        e.preventDefault();
    });

    wrapper.addEventListener('mouseleave', function () {
        isDown = false;
        wrapper.style.cursor = 'grab';
    });

    wrapper.addEventListener('mouseup', function () {
        isDown = false;
        wrapper.style.cursor = 'grab';
    });

    wrapper.addEventListener('mousemove', function (e) {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - wrapper.offsetLeft;
        const y = e.pageY - wrapper.offsetTop;
        wrapper.scrollLeft = scrollLeft + (x - startX);
        wrapper.scrollTop  = scrollTop  - (y - startY);
    });

    // ── Touch events ────────────────────────────────────────────────────────
    let touchStartX = 0, touchStartY = 0;
    wrapper.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].pageX - wrapper.offsetLeft;
        touchStartY = e.touches[0].pageY - wrapper.offsetTop;
        scrollLeft = wrapper.scrollLeft;
        scrollTop = wrapper.scrollTop;
    }, { passive: false });

    wrapper.addEventListener('touchmove', function (e) {
        e.preventDefault();
        const x = e.touches[0].pageX - wrapper.offsetLeft;
        const y = e.touches[0].pageY - wrapper.offsetTop;
        wrapper.scrollLeft = scrollLeft + (x - touchStartX);
        wrapper.scrollTop  = scrollTop  - (y - touchStartY);
    }, { passive: false });
}
