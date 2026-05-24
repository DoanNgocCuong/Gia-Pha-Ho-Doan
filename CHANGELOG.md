# CHANGELOG

Tài liệu này được cập nhật dựa trên **10 commit gần nhất** của repository.

## 2026-05-25

### Layout V4.1 — căn ancestor giữa con trực tiếp + width đúng theo đời + lùi mép phải

Refinements 3 sub-problems của Phase 2 trong [`utils/tree-layout-v2.js`](utils/tree-layout-v2.js) `computeAbsoluteLayout`. Chi tiết kỹ thuật ở [`docs/ADR/V4_HLD.md`](docs/ADR/V4_HLD.md) §"Refinements 2026-05-25 (V4.1)".

- **Sub 1.5 — Direct children cx midpoint**: Phase 2 trước dùng `desiredCx = midpoint(subtree bbox)`. Khi subtree một bên lan rộng (vd. cụ HUẤN: con trái ÔNG HỖ có cháu kéo bbox sang trái, con phải ÔNG ĐOÀN VĂN SƠN không con) → midpoint subtree lệch trái → cụ HUẤN cx trùng cx con trái (8829.3), không nằm giữa 2 con. **Fix**: tách 2 metric — `childBboxByParent` (giữ để bbox tracking) + `childCxByParent` MỚI (cx con trực tiếp); `desiredCx` dùng midpoint direct cx. Kết quả: cha luôn nằm giữa con trực tiếp.

- **Sub 1.6 — Depth-aware width (`widthAtDepth(d)`)**: Layout cũ dùng `W = cfg.node.default.width_cm × cmPx` (~57px) cho mọi đời. Nhưng CSS swap d0/d1/d2 thành ô **landscape 12cm × 4.5cm** (~454px wide) — layout tưởng 57px → bbox sai → ô cụ tổ thực render **dôi ra ngoài rFocus ~200px** (vd. cụ HUẤN cx=8966, layout tưởng right=8995=rFocus, thực render right=9193 vượt 198px). **Fix**: thêm `widthAtDepth(d)` trả `H` cho d ≤ 2 (landscape), `W` cho d ≥ 3 (portrait). Thay `W` → `Wd` trong Phase 2/2b/2c. Phase 1 + Phase 3/3b/3c giữ `W` vì focus + descendants đều là d3+ portrait.

- **Sub 1.7 — `ANCESTOR_RIGHT_MARGIN`**: Sau 1.6, ancestor đã trong rFocus nhưng vẫn dính sát mép (right edge ≈ rFocus) → trông "lẻ loi" ngoài rìa canvas. **Fix**: hằng `ANCESTOR_RIGHT_MARGIN = 333` trong Phase 2c, trừ thẳng vào `rFocusC` → target right edge nhỏ hơn rFocus 333px → Phase 2c kéo rightmost ancestor (cụ HUẤN) thêm về trái 333px. Có không gian breathing với mép canvas. Knob dễ tinh chỉnh — tăng nếu muốn lùi sâu hơn.

**Tệp:** [`utils/tree-layout-v2.js`](utils/tree-layout-v2.js) (function `widthAtDepth`, Phase 2 thêm `childCxByParent`, Phase 2/2b/2c dùng `Wd`, Phase 2c thêm `ANCESTOR_RIGHT_MARGIN`), [`docs/ADR/V4_HLD.md`](docs/ADR/V4_HLD.md) (thêm §"Refinements 2026-05-25").

### Edges — thử nghiệm đường chéo 1 đoạn thay gấp khúc orthogonal

- **Mô tả:** Thay path edge từ `M x1 y1 V busY H x2 V y2` (orthogonal 3 đoạn) sang `M x1 y1 L x2 y2` (đường chéo 1 đoạn từ tâm-đáy cha → tâm-đỉnh con). Phong cách "fan-out" thay vì org-chart vuông góc. **Exploratory** — giữ tạm logic `busY/lane/LANE_*` ở phía trên (dead code) để dễ rollback về gấp khúc nếu cần.
- **Tệp:** [`utils/tree-edges-v2.js`](utils/tree-edges-v2.js) line 263-275.

## 2026-05-24

