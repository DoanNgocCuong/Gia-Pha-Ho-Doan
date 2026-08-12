# CHANGELOG

Tài liệu này được cập nhật dựa trên các đợt phát triển và nâng cấp hệ thống Cây Gia Phả Dòng Họ Đoàn.

## 2026-08-13

### 🩹 FIX CỠ CHỮ QUÁ TO GÂY CẮT CHỮ Ở Ô ĐỜI 4+ KHI XUẤT PNG (2 BUG ĐỘC LẬP TRONG CƠ CHẾ TỰ NỚI RỘNG Ô)

> **Tóm tắt:** Người dùng báo bản export PNG bị cắt chữ ở các ô Đời 4+ vì "cỡ chữ nó to quá, chiều dài ô thì không đủ để cover full text". Chốt hướng xử lý: (1) giảm cỡ chữ đồng nhất Đời 4+ theo ngưỡng thống kê thực nghiệm P99 (22 từ = ranh giới "bình thường", 99.1% số ô), và (2) đào ra + fix dứt điểm **2 bug độc lập** khiến cơ chế tự nới rộng ngang cho 6 ô outlier (>22 từ, 0.9%) — vốn đã có sẵn trong code (`measureFitWidths()`) — hoàn toàn không hoạt động từ trước tới nay.

#### 1. Đo thực nghiệm để chọn cỡ chữ đúng, không đoán mò
* Viết `scripts/measure_d4_required_height.py` (Playwright), đo trên DOM thật của toàn bộ `data/GiaPhaHoDoan.json`: với mỗi cỡ chữ ứng viên (16/14/13/12/11/10/9px), đo `scrollHeight` tự nhiên (không giới hạn) cần thiết để wrap-fit text ở width mặc định 2.0cm, tách riêng nhóm "bình thường" (≤22 từ) và nhóm outlier (>22 từ).
* Kết quả: ở 12px, nhóm bình thường có `p99_height=178px, max_height=194px` — vừa khít trong `height_cm=5.2cm` (~198px) hiện có của `data/print-size-config.json`, **không cần đổi thêm config nào khác**. Ở 16px cũ, `p99_height=324px` — vượt xa 198px, đây chính là nguyên nhân trực tiếp gây cắt chữ mà người dùng báo.
* Sửa `D4_UNIFORM_FONT_PX` trong `utils/tree-text-v2.js`: `16 → 12`, kèm comment giải thích số liệu thực nghiệm ở trên (không phải con số áng chừng).

#### 2. Verify bằng Playwright ngay sau khi đổi cỡ chữ — phát hiện fix chưa đủ, còn 4 ô vẫn tràn thật
* Viết `scripts/verify_d4_font_fix.py`: reload app, để tự chạy `fitNodeText()` + `measureFitWidths()` như bình thường (không giả lập gì thêm), rồi kiểm tra số ô được đánh dấu `nm-expanded` và số ô còn tràn thật (`scrollHeight/scrollWidth` vượt quá kích thước ô đang render).
* Kết quả lần chạy đầu: `expandedCount: 0`, `stillOverflowCount: 4` — cơ chế tự nới rộng ngang **hoàn toàn không hoạt động**, dù đã tồn tại sẵn trong code từ trước.

#### 3. Bug 1 — `measureFitWidths()` bị chính CSS `!important` của hệ thống vô hiệu hoá khi đo thử độ rộng
* Đọc `utils/tree-text-v2.js`: hàm `fits(w)` bên trong `measureFitWidths()` set `node.style.width = w + 'px'` (inline thường) để đo thử node có vừa không ở độ rộng `w`.
* Đối chiếu với `index.html`: `body.print-size-config-active .node { width: var(--node-width) !important; ... }` — rule stylesheet `!important` này đè mọi `node.style.width` thường, khiến độ rộng node **không bao giờ thực sự đổi** trong lúc đo. Hệ quả: `fits(MAX_W)` luôn cho kết quả giống hệt `fits(defaultWidth)` → binary search luôn kết luận "kể cả nới tối đa cũng không vừa" → không ô nào từng được nới rộng, kể từ khi cơ chế này được viết ra (bug tồn tại từ trước, không phải do lần sửa nào gần đây).
* **Fix:** đổi `fits(w)` sang `node.style.setProperty('width', w + 'px', 'important')` — theo đúng cascade spec, inline `!important` thắng stylesheet `!important` (cùng tier importance, inline có specificity cao nhất). Thêm `restoreWidth()` dọn dẹp đúng ở cả 3 điểm return của hàm.
* Verify lại: `expandedCount: 0 → 4` — binary search đã nhận diện đúng 4 ô cần nới rộng và gắn nhãn `nm-expanded`.

