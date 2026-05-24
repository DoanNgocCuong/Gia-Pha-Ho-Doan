/**
 * @module tree-export
 * @description Export functionality: JSON, YAML, image (PNG), PDF, and JSON preview UI.
 *
 * Dependencies:
 *   - tree-state.js    (reads `treeState.currentTreePayload`)
 *   - tree-edges.js    (calls `drawTreeEdges`)
 *
 * External libraries (loaded via CDN in index.html):
 *   - html2canvas@1.4.1
 *   - jspdf@2.5.1
 */

import { treeState } from './tree-state-v2.js';
import { drawTreeEdges } from './tree-edges-v2.js';

// ── Pure helpers ──────────────────────────────────────────────────────────────

/**
 * Clone the tree root object via JSON round-trip.
 * @param {object} root
 * @returns {object|null}
 */
function cloneTreePayloadRoot(root) {
    try { return JSON.parse(JSON.stringify(root)); } catch (e) { return null; }
}

/**
 * Build tree data from the current in-memory payload, or from the DOM.
 * @returns {object|null}
 */
function buildTreeDataFromDom() {
    if (treeState.currentTreePayload && treeState.currentTreePayload.root) {
        return cloneTreePayloadRoot(treeState.currentTreePayload.root);
    }
    return null;
}

/**
 * Trigger a file download from a string content blob.
 * @param {string} content
 * @param {string} filename
 * @param {string} mimeType
 */
function downloadTextFile(content, filename, mimeType) {
    const blob      = new Blob([content], { type: mimeType });
    const objectUrl = URL.createObjectURL(blob);
    const link      = document.createElement('a');
    link.href      = objectUrl;
    link.download  = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
}

/**
 * Return an export timestamp string: YYYYMMDD-HHMMSS.
 * @returns {string}
 */
function getExportTimestamp() {
    const now = new Date();
    return now.getFullYear()
        + String(now.getMonth() + 1).padStart(2, '0')
        + String(now.getDate()).padStart(2, '0')
        + '-'
        + String(now.getHours()).padStart(2, '0')
        + String(now.getMinutes()).padStart(2, '0')
        + String(now.getSeconds()).padStart(2, '0');
}

// ── JSON/YAML data builders ───────────────────────────────────────────────────

/**
 * Get the JSON preview/export payload (from memory or DOM fallback).
 * @returns {object|null}
 */
function getJsonPreviewPayload() {
    if (treeState.currentTreePayload && treeState.currentTreePayload.root) {
        return treeState.currentTreePayload;
    }
    const fallbackRoot = buildTreeDataFromDom();
    if (!fallbackRoot) return null;
    return {
        familyName: 'Họ Đoàn',
        exportedAt: new Date().toISOString(),
        root: fallbackRoot
    };
}

/**
 * Escape special HTML characters in a string.
 * @param {*} value
 * @returns {string}
 */
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Export the tree data as a formatted JSON file.
 */
function exportDataAsJson() {
    const treeData = treeState.currentTreePayload && treeState.currentTreePayload.root
        ? treeState.currentTreePayload.root
        : buildTreeDataFromDom();
    if (!treeData) {
        alert('Không tìm thấy dữ liệu cây để xuất JSON.');
        return;
    }
    const payload = {
        familyName: (treeState.currentTreePayload && treeState.currentTreePayload.familyName) || 'Họ Đoàn',
        exportedAt: new Date().toISOString(),
        root: treeData
    };
    downloadTextFile(
        JSON.stringify(payload, null, 2),
        'Gia-Pha-Ho-Doan-' + getExportTimestamp() + '.json',
        'application/json;charset=utf-8'
    );
}

// ── YAML export ───────────────────────────────────────────────────────────────

/**
 * Escape a string for YAML double-quote format.
 * @param {*} value
 * @returns {string}
 */