### Edges — đường gấp khúc orthogonal + lane stagger hai chiều (chống chồng chéo)
- **Mô tả:** Thay thế Bézier curves bằng đường **orthogonal 3 đoạn** `V busY → H → V` cho mọi cạnh cha→con (org-chart style). Mỗi cha trong cùng thế hệ được gán **lane Y riêng** (`MAX_LANES=25`, `LANE_STEP=8`, `LANE_BASE_OFFSET=12`) để các bus ngang không đè Y lên nhau khi X-range trùng.
- **Logic gán lane hai chiều (key insight):** Tách parents thành 2 nhóm theo hướng bus:
  - **L-extending** (centroid(con) ≤ parent.cx, bus kéo sang TRÁI): sort L→R, lane 0 = leftmost. Bus kéo vào vùng trống bên trái, không cắt stem các parent khác.
  - **R-extending** (centroid(con) > parent.cx, bus kéo sang PHẢI): sort **R→L**, lane 0 = rightmost (đảo ngược). Tránh trường hợp leftmost parent có bus dài kéo sang phải băng qua vùng X của các parent bên phải → các stem dọc của parent đó phải cắt qua bus phía trên.
- **Công thức ràng buộc lane:** `LANE_BASE_OFFSET + (MAX_LANES − 1) × LANE_STEP ≤ gap − LANE_TAIL_CLEARANCE` (với gap = `between_generations_gap_cm × cmToPx` ≈ 264.6px ở 7cm → max 31 lanes lý thuyết).
- **Tệp:** [`utils/tree-edges-v2.js`](utils/tree-edges-v2.js) (bỏ `CURVE_TENSION`, thêm 4 constant LANE_*, Step 2b gán lane theo direction, Step 3 vẽ orthogonal path với busY = `p.cyBot + LANE_BASE_OFFSET + lane × LANE_STEP` có clamp `LANE_TAIL_CLEARANCE` để không đè con).

### Docs — Gộp ADR thành 1 file V4_HLD.md theo dạng MECE (2 vấn đề lớn)
- **Mô tả:** Restructure `docs/ADR/V4*.md` thành **một file duy nhất** [`docs/ADR/V4_HLD.md`](docs/ADR/V4_HLD.md) theo dạng MECE, tập trung vào **2 quyết định thiết kế lớn nhất**:
  1. **Layout — chọn đời mốc**: so sánh 3 phương án (top-down từ đời 1 / bottom-up từ đời 10 / focus = đời đông nhất), chốt **focus**. Bên trong gom các sub-problem layout (Phase 2 bbox-midpoint, Phase 2b/2c clamp + suffix pack tổ tiên, Phase 3b/3c mirror cho hậu duệ).
  2. **Edge routing**: so sánh 3 phương án (Bézier cong / orthogonal 1 chiều / **orthogonal bi-lane**), chốt bi-lane với minh hoạ ASCII vì sao phải đảo cho R-extending.
- **Đổi tên & xóa:**
  - `docs/ADR/V4.md` → `docs/ADR/V4_HLD.md` (đổi tên qua `git mv` để giữ history)
  - **Xóa** `docs/ADR/V4_ADR2_căn theo đời già nhất.md` (đã gộp vào Vấn đề 1 sub-problems)
  - **Xóa** `docs/ADR/V4_ADR3_name.md` (chỉ là stub TODO 4 dòng, không phải nội dung thiết kế)
- **Lý do:** Giảm trùng lặp giữa V4.md (Phụ lục B, C) và V4_ADR2 (§2.1, §2.2) — cả 2 đều mô tả Phase 2b/2c. Sau gộp: ~120 dòng (vs ~475 dòng cũ), tập trung "nhu cầu → phương án → chốt" thay vì decision log dài dòng.

## 2026-05-10

### Revert V4_ADR3 — bỏ `wifeName` và UI chia ô ngang (chồng / vợ)
- **Mô tả:** Gỡ trường **`wifeName`** khỏi [`data/GiaPhaHoDoan.json`](data/GiaPhaHoDoan.json); mỗi ô lại dùng **một** nhãn `.nm` với `name` đầy đủ. Xóa CSS `nm-row` / `nm-divider` / `nm-primary` / `nm-spouse` trong [`index.html`](index.html); đơn giản hóa [`utils/tree-bootstrap-v2.js`](utils/tree-bootstrap-v2.js) và [`utils/tree-text-v2.js`](utils/tree-text-v2.js). Xóa ADR [`docs/ADR/V4_ADR3.md`](docs/ADR/V4_ADR3.md) và script [`utils/migrate_wife_name.py`](utils/migrate_wife_name.py). Cập nhật [`utils/README.md`](utils/README.md).