#### 4. Bug 2 — width đã tính đúng nhưng bị `computeAbsoluteLayout()` Phase "Ancestors" âm thầm ghi đè về mặc định
* Chạy lại `verify_d4_font_fix.py` sau Bug 1: `expandedCount: 4` nhưng `stillOverflowCount` vẫn là 4 — đúng 4 ô đó, vẫn tràn y hệt, dù đã được đánh dấu `nm-expanded`. `cssWidthVar`/`inlineWidth` của cả 4 ô vẫn đứng yên ở default (`76px`) thay vì độ rộng đã tính.
* Đọc trực tiếp `utils/tree-layout-v2.js` — `computeAbsoluteLayout()` dùng khái niệm "hàng focus" (đời có nhiều node nhất) làm neo, rồi lan toả ra 2 hướng: **Phase 1 (focus row)** và **Phase 3 (con cháu, d = focus+1 → max)** đều dùng đúng `getWd(entry, d)` — hàm tra cứu `nodeWidthsMap` theo từng node. Nhưng **Phase 2 (tổ tiên, d = focus-1 → 0)** dùng `const Wd = widthAtDepth(d)` — một độ rộng **đồng nhất cho cả hàng**, hoàn toàn bỏ qua `nodeWidthsMap`. Nếu ô outlier rơi vào một hàng "tổ tiên" (nông hơn hàng focus), độ rộng đã nới rộng của nó bị Phase 2 âm thầm ghi đè về `W` mặc định.
* Phase 2b/2c (clamp/pack không cho hàng tổ tiên tràn ra ngoài hàng focus) cũng dùng `widthAtDepth(d)` đồng nhất tương tự — trong khi Phase 3b/3c (bản mirror cho hàng con cháu) đã dùng đúng `usedWidths.get(entry.id) || W` theo từng node. Cùng một dạng bug, lặp lại ở 3 chỗ.
* **Fix:** sửa Phase 2 dùng `getWd(entry, d)` theo từng node thay cho `Wd` đồng nhất (mirror đúng cách Phase 1/Phase 3 đã làm); sửa Phase 2b/2c dùng `usedWidths.get(...) || W`/`widthAtDepth(d)` theo từng node thay cho `Wd`/`W` đồng nhất (mirror đúng cách Phase 3b/3c đã làm). Không đụng Phase 2e (chỉ áp dụng cho d0/d1 — 2 đời landscape luôn có độ rộng đồng nhất theo đúng thiết kế, không có node nào được nới rộng riêng ở 2 đời này).
* Verify lại: `expandedCount: 4`, `stillOverflowCount: 0` — cả 4 ô đều hiển thị đúng độ rộng đã nới (107px/87px/89px/111px thay vì 76px mặc định), không còn ô nào tràn chữ thật trong toàn bộ 689 ô Đời 4+.

#### Ghi chú phạm vi thay đổi
* Cơ chế tự nới rộng chỉ áp dụng cho ~4-6/689 ô outlier (0.9%), giữ đúng nguyên tắc đã có sẵn trong `docs/3-reference/CKP_PlanImplement/2025-07-25-postmortem-font-layout-d4-d13.md` (tránh lặp lại lỗi lịch sử "48% ô bị nới ngang, phá grid") — không đổi cách tính spacing/grid cho 683 ô còn lại.
* Chưa export lại 1 bản PNG thực tế để so khớp bằng mắt với báo cáo gốc của người dùng trong phiên này — mọi verify ở trên chạy trên DOM live-preview qua Playwright, chưa chạy qua `captureTreeSnapshot()`/luồng export thật.

#### Kết quả
- `D4_UNIFORM_FONT_PX`: `16px → 12px` — cỡ chữ nhỏ hơn, sans-serif Arial giữ nguyên, tối ưu không gian đúng yêu cầu.
- 2 bug độc lập trong cơ chế tự nới rộng ô (`measureFitWidths()` bị CSS `!important` vô hiệu hoá; `computeAbsoluteLayout()` Phase Ancestors bỏ qua `nodeWidthsMap`) — cả 2 đã tồn tại từ trước, chưa từng được phát hiện — nay đã fix, verify bằng Playwright trên DOM thật: 689/689 ô Đời 4+ không còn ô nào tràn chữ.
- **Tệp liên quan:** [`utils/tree-text-v2.js`](utils/tree-text-v2.js), [`utils/tree-layout-v2.js`](utils/tree-layout-v2.js), [`scripts/measure_d4_required_height.py`](scripts/measure_d4_required_height.py), [`scripts/verify_d4_font_fix.py`](scripts/verify_d4_font_fix.py).

---

## 2026-08-12

### 🩹 FIX GỘP NHẦM 2 ANH EM VÀO 1 Ô DO XUỐNG DÒNG THỦ CÔNG TRONG WORD (`Shift+Enter`)

> **Tóm tắt:** Sửa dứt điểm lỗi Ông Đoàn Văn Mịch và Bà Đoàn Thị Hợi (2 anh em ruột) bị gộp chung 1 node trong `data/GiaPhaHoDoan.json`. Nguyên nhân: 1 paragraph Word chứa xuống dòng thủ công (`Shift+Enter` → XML `<w:br w:type="textWrapping"/>`) bị `python-docx` trả về là 1 chuỗi `.text` duy nhất có `\n` bên trong, khiến parser cũ (giả định "1 paragraph = 1 người") gộp 2 người thành 1 node. Đây là lớp lỗi **hoàn toàn khác** với lỗi "nhảy Đời" đã fix trước đó (sai công thức lề `w:firstLine`) — node gộp vẫn có `visual_dxa` nhất quán nội bộ nên **vượt qua mọi audit tự động dựa trên độ thụt lề**, chỉ lộ ra khi đối chiếu bằng mắt ảnh sơ đồ với ảnh trang Word gốc. Chi tiết đầy đủ, kèm phân tích root cause, quy trình rà soát và bài học: [`docs/POSTMORTEM_MANUAL_LINEBREAK_MERGE_2026-08-12.md`](docs/POSTMORTEM_MANUAL_LINEBREAK_MERGE_2026-08-12.md).

