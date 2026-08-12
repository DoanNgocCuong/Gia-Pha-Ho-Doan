"""Verify thuc te sau khi doi D4_UNIFORM_FONT_PX 16->12: reload app that,
de app tu chay fitNodeText()+measureFitWidths() nhu binh thuong (khong can
gia lap gi them), roi kiem tra:
  - Bao nhieu o Doi 4+ bi danh dau nm-expanded (ky vong ~6, khop P99 outliers)
  - Co o nao van bi CLIP thuc su khong (scrollHeight > clientHeight cua .node,
    tuc la van tran ngoai o that su, ke ca sau khi da noi rong ngang)
"""
import json
import sys

from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

URL = 'http://127.0.0.1:8792/index.html?_cachebust=verify1'

JS_CHECK = """
() => {
    const nodes = Array.from(document.querySelectorAll('.node[data-node-id]')).filter((n) => {
        const m = n.className.match(/\\bd(\\d+)\\b/);
        return m && parseInt(m[1], 10) >= 3;
    });

    let expandedCount = 0;
    let stillOverflowCount = 0;
    const overflowSamples = [];
    const expandedSamples = [];
    let sampleFontPx = null;

    nodes.forEach((node) => {
        const nm = node.querySelector('.nm');
        if (!nm) return;
        if (sampleFontPx === null) sampleFontPx = getComputedStyle(nm).fontSize;
        const isExpanded = node.classList.contains('nm-expanded');
        if (isExpanded) {
            expandedCount++;
            expandedSamples.push({
                text: (nm.textContent || '').slice(0, 50),
                nodeW: node.clientWidth,
                nodeH: node.clientHeight,
                cssWidthVar: node.style.getPropertyValue('--node-width'),
                inlineWidth: node.style.width
            });
        }

        // Tran that su: noi dung cao/rong hon chinh o .node dang render (sau khi da ap
        // dung moi thu, ke ca noi rong ngang cho outlier).
        const overflowsNode = nm.scrollHeight > node.clientHeight + 1 || nm.scrollWidth > node.clientWidth + 1;
        if (overflowsNode) {
            stillOverflowCount++;
            if (overflowSamples.length < 10) {
                overflowSamples.push({
                    text: (nm.textContent || '').slice(0, 60),
                    nodeW: node.clientWidth,
                    nodeH: node.clientHeight,
                    scrollW: nm.scrollWidth,
                    scrollH: nm.scrollHeight,
                    isExpanded,
                    cssWidthVar: node.style.getPropertyValue('--node-width'),
                    inlineWidth: node.style.width
                });
            }
        }
    });

    return {
        totalD4Plus: nodes.length,
        sampleFontPx,
        expandedCount,
        stillOverflowCount,
        overflowSamples,
        expandedSamples
    };
}
"""

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1600, 'height': 1200})
    page.on('pageerror', lambda e: print('[pageerror]', e))

    page.goto(URL, wait_until='load', timeout=30000)
    page.wait_for_selector('.node[data-node-id]', timeout=30000)
    page.wait_for_timeout(1500)

    result = page.evaluate(JS_CHECK)
    print(json.dumps(result, indent=2, ensure_ascii=False))

    browser.close()