### Đồng bộ repo — dữ liệu `data/`, ô nam + `wifeName` (chia ngang), utils cây, ADR/SDD/HLD, BMad, script
- **Mô tả:** Gom dữ liệu gia phả vào `data/` (JSON gốc + `print-size-config.json`, `tree-shell-config.json`, bản `.bak` nếu có). Bổ sung trường **`wifeName`** trên node nam; script migrate [`utils/migrate_wife_name.py`](utils/migrate_wife_name.py). UI: `gender === "male"` và có vợ → hai vùng **chia ngang** (chồng trên / vạch ngang / vợ dưới, hai nửa cao bằng), normalize + fit chữ cho `.nm-primary` / `.nm-spouse`. Tái cấu trúc utils cây (`tree-layout`, `tree-edges`, `tree-bootstrap`, `tree-text`, `tree-state`, `tree-pan`, `print-config`, `css-units` và bản **`-v2`** tương ứng; `tree-export`, `tree-shell-config`). Cập nhật `index.html`, `utils/README.md`, `AGENTS.md`, hook `.cursor/hooks/state/`. Tài liệu: thư mục [`docs/ADR/`](docs/ADR/) (`V1`–`V4`, `V4_ADR1`–`V4_ADR3`, `V4_ADR2_căn theo đời già nhất.md`), [`docs/ADR/V4.md`](docs/ADR/V4.md), [`docs/SDD.md`](docs/SDD.md), [`docs/HighLevelDesign.md`](docs/HighLevelDesign.md), hình minh hoạ layout/edge (`docs/*.png`). Script phụ: [`scripts/prefix_doan_van_male_names.py`](scripts/prefix_doan_van_male_names.py), [`scripts/_normalize_ong_names.py`](scripts/_normalize_ong_names.py), [`parse_gia_pha.cjs`](parse_gia_pha.cjs). Thêm cấu hình/kỹ năng agent: [`.agents/`](.agents/) (skills BMad…), [`.claude/`](.claude/) (skills), [`_bmad/`](_bmad/), [`_bmad-output/`](_bmad-output/). **Xóa khỏi tracking:** `GiaPhaHoDoan.json` ở root (thay bằng `data/GiaPhaHoDoan.json`), `family_tree_full.json`. **Untracked root:** `GiaPhaHoDoan.json.bak` (backup); index hook `continual-learning-index.json`.
- **Tệp (rút gọn theo nhóm):**  
  - **Dữ liệu & migrate:** `data/GiaPhaHoDoan.json`, `data/print-size-config.json`, `data/tree-shell-config.json`, `utils/migrate_wife_name.py`  
  - **Cây & in:** `utils/tree-*-v2.js`, `utils/tree-*.js`, `utils/css-units.js`, `utils/print-config.js`, `utils/tree-shell-config.js`  
  - **UI:** `index.html` (CSS `.node.male .nm-row` cột + `.nm-divider` ngang)  
  - **Docs:** `docs/ADR/*`, `docs/ADR/V4.md`, `docs/SDD.md`, `docs/HighLevelDesign.md`, `docs/*.png`  
  - **Khác:** `scripts/*`, `parse_gia_pha.cjs`, `AGENTS.md`, `CHANGELOG.md`, `.agents/**`, `.claude/**`, `_bmad/**`, `_bmad-output/**`, `.cursor/hooks/state/*`

### Edges — greedy track theo `busInterval` (SDD §13)
- **Mô tả:** `drawTreeEdges` gán lane greedy (`laneRight + GAP < busLeft`) trong mỗi khe cha–con; `midY` chia đều theo số lane thay vì xếp theo `cx` + tỉ lệ `(i+1)/(N+1)` (tránh bus ngang chồng/cắt khi N lớn).
- **Tệp:** `utils/tree-edges-v2.js`, `utils/tree-edges.js`.

### Layout — clamp mép phải cho đời hậu duệ (theo `R_focus`)
- **Mô tả:** Sau Phase 3, thêm Phase **3b** (shift cả hàng `d > focus` nếu vượt mép phải đời focus, mirror Phase 2b) và **3c** (suffix pack mirror 2c); sau đó vẫn chạy Phase 2d. Cập nhật `docs/ADR/V4_ADR2.md`.
- **Tệp:** `utils/tree-layout.js`, `utils/tree-layout-v2.js` (entry `index.html`), `docs/ADR/V4_ADR2.md`, `docs/ADR/V4.md`, `docs/SDD.md` (mục Phase 3b/3c + chú thích bảng đo cũ).

### Utils — in đồng bộ layout, CSS px, PDF nhiều trang
- **Mô tả:** Gán `treeState.activePrintSizeConfig` khi áp dụng cấu hình in; chuyển biến CSS layout node/gap sang px qua `css-units.js`; sửa vòng lặp xuất PDF (toạ độ mm nhất quán); bỏ export công khai `compactTreeLayout`; ước lượng chiều cao cây từ config khi thiếu mẫu DOM.
- **Tệp:** `utils/css-units.js`, `utils/print-config.js`, `utils/tree-layout.js`, `utils/tree-export.js`.