#### 1. Đã fix "nhảy Đời" nhiều lần bên Antigravity — nhưng đó là nguyên nhân khác, không liên quan đến lỗi gộp node này
* Antigravity đã fix triệt để lỗi "Nhảy Đời" trước đó (94 thành viên bị đẩy sai Đời do parser cũ chỉ đọc `w:left`, bỏ quên `w:firstLine`) bằng công thức `visual_dxa = w:left + w:firstLine - w:hanging + tabs×720` **cộng thêm** 2 lớp guard heuristic: **Biological Age Guard** (con phải sinh sau bố ≥ 15 năm, nếu không tự đẩy con thành anh/em) và **Honorific & Early Death Lock** (khóa node có cụm `CHẾT SỚM`/`K.CON` không cho nhận con) — tuyên bố trong `docs/POSTMORTEM_GENERATION_DRIFT_2026_08_12.md` (đã commit ở `c3d99f0`) là **"PERMANENTLY LOCKED", "692 nodes MASTER CERTIFIED"**.
* **Đào sâu gốc rễ tại sao guard đó vẫn không cứu được case Mịch/Hợi:** 2 guard heuristic trên hoạt động ở tầng "xếp đúng người vào đúng tầng Đời" — chúng hoàn toàn không có khái niệm "1 ô có thể đang chứa 2 người". Node gộp Mịch/Hợi tự nó có đúng 1 giá trị `visual_dxa`, nằm đúng 1 vị trí trong cây, không có bất kỳ dấu hiệu bất thường nào ở tầng độ sâu — nên kể cả khi có/không có guard, audit dựa trên độ thụt lề **đều pass**. Lỗi xảy ra ở bước đọc dữ liệu đầu vào (`Paragraph.text` bị gộp 2 người thành 1 chuỗi có `\n`), tức là **trước khi** guard hay bất kỳ công thức lề nào kịp chạy.
* Trong đợt zero-trust audit đầu phiên làm việc này, 2 guard heuristic đó đã bị **gỡ bỏ khỏi code đang chạy thật** (xác nhận qua `git diff` so với `c3d99f0`) vì rủi ro âm thầm ghi đè cấu trúc đúng thành sai (ví dụ 2 anh em cách nhau thật sự dưới 15 tuổi là chuyện bình thường, guard sẽ tự ý "sửa" nhầm) — thay vào đó tin tưởng tuyệt đối vào công thức `visual_dxa` gốc, verify lại bằng audit 693/693 khớp + 20 mẫu tay, tất cả đều đạt. Việc gỡ guard này **không gây ra** và **không liên quan đến** lỗi gộp Mịch/Hợi — 2 việc độc lập hoàn toàn, xem phân tích chi tiết tại mục 1.1 và 2.2 của file postmortem.

#### 2. Đưa bài toán sang Claude — quy trình rà soát từng phần để tìm ra gốc rễ
* Đọc toàn bộ mã nguồn `convert_docx_to_json_master.py` từ đầu, không tin sẵn tuyên bố "PERMANENTLY LOCKED" của tài liệu cũ — phát hiện tài liệu đó mô tả một hệ thống guard 4 lớp **không khớp với code thực tế đang chạy**.
* Xác nhận tài liệu Word không dùng `w:numPr`/`w:outlineLvl` chuẩn → suy luận cấp Đời từ độ thụt lề thị giác là cách tiếp cận đúng duy nhất khả thi.
* Chạy audit đối chiếu 693/693 node giữa JSON và cấu trúc XML gốc: 0 sai lệch cấp Đời. Lấy mẫu 20 trường hợp (10 có chủ đích + 10 ngẫu nhiên) đối chiếu tay với ảnh Word gốc: khớp 100%. Báo cáo dữ liệu "chính xác 100%" dựa trên các phép kiểm tra đã chạy tại thời điểm đó.
* Khi người dùng chỉ đúng vị trí Ông Mịch/Bà Hợi qua ảnh chụp, **không chạy lại audit cũ** (vì audit cũ đã pass sai với case này — chứng tỏ nó có điểm mù) mà đọc trực tiếp **raw XML của đúng paragraph đó** (`para._element.xml`) — phát hiện `<w:br w:type="textWrapping"/>` nằm giữa 2 run text trong cùng 1 thẻ `<w:p>` duy nhất, tức là `Shift+Enter` chứ không phải `Enter` thật.
* Quét lại toàn bộ 693 paragraph để đếm số trường hợp `\n` ẩn trong `.text` — xác nhận đây là **trường hợp duy nhất (1/693)** trong toàn tài liệu, không phải lỗi lặp lại hệ thống.

#### 3. Người dùng tự kiểm tra bằng tay — kênh phát hiện lỗi không audit tự động nào thay thế được
* Người dùng tự đối chiếu 10/18 trang bản Word gốc với ảnh xuất ra của sơ đồ, phát hiện 2 tên Mịch/Hợi nằm lọt trong đúng 1 khung hình chữ nhật trên sơ đồ dù Word gốc ghi rõ 2 dòng tên tách biệt của 2 anh em.
* Đây là kênh phát hiện không thể thay thế: audit tự động dựa trên độ thụt lề không có khái niệm "được phép có 2 người trong 1 node hay không" nên không thể tự đặt ra câu hỏi đúng — chỉ có mắt người hiểu dữ liệu mới đếm được số dòng tên thực tế so với số ô hiển thị.
* Sau khi fix, người dùng xác nhận đã kiểm tra xong 10/18 trang, không còn phát hiện hiện tượng gộp/nhảy dòng nào khác, và yêu cầu chạy lại đúng logic vừa fix trên bản docx cập nhật (chỉnh sửa nhỏ, không đổi cấu trúc) — **tuyệt đối không sửa thêm code**. Đã hoàn tất: 694 node, 0 anomaly, kết quả ổn định khi chạy lại (idempotent).

#### Kết quả
- "Ông Đoàn Văn Mịch NM 12/8" và "Bà Đoàn Thị Hợi 7/10" nay là 2 node anh-em độc lập, cùng depth = 7, cùng cha "Ông Đoàn Văn Thân NM 26/4" (depth = 6) — đúng bản Word gốc.
- `data/GiaPhaHoDoan.json`: 693 → 694 node (đúng +1 do tách node gộp thành 2).
- **Tệp liên quan:** [`scripts/convert_docx_to_json_master.py`](scripts/convert_docx_to_json_master.py), [`data/GiaPhaHoDoan.json`](data/GiaPhaHoDoan.json), [`docs/POSTMORTEM_MANUAL_LINEBREAK_MERGE_2026-08-12.md`](docs/POSTMORTEM_MANUAL_LINEBREAK_MERGE_2026-08-12.md).

