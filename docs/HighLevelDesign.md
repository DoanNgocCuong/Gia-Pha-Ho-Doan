# High-Level Design — Gia Phả Họ Đoàn (tóm tắt)

**Mục đích**: Một trang web đơn (`index.html`) đọc dữ liệu JSON, vẽ cây gia phả 10 đời với **ưu tiên in ấn** (kích thước cm, gap cố định), layout **bottom-up absolute** để giảm bề ngang và **không chồng ô**.

**Chi tiết đặc tả & đo đạc**: xem [SDD.md](./SDD.md).

---

## 1. Ngữ cảnh hệ thống

```
+------------------+     fetch       +---------------------------+
|   Trình duyệt    |  -------------> | data/GiaPhaHoDoan.json      |
|   index.html     |                 | data/print-size-config.json |
+------------------+                 +---------------------------+
        |                                        |
        | validate + build stratified model       | CSS vars + @page print
        v                                        v
+------------------+     compute + apply        +------------------+
| DOM ul/li + .node| <------------------------- | computeAbsolute   |
| position:absolute|                         | Layout / edges    |
+------------------+                         +------------------+
```

- **Nguồn dữ liệu**: [`data/GiaPhaHoDoan.json`](../data/GiaPhaHoDoan.json) — cây nested (`root`, `children`, `depth`, `gender`).
- **Token in**: [`data/print-size-config.json`](../data/print-size-config.json) — khổ canvas (cm), kích thước ô, khoảng cách đời/khoảng cách anh em, typography, margin an toàn; nạp qua `fetch`, có fallback trong JS nếu lỗi/mất file.
- **Triển khai**: toàn bộ UI, layout, vẽ cạnh SVG, export, drawer JSON nằm trong [`index.html`](../index.html) (ứng dụng một file, không backend).

---

## 2. Luồng xử lý chính (theo code)

1. **Bootstrap**: `bootstrapTree()` → `loadPrintSizeConfig()` → áp config lên CSS (`--node-width`, `--stratum-gap-*`, `@page` in, override đời 1–4 nếu có) → `loadTreeData()` đọc JSON gia phả.
2. **Render**: `renderTreeFromData()` xây nested `<ul>/<li>` và các ô `.node` có `data-node-id`.
3. **Mô hình đồ thị**: `buildStratifiedModel` → `levels[]`, `edges[]`; đời focus = đời đông nhất (`computeBusiestGenerationDepth`).
4. **Layout**: `computeAbsoluteLayout(model, focusDepth)` — ba phase (focus row đều → lên tổ tiên có sweep → xuống hậu duệ cụm quanh cha); `applyAbsoluteLayout()` đặt `position: absolute; left/top` và kích thước vùng `.tree`.
5. **Cạnh**: `drawTreeEdges()` dùng `getBoundingClientRect()` — tương thích với absolute layout; có observer khi resize/zoom.
6. **Chữ trong ô**: `fitNodeText()` / normalize nhãn — font px suy ra từ config typography.

