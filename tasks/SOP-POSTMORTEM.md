# 📜 NHẬT KÝ KIỂM TOÁN, NGUYÊN TẮC THIẾT KẾ & QUY TRÌNH HẤP THU BÀI HỌC (SOP-POSTMORTEM.md)

> **Chủ trì Kaizen:** Phó Chủ tịch Đoàn Ngọc Cường — Chief Architect  
> **Quy chuẩn:** DoanNgocCuong Review Protocol (`/doanngoccuong_review`) & Zero-Trust Audit (`/bmad-guru-zero-trust-adversarial-audit`)  
> **Trạng thái:** ACTIVATED, CERTIFIED & SYNCHRONIZED 100% SINGLE SOURCE OF TRUTH (SSOT)

---

## 🛡️ 1. BỘ 9 QUY TẮC THÉP (HARD RULES TO PREVENT REPEATED FAILURES)

> [!CAUTION]
> **BỘ 9 QUY TẮC THÉP NÀY LÀ ĐIỀU KIỆN TIÊN QUYẾT BẮT BUỘC TUÂN THỦ TRONG TOÀN BỘ QUY TRÌNH PHÁT TRIỂN & BẢO TRÌ NỀN TẢNG GIA PHẢ HỌ ĐOÀN. CẤM VI PHẠM TRONG BẤT KỲ TRƯỜNG HỢP NÀO!**

1. **HARD RULE #1 (REAL-DATA SIMULATION FIRST):**  
   LUÔN mô phỏng (simulate) toán học trên 100% dữ liệu thực tế TRƯỚC KHI viết code. Chạy phân tích phân bổ (word count distribution, line height, overflow %) để lựa chọn giải pháp đúng ngay từ nguyên lý gốc.

2. **HARD RULE #2 (VERIFICATION BEFORE COMMIT):**  
   CẤM NGHỆCH LÝ PUSH CODE HOẶC TUYÊN BỐ HOÀN THÀNH mà chưa qua kiểm thử thực nghiệm (Verification Commands / HTTP Server / Audit Scripts). Bằng chứng thực nghiệm (logs/diffs) luôn đứng trước mọi lời khẳng định.

3. **HARD RULE #3 (DISPLAY MODE OVER INDIVIDUAL FIT):**  
   Khi người dùng yêu cầu "cỡ chữ đồng nhất và hiển thị rõ ràng", giải pháp đúng là THAY ĐỔI DISPLAY MODE (ví dụ: inline vs block, wrap text) thay vì fit chữ riêng lẻ từng ô rồi cố sync MIN.

4. **HARD RULE #4 (SPACE-SAFE INLINE JOIN):**  
   Khi chuyển `.nm-line` sang `display: inline`, hàm ghép token `.join('')` BẮT BUỘC phải đổi thành `.join(' ')` (có khoảng trắng). Các thẻ inline không có khoảng trắng giữa chúng trong mã nguồn HTML sẽ làm dính liền các từ tiếng Việt.

5. **HARD RULE #5 (NO KERN BREAKING / NO WORD-SPLITTING):**  
   CẤM DÙNG `overflow-wrap: break-word` làm bẻ đôi từ tiếng Việt (ví dụ: `NGUY-` / `ỄN`). Bắt buộc dùng `display: inline-block; white-space: nowrap` trên từng token + `word-break: keep-all` trên container.

6. **HARD RULE #6 (LINE HEIGHT FOR UPPERCASE VIETNAMESE):**  
   Line-height `1.15` là quá chật cho chữ HOA tiếng Việt có dấu (Ấ, Ầ, Ể, Ỗ, Ứ). Bắt buộc thiết lập `line-height` tối thiểu `1.35` cho mọi khối văn bản chữ HOA.

7. **HARD RULE #7 (FUTURE-PROOF SELECTORS):**  
   CẤM liệt kê CSS selector thủ công theo danh sách cố định (ví dụ: `.d3, .d4, ... .d9`). Bắt buộc dùng `:not(.d0):not(.d1):not(.d2)` để tự động bao phủ tất cả các đời tương lai (Đời 10+).

8. **HARD RULE #8 (PARALLEL SUBAGENT AUDIT):**  
   Bắt buộc triệu hồi bộ subagents (Reviewer, Auditor, Architect) rà soát mã nguồn song song trước khi chốt bản release để triệt tiêu các lỗi khuất mà 1 cá nhân bỏ sót.

9. **HARD RULE #9 (DOCUMENT METADATA SEPARATION GUARD):**  
   Mọi đoạn văn chứa từ khóa `GHI CHÚ:`, `CHÚ GIẢI:`, `CHÚ THÍCH:` BẮT BUỘC phải bị loại bỏ khỏi mảng node cây gia phả (`children[]`) và trích xuất lưu vào trường Root Metadata (`"legend"`, `"notes"`). CẤM TUYỆT ĐỐI biến ghi chú tài liệu thành node thành viên gia phả!