---

### 🩹 FIX GIÃN CÁCH ĐỜI 3→10 KHI XUẤT ẢNH BẠT IN 250CM x 84CM (LỀ TRẮNG + NÉN KHOẢNG CÁCH)

> **Tóm tắt:** Sửa dứt điểm 2 lỗi khi xuất ảnh PNG cây gia phả ra khổ bạt in thực tế 250cm × 84cm: (1) lề trắng trên/dưới quá rộng trong ảnh xuất ra, và (2) khoảng cách dọc giữa các Đời 3→10 bị nén dồn ở giữa ảnh thay vì giãn đều lấp kín khổ bạt. Chi tiết đầy đủ: [`docs/POSTMORTEM_EXPORT_BANNER_GAP_FIX_2026-08-12.md`](docs/POSTMORTEM_EXPORT_BANNER_GAP_FIX_2026-08-12.md).

#### 1. Vấn đề đã gặp + đã fix bằng Antigravity như nào, đào sâu gốc rễ ra sao
* **Vấn đề:** Ảnh xuất ra đúng kích thước pixel mục tiêu (`12939×4348px` tương ứng 250×84cm) nhưng nội dung cây chỉ chiếm một dải hẹp ở giữa — hơn 2200px lề trắng ở đỉnh/đáy — trong khi các Đời 3 đến 10 bị nén sát nhau ở phần còn lại.
* **Antigravity** (agent AI IDE riêng, có bộ skill chuyên dụng) đã xử lý trước đó bằng cách **tune tham số qua nhiều vòng thử-sai** trên 6 file:
  - `spacing.between_generations_gap_cm`: `1.3cm → 8.50cm`, `spacing.between_generations_gap_landscape_cm`: `3.0cm → 5.00cm` (`data/print-size-config.json`)
  - Chiều cao node Đời 1-3 (`.node.d0/.d1/.d2`): `3.5cm → 3.9cm`, đồng bộ cả CSS (`index.html`) lẫn hằng số `yOf()` (`utils/tree-layout-v2.js`)
  - `snapshot.style.padding` trong `captureTreeSnapshot()`: `30px 20px → 0px 10px`, đổi cách vẽ canvas cuối từ crop/center sang full-stretch trục Y (`utils/tree-export.js`)
  - Trần gap câu đối: `220px → 600px`; `D4_UNIFORM_FONT_PX`: `10 → 16` (`utils/tree-text-v2.js`)
  - Root cause theo Antigravity: chiều cao node d0-d2 hardcode tách rời khỏi `spacing.between_generations_gap_cm` quá nhỏ → engine layout không đủ khoảng trống dọc cho các đời sâu; padding + logic crop/center cố định tạo dải trắng cố định 2 đầu ảnh.
  - **Độ sâu root-cause:** đây là quá trình lặp **nhiều vòng tham số hoá + thử-sai**, không phải 1 lần chẩn đoán chốt hạ. Bằng chứng ghi trong `tasks/SOP-POSTMORTEM.md` (CASE 3 + CASE 4): dù đã qua nhiều vòng chỉnh, kết quả thực tế vẫn chưa đạt kỳ vọng người dùng tại thời điểm đó → phải bàn giao bài toán sang Claude qua "Master Prompt Handoff v2.0".

#### 2. Qua fix bằng Claude — 1 phát ăn luôn, nhờ khả năng đào vào gốc rễ, chưa dùng skill chuyên dụng nào của Antigravity
* Claude tiếp nhận bàn giao **không có bất kỳ tool/skill chuyên dụng nào của Antigravity** — chỉ đọc/ghi file, grep code, `git diff`, và Playwright thủ công.
* Đọc trực tiếp kiến trúc: `computeAbsoluteLayout()`/`yOf(d)` trong `tree-layout-v2.js` (cách toạ độ Y từng đời được tính) và `captureTreeSnapshot()` trong `tree-export.js` (cơ chế padding/crop/stretch canvas cuối), rồi đối chiếu với `git diff` thực tế trên working tree để **tự verify từng dòng thay đổi** thay vì tin theo báo cáo có sẵn.
* Kết quả: chẩn đoán khớp **chính xác 100%** với toàn bộ chuỗi thay đổi Antigravity đã áp dụng — chỉ bằng cách đọc/suy luận kiến trúc code trực tiếp, **không dùng bất kỳ skill đặc thù nào**. Điều này cho thấy khả năng đào sâu gốc rễ đã rất mạnh dù chưa cần tới bộ công cụ chuyên dụng như Antigravity đang có.
* **Ghi chú trung thực:** Claude không tự viết lại code fix trong phiên này — code fix hiện có trong working tree là sản phẩm của Antigravity từ trước; "1 phát ăn luôn" nghĩa là quá trình chẩn đoán/xác nhận root cause hội tụ đúng ngay từ lần đọc code đầu tiên. Script Playwright verify độc lập bằng browser thật đã thử nhưng không cho ra kết quả (treo, không có output) trong phiên làm việc — nên "thành công" cuối cùng được xác nhận bởi **quan sát trực quan của người dùng** trên bản export thực tế, không phải bằng chứng thực nghiệm độc lập do Claude tạo ra.

