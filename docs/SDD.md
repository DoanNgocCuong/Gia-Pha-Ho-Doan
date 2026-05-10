# SDD — Bottom-up Absolute Layout cho Cây Gia Phả Họ Đoàn

**Created**: 2026-05-09 (UTC+7)
**Last Updated**: 2026-05-09 23:08 (UTC+7) — Edge routing Phase B (greedy track assignment): 156 cặp bus chồng đoạn → 0; mỗi đời cha tự động chia 3-6 lane.
**Status**: ✅ DONE — Layout: 0 overlap node toàn cây. Edges: 0 cặp bus chồng đoạn (channel routing chuẩn Graphviz/ELK).
**Owner**: Pjp + Cursor Agent
**Liên quan**:
- [`index.html`](../index.html) — UI + thuật toán layout
- [`print-size-config.json`](../data/print-size-config.json) — token kích thước in
- [`GiaPhaHoDoan.json`](../data/GiaPhaHoDoan.json) — dữ liệu cây 10 đời
- Plan: `c:\Users\User\.cursor\plans\bottom-up_absolute_layout_từ_đời_focus_3139ee7b.plan.md` (READ-ONLY)

---

## Quick Status Overview

```
+==============================================================================+
|              QUICK STATUS — BOTTOM-UP ABSOLUTE LAYOUT (v2.3)                 |
+==============================================================================+
| Vấn đề ban đầu  : tree width = 379.03cm > canvas 230cm (vượt ~65%)           |
| Mục tiêu        : in vừa 2.7m × 2.3m landscape, không có ô đè ô              |
| Giải pháp v1    : bottom-up absolute layout từ đời focus                     |
|                   (Phase 2 dùng avg(con trực tiếp))                          |
| Vấn đề v1       : đời tổ tiên (d=3..5) lệch phải ~3.5cm; root lệch 67.88cm  |
| Giải pháp v2    : Phase 2 dùng MIDPOINT BBOX cây con (Reingold-Tilford)      |
| Bổ sung v2.1    : Phase 2b — clamp mép phải PER-ROW theo đời focus           |
|                   (đời nào trồi phải thì kéo trái cả đội hình đời đó)        |
| Vấn đề v2.1     : d=5 vẫn trồi 11.44cm, d=6 vẫn trồi 7.92cm vì leftmost = 0  |
|                   chặn shift đều — không kéo trái thêm được nữa.             |
| Bổ sung v2.2    : Phase 2c — cascading left-pack SUFFIX SHIFT từ phải        |
|                   sang trái (lấp slack ở từng khe) cho mọi đời tổ tiên       |
|                   còn overflow.                                              |
| Kết quả v2.2    : tree = 263.68 × 183.99 cm — 0 OVERLAP TOÀN CÂY             |
|                   d=4..6 overflow 0; tree width giảm 271.59 → 263.68 cm     |
|                   (−7.91 cm). Trade-off: gap trong row không đều 0.25cm,    |
|                   mũi tên cha-con bend hơn.                                  |
| Bổ sung v2.3    : Edge routing với GREEDY TRACK ASSIGNMENT (channel         |
|                   routing) — mỗi cha có midY riêng theo lane, cha overlap   |
|                   busInterval bị tách lane khác Y → bus không chồng đoạn.   |
| Kết quả v2.3    : 156 cặp bus chồng đoạn → 0 cặp; mỗi đời 3-6 lane.         |
+==============================================================================+

PHASE 1 (focus row d=7, 148 nodes)            ✅ width = 260.14 cm, gap đều 0.25 cm
PHASE 2 v2 (ancestors d=6→0, bbox-midpoint)   ✅ root cx 137.55 cm
PHASE 2b (uniform per-row clamp)              ✅ d=4,5 shift 3.5cm trái
PHASE 2c (cascading left-pack, suffix shift)  ✅ d=4,5,6 overflow → 0
PHASE 3 (descendants d=8→9)                   ✅ cluster center quanh cha + sweep
APPLY  (position:absolute lên DOM)            ✅ 615 nodes positioned
EDGES PHASE B (greedy track assignment)       ✅ 156 → 0 cặp bus chồng đoạn

Last Updated: 2026-05-09 23:08 (UTC+7)
Progress: P0 ✅ → P1 ✅ → P2 v1 ✅ → P2 v2 ✅ → P2b ✅ → P2c ✅ → P3 ✅ → APPLY ✅ → EDGES_B ✅
```

---

## 1. Bối cảnh & Vấn đề ban đầu

Trước khi triển khai bottom-up layout, hệ thống render bằng flexbox tự nhiên + thuật toán `compactTreeLayout()` chỉnh `margin-left`. Đo thực tế:

| Tiêu chí | Đo được | Khổ in an toàn (cũ 230×270) | Trạng thái |
|---|---|---|---|
| Số đời | 10 (depth 0..9) | — | ✅ Đúng (sau khi inject Cụ Tổ) |
| Chiều cao | 182.53 cm | 268 cm | ✅ Vừa (dư ~85.5 cm) |
| Chiều ngang | **379.03 cm** | **228 cm** | ❌ VƯỢT KHỔ ~151 cm (~65%) |
| `--node-width` | `1.5cm` | — | OK |
| `--node-height` | `12cm` | — | OK |
| `--stratum-gap-y` | `7cm` | — | OK |
| `--stratum-gap-x` | `0.25cm` | — | OK |

### Phép tính bề ngang đời đông nhất (148 node):

```
148 × 1.5cm + 147 × 0.25cm gap_x + cluster gaps
= 222 cm + 36.75 cm + ~120 cm cluster gaps
≈ 379 cm  (khớp đo)
```

→ Nguyên nhân: `cluster gaps ~120cm` do flexbox `gap` mặc định + `margin` giữa các nhánh subtree.

---

## 2. Yêu cầu (Requirements)

| ID | Loại | Mô tả |
|---|---|---|
| R1 | Functional | Khổ in mục tiêu: 2.7m × 2.3m landscape → `canvas: { width_cm: 270, height_cm: 230 }`. |
| R2 | Functional | Render đủ 10 đời (depth 0..9), root là Cụ Tổ. |
| R3 | Constraint | KHÔNG được có 2 ô đè nhau ở bất kỳ đời nào. |
| R4 | Quality | Đời đông nhất phải xếp sát nhau theo gap chuẩn `0.25 cm`. |
| R5 | Trade-off | Chấp nhận mũi tên cha-con ở các đời khác đi vòng / bend. |
| R6 | Non-functional | Giữ nguyên: nested `<ul>/<li>`, `drawTreeEdges()`, header, legend, export, JSON drawer, drag-to-pan. |

---

## 3. Thiết kế giải pháp

### 3.1 Tổng quan thuật toán