function escapeYamlString(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Recursive YAML serializer.
 * @param {*} value
 * @param {number} indent - Current indentation spaces.
 * @returns {string}
 */
function toYaml(value, indent) {
    const space = ' '.repeat(indent);
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string')    return '"' + escapeYamlString(value) + '"';
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);

    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        return value.map(function (item) {
            if (item !== null && typeof item === 'object') {
                const nested    = toYaml(item, indent + 2);
                const lines     = nested.split('\n');
                const firstLine = lines[0];
                const rest      = lines.slice(1).map(function (line) { return space + '  ' + line; });
                return space + '- ' + firstLine + (rest.length ? '\n' + rest.join('\n') : '');
            }
            return space + '- ' + toYaml(item, 0);
        }).join('\n');
    }

    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    return entries.map(function (entry) {
        const key = entry[0];
        const val = entry[1];
        if (val !== null && typeof val === 'object') {
            const nested = toYaml(val, indent + 2);
            return space + key + ':\n' + nested;
        }
        return space + key + ': ' + toYaml(val, 0);
    }).join('\n');
}

/**
 * Export the tree data as a YAML file.
 */
function exportDataAsYaml() {
    const treeData = treeState.currentTreePayload && treeState.currentTreePayload.root
        ? treeState.currentTreePayload.root
        : buildTreeDataFromDom();
    if (!treeData) {
        alert('Không tìm thấy dữ liệu cây để xuất YAML.');
        return;
    }
    const payload = {
        familyName: (treeState.currentTreePayload && treeState.currentTreePayload.familyName) || 'Họ Đoàn',
        exportedAt: new Date().toISOString(),
        root: treeData
    };
    downloadTextFile(
        toYaml(payload, 0),
        'Gia-Pha-Ho-Doan-' + getExportTimestamp() + '.yaml',
        'text/yaml;charset=utf-8'
    );
}

// ── JSON preview UI ───────────────────────────────────────────────────────────

/**
 * Highlight keyword matches in a source string with <span class="json-match">.
 * @param {string} source
 * @param {string} keyword
 * @returns {string}
 */
function highlightText(source, keyword) {
    if (!keyword) return escapeHtml(source);
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKeyword, 'gi');
    let lastIndex = 0;
    let out = '';
    let match = regex.exec(source);
    while (match) {
        const start = match.index;
        const end   = start + match[0].length;
        out += escapeHtml(source.slice(lastIndex, start));
        out += '<span class="json-match">' + escapeHtml(source.slice(start, end)) + '</span>';
        lastIndex = end;
        match = regex.exec(source);
    }
    out += escapeHtml(source.slice(lastIndex));
    return out;
}

/**
 * Render the JSON preview into #jsonViewerPre, optionally filtering by searchTerm.
 * @param {string} [searchTerm]
 */
function renderJsonPreview(searchTerm) {
    const pre     = document.getElementById('jsonViewerPre');
    const payload = getJsonPreviewPayload();
    if (!pre) return;
    if (!payload) { pre.textContent = 'Không có dữ liệu để hiển thị.'; return; }

    const jsonString = JSON.stringify(payload, null, 2);
    if (!searchTerm) {
        pre.textContent = jsonString;
    } else {
        pre.innerHTML = highlightText(jsonString, searchTerm.trim());
    }
}

/** Open the JSON drawer panel. */
function openJsonDrawer() {
    const drawer = document.getElementById('jsonDrawer');
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    renderJsonPreview('');
}

/** Close the JSON drawer panel. */
function closeJsonDrawer() {
    const drawer = document.getElementById('jsonDrawer');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
}

/** Read #jsonSearchInput and apply search filter to the JSON preview. */
function applyJsonSearch() {
    const input = document.getElementById('jsonSearchInput');
    renderJsonPreview(input ? input.value : '');
}

/** Clear the JSON search input and reset the preview. */
function clearJsonSearch() {
    const input = document.getElementById('jsonSearchInput');
    if (input) input.value = '';
    renderJsonPreview('');
}

// ── Image / PDF snapshot ──────────────────────────────────────────────────────

/**
 * Script CDN gắn html2canvas lên globalThis — trong ES module không được phép dùng tên `html2canvas` tự do.
 * @returns {((element: HTMLElement, options?: object) => Promise<HTMLCanvasElement>)|null}
 */
function getHtml2Canvas() {
    const g = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : null;
    if (!g) return null;
    const fn = g.html2canvas;
    return typeof fn === 'function' ? fn : null;
}

/**
 * html2canvas không chịu nổi chiều cao cực lớn (vd. couplet gap 7.5cm × n từ → vượt giới hạn canvas).
 * Bản clone chỉ dùng khi xuất: tính gap động để cột câu đối ≈ chiều cao .tree-stage,
 * giữ cảm giác câu đối treo dọc theo cây mà không nổ canvas.
 * Fallback 0.5rem nếu không đo được tree-stage.
 * @param {HTMLElement} regionClone - #giaPhaExportRegion.cloneNode(true)
 */
