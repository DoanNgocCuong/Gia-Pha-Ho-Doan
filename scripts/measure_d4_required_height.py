"""Do thuc nghiem tren DOM that: voi FIXED default width cua o Doi 4+ (2.0cm),
va tung co chu ung vien, do CHIEU CAO TU NHIEN (scrollHeight, khong gioi han
height) can thiet de wrap-fit text cua MOI node that trong data/GiaPhaHoDoan.json.

Muc dich: chon height_cm moi cho box Doi 4+ sao cho P99 (nhom <=22 tu, ~99.1%
so o) vua khit KHONG can noi rong ngang, chi ~6 o outlier (>22 tu, 0.9%) moi
tu dong noi rong (co che measureFitWidths() co san trong utils/tree-text-v2.js
khong doi).

Cach do: set node.style.width = defaultWidthPx, node.style.height = 'auto',
nm.style.maxHeight = 'none' (bo gioi han max-height:100% dang co trong CSS),
nm.style.fontSize = fontPx, roi doc nm.scrollHeight true content height.
"""
import json
import sys

from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

URL = 'http://127.0.0.1:8792/index.html'
CANDIDATE_SIZES = [16, 14, 13, 12, 11, 10, 9]
P99_WORD_THRESHOLD = 22

JS_MEASURE = """
(args) => {
    const sizes = args.sizes;
    const threshold = args.threshold;

    const cmPx = (function () {
        const probe = document.createElement('div');
        probe.style.cssText = 'position:absolute;left:-9999px;height:1cm;width:1cm;visibility:hidden;';
        document.body.appendChild(probe);
        const h = probe.offsetHeight || 37.8;
        probe.remove();
        return h > 0 ? h : 37.8;
    })();

    const nodes = Array.from(document.querySelectorAll('.node[data-node-id]')).filter((n) => {
        const m = n.className.match(/\\bd(\\d+)\\b/);
        return m && parseInt(m[1], 10) >= 3;
    });
    const unexpanded = nodes.find((n) => !n.classList.contains('nm-expanded'));
    const defaultWidthPx = unexpanded ? unexpanded.getBoundingClientRect().width : 2.0 * cmPx;

    const perSize = {};

    sizes.forEach((fontPx) => {
        const normalHeights = [];
        const outlierRows = [];

        nodes.forEach((node) => {
            const nm = node.querySelector('.nm');
            if (!nm) return;

            const text = (nm.dataset.gpNm || nm.textContent || '').trim();
            const wordCount = text ? text.split(/\\s+/).filter(Boolean).length : 0;

            const savedNodeW = node.style.width;
            const savedNodeH = node.style.height;
            const savedFs = nm.style.fontSize;
            const savedMaxH = nm.style.maxHeight;

            node.style.width = defaultWidthPx + 'px';
            node.style.height = 'auto';
            nm.style.maxHeight = 'none';
            nm.style.fontSize = fontPx + 'px';

            const neededH = nm.scrollHeight;

            if (wordCount <= threshold) {
                normalHeights.push(neededH);
            } else {
                outlierRows.push({ wordCount, neededH, text: text.slice(0, 50) });
            }

            node.style.width = savedNodeW;
            node.style.height = savedNodeH;
            nm.style.fontSize = savedFs;
            nm.style.maxHeight = savedMaxH;
        });

        normalHeights.sort((a, b) => a - b);
        const p = (arr, q) => arr[Math.min(Math.floor(arr.length * q), arr.length - 1)];

        perSize[fontPx] = {
            defaultWidthPx: Math.round(defaultWidthPx * 100) / 100,
            normalCount: normalHeights.length,
            outlierCount: outlierRows.length,
            normal_p50: p(normalHeights, 0.50),
            normal_p90: p(normalHeights, 0.90),
            normal_p95: p(normalHeights, 0.95),
            normal_p99: p(normalHeights, 0.99),
            normal_max: normalHeights[normalHeights.length - 1],
            outlierSamples: outlierRows.sort((a, b) => b.neededH - a.neededH)
        };
    });

    return { cmPx, perSize };
}
"""

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1600, 'height': 1200})
    page.on('pageerror', lambda e: print('[pageerror]', e))

    page.goto(URL, wait_until='load', timeout=30000)
    page.wait_for_selector('.node[data-node-id]', timeout=30000)
    page.wait_for_timeout(1500)

    result = page.evaluate(JS_MEASURE, {'sizes': CANDIDATE_SIZES, 'threshold': P99_WORD_THRESHOLD})
    print(json.dumps(result, indent=2, ensure_ascii=False))

    browser.close()
