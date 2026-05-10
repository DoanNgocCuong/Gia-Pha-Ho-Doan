# CHANGELOG

Tài liệu này được cập nhật dựa trên **10 commit gần nhất** của repository.

## 2026-05-10

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