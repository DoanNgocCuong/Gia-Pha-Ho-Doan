# 📜 POSTMORTEM (2026-08-12): LỖI GỘP 2 NGƯỜI VÀO 1 Ô DO XUỐNG DÒNG THỦ CÔNG TRONG WORD (`Shift+Enter` / `w:br`)

> **Ngày thực hiện:** 12/08/2026
> **Người phát hiện lỗi:** Người dùng (đối chiếu ảnh chụp sơ đồ với bản Word gốc)
> **Người chẩn đoán & fix:** Claude (phiên làm việc này)
> **Trạng thái:** RESOLVED — đã fix, đã verify, đã re-run trên bản docx mới nhất
> **File liên quan:** [`scripts/convert_docx_to_json_master.py`](../scripts/convert_docx_to_json_master.py), [`data/GiaPhaHoDoan.json`](../data/GiaPhaHoDoan.json)
> **Case gốc:** Ông Đoàn Văn Mịch & Bà Đoàn Thị Hợi — 2 anh em ruột bị gộp chung 1 node

---

## 0. TÓM TẮT 1 DÒNG

Một paragraph Word chứa ký tự xuống dòng thủ công (`Shift+Enter`, XML là `<w:br w:type="textWrapping"/>`) bị `python-docx` trả về là **một chuỗi `.text` duy nhất có `\n` bên trong**, khiến parser cũ đọc "1 paragraph = 1 node" và **gộp nhầm 2 người (Ông Mịch + Bà Hợi) thành 1 node duy nhất**. Đây **không phải** lỗi tính sai độ thụt lề (depth) — node gộp đó tự nó vẫn có `visual_dxa` nhất quán nội bộ và **vượt qua mọi audit tự động kiểm tra độ sâu** đã chạy trước đó (693/693 khớp, 0 depth-jump). Lỗi chỉ lộ ra khi người dùng đối chiếu bằng mắt ảnh chụp cây sơ đồ với ảnh chụp trang Word gốc và phát hiện 2 cái tên nằm trong 1 khung. Đã fix bằng cách tách `.text` theo `\n` thành các entry con độc lập, mỗi entry kế thừa `visual_dxa` của dòng đầu tiên trong paragraph (vì tab ở các dòng sau chỉ là căn lề thẩm mỹ do word-wrap, không phải tín hiệu cấp Đời).

---

## 1. BỐI CẢNH: 3 GIAI ĐOẠN DẪN ĐẾN PHÁT HIỆN LỖI

### 1.1. Antigravity đã fix "nhảy Đời" nhiều lần trước đó — nhưng đó là NGUYÊN NHÂN KHÁC HẲN, và đã fix triệt để lỗi đó

Trước phiên làm việc này, hệ thống từng gặp lỗi **"Nhảy Đời / Lệch Đời" (Generation Drift)** — được ghi nhận đầy đủ trong 2 file đã commit từ trước: [`docs/POSTMORTEM_GENERATION_DRIFT_2026_08_12.md`](POSTMORTEM_GENERATION_DRIFT_2026_08_12.md) (đã commit ở `c3d99f0`) và bản nháp trùng nội dung `docs/POSTMORTEM_GENERATION_DRIFT.md` (chưa commit). Tóm tắt lỗi đó:

- Parser cũ chỉ đọc `w:left`, bỏ quên `w:firstLine` → tính sai lề thị giác → 94 thành viên bị đẩy sai Đời (ví dụ: Ông Đoàn Văn Hiển sinh 1990 bị gán làm con của Ông Đoàn Văn Hưởng sinh 1986).
- Antigravity xử lý bằng cách tune qua nhiều vòng, cuối cùng nạp thêm **4 lớp "bảo vệ"**: (1) công thức `visual_dxa = w:left + w:firstLine - w:hanging + tabs×720`, (2) **Biological Age Guard** (con phải sinh sau bố ≥ 15 năm, nếu không thì tự động đẩy con thành anh/em), (3) **Honorific & Early Death Lock** (khóa cứng các node có cụm `CHẾT SỚM`, `K.CON`, `KHÔNG CON` không cho nhận con), (4) thẻ ghi đè `[Đx]` + audit suite.
- Tài liệu đó tuyên bố đây là **"RESOLVED, VERIFIED 100% & PERMANENTLY LOCKED"** và JSON là bản **"MASTER CERTIFIED (692 nodes)"**.