```
+==============================================================================+
|                        BOTTOM-UP ABSOLUTE LAYOUT                             |
+==============================================================================+

renderTreeFromData(payload)
        |
        v
buildStratifiedModel  -->  levels: Array<Array<{id, parentId}>>
        |                  edges:  Array<{parentId, childId}>
        v
computeBusiestGenerationDepth   -->  focusDepth = 7 (148 nodes)
        |
        v
+----------------------------------------------------------------+
|  PHASE 1 — depth 7 (focus)                                     |
|  x_i = i × (W + G) + W/2                                       |
|  148 × 1.5cm + 147 × 0.25cm = 258.75cm                         |
+----------------------------------------------------------------+
        |
        v
+----------------------------------------------------------------+
|  PHASE 2 — đi LÊN (d = 6, 5, ..., 0)                           |
|  Mỗi node = center con trực tiếp                               |
|  Sweep trái → phải tránh đè anh em ngang hàng                  |
+----------------------------------------------------------------+
        |
        v
+----------------------------------------------------------------+
|  PHASE 3 — đi XUỐNG (d = 8, 9)                                 |
|  Cụm con của mỗi cha = center quanh cha                        |
|  Sweep trái → phải; cụm bị đẩy → mũi tên cha-con bend          |
+----------------------------------------------------------------+
        |
        v
applyAbsoluteLayout()      -->  position:absolute, left/top cho từng .node
        |
        v
drawTreeEdges()            -->  vẽ lại 635 SVG paths
                                (dùng getBoundingClientRect, tự đúng)
```

### 3.2 Phép tính bề ngang/dài (đã chốt)

| Tham số | Giá trị | Nguồn |
|---|---|---|
| W (node width) | 1.5 cm | `node.default.width_cm` |
| H (node height) | 12 cm | `node.default.height_cm` |
| G (same-gen gap) | 0.25 cm | `spacing.same_generation_gap_cm` |
| VG (between-gen gap) | 7 cm | `spacing.between_generations_gap_cm` |
| Đời focus | depth 7 — 148 nodes | tự động bởi `computeBusiestGenerationDepth()` |
| Bề ngang đời focus | `148*1.5 + 147*0.25 = 258.75 cm` | tính sẵn |
| Bề cao tổng | `10*12 + 9*7 = 183 cm` | tính sẵn |
| Canvas | 270 × 230 cm | `canvas.{width,height}_cm` |
| Safe inner | 268 × 228 cm | trừ margin 1cm mỗi cạnh |

### 3.3 Pseudo-code chi tiết

#### Phase 1 — Đời focus

```
focusY = focusDepth × (H + VG)
for i in 0..(focusRow.length - 1):
    cx = i × (W + G) + W/2
    positions[focusRow[i].id] = { x: cx, y: focusY }
```

#### Phase 2 — Đi LÊN (d = focus-1 → 0)

```
for d from focus-1 downto 0:
    childrenXByParent = group(level[d+1].positions).by(parentId)

    prev_right = -∞
    for entry in level[d] (preorder):           // anh em giữ nguyên thứ tự
        childXs = childrenXByParent[entry.id]
        if childXs.length > 0:
            desired_cx = avg(childXs)            // CENTER theo CON TRỰC TIẾP
        else:
            desired_cx = null                    // leaf — sweep tự đặt

        min_cx = (prev_right == -∞) ? W/2 : prev_right + G + W/2
        cx = (desired_cx != null) ? max(desired_cx, min_cx) : min_cx
        positions[entry.id] = { x: cx, y: d × (H + VG) }
        prev_right = cx + W/2
```

#### Phase 3 — Đi XUỐNG (d = focus+1 → maxDepth)

```
for d from focus+1 to maxDepth:
    prev_right = -∞
    i = 0
    while i < level[d].length:
        parentId = level[d][i].parentId
        cluster  = consecutive entries with same parentId
        n        = cluster.length
        span     = n × W + (n-1) × G
        desired_first_cx = parent.x - span/2 + W/2
        min_first_cx     = (prev_right == -∞) ? W/2 : prev_right + G + W/2
        first_cx         = max(desired_first_cx, min_first_cx)

        for k in 0..(n-1):
            cx = first_cx + k × (W + G)
            positions[cluster[k].id] = { x: cx, y: d × (H + VG) }

        prev_right = first_cx + (n-1) × (W + G) + W/2
        i = i + n
```

#### Phase 3b / 3c — Clamp mép phải cho hậu duệ (mirror Phase 2b / 2c)

Sau Phase 3, với mỗi `d ∈ [focus+1, maxDepth]`:

- **3b:** cùng công thức per-row như §11.2 (`R_focus`, `overflow`, `shift = min(overflow, max(0,L_d))`), shift cả hàng `levels[d]` sang trái nếu cần.
- **3c:** cùng tinh thần suffix pack như §12 (kéo suffix khi còn slack giữa anh em).

Thứ tự thực thi trong `utils/tree-layout.js`: Phase 3 → **3b → 3c** → Phase 2d. Chi tiết quyết định: [`docs/ADR/V4_ADR2.md`](ADR/V4_ADR2.md).

### 3.4 CSS chuyển sang absolute mode

```css
.tree.absolute-layout {
    position: relative;
}
.tree.absolute-layout > ul,
.tree.absolute-layout ul,
.tree.absolute-layout li {
    display: contents;             /* ul/li "trong suốt" về layout */
}
.tree.absolute-layout .node {
    position: absolute;
    margin: 0 !important;
}
```

Class `.svg-edges-active` được giữ nguyên để ẩn các đường nối CSS pseudo-element cũ.

---

## 4. Triển khai

### 4.1 File thay đổi

| File | Thay đổi | Bytes ảnh hưởng |
|---|---|---|
| [`print-size-config.json`](../data/print-size-config.json) | Swap canvas: `width_cm 230 → 270`, `height_cm 270 → 230` | 2 dòng |
| [`index.html`](../index.html) | (a) Thêm CSS `.tree.absolute-layout` <br> (b) Thêm `computeAbsoluteLayout(model, focusDepth)` <br> (c) Thêm `applyAbsoluteLayout()` <br> (d) Thay `compactTreeLayout()` → `applyAbsoluteLayout()` trong `renderTreeFromData()` | ~180 dòng JS + 16 dòng CSS |

### 4.2 Code references

#### Hàm `computeAbsoluteLayout()` — Phase 1/2/3

```1480:1622:d:\GIT\Gia-Pha-Ho-Doan\index.html
function computeAbsoluteLayout(model, focusDepth) {
    if (!model || !model.levels || !model.levels.length) {
        return { positions: new Map(), totalWidth: 0, totalHeight: 0 };
    }

    const cmPx = cssCmToPxFactor();
    const cfg = activePrintSizeConfig || DEFAULT_PRINT_SIZE_CONFIG;
    const W = cfg.node.default.width_cm * cmPx;
    const H = cfg.node.default.height_cm * cmPx;
    const G = cfg.spacing.same_generation_gap_cm * cmPx;
    const VG = cfg.spacing.between_generations_gap_cm * cmPx;
    // PHASE 1: focus row đặt đều cx = i*(W+G) + W/2
    // PHASE 2 (d = focus-1 → 0): desired_x = avg(child.x); sweep prev_right + G
    // PHASE 3 (d = focus+1 → maxDepth): cluster center quanh cha; sweep
    return { positions, totalWidth, totalHeight, W, H };
}
```

#### Hàm `applyAbsoluteLayout()` — áp toạ độ lên DOM