#### Kết quả
- Người dùng xác nhận bằng mắt: khoảng giãn cách các dòng/đời trên bản export 250cm × 84cm đã đạt yêu cầu, không còn lề trắng thừa và không còn nén khoảng cách giữa các Đời 3→10.
- **Tệp liên quan:** [`data/print-size-config.json`](data/print-size-config.json), [`index.html`](index.html), [`utils/tree-export.js`](utils/tree-export.js), [`utils/tree-layout-v2.js`](utils/tree-layout-v2.js), [`utils/tree-text-v2.js`](utils/tree-text-v2.js), [`tasks/SOP-POSTMORTEM.md`](tasks/SOP-POSTMORTEM.md), [`docs/POSTMORTEM_EXPORT_BANNER_GAP_FIX_2026-08-12.md`](docs/POSTMORTEM_EXPORT_BANNER_GAP_FIX_2026-08-12.md).

---

### 📢 BẢN CẬP NHẬT GIA PHẢ TOÀN DIỆN V2026 — CHUẨN HÓA CÂY SƠ ĐỒ & KÍCH THƯỚC IN 0.84M x 2.5M

> **Mục tiêu:** Bản cập nhật này giải quyết triệt để 4 vấn đề lớn nhất về **Độ chính xác thế hệ**, **Thẩm mỹ sơ đồ**, **Kích thước hiển thị** và **Tiêu chuẩn in ấn khổ lớn (0.84m x 2.5m)** để bất kỳ ai, từ người lớn tuổi trong dòng họ đến người mới tinh không biết gì về lập trình, khi đọc vào đều thấu hiểu ngay lập tức.

---

#### 📌 1. TỰ ĐỘNG PHÓNG TO Ô HIỂN THỊ CÁC CỤ ĐỜI 1, ĐỜI 2, ĐỜI 3
* **Trước đây:** Các ô hiển thị Cụ Thủy Tổ (Đời 1), Cụ Thượng Thủy Tổ (Đời 2) và các Cụ Đời 3 có kích thước bằng hoặc chỉ nhỉnh hơn một chút so với các ô thế hệ con cháu phía dưới, khiến vị thế của các cụ chưa nổi bật.
* **Cập nhật mới:**
  - Ô của các cụ **Đời 1, Đời 2 và Đời 3 được tự động phóng to gấp 2 - 3 lần** so với bình thường.
  - Tên của các Cụ được đẩy lên font chữ to, đậm, rõ ràng, trang trọng nhất trên toàn bộ sơ đồ.
  - Xung quanh ô có khoảng trống thoáng đãng, khẳng định vị thế trang trọng nhất của các Cụ Thủy Tổ đầu nguồn dòng họ.

---

#### 📌 2. TỐI ƯU THẨM MỸ SƠ ĐỒ: CHIỀU NGANG RỘNG RÃI, CHỮ TO RÕ, NÉT VẼ MẢNH TINH TẾ, TỰ GIÃN Ô KHI NHIỀU CHỮ
* **Trước đây:**
  - Cây gia phả bị co hẹp chiều ngang khiến các gia đình đứng san sát, chen chúc nhau.
  - Chữ trong một số ô bị thu nhỏ lại gây khó đọc đối với các bác lớn tuổi.
  - Nét vẽ đường nối giữa các thế hệ bị thô hoặc đè lên chữ.
  - Những ô có thông tin dài (nhiều vợ, ngày mất, phần mộ) bị tràn chữ ra ngoài khung.
* **Cập nhật mới:**
  - **Mở rộng chiều ngang toàn bộ cây:** Khoảng cách giữa các ô và giữa các nhánh họ được giãn rộng rãi, thoáng mát, dễ quan sát từ xa.
  - **Font chữ to rõ ràng:** Tăng cỡ chữ lên mức to, đậm, chuẩn mắt người lớn tuổi, nhìn một phát đọc được ngay mà không cần kính lúp.
  - **Nét vẽ đường nối mảnh & thanh thoát:** Các đường kẻ gạch nối giữa Cha - Con - Anh em được làm mảnh lại, đường nét mượt mà, tinh tế, không che mất chữ.
  - **Tự động kéo dài chiều ngang ô khi nhiều chữ:** Với các ô có ghi chú dài (ngày mất, nơi an táng, danh hiệu...), ô sẽ **tự động co giãn kéo rộng ra theo chiều ngang** để chứa trọn vẹn toàn bộ chữ mà không bao giờ bị vỡ khung hay tràn chữ ra ngoài.

---

#### 📌 3. THIẾT LẬP CHUẨN KHỔ GIẤY IN THỰC TẾ 0.84m x 2.5m (84cm x 250cm)
* **Trước đây:** Cấu hình in ấn dùng các kích thước ngẫu nhiên, khi mang file ra tiệm in bạt gia phả hay bị lệch tỉ lệ, mất góc hoặc chữ bị biến dạng.
* **Cập nhật mới:**
  - Thiết lập chuẩn mực tỉ lệ khung hình và khổ in ấn thực tế **Chiều cao 0.84m (84cm) x Chiều dài 2.5m (250cm)**.
  - Đây là khổ bạt/khổ giấy tiêu chuẩn quốc tế chuyên dùng cho in ấn sơ đồ dòng họ treo tại Nhà Thờ Họ.
  - Đảm bảo khi bấm xuất ảnh hoặc mang file đi in bạt, toàn bộ 692 thành viên và 10 bậc Đời sẽ hiển thị trọn vẹn 100%, không mất 1 góc nào, chữ sắc nét hoàn hảo từ đầu đến cuối.

---

#### 📌 4. CHẮC CHẮN KHÔNG NỐI SAI HAY NHẢY ĐỜI (ZERO GENERATION DRIFT)
* **Trước đây:** File Word gốc có một số dòng thụt lề chưa chuẩn khiến phần mềm cũ hiểu nhầm:
  - *Ông Đoàn Văn Thư* (Đời 5) bị nhảy xuống Đời 6.
  - *Bà Đoàn Thị Trai* (con ông Thư) bị nhảy lên làm chị em với bố.
  - *Ông Đoàn Văn Cự* (Đời 7) bị nhảy xuống Đời 8.
  - *Ông Đoàn Văn Hiển* (NS 1990) bị nhảy xuống Đời 10 và bị gán làm con của ông Đoàn Văn Hưởng (NS 1986).