function normalizeClonedExportRegionForHtml2Canvas(regionClone) {
    if (!regionClone || !regionClone.querySelectorAll) return;

    const liveStage     = document.querySelector('.tree-stage');
    const stageHeightPx = liveStage ? liveStage.getBoundingClientRect().height : 0;

    regionClone.querySelectorAll('.couplet-words').forEach(function (el) {
        const words = el.querySelectorAll('.couplet-word');
        if (words.length < 2 || stageHeightPx <= 0) {
            el.style.gap = '0.5rem';
            return;
        }
        const cs         = getComputedStyle(el);
        const fontSizePx = parseFloat(cs.fontSize)   || 22;
        const lineHPx    = parseFloat(cs.lineHeight) || fontSizePx * 1.2;
        const wordsH     = words.length * lineHPx;
        const padY       = 28; // ≈ --couplet-padding-y × 2 (14px × 2)
        const raw        = (stageHeightPx - wordsH - padY) / (words.length - 1);
        // Tối thiểu 12px để chữ không dính; tối đa 220px để tránh nổ canvas khi cây quá cao.
        const gapPx      = Math.max(12, Math.min(raw, 220));
        el.style.gap     = gapPx + 'px';
    });
}

/**
 * Capture a full snapshot (header + [legend nếu có] + câu đối hai bên + tree + footer) using html2canvas.
 * Scrolls the wrapper to origin, creates an off-screen clone, draws edges, captures,
 * then restores the original scroll position.
 *
 * @returns {Promise<{canvas: HTMLCanvasElement, filenameBase: string}>}
 */
function captureTreeSnapshot() {
    const wrapper      = document.querySelector('.tree-wrapper');
    const tree         = document.querySelector('.tree');
    const exportRegion = document.getElementById('giaPhaExportRegion');
    const header       = document.querySelector('.header');
    const legend       = document.querySelector('.legend');
    const footer       = document.querySelector('.footer');
    const h2c          = getHtml2Canvas();

    if (!wrapper || !tree || !exportRegion || !footer || !h2c) {
        const missing = [];
        if (!wrapper) missing.push('.tree-wrapper');
        if (!tree) missing.push('.tree');
        if (!exportRegion) missing.push('#giaPhaExportRegion');
        if (!footer) missing.push('.footer');
        if (!h2c) missing.push('globalThis.html2canvas (kiểm tra script html2canvas trước khi import module)');
        return Promise.reject(new Error('Không thể tạo snapshot. Thiếu: ' + missing.join(', ') + '.'));
    }

    const savedLeft = wrapper.scrollLeft;
    const savedTop  = wrapper.scrollTop;
    wrapper.scrollLeft = 0;
    wrapper.scrollTop  = 0;

    drawTreeEdges();

    const snapshot = document.createElement('div');
    snapshot.style.position    = 'fixed';
    snapshot.style.left       = '-100000px';
    snapshot.style.top        = '0';
    snapshot.style.padding    = '30px 20px';
    snapshot.style.background = '#FEFEFE';
    snapshot.style.display    = 'inline-block';

    const headerClone  = header ? header.cloneNode(true) : null;
    const footerClone  = footer.cloneNode(true);
    const regionClone  = exportRegion.cloneNode(true);
    normalizeClonedExportRegionForHtml2Canvas(regionClone);

    // Expand the stage and its internal wrapper to show full tree content
    const wrapperClone = regionClone.querySelector('.tree-wrapper');
    const treeClone    = regionClone.querySelector('.tree');
    const stageClone   = regionClone.querySelector('.tree-stage');
    if (wrapperClone && treeClone) {
        wrapperClone.style.overflow = 'visible';
        wrapperClone.style.width    = wrapper.scrollWidth + 'px';
        treeClone.style.width       = wrapper.scrollWidth + 'px';
        treeClone.style.margin      = '0';
        treeClone.style.padding     = '0';
    }
    if (stageClone) {
        stageClone.style.width      = 'max-content';
        stageClone.style.maxWidth   = 'none';
        stageClone.style.background = '#FEFEFE';
        stageClone.style.border     = 'none';
        stageClone.style.boxShadow  = 'none';
    }

    if (headerClone) snapshot.appendChild(headerClone);
    if (legend) {
        snapshot.appendChild(legend.cloneNode(true));
    }
    snapshot.appendChild(regionClone);
    snapshot.appendChild(footerClone);
    document.body.appendChild(snapshot);

    const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const opt   = { backgroundColor: '#FEFEFE', scale: scale, useCORS: true, logging: false };

    return h2c(snapshot, opt).then(function (canvas) {
        if (!canvas || canvas.width < 2 || canvas.height < 2) {
            throw new Error('Ảnh chụp rỗng hoặc quá nhỏ (có thể nội dung vượt giới hạn canvas trình duyệt).');
        }
        return { canvas: canvas, filenameBase: 'Gia-Pha-Ho-Doan-' + getExportTimestamp() };
    }).finally(function () {
        snapshot.remove();
        wrapper.scrollLeft = savedLeft;
        wrapper.scrollTop  = savedTop;
    });
}