```1624:1645:d:\GIT\Gia-Pha-Ho-Doan\index.html
function applyAbsoluteLayout() {
    const strat = document.querySelector('.tree.svg-edges-active');
    if (!strat || !stratifiedGraphModel) return;
    const layout = computeAbsoluteLayout(stratifiedGraphModel, treeCompactFocusDepth);
    if (!layout.positions || layout.positions.size === 0) return;
    strat.classList.add('absolute-layout');
    strat.style.width  = layout.totalWidth + 'px';
    strat.style.height = layout.totalHeight + 'px';
    const halfW = layout.W / 2;
    layout.positions.forEach(function (pos, id) {
        const el = strat.querySelector('[data-node-id="' + id + '"]');
        if (!el) return;
        el.style.left = (pos.x - halfW) + 'px';
        el.style.top  = pos.y + 'px';
    });
}
```

#### CSS absolute-layout mode

```404:419:d:\GIT\Gia-Pha-Ho-Doan\index.html
.tree.absolute-layout {
    position: relative;
}
.tree.absolute-layout > ul,
.tree.absolute-layout ul,
.tree.absolute-layout li {
    display: contents;
}
.tree.absolute-layout .node {
    position: absolute;
    margin: 0 !important;
}
```

### 4.3 Phạm vi không thay đổi

- Nested `<ul>/<li>` + preorder traversal trong `renderTreeFromData()`.
- `drawTreeEdges()`: dùng `getBoundingClientRect()` → tự động đúng với absolute positioning.
- `compactTreeLayout()` cũ vẫn còn trong file (có thể rollback nếu cần) — chỉ ngừng gọi.
- Header, legend, nút export PNG/PDF, JSON drawer, drag-to-pan, fitNodeText, normalizeAllNodeLabels.

---

## 5. Kết quả đo (Chrome DevTools — DPI 38 px/cm)

### 5.1 Bảng đo từng đời

| Đời (depth) | Số ô | Width (cm) | leftCm | rightCm | Min gap (px) | Max gap (px) | Overlap |
|---|---|---|---|---|---|---|---|
| 0 (Cụ Tổ) | 1 | 1.49 | 196.51 | 198.01 | — | — | 0 |
| 1 | 1 | 1.49 | 196.51 | 198.01 | — | — | 0 |
| 2 | 3 | 194.90 | 77.63 | 272.52 | 1088.77 | 6147.29 | 0 |
| 3 | 25 | 269.90 | 3.50 | 273.40 | 9.81 | 1519.68 | 0 |
| 4 | 56 | **271.87** | 3.50 | 275.37 | 9.81 | 1586.18 | 0 |
| 5 | 85 | 270.99 | 3.50 | 274.49 | 9.81 | 1091.55 | 0 |
| 6 | 115 | 266.62 | 0.00 | 266.62 | 9.81 | 375.56 | 0 |
| **7 (focus)** | **148** | **258.74** | 0.00 | 258.74 | **9.81** | **9.81** | **0** |
| 8 | 130 | 262.24 | 0.00 | 262.24 | 9.81 | 575.06 | 0 |
| 9 | 51 | 254.37 | 0.00 | 254.37 | 9.81 | 2902.56 | 0 |
| **TỔNG** | **615** | **275.39 × 183.00** | — | — | — | — | **0** |

> **Lưu ý**: `9.81 px ≈ 0.258 cm` ở DPI 38 px/cm (sai số 0.008cm do làm tròn pixel — chấp nhận được).

### 5.2 Đáp ứng plan

| Tiêu chí | Plan | Thực tế | Trạng thái |
|---|---|---|---|
| Đời focus có 148 ô | 148 | 148 | ✅ |
| Bề ngang đời focus ≈ 258.75cm | 258.75 | 258.74 | ✅ |
| Gap đời focus = 0.25cm | 0.25cm (~9.5px) | 9.81px (đều min=max) | ✅ |
| Tổng cao = 183cm | 183 | 183.00 | ✅ |
| Không node chồng nhau | 0 | **0 toàn cây** | ✅ |
| Min gap mọi đời ≥ G | ≥ 0.25cm | 0.258 cm | ✅ |
| 635 edges path vẽ lại đúng | — | 635 paths, 0 console error | ✅ |

### 5.3 So sánh trước/sau

| Tiêu chí | Trước (compactTreeLayout) | Sau (applyAbsoluteLayout) | Cải thiện |
|---|---|---|---|
| Tree width | 379.03 cm | 275.39 cm | **−103.64 cm (−27%)** |
| Tree height | 182.53 cm | 183.00 cm | tương đương |
| Overlap (đời focus) | có cảnh báo | **0** | ✅ sạch |
| Đời focus có gap đều? | không (random) | **đều tăm tắp 0.258cm** | ✅ |
| Width fits canvas inner? | ❌ vượt 151cm | ⚠️ vượt 7.39cm (~2.7%) | đã giảm 95% phần vượt |

---

## 6. Phân tích / Lưu ý — width vượt 7.39 cm

### 6.1 Lý do (root cause)

Phase 2 quyết định center tổ tiên theo **CON TRỰC TIẾP** (`avg(child.x)`), không theo subtree-bbox. Khi 1 nhánh con cháu (vd. d=4..d=7 của một tổ tiên d=3) có spread rộng, tổ tiên d=2 vẫn bám sát đỉnh nhánh đó → đẩy ô d=2 ra ngoài rìa đời focus.

```
Đời focus  d=7: |== 258.74 cm ==|
Đời 4      d=4: |==   271.87 cm   ==|   (+13.13cm so với focus)
Đời tổng:       |==     275.39 cm     ==|
Canvas inner:   |==   268.00 cm   ==|
Overflow:                      [+7.39cm]
```

### 6.2 Ảnh hưởng

- Tree rộng 275.4 cm vs canvas inner 268 cm → **vượt 2.7%**.
- Height vẫn dư 45 cm → có thể "trao đổi" chiều cao lấy chiều ngang.
- Đối với thiết bị in tile / khổ A0 in 2 mảng ghép → chấp nhận được.

### 6.3 Tuỳ chọn xử lý (chưa thực hiện, đợi chốt)

| Option | Mô tả | Effort | Impact |
|---|---|---|---|
| (a) Chấp nhận | In tile, ghép mép | Thấp | Người dùng ghép tay |
| (b) Giảm G focus | `same_generation_gap_cm: 0.25 → 0.20 cm` (đời focus còn 251.25cm) | Rất thấp | Nén 7-9 cm, đủ vừa |
| (c) Đổi center logic | Phase 2 weighted-by-subtree-leaves thay vì avg con trực tiếp | Trung bình | Giảm spread tổ tiên 5-10cm |
| (d) Crop margin | Margin 1cm → 0.5cm mỗi bên | Rất thấp | +1cm inner |
| (e) Width canvas | 270 → 280 cm | Rất thấp | Hết overflow nhưng đổi spec phần cứng |

---

## 7. Timeline