## 2026-05-09

### Dữ liệu — đệm họ «Đoàn Văn» sau «Ô.» (nam)
- **Mô tả:** Trong `data/GiaPhaHoDoan.json`, với mọi nút `gender: "male"`, sau mỗi cụm `Ô.` chèn `Đoàn Văn ` nếu chưa có; **không** áp dụng cho toàn bộ cây con gốc `I. Cụ Hán M6.5-\u200bB1 Đức M19.8, B2 Ruyên M17.7, B3 Lý M11.9`.
- **Tệp:** `data/GiaPhaHoDoan.json`, script tái lập quy tắc: `scripts/prefix_doan_van_male_names.py`.

## 2026-04-30

### 1. 5519307c - export PDF
- **Tác giả:** Doan Ngoc Cuong
- **Thời gian:** 2026-04-30 16:38:13 +0700
- **Mô tả:** Bổ sung/chỉnh sửa luồng xuất cây gia phả sang định dạng PDF từ giao diện web.
- **Tệp thay đổi:**
  - `index.html`

### 2. 8069d1db - Update các cụ... (cập nhật dữ liệu diện rộng)
- **Tác giả:** Doan Ngoc Cuong
- **Thời gian:** 2026-04-30 16:13:02 +0700
- **Mô tả:** Cập nhật thông tin nhiều nhánh và nhiều nhân sự trong gia phả (bao gồm các cụ và hậu duệ liên quan), đồng bộ dữ liệu và phần hiển thị.
- **Tệp thay đổi:**
  - `GiaPhaHoDoan.json`
  - `index.html`

### 3. 528df64b - JSON export, import to HTML
- **Tác giả:** Doan Ngoc Cuong
- **Thời gian:** 2026-04-30 15:56:34 +0700
- **Mô tả:** Thiết lập/chuyển đổi cơ chế xuất dữ liệu JSON và nạp vào HTML để render cây gia phả theo hướng dữ liệu dẫn dắt (JSON-driven).
- **Tệp thay đổi:**
  - `GiaPhaHoDoan.json` (thêm mới tại thời điểm commit)
  - `index.html`

### 4. bba18cf6 - update family tree hierarchy rendering and directional connectors
- **Tác giả:** Doan Ngoc Cuong
- **Thời gian:** 2026-04-30 15:01:13 +0700
- **Mô tả:** Cải tiến thuật toán hiển thị phân cấp cây và đường nối có hướng giữa các thế hệ/nhánh.
- **Tệp thay đổi:**
  - `index.html`

### 5. c764b055 - update family tree dataset and sync rendered HTML from latest Excel source
- **Tác giả:** Doan Ngoc Cuong
- **Thời gian:** 2026-04-30 10:14:08 +0700
- **Mô tả:** Đồng bộ dữ liệu gia phả từ nguồn Excel mới nhất, cập nhật tài liệu đi kèm và chuẩn hóa vị trí tài liệu trong thư mục `docs`.
- **Tệp thay đổi chính:**
  - `index.html`
  - `docs/GIA PHẢ HỌ ĐOÀN.md` (đổi vị trí từ file cũ)
  - `docs/GiaPha_Template_Updated.xlsx` (thêm mới)
  - `docs/[Live Online] - sua 27.4 Cụ ô Liễu M20.docx` (thêm mới)
  - `.cursor/hooks/state/continual-learning.json`
  - Xóa một số tài liệu gốc cũ ở thư mục root

### 6. 007945a0 - update index.html: normalize label formatting, hyphen line-break rendering, and robust full-tree image export
- **Tác giả:** Doan Ngoc Cuong
- **Thời gian:** 2026-04-30 09:58:20 +0700
- **Mô tả:** Chuẩn hóa format nhãn hiển thị, cải thiện xuống dòng với dấu gạch nối và tăng độ ổn định cho chức năng xuất ảnh toàn cây.
- **Tệp thay đổi:**
  - `index.html`

## 2026-04-21

### 7. ee85bfef - [update thông tin]
- **Tác giả:** Doan Ngoc Cuong
- **Thời gian:** 2026-04-21 13:40:42 +0700
- **Mô tả:** Cập nhật dữ liệu/thông tin tổng hợp, bổ sung bộ script hỗ trợ xử lý dữ liệu và tài liệu hướng dẫn cho thư mục tiện ích.
- **Tệp thay đổi chính:**
  - `index.html`
  - `utils/README.md` (thêm mới)
  - `utils/build_tree.py` (thêm mới)
  - `utils/extract_text.py` (thêm mới)
  - `utils/extract_with_indent.py` (thêm mới)
  - `.cursor/hooks/state/continual-learning.json` (thêm mới tại thời điểm commit)
  - Cập nhật/thay thế tài liệu `.docx` nguồn