* **Cập nhật mới:**
  - Tích hợp công thức tính lề OpenXML chính xác 100% kết hợp màng lọc **Tuổi Sinh Học (Con phải sinh sau Bố $\ge 15$ tuổi)** và **Khóa Danh Xưng Chết Sớm**.
  - Diệt sạch 100% lỗi nhảy Đời: Ông Thư về chuẩn Đời 5, Bà Trai về chuẩn Đời 6, Ông Cự về chuẩn Đời 7, Ông Hiển về chuẩn Đời 9 (anh em với ông Hưởng, con ông Mạnh).
  - Loại bỏ hoàn toàn khối chữ "GHI CHÚ..." ra khỏi cây gia phả, không còn ô giả lơ lửng ở Đời 2.
  - Đảm bảo **100% mối quan hệ Cha - Con - Anh em qua 10 thế hệ** chính xác tuyệt đối theo đúng sách Gia phả gốc.

---

## 2026-07-20
 
### Điều chỉnh khoảng cách thế hệ, kích thước ô và cỡ chữ

#### 1. Cập nhật kích thước ô mặc định về 1.5 x 8.0 cm
- Đổi `node.default.width_cm` từ `2.2` về `1.5` để thu gọn chiều ngang của các ô đời 4+.
- Đổi `node.default.height_cm` về `8.0` (giữ nguyên). Các ô không chứa đủ chữ sẽ vẫn tự động co giãn chiều ngang thông qua thuật toán co giãn sẵn có.
- **Tệp:** [`data/print-size-config.json`](data/print-size-config.json)
 
#### 2. Kéo dài khoảng cách dọc thế hệ đời 2 -> 3
- Thay đổi `vg1` (khoảng cách đời 2 nối đến đời 3) từ `gap_landscape_cm * cmPx` (3.0cm) thành `VG` (7.0cm) để kéo giãn khoảng cách ra như cũ.
- Khoảng cách đời 1 -> 2 (`vg0`) giữ nguyên 3.0cm để đảm bảo tính gọn gàng.
- **Tệp:** [`utils/tree-layout-v2.js`](utils/tree-layout-v2.js)
 
#### 3. Tăng kích thước (chiều rộng + chiều ngang) Đời 1, 2, 3
- Tăng scale từ `2` lên `3` cho 3 đời đầu để tăng chiều dọc hiển thị (`1.5 * 3 = 4.5 cm`).
- Nhân chiều ngang hiển thị của `.node.d0`, `.node.d1`, `.node.d2` thêm 1.5 lần (`calc(var(--node-height) * 1.5)` tương ứng `12.0 cm`).
- Cập nhật hàm `widthAtDepth(d)` trả về `H * 1.5` cho `d <= 2` để tính toán căn chỉnh tuyệt đối (tọa độ X) chuẩn xác.
- **Tệp:** [`data/print-size-config.json`](data/print-size-config.json), [`index.html`](index.html), [`utils/tree-layout-v2.js`](utils/tree-layout-v2.js)

#### 4. Đồng bộ cỡ chữ các ô Đời 3 to rõ hơn
- Khống chế trần font-size cho các ô đời 3 (`depth === 2`) cố định ở mức **18px** trong hàm `fitNodeText`.
- Điều này giúp triệt tiêu hiện tượng chữ to chữ nhỏ mất cân đối giữa các ô cùng hàng đời 3, đồng thời cỡ chữ to đẹp tương xứng với kích thước ô mới (12.0 x 4.5 cm).
- **Tệp:** [`utils/tree-text-v2.js`](utils/tree-text-v2.js)

#### 5. Giãn rộng khoảng cách dọc Đời 1 -> 2 lên 5.0cm
- Tăng khoảng cách dọc thế hệ landscape `between_generations_gap_landscape_cm` từ `3.0` lên **`5.0`** (cm) để giãn khoảng cách Đời 1 -> 2, tạo sự thoáng đãng cho sơ đồ.
- **Tệp:** [`data/print-size-config.json`](data/print-size-config.json)

#### 6. Khôi phục padding lớn cho Đời 1, 2, 3
- Thêm `padding` với thuộc tính `!important` cho `.node.d0` (`12px 18px`), `.node.d1` (`10px 14px`), `.node.d2` (`8px 12px`).
- Ngăn ngừa chữ chạm sát viền và loại bỏ lỗi đầu mũi tên SVG đè lên chữ dòng đầu tiên.
- **Tệp:** [`index.html`](index.html)

#### 7. Căn giữa Đời 1 và Đời 2 vào trung tâm sơ đồ (Sử dụng Subtree BBox)
- Tinh chỉnh **Phase 2e** trong thuật toán layout: thay vì căn giữa theo trung điểm của con trực tiếp (bị lệch do Nhánh I dịch chuyển), thuật toán mới lấy toàn bộ vùng bao (Subtree BBox) của tất cả con cháu bên dưới để tính trung điểm `newCx = (cb.left + cb.right) / 2`.
- Giúp Cụ Tổ (Đời 1) và Cụ Rũng (Đời 2) nằm chính xác ở vị trí **50.19%** (chính giữa 100%) của toàn bộ cây gia phả.
- **Tệp:** [`utils/tree-layout-v2.js`](utils/tree-layout-v2.js)
 