| Date | Time (UTC+7) | Activity | Result | Status |
|---|---|---|---|---|
| 2026-05-09 | 15:57 | Mở `index.html` qua `python -m http.server 8765` | Server up | ✅ |
| 2026-05-09 | 17:50 | Inject Cụ Tổ vào `GiaPhaHoDoan.json`, shift depths +1 | 10 đời | ✅ |
| 2026-05-09 | 18:00 | Đo trước: width 379cm vs canvas 230cm (vượt 65%) | Xác định cần refactor | ✅ |
| 2026-05-09 | 18:10 | Chốt plan bottom-up absolute layout từ đời focus | Plan READ-ONLY | ✅ |
| 2026-05-09 | 18:20 | Swap canvas 230×270 → 270×230 (`print-size-config.json`) | OK | ✅ |
| 2026-05-09 | 18:25 | Thêm CSS `.tree.absolute-layout` | OK | ✅ |
| 2026-05-09 | 18:30 | Code `computeAbsoluteLayout()` + `applyAbsoluteLayout()` | OK | ✅ |
| 2026-05-09 | 18:32 | Thay call `compactTreeLayout()` → `applyAbsoluteLayout()` | OK | ✅ |
| 2026-05-09 | 18:35 | Reload + đo qua Chrome DevTools | 0 overlap, 258.74cm focus | ✅ |
| 2026-05-09 | 18:36 | Lưu screenshot full-page `docs/bottom-up-layout-fullpage.png` | OK | ✅ |
| 2026-05-09 | 18:37 | Cập nhật SDD lần 1 (v1) | OK | ✅ |
| 2026-05-09 | 19:00 | User gửi ảnh khoanh đỏ: đời 3..5 lệch phải so với focus | Mở Phase 2 v2 | 🔍 |
| 2026-05-09 | 19:10 | Phân tích: nguyên nhân là `avg` cộng dồn bias | Chốt cách B (bbox-midpoint) | ✅ |
| 2026-05-09 | 19:13 | Thay Phase 2: `avg(child.x)` → `(L+R)/2` của bbox cây con | OK, không lỗi linter | ✅ |
| 2026-05-09 | 19:15 | Reload + đo lại qua Chrome DevTools | root 197.25 → 136.81 cm; 0 overlap | ✅ |
| 2026-05-09 | 19:15 | Lưu screenshot v2 `docs/bottom-up-layout-bbox-midpoint.png` | OK | ✅ |
| 2026-05-09 | 19:16 | Cập nhật SDD §10 (v2) | OK | ✅ |
| 2026-05-09 | 19:30 | User: đời 4..6 vẫn trồi phải so với focus → yêu cầu clamp | Chốt Phase 2b | 🔍 |
| 2026-05-09 | 19:35 | Code Phase 2b shift cả khối → bị cap = 0 | Đổi sang per-row | ⚠️ |
| 2026-05-09 | 19:38 | Code Phase 2b per-row, cap bởi leftmost riêng đời | OK | ✅ |
| 2026-05-09 | 19:40 | Reload + đo: tree width 273.63 → 270.13cm, 0 overlap | ✅ | ✅ |
| 2026-05-09 | 19:41 | Lưu screenshot v2.1 `docs/bottom-up-layout-phase2b-clamp.png` + cập nhật SDD §11 | OK | ✅ |
| 2026-05-09 | 20:00 | User: d=5 vẫn trồi 11.38cm dù leftmost=0 — yêu cầu cascading left-pack | Chốt Phase 2c | 🔍 |
| 2026-05-09 | 20:25 | Code Phase 2c v1: single-node shift theo plan | Đo lại: overflow KHÔNG giảm | ⚠️ |
| 2026-05-09 | 20:30 | Phát hiện logic sai: node cực phải bị chặn (gap=G) → myShift=0; sửa thành SUFFIX shift | OK | ✅ |
| 2026-05-09 | 20:33 | Reload + đo: d=4,5,6 overflow → 0; tree width 271.59 → 263.68cm; 0 overlap | ✅ | ✅ |
| 2026-05-09 | 20:35 | Lưu screenshot v2.2 `docs/bottom-up-layout-phase2c-leftpack.png` + cập nhật SDD §12 | OK | ✅ |
| 2026-05-09 | 22:30 | User gửi screenshot khoanh đỏ: bus chồng đoạn dày đặc → yêu cầu "2 cha cùng đời mũi tên không đè" | Mở Edge Routing Phase B | 🔍 |
| 2026-05-09 | 22:45 | Phân tích: root cause = midY = 0.68*distY cố định cho mọi cạnh | OK | ✅ |
| 2026-05-09 | 22:50 | Đo baseline: 156 cặp bus chồng đoạn (đời focus 69 cặp) | Confirm vấn đề | ✅ |
| 2026-05-09 | 23:00 | Code Phase B: greedy track assignment per row + lane → midY ratio map | OK, no linter | ✅ |
| 2026-05-09 | 23:05 | Reload + đo: 156 → 0 cặp; mỗi đời 3-6 lane; 0 console error | ✅ | ✅ |
| 2026-05-09 | 23:08 | Lưu screenshot `docs/edge-routing-track-assignment.png` + cập nhật SDD §13 | OK | ✅ |

---

## 8. Phụ lục

### 8.1 Số đo môi trường

- DPI runtime: `cssCmToPxFactor()` trả về **38 px/cm** trên màn hình test.
- 1 cm = 38 px → 0.25 cm = 9.5 px (lý thuyết) → đo thực 9.81 px (sai số rounding).

### 8.2 Cấu trúc dữ liệu `stratifiedGraphModel`

```javascript
{
    levels: [
        // depth 0
        [{ id: 'gp-0', nodeRef: <ref>, parentId: null }],
        // depth 1
        [{ id: 'gp-1', nodeRef: <ref>, parentId: 'gp-0' }],
        // ...
        // depth 7 (focus)
        [/* 148 entries, preorder */]
        // ...
    ],
    edges: [
        { parentId: 'gp-0', childId: 'gp-1' },
        // ...
    ]
}
```

Mỗi `entry.id` cũng là `data-node-id` trên DOM (cả hai đều preorder DFS, cùng counter).

### 8.3 Khi nào chạy lại layout?

`renderTreeFromData()` gọi `applyAbsoluteLayout()` đúng 1 lần sau khi build DOM.
Edges được vẽ lại tự động qua `ResizeObserver` trên `.tree-wrapper` + `.tree.svg-edges-active` mỗi khi kích thước thay đổi (ví dụ zoom in/out hoặc resize cửa sổ).

### 8.4 Screenshot tham khảo

- Full page v1 (avg): [`docs/bottom-up-layout-fullpage.png`](./bottom-up-layout-fullpage.png)
- Full page v2 (bbox-midpoint): [`docs/bottom-up-layout-bbox-midpoint.png`](./bottom-up-layout-bbox-midpoint.png)
- Full page v2.1 (Phase 2b clamp per-row): [`docs/bottom-up-layout-phase2b-clamp.png`](./bottom-up-layout-phase2b-clamp.png)
- Full page v2.2 (Phase 2c cascading left-pack): [`docs/bottom-up-layout-phase2c-leftpack.png`](./bottom-up-layout-phase2c-leftpack.png)
- Full page v2.3 (Edge routing track assignment): [`docs/edge-routing-track-assignment.png`](./edge-routing-track-assignment.png)

---

## 9. Decision log

