# V4 HLD — 2 quyết định lớn

Tài liệu này chốt **2 vấn đề thiết kế quan trọng nhất** đã giải quyết trong V4. Chi tiết kỹ thuật & đo đạc: [SDD.md](../SDD.md).

---

## Vấn đề 1 — Chọn đời nào làm "mốc cố định" để layout?

### Nhu cầu

Cây gia phả 10 đời cần **thu nhỏ tối đa chiều ngang/dọc** để vừa khổ in landscape 270×230 cm, bằng cách cho phép các ô **sát rạt nhau** (gap `G = 0.25 cm`). Phải chọn một đời làm **mốc** trước, các đời khác căn theo.

### Các phương án đã cân nhắc

| Phương án                                                | Cách làm                                                                                                             | Vấn đề gặp phải                                                                                          |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **A. Start từ đời đầu (top-down)**               | Đặt root ở giữa, đời sau spread ra theo số con                                                                  | **Phình to ở đời sau** — đời nhiều con nhất (giữa hoặc cuối) bị trải quá khổ canvas     |
| **B. Start từ đời cuối (bottom-up từ đời 10)** | Đặt đời cuối đều nhau, đời trước co theo                                                                    | Đời đông nhất (vd đời 8 với 148 nodes)**không có chỗ chứa các cha** vì đời 10 hẹp hơn |
| **C. Start từ đời đông nhất (focus)** ✅        | Đặt đời focus đều nhau với gap chuẩn, các đời tổ tiên (lên) và hậu duệ (xuống) căn theo `R_focus` | Cây vừa canvas, đời focus full chuẩn, các đời khác co/dãn theo                                      |

### Phương án chốt: C — Focus = đời đông nhất

```
Đời 1  [ROOT]                                         ← căn theo focus
Đời 2  [...]    [...]                                  ← căn theo focus
...
Đời 8  [.][.][.][.][.][.][.][.][.][.][.][.][.][.][.] ← FOCUS: đặt đều, gap = G chuẩn
...
Đời 10 [..]    [....]    [..]                          ← căn theo focus
```

Code: `computeBusiestGenerationDepth()` tìm đời `focus`, sau đó `computeAbsoluteLayout()` chạy theo thứ tự:

```
Phase 1   → đặt đời focus đều nhau (cx = i × (W+G) + W/2)
Phase 2   → bottom-up lên tổ tiên (d = focus-1 → 0)
Phase 2b  → kéo các đời tổ tiên trồi phải về trong R_focus
Phase 2c  → suffix-pack nén khe trống khi 2b bị chặn bởi x=0
Phase 3   → top-down xuống hậu duệ (d = focus+1 → maxDepth)
Phase 3b  → mirror 2b cho hậu duệ
Phase 3c  → mirror 2c cho hậu duệ
Phase 2d  → clamp parent.cx ∈ [L,R] con sau khi mọi đời đã shift
```

### Các vấn đề con trong layout (đã giải)

| Sub | Vấn đề                                       | Giải pháp                                                                       |
| --- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| 1.1 | `avg(con)` cộng dồn bias làm cây nghiêng | `(min+max)/2` của bbox subtree — phép `min/max` "phẳng" không cộng dồn |
| 1.2 | Tổ tiên trồi mép phải sau Phase 2          | **2b**: kéo cả đội hình sang trái `min(overflow, leftmost)`         |
| 1.3 | 2b bị chặn bởi `leftmost=0`, còn trồi    | **2c**: tìm khe trống nội bộ, dồn suffix `[i..N-1]` sang trái       |
| 1.4 | Hậu duệ cũng trồi                           | **3b/3c**: mirror 2b/2c cho `d > focus`                                   |

**Kết quả**: tree **263.68 × 183.99 cm** (vừa canvas 270×230cm), **0 chồng ô**, đời focus full gap chuẩn 0.25cm.


Hiểu đơn giản 