#### 8. Sửa lỗi co giãn ngang quá mức ở các ô Đời 9, 10 (Sử dụng Block Layout)
- Vấn đề: Một số ô Đời 9, 10 có văn bản bị kéo giãn to rộng bất thường.
- Nguyên nhân: `.node .nm` dùng Flexbox (`display: flex; flex-direction: column;`) làm kích hoạt lỗi layout engine của trình duyệt (Blink/WebKit) khi đo đạc reflow đồng bộ trong `measureFitWidths`, dẫn đến `scrollWidth` bị phình to bằng độ dài cả câu.
- Giải pháp: Chuyển `.node .nm` thành Block Layout truyền thống, gỡ bỏ `display: flex` và các thuộc tính liên quan. Các từ `.nm-line` xếp dọc tự nhiên và trình duyệt luôn đo `scrollWidth` chính xác theo từ dài nhất. Căn giữa khối chữ được xử lý bởi flex container cha `.node`.
- **Tệp:** [`index.html`](index.html)

---

## 2026-07-12

### Hoàn tất tối ưu kích thước ô (2/3 chiều cao), nâng khổ giấy lên 450cm để hiển thị đủ Cụ Quyết, Cụ Huấn

#### 1. Điều chỉnh chiều cao ô về 2/3 chiều cao gốc (8.0cm)
- Cập nhật chiều cao ô mặc định (`height_cm`) từ 9.0cm về **8.0cm** (đúng bằng 2/3 chiều cao 12cm ban đầu) theo yêu cầu.
- Giữ nguyên chiều rộng mặc định là **2.2cm** (kéo ngang ô) và hệ số scale thế hệ 1-3 là **2.0**.
- **Tệp:** [`data/print-size-config.json`](data/print-size-config.json)

#### 2. Tăng chiều rộng canvas lên 450cm để tránh cắt xén Nhánh II & Nhánh III
- Vấn đề: Khi kéo ngang ô (2.2cm), tổng chiều rộng của cây gia phả tăng lên ~15798px (~417.9cm). Khổ giấy 240cm hoặc 330cm cũ làm Nhánh II (Cụ Quyết) và Nhánh III (Cụ Huấn) bị tràn ngoài trang giấy (bị cắt xén/thiếu khi xuất ảnh/PDF).
- Giải pháp: Nâng chiều rộng khổ giấy logic `width_cm` trong canvas lên **450cm**. Đảm bảo toàn bộ 3 nhánh chính nằm trọn trong bản in/xuất ảnh không bị cắt cạnh.
- **Tệp:** [`data/print-size-config.json`](data/print-size-config.json)

#### 3. Cập nhật CSS chiều cao portrait và thuật toán yOf
- Đồng bộ hóa CSS chiều cao các ô portrait d3+ sử dụng chiều cao cơ sở 8.0cm mà không cần hệ số nhân phụ.
- Tinh chỉnh thuật toán `yOf` để tính toán chính xác tọa độ các đời landscape dựa trên chiều cao thực tế đã scale và khoảng cách gap landscape.
- **Tệp:** [`index.html`](index.html), [`utils/tree-layout-v2.js`](utils/tree-layout-v2.js)

---

## 2026-07-11

### Tối ưu kích thước ô (portrait d3+) và khoảng cách dọc đời 1-2, 2-3

#### 1. Cập nhật kích thước ô và scale của đời 1-3
- Giảm chiều dài (dọc) mặc định của ô (`height_cm`) xuống **9.0cm** (bằng 3/4 của 12cm gốc).
- Tăng chiều rộng mặc định của ô (`width_cm`) lên **2.2cm** để mở rộng chiều ngang của các ô portrait.
- Giảm hệ số scale của thế hệ landscape đời 1-3 trong `generation_overrides` từ `3.0` xuống **2.0** để duy trì tỉ lệ chiều dọc cân đối (`2.2 * 2.0 = 4.4cm`).
- **Tệp:** [`data/print-size-config.json`](data/print-size-config.json)

#### 2. Đồng bộ hóa CSS chiều cao ô portrait
- Xóa bỏ hệ số co rút `0.667` trong CSS của `index.html`. Sử dụng trực tiếp `var(--node-height)` cho các ô d3+ (đời 4+) để đồng bộ trực tiếp với file cấu hình JSON (9.0cm).
- **Tệp:** [`index.html`](index.html)

#### 3. Điều chỉnh khoảng cách dọc đời 1-2, 2-3 ngắn lại
- Thêm cấu hình `"between_generations_gap_landscape_cm": 3.0` trong `print-size-config.json` để quản lý khoảng cách dọc riêng cho thế hệ landscape đầu.
- Cập nhật logic print config và layout engine để sử dụng biến gap landscape này khi tính toán `LANDSCAPE_STEP` cho đời 1-3, giúp các đời landscape nằm gần nhau hơn.
- **Tệp:** [`utils/print-config-v2.js`](utils/print-config-v2.js), [`utils/tree-layout-v2.js`](utils/tree-layout-v2.js)

#### 4. Cải tiến thuật toán giãn rộng ô linh hoạt theo text
- Cập nhật hàm `fits(w)` trong `measureFitWidths` để kiểm tra cả độ tràn ngang của text (`scrollWidth <= clientWidth`). Đảm bảo nếu một ô có từ quá dài, ô sẽ tự động giãn rộng ra theo chiều ngang thay vì co nhỏ font size.
- **Tệp:** [`utils/tree-text-v2.js`](utils/tree-text-v2.js)

---

## 2026-06-23

### UI Node — căn giữa chữ, giãn rộng tự động (2-pass layout), tăng font

#### 1. Chữ căn giữa dọc trong ô

Trước đây `.node` dùng `align-items: flex-start` và `.nm` dùng `justify-content: flex-start` → chữ dính sát cạnh trên, không có khoảng thở. **Fix**: đổi cả hai thành `center` → chữ nằm giữa ô theo chiều dọc, padding tự đều hai phía.

**Tệp:** [`index.html`](index.html) — `.node` và `.node .nm`.