| ID | Quyết định | Lý do | Thời điểm |
|---|---|---|---|
| D-01 | Swap canvas 270×230 thay vì 230×270 | User chốt: in landscape 2.7m ngang × 2.3m cao | 2026-05-09 18:00 |
| D-02 | Đời focus = đời đông nhất (auto bởi `computeBusiestGenerationDepth`) | Plan: ép đời đông nhất sát nhau, các đời khác "vòng" | 2026-05-09 18:10 |
| D-03 | Phase 2 v1 center theo CON TRỰC TIẾP (avg) | Cách đơn giản nhất, làm baseline | 2026-05-09 18:12 |
| D-04 | `display: contents` cho ul/li thay vì `display: none` | Giữ DOM tree cho `drawTreeEdges()` query `data-node-id` | 2026-05-09 18:25 |
| D-05 | Giữ lại `compactTreeLayout()` (chưa xoá) | Cho phép rollback nhanh, an toàn | 2026-05-09 18:32 |
| D-06 | Phase 2 v2: chuyển từ `avg` sang `(L+R)/2` của bbox cây con | Ảnh khoanh đỏ user gửi: đời 3..5 lệch phải; root cx 197.25cm thay vì ~129cm | 2026-05-09 19:13 |
| D-07 | Không bật post-shift guard (cách shift cả khối tổ tiên) | Đo thực tế: đời 3..6 leftCm ≤ 3.5cm; shift cả khối bị cap = 0 do d=6 leftmost=0 | 2026-05-09 19:16 |
| D-08 | Phase 2b: clamp mép phải PER-ROW (không cả khối) | User: "đời nào trồi thì kéo trái cả đội hình đời đó". Per-row giảm overflow d=4,5 hiệu quả hơn | 2026-05-09 19:38 |
| D-09 | Cap shift bởi leftmost RIÊNG đời đó (không tổng) | Tránh đẩy ô đầu tiên qua x=0; chấp nhận d=5 còn trồi 11.38cm | 2026-05-09 19:40 |
| D-10 | Phase 2c: cascading left-pack — SUFFIX SHIFT khi tìm thấy slack | User: "kiểm khe trống nào dịch được, dịch tới khi đủ overflow". Suffix shift đúng vì các khe sau đã sát G — toàn bộ suffix [i..N-1] phải di chuyển cùng nhau. Single-node shift sai logic vì node cực phải bị chặn (gap = G) → myShift luôn 0 → overflow không giảm | 2026-05-09 20:30 |
| D-11 | Edge routing: GREEDY TRACK ASSIGNMENT (channel routing) per row | User: "2 cha cùng đời thì mũi tên không được đè". Best practice từ VLSI/Graphviz dot/ELK Layered. Phase B gán cha overlap busInterval vào lane khác → bus không chồng đoạn (Mức 1, cho phép cắt 1 điểm) | 2026-05-09 23:00 |
| D-12 | BỎ Phase A1 (bundle bus cùng cha) | Bus cùng cha trùng nhau cùng màu → user không thấy đè. Refactor không tăng giá trị visual mà tăng rủi ro. Giữ per-edge drawing đơn giản | 2026-05-09 23:00 |

---

## 10. Phase 2 v2 — bbox-midpoint (Reingold–Tilford "tight")

### 10.1 Lý do refactor

Sau khi Phase 2 v1 (`avg(con trực tiếp)`) được triển khai, đo thực tế và quan sát screenshot phát hiện hiện tượng "khoanh đỏ":

```
+--------------------- focus row d=7 (mép trái = 0cm) -----------------------+
|                                                                            |
|  d=3..5 đáng lẽ trải đến mép trái nhưng lại bắt đầu từ ~3.5cm              |
|  d=2 chỉ có 3 ô, 2 ô tụ về phải (78, 241, 271 cm)                          |
|  d=0 root: cx = 197.25cm (đáng lẽ ~129.37cm = giữa focus row)              |
|                                                                            |
+----------------------------------------------------------------------------+
```

**Nguyên nhân toán học:** `avg(child.x)` không phải phép toán **idempotent** qua nhiều tầng:

\[
\mathrm{avg}\big(\mathrm{avg}(a,b),\ \mathrm{avg}(c,d,e)\big) \;\neq\; \mathrm{avg}(a,b,c,d,e)
\]

→ Bias tích lũy mỗi tầng đi lên. Cây không đối xứng → root lệch theo cụm con đông.

### 10.2 Logic toán học

**Định nghĩa**: với mỗi node `v`, gọi `Bbox(v) = [L(v), R(v)]` là **bao biên ngang** của cây con `v` (chiếu lên trục X), tính từ đời focus đi lên.

**Hàm mục tiêu**: tâm v được chọn sao cho

\[
x(v) \;=\; \frac{L(v) + R(v)}{2}
\]

**Quy nạp bottom-up**:

```
Base case (đời focus, d = F):
    L(v) = x(v) − W/2
    R(v) = x(v) + W/2

Bước đệ quy (đời d, d < F):
    L̃(v) = min over children c của L(c)
    R̃(v) = max over children c của R(c)
    x̂(v) = (L̃ + R̃) / 2                          ← desired (midpoint bbox)
    x(v) = max(x̂(v), prev_right + G + W/2)        ← sweep tránh đè
    L(v) = min(x(v) − W/2, L̃)
    R(v) = max(x(v) + W/2, R̃)
```

**Tính chất key**: `min` và `max` là phép toán **idempotent**:

\[
\min(\min(a,b), \min(c,d,e)) = \min(a,b,c,d,e)
\]

→ Không có bias tích lũy. Bbox của root chính xác bằng bbox của toàn cây.

### 10.3 Code thay đổi

```1495:1597:d:\GIT\Gia-Pha-Ho-Doan\index.html
function computeAbsoluteLayout(model, focusDepth) {
    // ... khai báo W, H, G, VG, levels, focus, positions, yOf ...

    // PHASE 1: Đời focus, đặt đều
    focusRow.forEach(function (entry, i) {
        const cx = i * (W + G) + W / 2;
        positions.set(entry.id, { x: cx, y: focusY });
    });

    // Khởi tạo bbox cho focus row (base case)
    const bboxX = new Map();
    focusRow.forEach(function (entry) {
        const cp = positions.get(entry.id);
        bboxX.set(entry.id, { left: cp.x - W / 2, right: cp.x + W / 2 });
    });

    // PHASE 2 v2: bbox-midpoint
    for (let d = focus - 1; d >= 0; d--) {
        // Gom bbox cây con theo parentId
        const childBboxByParent = new Map();
        // ... (min/max bbox.left, bbox.right của các con) ...

        // Sweep + cập nhật bbox node
        let prevRight = -Infinity;
        dRow.forEach(function (entry) {
            const cb = childBboxByParent.get(entry.id);
            const desiredCx = cb ? (cb.left + cb.right) / 2 : null;
            const minCx = (prevRight === -Infinity) ? (W / 2) : (prevRight + G + W / 2);
            const cx = (desiredCx !== null) ? Math.max(desiredCx, minCx) : minCx;
            positions.set(entry.id, { x: cx, y: dY });
            prevRight = cx + W / 2;

            // Cập nhật bbox(entry) = union(self, bbox cây con)
            const myLeft  = cx - W / 2;
            const myRight = cx + W / 2;
            const finalLeft  = cb ? Math.min(cb.left,  myLeft)  : myLeft;
            const finalRight = cb ? Math.max(cb.right, myRight) : myRight;
            bboxX.set(entry.id, { left: finalLeft, right: finalRight });
        });
    }

    // PHASE 3 không đổi
    // ...
}
```

### 10.4 Đo thực tế trước/sau