- logic là từ tầng 8 gióng lên để đặt cha ở giữa các con, sau khi xếp xong hết thì đẩy dịch từ phải qua trái vào sao cho độ dài tổng thể của bên phải bằng với max (ở đời 8) đúng chứ ??


**Bước 1 — Phase 2 chính (đặt cha ở giữa con):**

* Từ đời 7 lên đời 1, mỗi cha = `(bbox.left + bbox.right) / 2` của cụm con
* Có sweep để đảm bảo anh em không đè (gap tối thiểu G)

**Bước 2 — Phase 2b/2c (đẩy dồn phải→trái vào trong rFocus):**

* **2b** : nếu hàng đời `d` có right edge > rFocus → shift đều toàn hàng sang trái
* **2c** : nếu 2b chưa đủ → đẩy "kiểu xếp gối" từ phải sang trái, mỗi cặp anh em ăn bớt khoảng trống thừa

Mục tiêu cuối cùng: **mọi hàng đời 1–7 phải nằm trong khung [0, rFocus]** của đời 8.

### Refinements 2026-05-25 (V4.1)

Sau khi V4 chạy thực, phát hiện thêm 3 vấn đề con của Phase 2 + biện pháp đã áp dụng trong `computeAbsoluteLayout` ([utils/tree-layout-v2.js](../../utils/tree-layout-v2.js)):

| Sub | Vấn đề                                                                                                                                                                                                                                | Giải pháp                                                                                                                                                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.5 | Phase 2 dùng **subtree bbox midpoint** → ancestor bị "kéo" sang một bên khi subtree lệch (vd. cụ HUẤN có 2 con: con trái có cháu lan rộng → midpoint subtree lệch trái → cụ HUẤN trùng cx con trái thay vì giữa 2 con)                          | Tách 2 metric trong Phase 2: `childBboxByParent` (subtree bbox, dùng cho `bboxX.set` collision avoidance) **+** `childCxByParent` MỚI (cx con TRỰC TIẾP). `desiredCx = midpoint(childCxByParent)` → cha luôn nằm giữa con trực tiếp                                          |
| 1.6 | Layout dùng `W = 1.5cm` cho mọi đời, nhưng CSS swap d0/d1/d2 thành **landscape 12cm × 4.5cm** → ô cụ Hán/Quyết/Huấn rộng 454px thực tế nhưng layout tưởng 57px → bbox sai, ô **dôi ra ngoài rFocus** ~200px (cụ HUẤN nhô qua mép phải canvas)        | Thêm `widthAtDepth(d)`: trả `H` (height_cm × cmPx ≈ 454px) cho d ≤ 2, trả `W` (~57px) cho d ≥ 3. Thay `W` → `Wd` trong Phase 2/2b/2c (Phase 1, 3, 3b, 3c giữ W vì focus + descendants đều là d3+ portrait). Phase 2c giờ tự kéo ancestor về trong rFocus đúng width thực |
| 1.7 | Sau 1.6, ancestor đã trong rFocus nhưng vẫn dính sát mép phải (vd. cụ HUẤN.right ≈ rFocus) → trông "lẻ loi" ngoài rìa canvas, không có không gian breathing                                                                                | `ANCESTOR_RIGHT_MARGIN = 333` trong Phase 2c: target right edge = rFocus − margin → Phase 2c kéo rightmost ancestor (cụ HUẤN) thêm về trái ~333px → cụ HUẤN cx ≈ 8434 thay vì 8767, có khoảng thở với mép canvas                                                                |

Hệ quả phụ:
- **1.5**: subtree cân đối (đa số ancestor) gần như không đổi vị trí (direct cx midpoint ≈ subtree bbox midpoint). Chỉ subtree lệch một bên mới shift.
- **1.6**: tăng độ chính xác bbox cho mọi ancestor d0–d2 → Phase 2b/2c hoạt động đúng width thực.
- **1.7**: knob số đơn giản — dễ tinh chỉnh (tăng margin nếu muốn ancestor lùi sâu hơn; giảm nếu muốn sát mép hơn).

---