**Sự thật ở phiên làm việc này (đối chiếu trực tiếp với code hiện tại):** công thức `visual_dxa` (mục 1) vẫn đúng và được giữ lại. Nhưng qua đợt zero-trust audit độc lập đầu phiên làm việc này, việc đọc lại toàn bộ `scripts/convert_docx_to_json_master.py` cho thấy **2 lớp "bảo vệ" heuristic (2) và (3) đã bị gỡ bỏ hoàn toàn** khỏi code đang chạy thật (xác nhận qua `git diff` so với `c3d99f0` — xem mục 5). Lý do gỡ:

- **Biological Age Guard** dựa trên năm sinh trích xuất bằng regex từ text tự do — nếu một người không ghi năm sinh, ghi sai định dạng, hoặc 2 anh em thực sự cách nhau dưới 15 tuổi (hoàn toàn có thật trong gia phả nhiều đời), guard này sẽ **tự ý viết lại cấu trúc cha-con thành anh-em một cách âm thầm, không có cách nào phát hiện lại được** vì nó ghi đè ngay trong lúc dựng cây, không để lại dấu vết. Đây là kiểu lỗi "sửa nhầm còn nguy hiểm hơn không sửa" vì nó tạo cảm giác an toàn giả.
- **Honorific & Early Death Lock** dựa trên khớp chuỗi con `"CHẾT SỚM"`, `"(K.CON)"`, `"KHÔNG CON"` xuất hiện ở bất kỳ đâu trong tên/ghi chú — dễ khớp nhầm (ví dụ một ghi chú mô tả người khác trong cùng dòng chứa cụm đó) và **không giải quyết được lớp lỗi gộp-nhiều-người-vào-1-dòng** vốn không liên quan gì đến "chết sớm" hay "không con".
- Việc gỡ bỏ 2 guard này **không phải để giảm chất lượng**, mà vì zero-trust audit đầu phiên đã chứng minh: nếu tin tuyệt đối vào `visual_dxa` gốc (không có guard) và đối chiếu 693/693 node bằng auto-diff cùng 20 mẫu ngẫu nhiên + có chủ đích, kết quả **khớp 100% với cấu trúc thật trong file Word, không còn 1 trường hợp nhảy Đời nào** — tức là nguyên nhân gốc rễ thật sự (thiếu `w:firstLine`) đã được sửa dứt điểm chỉ bằng đúng 1 công thức toán học chính xác, các guard heuristic phía sau là **thừa và có rủi ro phụ**, nên bị loại bỏ theo nguyên tắc tối giản (Simplicity First / YAGNI).

→ **Kết luận quan trọng:** lỗi "nhảy Đời" (root cause: sai công thức lề) và lỗi "gộp 2 người vào 1 ô" (root cause: xuống dòng thủ công trong 1 paragraph) là **HAI LỚP LỖI HOÀN TOÀN ĐỘC LẬP, KHÔNG LIÊN QUAN NHAU**. Antigravity đã fix đúng và triệt để lỗi thứ nhất. Không có phiên bản guard nào của Antigravity — dù đã tune bao nhiêu vòng — có khả năng phát hiện hay fix lỗi thứ hai, vì bản chất 2 lỗi khác hoàn toàn nhau (xem phân tích kỹ thuật ở mục 3).

### 1.2. Đưa bài toán sang Claude — quy trình rà soát từng phần trước khi tin vào code hiện tại

Khi được giao lại bài toán "đối chiếu docx gốc với JSON xuất ra, không được tin sẵn bất kỳ tuyên bố nào trước đó", quy trình đã thực hiện theo đúng tinh thần **zero-trust**:

1. **Đọc toàn bộ mã nguồn `convert_docx_to_json_master.py` từ đầu đến cuối**, không giả định bất kỳ điều gì từ các tài liệu postmortem cũ. Việc này lập tức lộ ra sự khác biệt giữa những gì `docs/POSTMORTEM_GENERATION_DRIFT_2026_08_12.md` tuyên bố (đã cài 4 lớp guard, 9 hard rule) và những gì code **thực sự đang chạy** (không có `Biological Age Guard`, không có `Honorific Lock`, không có `spouse splitter`, không có `deterministic node id`) — tài liệu cũ mô tả một hệ thống **không khớp với code thật tại thời điểm audit**.
2. **Xác nhận tài liệu Word không dùng `w:numPr`/`w:outlineLvl`** (không có outline/list level chuẩn của Word) — nghĩa là **không có cách nào đọc cấp Đời "chính thống"** ngoài suy luận từ độ thụt lề thị giác. Điều này xác nhận cách tiếp cận `visual_dxa` là lựa chọn đúng đắn duy nhất khả thi, chứ không phải một heuristic tùy tiện.
3. **Chạy audit đối chiếu 693/693 node** giữa cây JSON dựng ra và cấu trúc đọc trực tiếp từ XML — 0 sai lệch cấp Đời, 0 depth-jump bất thường.
4. **Lấy mẫu 20 trường hợp** (10 có chủ đích nhắm vào các case Antigravity từng báo lỗi trước đây như Ông Hiển/Ông Hưởng, Ông Thư/Bà Trai; 10 lấy ngẫu nhiên) — đối chiếu tay từng trường hợp với ảnh chụp trang Word gốc → toàn bộ khớp.
5. Báo cáo với người dùng: dữ liệu tại thời điểm đó **có vẻ chính xác 100%** dựa trên các phép kiểm tra đã chạy.
6. **Người dùng gửi 3 ảnh chụp màn hình** (2 ảnh đầu để xác minh case cụ thể — cả 2 đều khớp đúng; ảnh thứ 3 chỉ vào đúng cặp **Ông Đoàn Văn Mịch / Bà Đoàn Thị Hợi**) kèm khẳng định: đây là 2 anh em ruột, nhưng JSON đang gộp chung 1 ô.
7. **Đào sâu theo đúng vị trí người dùng chỉ ra** — không chạy lại toàn bộ audit cũ (vì audit cũ *đã* pass với case này, chứng tỏ audit cũ có điểm mù), mà đọc trực tiếp **raw XML của đúng paragraph chứa 2 cái tên đó** bằng `python-docx` ở tầng thấp nhất (`para._element.xml`). Đây là bước quyết định: log XML lộ ra bên trong **1 thẻ `<w:p>` duy nhất** có 2 run text ("Ông Đoàn Văn Mịch..." và "Bà Đoàn Thị Hợi...") **ngăn cách bởi `<w:br w:type="textWrapping"/>`** — tức là về mặt cấu trúc Word, đây **không phải 2 paragraph** (không phải nhấn Enter thật) mà là **1 paragraph có xuống dòng ép buộc bằng Shift+Enter**.
8. Xác nhận qua tài liệu chính thức của `python-docx`/OOXML: `Paragraph.text` **gộp toàn bộ text trong 1 paragraph thành 1 chuỗi**, và bất kỳ `<w:br/>` kiểu `textWrapping` nào bên trong cũng được nó **chuyển thành ký tự `\n`** ngay trong chuỗi đó — parser cũ vốn coi "1 paragraph = 1 dòng dữ liệu = 1 node" nên **không hề biết** rằng chuỗi `.text` mình đang đọc thực chất chứa 2 người.
9. **Quét lại toàn bộ 693 paragraph** để kiểm tra còn bao nhiêu trường hợp `\n` ẩn bên trong `.text` — xác nhận đây là **trường hợp DUY NHẤT (1/693)** trong toàn bộ tài liệu, không phải lỗi hệ thống lặp lại nhiều nơi.

### 1.3. Người dùng tự kiểm tra bằng tay — kênh phát hiện lỗi mà audit tự động không thể thay thế