| Chỉ số | v1 (`avg`) | v2 (`bbox-midpoint`) | Cải thiện |
|---|---|---|---|
| **Root cx (cm)** | 197.25 | **136.81** | **−60.44 cm** |
| Tree width (cm) | 275.39 | 273.63 | −1.76 cm |
| Tree height (cm) | 183.00 | 183.00 | 0 |
| **d=0 leftCm** | 196.51 | 136.06 | thụt vào (1 ô đứng giữa) |
| **d=2 leftCm** | 77.63 | 108.94 | dịch về tâm cây |
| **d=2 width** | 194.90 | 145.87 | thu hẹp 49 cm |
| **d=3 leftCm** | 3.50 | 3.50 | không đổi |
| **d=4 leftCm** | 3.50 | 3.50 | không đổi |
| **d=5 leftCm** | 3.50 | 3.50 | không đổi |
| **d=6 leftCm** | 0.00 | 0.00 | không đổi |
| Overlap | 0 | **0** | OK |
| Console errors | 0 | **0** | OK |

### 10.5 Phân tích

- **Root** (d=0) chuyển từ 197.25cm → 136.81cm. Tâm "lý tưởng" toán học (trung tâm focus row) là 129.37cm; thực tế 136.81cm = lệch +7.44cm. Lệch này do các đời 3..5 mở rộng nhẹ ra phải (tới 273.62cm ở đời 5 — bbox lớn hơn focus row), kéo bbox(root) sang phải.
- Đời 3..6 (đời "đông") vẫn bám sát mép focus row (3.5cm hoặc 0cm).
- Đời 0..2 (đời "thưa") tự động "thụt vào" vì midpoint của bbox nhỏ → cha leftmost không nằm sát mép. Đây là kết quả ĐÚNG về mặt thẩm mỹ: tổ tiên đứng cân giữa cây con của mình.

### 10.6 Lý do không bật lớp phòng vệ (post-shift)

Plan đặt ngưỡng "leftCm > 5cm cho đời tổ tiên thì shift". Đo thực tế:

| Đời | leftCm | < 5cm? |
|---|---|---|
| 3 | 3.50 | ✓ |
| 4 | 3.50 | ✓ |
| 5 | 3.50 | ✓ |
| 6 | 0.00 | ✓ |

→ Tất cả các đời "đông" đều dưới ngưỡng. Các đời 0..2 ít node và midpoint thụt vào là **đặc tính mong muốn** của bbox-midpoint — không phải "lệch phải". Không bật post-shift.

### 10.7 Bất biến vẫn được giữ

- I1 (bbox đúng): hợp lệ theo quy nạp.
- I2 (không đè): sweep `cx ≥ prev_right + G + W/2` vẫn áp dụng.
- I3 (preorder order): duyệt `dRow.forEach` theo preorder.
- Không động Phase 1 (hàng đời focus). Phase 3 đặt toạ độ ban đầu cho hậu duệ; Phase **3b/3c** (mirror 2b/2c) có thể dịch `x` các đời `d > focus` để không vượt mép phải `R_focus`; sau đó Phase 2d chỉnh cha trong `[L,R]` của con.

---

## 11. Phase 2b — Clamp mép phải per-row theo đời focus

### 11.1 Lý do

Sau Phase 2 v2 (bbox-midpoint), root về đúng tâm nhưng **vẫn còn các đời tổ tiên trồi sang phải** so với mép phải đời focus do bbox của một số nhánh con cháu trải rộng:

| Đời | rightCm | overflow vs focus |
|---|---|---|
| d=4 | 266.18 | +7.44 cm |
| d=5 | 273.62 | +14.88 cm |
| d=6 | 266.62 | +7.88 cm |
| **focus (d=7)** | **258.74** | **0** |

→ Yêu cầu user: *"đời nào bị trồi ra ngoài bên phải => kéo sang trái toàn bộ đội hình"*. Áp dụng per-row, chấp nhận mũi tên cha-con giữa các đời tổ tiên có thể bend (tinh thần đã có ở Phase 3).

### 11.2 Công thức

Với mỗi đời `d ∈ [0, focus-1]`:

```text
R_focus = max over focusRow of (x + W/2)
R_d     = max over levels[d] of (x + W/2)
L_d     = min over levels[d] of (x - W/2)
overflow_d = max(0, R_d - R_focus)
shift_d    = min(overflow_d, max(0, L_d))    // cap để không xuyên x = 0
```

Nếu `shift_d > 0`: với mọi `entry ∈ levels[d]`, `x ← x - shift_d`.

### 11.3 Code

```1582:1622:d:\GIT\Gia-Pha-Ho-Doan\index.html
// PHASE 2b: Clamp mép phải từng đời tổ tiên theo đời focus
if (focus > 0) {
    let rFocus = -Infinity;
    focusRow.forEach(function (entry) { /* ... max x + W/2 ... */ });

    if (Number.isFinite(rFocus)) {
        for (let d = 0; d < focus; d++) {
            // tính rRow, lRow của đời d
            // overflow = rRow - rFocus
            // shift    = min(overflow, max(0, lRow))
            // dịch toàn bộ levels[d] sang trái 'shift'
        }
    }
}
```

### 11.4 Đo thực tế trước/sau

| Đời | Trước (overflow vs focus) | Sau | shift áp dụng | Cap bởi leftmost |
|---|---|---|---|---|
| 0 | -121.19 cm | -121.19 cm | 0 (không trồi) | — |
| 1 | -121.19 cm | -121.19 cm | 0 | — |
| 2 | -3.94 cm | -3.94 cm | 0 (không trồi) | — |
| 3 | -2.19 cm | -2.19 cm | 0 (không trồi) | — |
| **4** | **+7.44 cm** | **+3.94 cm** | **−3.5 cm** | leftmost = 3.5 |
| **5** | **+14.88 cm** | **+11.38 cm** | **−3.5 cm** | leftmost = 3.5 |
| **6** | **+7.88 cm** | **+7.88 cm** | 0 | leftmost = 0 (không thể trái thêm) |
| focus (7) | 0 | 0 | — | — |
| 8 | +3.50 | +3.50 | giữ (snapshot trước Phase 3b/3c) | — |
| 9 | -4.38 | -4.38 | giữ | — |

*Bản ghi số đo trên là snapshot trước khi bổ sung Phase 3b/3c (2026-05-10). Hiện tại các đời `d > focus` cũng được clamp theo `R_focus` — xem [`V4_ADR2.md`](ADR/V4_ADR2.md).*

| Tổng cộng | Trước | Sau | Δ |
|---|---|---|---|
| Tree width | 273.63 cm | **270.13 cm** | **−3.5 cm** |
| Tree height | 183.00 cm | 183.00 cm | 0 |
| Overlap | 0 | **0** | OK |

### 11.5 Trade-off

**Bị cap bởi leftmost > 0 nên không hết overflow**: d=5 vẫn trồi 11.38cm, d=6 vẫn trồi 7.88cm. Lý do: leftmost của các đời này đã sát mép trái (0..3.5cm) — kéo trái thêm sẽ làm ô đầu tiên xuyên qua x=0. Trade-off có chủ đích, ưu tiên giữ ô trong khung.

**Mũi tên cha-con bend**: vì shift mỗi đời một lượng khác nhau, mũi tên giữa d=3 (shift=0) và d=4 (shift=3.5cm) có thể lệch ngang nhẹ. Chấp nhận theo tinh thần Phase 3.

### 11.6 Tính chất bảo toàn