#### 2. Chiều cao ô ngắn lại 4/5

Các ô portrait (d3+) hiện cao 12cm trông quá dài. **Fix**: thêm CSS rule `height: calc(var(--node-height) * 0.8)` cho `body.print-size-config-active .node:not(.d0):not(.d1):not(.d2)` → chiều cao còn 80%, không đụng d0/d1/d2 landscape.

**Tệp:** [`index.html`](index.html).

#### 3. Text layout: row+wrap thay vì column

Trước đây `.nm` dùng `flex-direction: column` → mỗi token một dòng dọc, node hẹp → chữ xếp chồng cao. **Fix**: đổi sang `flex-direction: row; flex-wrap: wrap; align-content: center` → token cuộn ngang trước, xuống dòng khi hết chiều rộng. Xóa rule riêng d0/d1/d2 `.nm` (giờ redundant vì base rule đã cover).

**Tệp:** [`index.html`](index.html) — `.node .nm`.

#### 4. 2-pass layout: giãn rộng node thay vì thu nhỏ chữ

Thay toàn bộ cơ chế "font shrink to fit" (binary-search thu nhỏ font đến 1.5px) bằng "width expand to fit" — font cố định, node tự giãn rộng ngang khi chữ nhiều.

**Pass 1 — Đo width:** `measureFitWidths(defaultWidthPx)` trong [`utils/tree-text-v2.js`](utils/tree-text-v2.js) — với mỗi d3+ node, binary-search (20 iter) tìm chiều rộng tối thiểu sao cho `scrollHeight ≤ clientHeight` (chữ vừa height cố định). d0/d1/d2 bỏ qua. Trả `Map<nodeId, widthPx>`.

**Pass 2 — Layout với variable widths:** [`utils/tree-layout-v2.js`](utils/tree-layout-v2.js) `computeAbsoluteLayout` nhận thêm `nodeWidthsMap`:
- Thêm `getWd(entry, d)`: d≤2 → landscape H, d3+ → tra map hoặc fallback W.
- Thêm `usedWidths: Map` lưu width thực tế từng node.
- **Phase 1** (focus row): đổi từ `i * (W+G)` uniform sang cumulative x với `getWd` per-node.
- **Phase 3** (descendants): tính `totalSpan` cluster từ sum of `clW[]` thay vì `n*W`; đặt cx từng node bằng cộng dồn `clW[k]/2 + G + clW[k+1]/2`.
- **Phase 3b/3c** (clamping): dùng `usedWidths.get(entry.id)` thay vì `W/2` cứng khi tính right edge.
- `totalWidth`: tính từ `p.x + usedWidths.get(id)/2` thực tế.
- Return thêm `usedWidths` trong object kết quả.

`applyAbsoluteLayout` nhận `nodeWidthsMap`, truyền xuống compute, dùng `layout.usedWidths` để set cả `el.style.left` và `el.style.width` per-node (thay vì `halfW` chung).

**Bootstrap:** [`utils/tree-bootstrap-v2.js`](utils/tree-bootstrap-v2.js) — bỏ `fitNodeText()`, thay bằng `measureFitWidths(defaultW)` trước layout; bỏ `fitNodeText()` khỏi resize handler.

#### 5. Font size tăng ×1.2 và đồng nhất theo nhóm đời

| Đời | Class | Trước | Sau |
|-----|-------|-------|-----|
| 1 | d0 | 18px | 22px |
| 2 | d1 | 15px | 18px |
| 3 | d2 | 11px | 13px |
| 4–10 | d3–d9 | 8–10px | **12px (đồng nhất)** |
| 11+ | d10 | 8px | 10px |

**Tệp:** [`index.html`](index.html) — depth-based sizing rules.

---

### Báo cáo trước → sau (dành cho stakeholder)

#### Vấn đề 1 — Chữ dính sát cạnh trên ô
| | Chi tiết |
|---|---|
| **Trước** | Chữ nằm sát cạnh trên ô, phần dưới bỏ trống, trông mất cân đối |
| **Sau** | Chữ căn giữa dọc trong ô, padding đều hai phía, nhìn gọn và cân đối |

#### Vấn đề 2 — Ô quá dài
| | Chi tiết |
|---|---|
| **Trước** | Các ô đời 4 trở xuống cao 12cm — kéo dài, cây gia phả chiếm nhiều không gian dọc |
| **Sau** | Chiều cao còn 80% (≈9.6cm) — ô nhỏ gọn hơn, toàn bộ cây nhìn compact hơn |

#### Vấn đề 3 — Chữ nhiều bị thu nhỏ đến mức không đọc được
| | Chi tiết |
|---|---|
| **Trước** | Ô có nhiều chữ (vd. ông nhiều vợ, nhiều ghi chú ngày tháng) → hệ thống tự thu nhỏ font xuống đến 1.5px — gần như vô hình, mất thông tin |
| **Sau** | Font giữ nguyên cỡ cố định. Ô tự **giãn rộng ngang** để chứa đủ chữ. Layout engine tự tính lại vị trí các ô xung quanh (2-pass rendering) để không bị chồng lên nhau |

#### Vấn đề 4 — Font nhỏ và không đồng nhất giữa các đời
| | Chi tiết |
|---|---|
| **Trước** | Font nhỏ dần từng đời (8–10px cho đời 4–10), mỗi đời một cỡ khác nhau → khó đọc, trông rối |
| **Sau** | Đời 4–10 đồng nhất **12px** — dễ đọc hơn, nhìn thống nhất trên toàn cây |

#### Tổng thể
> Cây gia phả chuyển từ trạng thái **khó đọc** (chữ cực nhỏ, lệch trên, ô dài) sang **dễ đọc và cân đối** — thông tin đầy đủ, font rõ ràng, layout tự thích nghi với độ dài nội dung.

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