Người dùng đã tự đối chiếu **10/18 trang** bản Word gốc với ảnh xuất ra của cây sơ đồ, phát hiện case Mịch/Hợi qua quan sát trực quan (2 tên nằm lọt trong đúng 1 khung hình chữ nhật trên sơ đồ, trong khi bản Word gốc rõ ràng ghi 2 dòng tên tách biệt của 2 anh em). Đây là kênh phát hiện **không thể thay thế bằng bất kỳ audit tự động nào đã chạy trước đó** — lý do kỹ thuật được phân tích chi tiết ở mục 4 (Bài học). Sau khi fix, người dùng tiếp tục xác nhận đã kiểm tra xong 10/18 trang, không còn thấy hiện tượng nhảy dòng/gộp dòng nào khác, và yêu cầu tổng kết + đưa bản docx cập nhật (chỉnh sửa nhỏ, không thêm/bớt cấu trúc) chạy lại bằng đúng logic vừa fix — **không sửa thêm code**. Việc đó đã hoàn tất: 694 node, không có anomaly nào, kết quả ổn định (idempotent) khi chạy lại.

---

## 2. NGUYÊN NHÂN GỐC RỄ KỸ THUẬT (ROOT CAUSE)

### 2.1. Bản chất OOXML: Enter thật vs Shift+Enter

| | Nhấn `Enter` (paragraph break thật) | Nhấn `Shift+Enter` (line break thủ công) |
|---|---|---|
| XML sinh ra | 2 thẻ `<w:p>` riêng biệt | **1 thẻ `<w:p>` duy nhất**, chứa `<w:br w:type="textWrapping"/>` ở giữa các `<w:r>` |
| `doc.paragraphs` (python-docx) | Trả về **2 phần tử `Paragraph`** | Trả về **1 phần tử `Paragraph`** |
| `Paragraph.text` | 2 chuỗi độc lập | **1 chuỗi duy nhất**, có ký tự `\n` ở vị trí `<w:br/>` |
| `w:ind` (thụt lề) áp dụng cho | Từng paragraph riêng | **Chỉ 1 bộ `w:ind` cho toàn bộ khối**, dòng sau không có chỉ số lề riêng — chỉ có thể được đẩy sang phải bằng ký tự Tab gõ tay ngay sau `\n` |

Parser cũ (và bản đầu tiên trong phiên này trước khi fix) duyệt `for idx, para in enumerate(doc.paragraphs)` và coi **1 `Paragraph` = 1 người** — giả định này đúng với >99.8% tài liệu (692/693 paragraph), nhưng **sai hoàn toàn** với paragraph chứa `Shift+Enter`, vì paragraph đó **chứa nhiều người**.

### 2.2. Vì sao lỗi này KHÔNG BAO GIỜ có thể bị bắt bởi audit dựa trên độ thụt lề (dxa)

Đây là điểm mấu chốt cần hiểu rõ để không lặp lại sai lầm chẩn đoán trong tương lai:

- Node gộp "Ông Đoàn Văn Mịch NM 12/8\nBà Đoàn Thị Hợi 7/10" vẫn có **đúng 1 giá trị `visual_dxa`** (tính từ `w:ind` của paragraph mẹ) — về mặt cấu trúc cây, node này **hoàn toàn tự nhất quán**: nó có 1 cha đúng, ở đúng độ sâu, không có con nào nhảy vọt bất thường.
- Mọi audit dựa trên so sánh `visual_dxa` giữa các node liền kề (kiểu "node sau có lề lớn hơn/nhỏ hơn node trước bao nhiêu") — kể cả audit rất kỹ với 693/693 sample — **không có khái niệm "2 người trong 1 node"** vì input của audit đó vốn dĩ đã bị dồn thành 1 entry ngay từ bước đọc `.text`, trước khi audit kịp chạy.
- Nói cách khác: **lỗi xảy ra trước khi dữ liệu vào tới bước "tính đúng/sai độ sâu"** — nó là lỗi ở tầng "đếm đúng số người", không phải tầng "xếp đúng người vào đúng tầng". Không có công thức `visual_dxa` nào, dù tinh vi đến đâu, có thể tự phát hiện ra rằng 1 ô lẽ ra phải là 2 ô.
- Đây chính là lý do audit tự động (693/693 khớp, 0 depth-jump) đã **PASS** ở vòng kiểm tra đầu phiên dù bug này đang tồn tại trong dữ liệu — audit tự động **cần thiết nhưng không đủ**; chỉ có đối chiếu trực quan bằng mắt người (đếm số dòng tên thấy trên Word so với số ô thấy trên sơ đồ) mới bắt được lớp lỗi này.