- **Không sinh chồng lấn**: shift đồng đều **toàn bộ** node trong cùng đời → khoảng cách trong đời giữ nguyên.
- **Không phá Phase 1**: hàng focus không shift. Phase 2b/2c chỉ động `positions[id].x` với `depth < focus`; hậu duệ do Phase **3b/3c** xử lý sau Phase 3.
- **Idempotent**: chạy lại cũng cho cùng kết quả (overflow đã giảm về <= 0 hoặc bị cap).

---

## 12. Phase 2c — Cascading left-pack (suffix shift) cho đời tổ tiên

### 12.1 Lý do

Sau Phase 2b, một số đời tổ tiên vẫn còn trồi sang phải nhưng `leftmost = 0` đã chặn shift đều — không thể kéo cả đội hình sang trái thêm:

| Đời (1-based) | depth | overflow | leftmost | Có thể shift đều? |
|---|---|---|---|---|
| Đời 5 | 4 | +3.96 cm | 0 cm | ✗ (cap = 0) |
| Đời 6 | 5 | +11.44 cm | 0 cm | ✗ (cap = 0) |
| Đời 7 | 6 | +7.92 cm | 0 cm | ✗ (cap = 0) |

Tuy nhiên nội bộ các row này có **khe trống lớn** giữa anh em (`maxGap` = 957 px, 1090 px, 375 px) → có thể nén để giảm overflow.

User mô tả logic:
> *"Mình cần dịch con ở cuối cùng bên phải sang trái, mình check xem có dịch được ko, nếu bị chặn ở ông đằng trước thì check xem ô đằng trước có dịch được ko, lại check ô đằng trước, cứ thế ... cho đến 1 ông có thể dịch được đủ số cm cần thì dịch."*

### 12.2 Logic toán học — vì sao phải SUFFIX shift, không phải single-node shift

**Tình trạng đầu vào** (sau Phase 2b): mọi node đặt theo bbox-midpoint + sweep từ trái → khe nhỏ nhất giữa anh em luôn = `G` (ép sát). Khe lớn chỉ xuất hiện khi node bbox-midpoint nhảy qua `prev_right + G + W/2` do bbox cây con dài.

**Quan sát then chốt**: Node cực phải `i = N−1` luôn có gap với `i−2` ≈ `G` (đã sát) ⇒ slack ngay trước nó = 0 ⇒ nếu chỉ shift node cực phải, `myShift = 0` ⇒ **overflow không giảm chút nào**.

⇒ Khi tìm được khe có slack ở vị trí `i*`, ta phải shift **toàn bộ suffix `[i*..N−1]`** sang trái cùng một lượng. Lý do:

- Các khe trong `[i*+1..N−1]` đều = `G` (sát) → không thể tách rời.
- Shift suffix giữ tất cả khe phải không đổi, chỉ ép khe `(i*−1, i*)` từ `gap` xuống còn `gap − myShift ≥ G`.
- Mép phải của row giảm đúng `myShift` cm.

### 12.3 Công thức

Với mỗi đời tổ tiên `d ∈ [0, focus−1]` còn `overflow_d > 0`:

```text
remaining ← overflow_d
for i = N−1 down to 0:
    if i = 0:
        slack ← x_0 − W/2                       // tới đụng x = 0
    else:
        gap   ← (x_i − W/2) − (x_{i−1} + W/2)
        slack ← max(0, gap − G)
    myShift ← min(remaining, slack)
    if myShift > 0:
        for j = i to N−1:
            x_j ← x_j − myShift                 // SUFFIX shift
        remaining ← remaining − myShift
    if remaining ≤ 0: break
```

Kết quả:
- Mọi khe trong `[i..N−1]` (sau khi áp myShift) vẫn ≥ G → bất biến không-đè.
- Mép phải đời `d` giảm đúng `Σ myShift` cm.
- Tối ưu: `remaining → 0` khi tổng slack đủ; nếu thiếu, `remaining` còn dương = phần overflow không thể nén.

### 12.4 Code

```1639:1690:d:\GIT\Gia-Pha-Ho-Doan\index.html
// PHASE 2c: Cascading left-pack — suffix shift khi tìm thấy slack
if (focus > 0) {
    let rFocusC = -Infinity;
    focusRow.forEach(/* tính rFocusC = max x + W/2 */);

    if (Number.isFinite(rFocusC)) {
        for (let d = 0; d < focus; d++) {
            // tính rRow, overflow
            // pass từ phải sang trái:
            //   slack = (i==0) ? x_0 − W/2 : max(0, gap(i−1,i) − G)
            //   myShift = min(remaining, slack)
            //   nếu myShift > 0 → SHIFT SUFFIX [i..N−1] cùng myShift
        }
    }
}
```

### 12.5 Đo thực tế trước/sau

| Đời | depth | Trước (sau Phase 2b) | Sau Phase 2c | Δ overflow |
|---|---|---|---|---|
| Đời 1 | 0 | overflow −121.84 cm | −121.84 cm | 0 (không trồi) |
| Đời 2 | 1 | −121.84 cm | −121.84 cm | 0 |
| Đời 3 | 2 | −3.96 cm | −3.96 cm | 0 |
| Đời 4 | 3 | −2.20 cm | −2.20 cm | 0 |
| **Đời 5** | **4** | **+3.96 cm** | **0 cm** | **−3.96** |
| **Đời 6** | **5** | **+11.44 cm** | **0 cm** | **−11.44** |
| **Đời 7** | **6** | **+7.92 cm** | **0 cm** | **−7.92** |
| Đời 8 (focus) | 7 | 0 | 0 | — |
| Đời 9 | 8 | +3.52 cm | +3.52 cm | giữ (snapshot trước Phase 3b/3c) |
| Đời 10 | 9 | −4.40 cm | −4.40 cm | giữ |

*Bảng trên: snapshot trước Phase 3b/3c; hậu duệ hiện được mirror-clamp — [`V4_ADR2.md`](ADR/V4_ADR2.md).*

| Tổng cộng | Trước | Sau | Δ |
|---|---|---|---|
| Tree width | 271.59 cm | **263.68 cm** | **−7.91 cm** |
| Tree height | 183.99 cm | 183.99 cm | 0 |
| Overlap toàn cây | 0 | **0** | OK |
| Console error | 0 | **0** | OK |

### 12.6 Trade-off

- **Gap trong row không còn đều `0.25cm`**: sau khi pack, các khe có giá trị `G` xen lẫn các khe lớn (chỗ phía trên cùng của bbox cây con dài). `minGapPx` = 9.81 ≈ G; `maxGapPx` đời 6 = 957 px (~25cm) — chấp nhận theo tinh thần user.
- **Mũi tên cha-con bend mạnh hơn**: vì các đời shift khác nhau và một phần row có pack, mũi tên giữa cha-con có thể nghiêng nhiều hơn Phase 2b.
- **Hậu duệ (depth > focus):** từ 2026-05-10, Phase **3b/3c** mirror 2b/2c sau Phase 3 — không còn giữ overflow chỉ vì “Phase 3 không đổi” như snapshot đo cũ dưới đây.

### 12.7 Tính chất bảo toàn