## Vấn đề 2 — Đường mũi tên nối cha → con

### Nhu cầu

Mỗi cạnh cha→con là một `<path>` SVG, **không được chồng/cắt nhau** giữa các cha cùng thế hệ, và phải đúng **phong cách gia phả** (dễ đọc dòng dõi).

### Các phương án đã cân nhắc

| Phương án                                                             | Cách làm                                                                                                              | Vấn đề gặp phải                                                                                                                                                                           |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Đường cong Bézier**                                       | `M parent C cp1 cp2 child` — cong mềm                                                                               | Không phong cách gia phả/org-chart; nhiều đường cong giao nhau khó trace                                                                                                               |
| **B. Gấp khúc 1 chiều** (`V → H → V`, lane theo `cx` ASC) | Vuông góc 3 đoạn, mỗi cha 1 lane Y khác nhau                                                                      | **Bất đối xứng**: tốt khi con BÊN TRÁI cha; **tệ khi con BÊN PHẢI** — bus leftmost cha kéo sang phải băng qua các cha bên phải, stem dọc của họ phải cắt qua |
| **C. Gấp khúc 2 chiều (bi-lane)** ✅                            | Vuông góc 3 đoạn,**phân nhóm cha theo hướng bus**: L-extending sort L→R, R-extending sort **R→L** | Triệt tiêu crossing ở cả 2 chiều                                                                                                                                                          |

### Phương án chốt: C — Orthogonal + Bi-lane

**Cấu trúc path:**

```
M parent.cx, cyBot   V busY   H child.cx   V child.cyTop
```

**Gán lane theo chiều bus** (Step 2b trong `tree-edges-v2.js`):

```
centroid(con) ≤ parent.cx  →  L-extending: sort cx ASC,  leftmost  lane 0
centroid(con) >  parent.cx  →  R-extending: sort cx DESC, RIGHTMOST lane 0   ← ĐẢO

busY = parent.cyBot + LANE_BASE_OFFSET + lane × LANE_STEP
```

**Vì sao đảo cho R-extending?** Minh hoạ 3 cha gần nhau X={100, 200, 300}, con phía phải:

```
KHÔNG ĐẢO (B):                          CÓ ĐẢO (C):
busY₁ (cao):   ──────────  X 100→1000   busY₁ (cao):              ─── X 300→1400
busY₂:              ─────  X 200→1200   busY₂:              ─────── X 200→1200
busY₃ (thấp):       ─────  X 300→1400   busY₃ (thấp): ──────────── X 100→1000
               │     │     │                          │     │     │
Stem cha 2,3 phải CẮT busY phía trên ❌  Stem mọi cha xuống lane của mình clear ✓
```

→ Bus xa nhất được đẩy sâu nhất, các stem dọc không bao giờ cắt qua bus của cha khác cùng nhóm.

**Tính toán giới hạn lane** (với `between_generations_gap_cm = 7` ≈ 264.6 px):

```
LANE_BASE_OFFSET + (MAX_LANES − 1) × LANE_STEP  ≤  gap − LANE_TAIL_CLEARANCE
12 + (MAX_LANES − 1) × 8 ≤ 264.6 − 12  →  MAX_LANES ≤ 31  (cap thực tế: 25)
```

**Kết quả**: 0 cặp bus chồng đoạn (giảm từ 156 ở V3), 0 crossing stem ↔ bus trong cùng nhóm.

---

## Tham chiếu

- **Code layout**: [`utils/tree-layout-v2.js`](../../utils/tree-layout-v2.js) — `computeAbsoluteLayout()`
- **Code edges**: [`utils/tree-edges-v2.js`](../../utils/tree-edges-v2.js) — `drawTreeEdges()` + constants `LANE_*`
- **SDD chi tiết**: [SDD.md](../SDD.md) §10 (bbox-midpoint), §11 (2b), §12 (2c), §13 (edge routing)
- **ADR cũ**: [V1.md](V1.md), [V2.md](V2.md), [V3.md](V3.md)