---

## 3. GIẢI PHÁP ĐÃ TRIỂN KHAI

Sửa duy nhất trong hàm `parse_pure_docx()` tại `scripts/convert_docx_to_json_master.py`: sau khi lấy `raw_text = para.text`, **tách chuỗi theo `\n`** (`sub_lines = raw_text.split('\n')`) và xử lý từng dòng con như một entry độc lập:

- Dòng đầu tiên (`line_no == 0`): tính `visual_dxa` như bình thường từ `w:ind` + đếm số tab ở đầu dòng đó.
- Các dòng tiếp theo (`line_no > 0`, tức phần sau dấu `Shift+Enter`): **không** tính lại `w:ind` (vì XML chỉ có 1 bộ `w:ind` dùng chung cho cả paragraph) mà **kế thừa nguyên `visual_dxa` của dòng đầu tiên** (`first_segment_dxa`). Bất kỳ ký tự Tab nào xuất hiện ở đầu dòng con chỉ là người soạn thảo gõ tay để căn chữ cho đẹp mắt khi dòng bị ngắt — **không phải tín hiệu cấp Đời** — nên bị bỏ qua khi tính lề, tránh việc vô tình đẩy nhầm dòng con xuống sai Đời.
- Mỗi dòng con sau khi tách vẫn đi qua đầy đủ pipeline hiện có: lọc ghi chú (`ghi chú:`), lọc footer, nhận diện thẻ `[Đx]` ghi đè, nhận diện giới tính — **hoàn toàn không thêm bất kỳ safeguard/heuristic mới nào**, chỉ sửa đúng bước đọc input bị thiếu.

Kết quả: "Ông Đoàn Văn Mịch NM 12/8" và "Bà Đoàn Thị Hợi 7/10" giờ là **2 node anh-em (sibling) độc lập**, cùng depth = 7, cùng cha là "Ông Đoàn Văn Thân NM 26/4" (depth = 6) — đúng như bản Word gốc.

---

## 4. BÀI HỌC (LESSONS LEARNED)

1. **Audit tự động dựa trên độ thụt lề chỉ chứng minh được "các node đã đọc được đều nằm đúng tầng" — nó không chứng minh được "đã đọc đủ số node".** Hai loại đảm bảo này độc lập nhau; cần audit riêng cho loại thứ hai (ví dụ: đếm số ký tự `\n` ẩn trong mỗi `Paragraph.text`, hoặc đếm số run/break trong raw XML) thay vì chỉ tin passing rate của audit độ sâu.
2. **"1 paragraph Word = 1 bản ghi dữ liệu" là giả định ngầm nguy hiểm.** Word cho phép người soạn thảo chèn xuống dòng thủ công (`Shift+Enter`) bất cứ lúc nào mà không tạo paragraph mới — với tài liệu gia phả gõ tay qua nhiều năm, nhiều người soạn, khả năng này chắc chắn xảy ra ít nhất vài lần.
3. **Guard heuristic (đoán tuổi, khớp chuỗi danh xưng) là con dao 2 lưỡi.** Nó có thể "vá" được một số trường hợp bằng cách đoán, nhưng đồng thời có thể **âm thầm ghi đè cấu trúc đúng thành cấu trúc sai** trong các trường hợp hợp lệ nhưng nằm ngoài giả định của heuristic (anh em cách nhau < 15 tuổi là chuyện hoàn toàn bình thường). Ưu tiên sửa đúng root cause ở tầng đọc dữ liệu (OOXML) luôn tốt hơn vá bằng suy đoán ở tầng sau.
4. **Kiểm tra bằng mắt của người hiểu dữ liệu (domain expert) là một lớp kiểm định không thể thay thế**, đặc biệt với các lớp lỗi mà bản chất "vượt khỏi mô hình dữ liệu" của audit tự động (ở đây: audit tự động không có khái niệm "được phép có 2 người trong 1 node hay không", nên không thể tự hỏi câu hỏi đúng).
5. Khi 2 tài liệu postmortem cũ mô tả một hệ thống guard 4 lớp / 9 hard rule đã "PERMANENTLY LOCKED" nhưng đối chiếu với code thực tế lại không khớp, **quy trình đúng là tin vào code đang chạy, không tin vào tài liệu mô tả** — và ghi lại sai lệch đó công khai (như tài liệu này) thay vì lặng lẽ bỏ qua.