- **Không sinh chồng lấn**: suffix shift giữ mọi khe ≥ G; chỉ ép khe `(i*−1, i*)` từ `gap` xuống `gap − myShift ≥ G`.
- **Không phá Phase 1**: hàng focus không shift. Phase 2c chỉ động `depth ∈ [0, focus−1]`; hậu duệ do Phase **3c** (sau 3b) xử lý tương tự trên `depth > focus`.
- **Tuyến tính O(N)**: pass từ phải sang trái mỗi row 1 lần; mỗi suffix shift tối đa N node. Tổng O(N²) trong trường hợp tệ nhất, O(N) thực tế (chỉ pack 2-3 vị trí mỗi row).
- **Idempotent**: chạy lại cho cùng kết quả (sau lần đầu không còn slack > G).

### 12.8 Lưu ý triển khai

Plan ban đầu mô tả "single-node shift" (chỉ dịch ô đang xét), nhưng thực thi cho thấy logic này **không giảm được overflow** — vì node cực phải luôn bị chặn bởi gap = G. Bản hiện thực cuối dùng **SUFFIX shift** (dịch toàn bộ ô từ vị trí slack về cuối row) để khớp đúng tinh thần "khi tìm thấy ông có thể dịch đủ thì dịch" của user. Xem D-10.

---

## 13. Edge Routing — Greedy Track Assignment (channel routing)

### 13.1 Bối cảnh

Sau khi layout node hoàn chỉnh, vấn đề tiếp theo là **các mũi tên cha-con đè lên nhau ở khu vực bus ngang**. User gửi screenshot cho thấy cả dải đỏ dày các đường ngang chồng lên nhau ở khoảng giữa 2 đời.

**Root cause**: Code cũ đặt `midY = startY + 0.68 * distY` cố định cho MỌI cạnh. Hệ quả: mọi cha cùng đời cùng có `startY` và `distY` → cùng `midY` → bus của các cha có `busInterval` overlap sẽ vẽ chồng lên cùng 1 đường ngang.

**Đo baseline**: 156 cặp bus chồng đoạn trên cây 614 edges (phân bố 8-69 cặp/đời, nặng nhất ở đời focus).

### 13.2 Thuật toán — Greedy Interval Scheduling (Track Assignment)

Đây là pattern chuẩn từ:
- **Channel Routing trong VLSI** (Soukup 1978) — route dây trong "channel" giữa 2 layer transistor.
- **Graphviz `dot`** — track assignment cho hierarchical edge routing.
- **ELK Layered** — layer-aware orthogonal edge routing.

```
Định nghĩa:
  busInterval(p) = [min(p.cx, leftmost child.cx),
                    max(p.cx, rightmost child.cx)]
```

Với mỗi đời cha `d`:

```
1. Sort các cha theo busInterval.left tăng dần.
2. lanes = []   (mỗi phần tử = busRight đã đặt cuối cùng trên lane đó)
3. For each parent p in sorted order:
     for k = 0..lanes.length:
        if lanes[k] + GAP < busInterval(p).left:
            assign p → lane k
            lanes[k] = busInterval(p).right
            break
     if no lane found:
        push new lane: lanes.push(busInterval(p).right)
        assign p → lane (lanes.length - 1)
4. midY(p) = startY + (0.45 + 0.40 * lane(p) / (numLanes-1)) * distY
```

**Tính chất**:
- 2 cha có `busInterval` overlap → BẮT BUỘC khác lane → khác `midY` → bus không chồng đoạn.
- 2 cha có `busInterval` không overlap → có thể dùng chung lane (tiết kiệm).
- Số lane = max chiều rộng "clique conflict" theo busInterval — thường nhỏ (3-7 cho cây gia phả).

### 13.3 Code

```1093:1186:d:\GIT\Gia-Pha-Ho-Doan\index.html
ensureArrowMarkersForColors(svg, usedColors);

// PHASE B: Greedy track assignment per row
//   - parentDepth[pid]: lookup depth từ class .d{N}
//   - parentBus[pid]:   { left, right } = busInterval
//   - parentsByDepth:   group cha theo depth row
//   - parentLane[pid]:  laneIdx (0-based) sau greedy assignment
//   - parentMidYRatio:  ratio map từ lane → [0.45, 0.85] của distY
```

### 13.4 Đo thực tế trước/sau

| Đời (1-based) | depth | parents | Trước (cặp bus chồng) | Sau (cặp bus chồng) | Lanes cần |
|---|---|---|---|---|---|
| Đời 1 | 0 | 1 | 0 | 0 | 1 |
| Đời 2 | 1 | 1 | 0 | 0 | 1 |
| Đời 3 | 2 | 3 | 0 | 0 | 1 |
| Đời 4 | 3 | 22 | 8 | **0** | 3 |
| Đời 5 | 4 | 28 | 23 | **0** | 4 |
| Đời 6 | 5 | 32 | 24 | **0** | 4 |
| Đời 7 | 6 | 46 | 24 | **0** | 3 |
| **Đời 8 (focus)** | **7** | **57** | **69** | **0** | **6** |
| Đời 9 | 8 | 26 | 8 | **0** | 3 |
| **TỔNG** | – | **216** | **156** | **0** | – |

| Tiêu chí | Trước | Sau |
|---|---|---|
| Số cặp bus chồng đoạn | 156 | **0** |
| Console error | 0 | 0 |
| Render time | nhỏ | tương đương |
| Số DOM path | 635 | 635 (không đổi) |
| Số lane mỗi đời | 1 | 3-6 (tự thích nghi) |

### 13.5 Trade-off

- **Mũi tên cha-con bend mạnh hơn**: cha ở lane cao có bus gần đời con, cha ở lane thấp có bus gần đời cha. Trunk dài/ngắn khác nhau.
- **Cắt 1 điểm vẫn có thể xảy ra** (Mức 2): bus cha A có thể CẮT trunk cha B nếu B nằm giữa busInterval của A. Đây là intersection 1 điểm (không chồng đoạn) — chấp nhận theo Mức 1 user chốt.
- **Idempotent**: chạy lại cho cùng kết quả với cùng cây input.

### 13.6 Tính chất bảo toàn

- **Không phá layout node**: chỉ thay đổi `midY` per parent, không động `position` của node.
- **Không phá hình dạng trunk-bus-drop**: vẫn dùng cấu trúc orthogonal cũ, chỉ stagger Y coordinate của bus.
- **Không phá Phase 1, Phase 2/2b/2c, Phase 3 của layout**.

### 13.7 Vì sao chọn Mức 1 (no overlap segment) thay vì Mức 2 (no intersection)

User chốt: *"Chỉ cần đừng đè vào nhau như hình trên"*. Hình trên cho thấy bus xếp chồng thành dải dày — đó là OVERLAP SEGMENT (chồng đoạn). Cắt 1 điểm (intersection) chỉ tạo 1 pixel giao, không nhìn thấy như "đè". Phase B đảm bảo cứng Mức 1; Mức 2 đòi hỏi thuật toán crossings minimization phức tạp hơn (Sugiyama framework) — overengineering với nhu cầu hiện tại.

### 13.8 Mapping với best practices ngành

| Phase B của tôi | Tên chính thức |
|---|---|
| Greedy interval scheduling | **Track Assignment** trong Channel Routing (Soukup 1978) |
| Lane → Y mapping | **Layered Hierarchical Edge Routing** (Graphviz dot, ELK Layered) |
| busInterval | **Edge envelope** trong VLSI routing |