Chi tiết pseudo-code và chỉ số đo: [SDD §3](./SDD.md#31-tổng-quan-thuật-toán).

---

## 3. Thuật toán layout (chốt triển khai)

| Phase | Ý tưởng | Ghi chú |
|-------|---------|---------|
| **1 — Đời focus** | Xếp đều `cx = i × (W + G) + W/2` | Đúng gap ngang chuẩn (vd. 0.25 cm). |
| **2 — Lên (ancestors)** | `desired_x = avg(các con trực tiếp)`, sau đó sweep trái→phải `max(desired, prev_right + G + W/2)` | Giữ không đè anh em; khác với “Cách B” (bbox min/max) trong phụ lục. |
| **3 — Xuống (descendants)** | Cụm con center quanh cha, sweep | Mũi tên có thể bend; chấp nhận theo R5 trong SDD. |

**CSS**: `.tree.absolute-layout` — `display: contents` cho `ul/li`, `.node` `position: absolute`. Thuật toán cũ `compactTreeLayout()` vẫn trong file nhưng không gọi (rollback nếu cần).

---

## 4. In ấn & không gian vật lý

- Khổ mục tiêu và margin: từ `print-size-config.json` → `@media print` và biến `--*` đồng bộ màn hình/preview.
- Kết quả đã đo (Chrome): cây ~**275.39 × 183 cm**, đời focus ~**258.74 cm** ngang; **0 overlap** toàn cây; tree width vượt “safe inner” canvas một phần nhỏ (~7.39 cm) — nguyên nhân & option xử lý: [SDD §5–§6](./SDD.md#53-đáp-ứng-plan).

---

## 5. Yêu cầu & phạm vi (rút từ SDD)

- **R1–R4**: Khổ in landscape đã chốt, đủ 10 đời, không chồng ô, đời đông nhất gap đúng token.
- **R5**: Đường nối cha-con được phép không thẳng tắp.
- **R6**: Giữ export PNG/PDF, legend, drawer JSON, drag-to-pan, v.v.

---

## 6. Quyết định kiến trúc (snapshot)

| ID | Nội dung |
|----|----------|
| D-01 | Canvas 270×230 cm (ngang × cao) landscape. |
| D-02 | Đời focus = đời đông nhất (auto). |
| D-03 | Phase 2 center theo **trung bình con trực tiếp**, không weighted-subtree. |
| D-04 | `display: contents` để giữ DOM cho edges. |
| D-05 | Giữ `compactTreeLayout` để rollback. |

Bảng đầy đủ: [SDD §9](./SDD.md#9-decision-log).

---

## Phụ lục — Logic “Cách B” (nghiên cứu, chưa triển khai)

Phần dưới mô tả phương án **tâm cha = midpoint bbox** subtree ở đời focus (`min/max` thay vì `avg` lặp tầng). Đây là hướng giảm bias khi cây lệch; **code hiện tại vẫn dùng avg + sweep như SDD**, không phải Cách B.

### Một câu

> "Mỗi tổ tiên đứng **chính giữa** dải mà cây con của nó chiếm ở đời focus."

### 3 thành phần

```
┌─────────────────────────────────────────────────────────┐
│  Mỗi node v lưu 2 số:                                  │
│     L(v) = mép TRÁI nhất của cây con v ở đời focus     │
│     R(v) = mép PHẢI nhất của cây con v ở đời focus     │
│                                                         │
│  Tâm của v:                                            │
│     x(v) = ( L(v) + R(v) ) / 2                         │
└─────────────────────────────────────────────────────────┘
```

### Quy trình bottom-up (4 bước)

```
Bước 1.  Đặt đời focus đều nhau (Phase 1, không đổi).
         Mỗi ô v ở đời focus:  L(v) = x(v) - W/2
                                R(v) = x(v) + W/2

Bước 2.  Lên 1 đời (d = focus-1, focus-2, ..., 0).
         Cho mỗi cha p ở đời d:
              L(p) = min(L của tất cả con của p)
              R(p) = max(R của tất cả con của p)
              x(p) = ( L(p) + R(p) ) / 2     ← TÂM = MIDPOINT BBOX

Bước 3.  Sweep phòng đè (giữ nguyên).
         Nếu tâm tính ra "đè" anh trước, đẩy sang phải:
              x(p) = max( x(p), prev_right + G + W/2 )

Bước 4.  Cập nhật L(p), R(p) sau sweep.
         L(p) = min( x(p) - W/2, L(p) cũ )
         R(p) = max( x(p) + W/2, R(p) cũ )
         → để truyền lên đời cao hơn cho đúng.
```

### Ví dụ tay với cây tí hon

Giả sử đời focus có 5 ô đặt tại x = `10, 20, 30, 40, 50`.

```
        d=0:           ROOT?
                       /        \
        d=1:        A              B
                  / | \           / \
        d=2:    a1 a2 a3        b1  b2
                |  |  |          |   |
        focus: 10 20 30         40   50
```

**Đặt focus row** (Bước 1):

```
ô |  x | L  | R
-----------------
10 | 10 | 5  | 15
20 | 20 | 15 | 25
30 | 30 | 25 | 35
40 | 40 | 35 | 45
50 | 50 | 45 | 55
```

**Lên d=1** (Bước 2):

`A` có 3 con `a1, a2, a3` (tức 3 ô focus 10, 20, 30):

```
L(A) = min(5, 15, 25)   = 5
R(A) = max(15, 25, 35)  = 35
x(A) = (5 + 35) / 2     = 20      ← chính giữa cây con của A
```

`B` có 2 con `b1, b2` (40, 50):

```
L(B) = min(35, 45)  = 35
R(B) = max(45, 55)  = 55
x(B) = (35 + 55)/2  = 45          ← chính giữa cây con của B
```

**Lên d=0** (root):

```
L(ROOT) = min(L(A), L(B)) = min(5, 35) = 5
R(ROOT) = max(R(A), R(B)) = max(35, 55) = 55
x(ROOT) = (5 + 55) / 2  = 30      ← chính giữa CẢ CÂY (đúng giữa focus row)
```

**So sánh với cách hiện tại (`avg con trực tiếp`):**

```
Cách hiện tại:
   x(A)    = avg(10, 20, 30) = 20    ✓ trùng nhau
   x(B)    = avg(40, 50)     = 45    ✓ trùng nhau
   x(ROOT) = avg(20, 45)     = 32.5  ✗ lệch phải 2.5

Cách B:
   x(ROOT) = (5 + 55)/2      = 30    ✓ đúng giữa focus row
```

→ Khi cây càng **không đối xứng** (số con trái ≠ phải, độ rộng cây con khác nhau), chênh lệch giữa `avg` và `bbox-mid` càng lớn. Trong cây gia phả thật, sai số này **cộng dồn** lên thành 60–70 cm như đo được ở Cụ Rũng / Cụ Tổ.

### Vì sao công thức `min/max` không bị "cộng dồn"

```
Tính chất TOÁN HỌC quan trọng:

   min( min(a,b), min(c,d) )  =  min(a,b,c,d)
   max( max(a,b), max(c,d) )  =  max(a,b,c,d)
```

Nghĩa là: **min/max là phép toán "phẳng"** — gộp nhiều tầng lại thành 1 tầng cũng cho đúng kết quả. Còn `avg` thì:

```
   avg( avg(a,b), avg(c,d) )  ≠  avg(a,b,c,d)        nếu trọng số khác
```

→ `avg` 2 tầng ≠ `avg` flat của tất cả → bias xuất hiện.

### Kết luận 1 dòng (Cách B)

**Cách B = "dùng `min/max` thay cho `avg`"**, vì `min/max` không bị cộng dồn sai số khi đệ quy lên nhiều tầng. Tâm cha luôn đứng đúng giữa cây con của mình ở đời focus, dù cây có lệch hay không.

*(Triển khai trong repo: xem [SDD §6.3](./SDD.md#63-tuỳ-chọn-xử-lý-chưa-thực-hiện-đợi-chốt) option (c) — chưa làm.)*