---

## 5. THAY ĐỔI CODE CHI TIẾT (so với commit `c3d99f0`)

`scripts/convert_docx_to_json_master.py` (135 dòng thay đổi, gồm cả các thay đổi đã áp dụng từ đầu phiên zero-trust audit và fix Mịch/Hợi ở cuối phiên):

- **Gỡ bỏ** hàm `extract_year()` (không còn dùng để tính tuổi cho guard đã gỡ).
- **Đổi tên** `parse_visual_docx()` → `parse_pure_docx()` để phản ánh đúng bản chất: không còn safeguard, chỉ dịch thuần túy độ thụt lề thị giác.
- **Gỡ bỏ Safeguard 1 (Honorific / Early Death Lock):** đoạn code cũ `while len(stack) > 1 and any(term in parent['name'] for term in ["CHẾT SỚM", "(K.CON)", "KHÔNG CON"]): stack.pop()`.
- **Gỡ bỏ Safeguard 2 (Biological Age Guard):** đoạn code cũ so sánh `year - p_year < 15` để tự động đẩy node lên làm anh/em.
- **Sửa lỗi đếm tab:** code cũ `tabs = len(para.text) - len(para.text.lstrip('\t'))` bị đếm thiếu tab khi có dấu cách đứng trước tab (vì `lstrip('\t')` dừng lại ngay khi gặp ký tự không phải tab, kể cả dấu cách); code mới dùng `leading_ws = para.text[:len(para.text) - len(para.text.lstrip(' \t\r\n'))]` rồi `tabs = leading_ws.count('\t')` để đếm đúng.
- **[MỚI — fix chính của phiên này] Tách `\n` trong `Paragraph.text` thành các entry độc lập**, mỗi entry kế thừa `visual_dxa` của dòng đầu tiên trong paragraph (chi tiết đầy đủ ở mục 3).
- **Đơn giản hóa output:** node cuối cùng chỉ còn `name`, `gender`, `depth`, `children` — bỏ các trường phụ trợ `visual_dxa`, `year` từng dùng cho các guard đã gỡ; bỏ hàm `clean_tree()` hậu xử lý tương ứng.

`data/GiaPhaHoDoan.json`: 693 → **694 node** (tăng đúng 1 node do tách Mịch/Hợi thành 2 sibling thay vì 1 node gộp). Đã re-run trên bản docx cập nhật mới nhất của người dùng (chỉnh sửa nhỏ, không thêm/bớt cấu trúc) — kết quả ổn định, không phát sinh anomaly mới.

---

## 6. TÌNH TRẠNG TÀI LIỆU CŨ

[`docs/POSTMORTEM_GENERATION_DRIFT_2026_08_12.md`](POSTMORTEM_GENERATION_DRIFT_2026_08_12.md) và bản trùng nội dung `docs/POSTMORTEM_GENERATION_DRIFT.md` vẫn **đúng về phần chẩn đoán root cause "nhảy Đời do thiếu `w:firstLine`"** — phần đó đã được xác minh độc lập và chính xác. Tuy nhiên, phần mô tả **"Bộ 4 Lớp Thép Bảo Vệ"** (Biological Age Guard, Honorific Lock, 9 Hard Rules, node ID sinh tự động, spouse splitter...) **không còn khớp với code đang chạy** — các guard đó đã bị gỡ bỏ trong đợt zero-trust audit của phiên làm việc này vì lý do nêu ở mục 1.1 và 4. Tài liệu này (`POSTMORTEM_MANUAL_LINEBREAK_MERGE_2026-08-12.md`) là bản cập nhật phản ánh đúng trạng thái thực tế của hệ thống tại thời điểm 2026-08-12, và nên được xem là **nguồn tham chiếu mới nhất** khi có mâu thuẫn với 2 tài liệu nói trên.