/**
 * Export the tree as a PNG image.
 */
function exportImage() {
    const btn = document.getElementById('exportBtn');
    btn.disabled    = true;
    btn.textContent = '⏳ Đang xử lý…';

    captureTreeSnapshot().then(function (result) {
        result.canvas.toBlob(function (blob) {
            if (!blob) { alert('Xuất ảnh thất bại. Vui lòng thử lại.'); return; }
            const objectUrl = URL.createObjectURL(blob);
            const link      = document.createElement('a');
            link.href      = objectUrl;
            link.download  = result.filenameBase + '.png';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(objectUrl);
        }, 'image/png');
    }).catch(function (err) {
        console.error('[tree-export] exportImage', err);
        alert('Xuất ảnh thất bại. ' + (err && err.message ? err.message : 'Vui lòng thử lại.'));
    }).finally(function () {
        btn.disabled    = false;
        btn.textContent = '📷 Tải Ảnh Gia Phả';
    });
}

/**
 * Export the tree as a multi-page PDF (A4 portrait).
 */
function exportPdf() {
    const btn = document.getElementById('exportPdfBtn');
    btn.disabled    = true;
    btn.textContent = '⏳ Đang tạo PDF…';

    captureTreeSnapshot().then(function (result) {
        if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('Thiếu thư viện jsPDF.');

        const jsPDF     = window.jspdf.jsPDF;
        const pdf       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidthMm  = pdf.internal.pageSize.getWidth();
        const pageHeightMm = pdf.internal.pageSize.getHeight();
        const imgData      = result.canvas.toDataURL('image/png');
        const canvas       = result.canvas;

        // Scale image to page width; all following geometry in mm (jsPDF unit).
        const imgWidthMm  = pageWidthMm;
        const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

        let heightLeftMm = imgHeightMm;
        let yMm          = 0;

        pdf.addImage(imgData, 'PNG', 0, yMm, imgWidthMm, imgHeightMm, undefined, 'FAST');
        heightLeftMm -= pageHeightMm;

        while (heightLeftMm > 0) {
            yMm = heightLeftMm - imgHeightMm;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, yMm, imgWidthMm, imgHeightMm, undefined, 'FAST');
            heightLeftMm -= pageHeightMm;
        }

        pdf.save(result.filenameBase + '.pdf');
    }).catch(function (err) {
        console.error('[tree-export] exportPdf', err);
        alert('Xuất PDF thất bại. ' + (err && err.message ? err.message : 'Vui lòng thử lại.'));
    }).finally(function () {
        btn.disabled    = false;
        btn.textContent = '📄 Tải PDF Gia Phả';
    });
}

// Bridge ES module functions to legacy inline onclick handlers in index.html.
Object.assign(window, {
    exportImage,
    exportPdf,
    exportDataAsJson,
    exportDataAsYaml,
    openJsonDrawer,
    closeJsonDrawer,
    applyJsonSearch,
    clearJsonSearch
});

export {
    cloneTreePayloadRoot,
    buildTreeDataFromDom,
    downloadTextFile,
    getExportTimestamp,
    getJsonPreviewPayload,
    escapeHtml,
    exportDataAsJson,
    escapeYamlString,
    toYaml,
    exportDataAsYaml,
    highlightText,
    renderJsonPreview,
    openJsonDrawer,
    closeJsonDrawer,
    applyJsonSearch,
    clearJsonSearch,
    captureTreeSnapshot,
    exportImage,
    exportPdf
};