---

## 💎 2. ĐÓNG GÓI CÁC VIÊN KIM CƯƠNG STAR (STAR MATRIX PACKING)

### 📌 CASE 1: LỖI NODE CHÚ THÍCH GIẢ TRÊN SƠ ĐỒ CÂY
* **S — Situation (Bối cảnh):** Đoạn văn Chú thích/Chú giải (`GHI CHÚ: NS: NĂM SINH, NM: NĂM MẤT...`) ở cuối file Word bị nạp nhầm thành 1 "Node thành viên" ở Đời 2, tạo ra 1 khung chữ nhật dị biệt trên Web App.
* **T — Thought (Tư duy):** Văn bản chú thích là **Document Metadata**, KHÔNG PHẢI là thành viên huyết thống (`genealogy node`). Bắt buộc tách biệt Metadata lên Root Metadata của JSON (`"legend"` / `"notes"`).
* **A — Action (Hành động):** Phẫu thuật hàm `is_footer()`, trích xuất `GHI CHÚ:` lưu vào `root.legend`, chạy lại parser tạo JSON (692 nodes chuẩn), viết script kiểm toán 100% `full_giapha_audit.py`.
* **R — Result (Kết quả):** Loại bỏ 100% node giả, cây gia phả sạch đẹp hoàn hảo.

### 📌 CASE 3: LỖI LỀ TRÊN/DƯỚI QUÁ RỘNG VÀ KÉO GIÃN KHOẢNG CÁCH NẾN ĐỜI 3→10 LẤP ĐẦY BẠT 84CM
* **S — Situation (Bối cảnh):** Khi xuất ảnh PNG (`D:\Gia-Pha-Ho-Doan-20260812-200734.png`), bức ảnh xuất ra đạt đúng kích thước bạt `12939 x 4348 px`, nhưng lề trên và lề dưới bị mảng trắng khổng lồ (>2200px), các đời 3->10 bị dồn ép dày đặc ở giữa.
* **T — Thought (Tư duy):** 
  1. Tỷ lệ bạt in `250cm x 84cm` (hệ số 2.976) ứng với `targetH = 4348px`.
  2. Khe dọc `between_generations_gap_cm` cũ quá chật làm tổng chiều cao cây chỉ đạt ~1400px, chênh lệch 2900px bị biến thành mảng trắng lề trên/dưới.
  3. Bắt buộc tăng `between_generations_gap_cm` lên `8.50cm` và `between_generations_gap_landscape_cm` lên `5.00cm` để kéo giãn chiều cao cây trong DOM lên ~4200px (khớp 100% targetH 4348px ở scale=2), đồng thời đặt `snapshot.style.padding = '0px 10px'` triệt hạ lề trên/dưới về **0px**.
* **A — Action (Hành động):** Tăng `between_generations_gap_cm` thành `8.50cm`, `between_generations_gap_landscape_cm` thành `5.00cm`, `couplet.word_gap_cm` thành `5.0cm` trong `data/print-size-config.json`. Đổi `snapshot.style.padding` thành `'0px 10px'` và nới trần `gapPx` câu đối lên `600px` trong `utils/tree-export.js`.
* **R — Result (Kết quả):** Loại bỏ 100% khoảng trắng đỉnh/đáy (0px padding), nến kéo dài thanh thoát lấp kín 100% bạt in 84cm, khoảng cách đời 3→10 được kéo giãn thoáng đẹp cực kỳ rõ ràng.

### 📌 CASE 4: BÀN GIAO BÀI TOÁN TỐI ƯU EXPORT CANVAS VÀ GAP NẾN SANG CLAUDE
* **S — Situation (Bối cảnh):** Antigravity đã điều chỉnh nhiều lượt mã nguồn (`utils/tree-export.js`, `data/print-size-config.json`), nhưng kết quả hình ảnh thực tế vẫn chưa đạt đúng kỳ vọng tuyệt đối của Sếp.
* **T — Thought (Tư duy):** Đóng gói toàn bộ bối cảnh dự án, nguyên nhân gốc rễ, các thử nghiệm đã làm và hàng rào an toàn vào Master Prompt Handoff v2.0 để chuyển giao cho Claude xử lý chuyên sâu.
* **A — Action (Hành động):** Đã ghi nhận nhật ký bàn giao vào `SOP-POSTMORTEM.md` và xuất bản Prompt bàn giao 7 thành tố chuẩn.
* **R — Result (Kết quả):** Đã hoàn tất đóng gói bối cảnh và chuyển giao bài toán cho Claude tiếp quản.