## 2026-04-04

### 8. c4a418c1 - fix: correct drag-to-pan scroll direction (left side scroll bug)
- **Tác giả:** DoanNgocCuong
- **Thời gian:** 2026-04-04 13:33:58 +0000
- **Mô tả:** Sửa lỗi chiều cuộn khi kéo (drag-to-pan), đặc biệt lỗi lệch hướng ở khu vực bên trái.
- **Tệp thay đổi:**
  - `index.html`

### 9. 947bae6e - fix: pan both directions + add image export button
- **Tác giả:** DoanNgocCuong
- **Thời gian:** 2026-04-04 11:49:49 +0000
- **Mô tả:** Bổ sung khả năng kéo theo cả hai trục và thêm nút xuất ảnh từ giao diện.
- **Tệp thay đổi:**
  - `index.html`

### 10. 73853bff - Add files via upload
- **Tác giả:** DoanNgocCuong
- **Thời gian:** 2026-04-04 18:50:15 +0700
- **Mô tả:** Bổ sung dữ liệu cây gia phả ban đầu phục vụ import/render.
- **Tệp thay đổi:**
  - `family_tree_full.json` (thêm mới)



### 11. TÁI CẤU TRÚC GIAO DIỆN: TỐI ƯU CHIỀU NGANG & CHỐNG ĐAN CHÉO (Reingold-Tilford)
- **Thời gian:** 2026-05-01
- **Mục đích cốt lõi:**
  1. Thu hẹp tối đa bề ngang dự án (ép các ô đứng sát rạt nhau) để bao quát được nhiều dòng họ nhất trên màn hình.
  2. Xóa sổ hoàn toàn tình trạng các đường rẽ nhánh đâm xuyên đè lên nhau.
- **Tiến trình thực hiện (3 Giai đoạn):**
  - **Giai đoạn 1 (Dạng phẳng ban đầu - Tác nhân đan chéo):** Hệ thống cũ xếp mỗi đời dàn hàng ngang hoàn toàn độc lập. Khi ép khoảng cách, cha con mất liên kết vật lý khiến các đường nối rẽ nhánh đâm xuyên chéo qua các gia đình khác một cách loạn xạ.
  - **Giai đoạn 2 (Cây phân cấp `ul/li` - Chống đan chéo nhưng bị hở):** Đổi cấu trúc HTML sang lồng nhau để ép gốc cha luôn bám thẳng đứng trên đỉnh đầu nhóm con. Điều này triệt tiêu 100% tình trạng đan chéo và cho phép nét vẽ rẽ nhánh vuông góc (Trunk-Bus-Drop) mượt mà. **Tuy nhiên**, trình duyệt lại sinh ra các "bức tường vô hình" bao quanh nhà đông con, đẩy các ông chú/bà bác ra xa gây hở hang lãng phí diện tích bề ngang.
  - **Giai đoạn 3 (Thuật toán dồn toa không gian - Hoàn hảo):** Viết hàm Javascript (`compactTreeLayout`) "hậu xử lý" cấu trúc Flexbox nhằm phá vỡ bức tường không gian:
    - Thuật toán quét khoảng cách ngược từ dưới lên (Bottom-up), cho phép các ô nhánh vắng con trượt thẳng vào gầm trống của nhà hàng xóm để ép khoảng cách chiều ngang về mức cực hạn.
    - **[HOTFIX 1 - Khử nhiễu Zoom]:** Khoảng cách đo được trên màn hình bị ảo do hàm phóng to/thu nhỏ trang. Đã xử lý triệt để bằng cách chia ngược cho `currentScale` để quy đổi về tọa độ chuẩn CSS, dập tắt lỗi các ô bị dồn đè lên nhau như bộ bài.
    - **[HOTFIX 2 - Giữ cha nằm chính giữa con]:** Xóa sạch lệnh bù trừ `margin-right` vô dụng, cho phép độ rộng khung `<ul>` tự động co rút theo con cháu, kéo theo người cha dịch chuyển tịnh tiến. Đồng thời bổ sung tính năng nảy ngược (`margin-left` dương) nếu các nhánh bị ép lố đà, giúp cha luôn vững chãi ở trung tâm các con và sơ đồ đẹp hoàn hảo ở mọi góc độ.
- **Tệp thay đổi:**
  - `index.html` (Chuyển cấu trúc DOM sang `ul/li`, làm lại thuật toán vẽ SVG, bổ sung logic `compactTreeLayout` và CSS đi kèm)