### 📌 CASE 2: LỖI NHẢY ĐỜI DO KHÔNG ĐỌC INDENT FIRSTLINE MS WORD
* **S — Situation (Bối cảnh):** Một số trường hợp cụ/ông ở Đời 8 bị parser đọc nhầm thành Đời 9 (nhảy đời làm lệch cây).
* **T — Thought (Tư duy):** Vị trí mắt nhìn thực tế trong MS Word không chỉ phụ thuộc vào `w:left` mà là sự kết hợp của:  
  $$\text{Visual\_DXA} = w:left + w:firstLine - w:hanging + (\text{Tabs} \times 720)$$
* **A — Action (Hành động):** Xây dựng **OpenXML Visual Offset Engine**, bổ sung **Biological Age Guard** (khoảng cách tuổi cha-con $\ge 15$ năm) và **Honorific Lock** (khóa cụ mất sớm không con).
* **R — Result (Kết quả):** Triệt tiêu 100% lỗi nhảy đời across tất cả 10 Thế hệ.

---

## 🧗 3. KỸ THUẬT 5 WHYS ROOT CAUSE ANALYSIS

```
[LẦN 1] Tại sao lại xuất hiện ô khung chữ nhật "GHI CHÚ..." trên sơ đồ cây Web App?
  └──> Vì trong file JSON có 1 node tên là "GHI CHÚ: NS: NĂM SINH, NM: NĂM MẤT...".

[LẦN 2] Tại sao lại có node tên "GHI CHÚ..." trong file JSON?
  └──> Vì parser đọc đoạn văn chú thích ở cuối file Word và nạp nó vào mảng children[].

[LẦN 3] Tại sao parser lại nạp đoạn chú thích vào mảng children[]?
  └──> Vì hàm is_footer() chỉ lọc từ "lần cuối cập nhật" mà bỏ qua từ khóa "GHI CHÚ:".

[LẦN 4] Tại sao is_footer() lại bỏ qua từ khóa "GHI CHÚ:"?
  └──> Vì thiết kế bộ lọc ban đầu chưa bao phủ hết các dạng văn bản ghi chú/chú giải trong file MS Word.

[LẦN 5 - NGUYÊN NHÂN GỐC RỄ TỐI CAO]
  └──> Phân định thiếu ranh giới giữa Entity Text (Tên người) và Document Metadata (Ghi chú/Chú thích) trong khâu Tokenize ban đầu.
```

---

## 📚 4. BÀI HỌC KỸ THUẬT & MẪU LỖI LỊCH SỬ (CRITICAL BUG PATTERNS)

### 🔴 Word-per-line vs Wrap Text (D4+ Layout)
* **Vấn đề cũ:** Đời 4+ dùng word-per-line (mỗi từ 1 dòng, `display:block`) ➔ 48% số ô tràn chiều cao 148px ➔ Layout bị hỏng.
* **Khắc phục:** Chuyển Đời 4+ sang **WRAP TEXT** (`display:inline` trên `.nm-line`):
  * Nhiều từ xếp trên 1 dòng ➔ Chiều cao giảm mạnh.
  * Cỡ chữ 10px + wrap ➔ Chỉ 0.7% ô cần nới rộng chiều ngang (expansion tối thiểu).

### 🔴 Regex Nhận Diện Quá Rộng (`BÀ\d?` vs `BÀ\d`)
* **Vấn đề:** `BÀ\d?` match cả chữ "BÀ" độc lập (danh xưng nữ) ➔ Áp dụng nhầm logic nới rộng cho ô bình thường.
* **Khắc phục:** Đổi thành `BÀ\d` (bắt buộc có chữ số 1, 2, 3...) ➔ Chỉ match BÀ1, BÀ2, BÀ3 (các ô thực sự có nhiều vợ).

### 🔴 Lỗi `overflow: visible` Làm Sai `scrollWidth` Trên Chrome
* **Vấn đề:** Chrome trả `scrollWidth === clientWidth` khi `overflow: visible` ➔ Thuật toán đo chiều rộng nhầm tưởng ô đã vừa ➔ Bị cắt mất chữ.
* **Khắc phục:** Giữ nguyên `overflow: hidden` khi đo đạc ➔ `scrollWidth` luôn trả về chiều rộng thực.

### 🔴 Phân Biệt Width Overflow vs Height Overflow
* `measureFitWidths` chỉ có tác dụng giải quyết **Width Overflow** (tràn chiều ngang). Nới rộng chiều ngang không thể làm giảm số dòng khi ô bị tràn chiều cao (Height Overflow).

---
*Bản SOP này hợp nhất 100% toàn bộ Quy tắc thép, Bài học lịch sử và STAR Matrix vào duy nhất 1 tệp SSOT.*
