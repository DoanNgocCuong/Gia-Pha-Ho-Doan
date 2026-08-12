# Lessons Learned & Technical Patterns

## 5-Council Review: 4 Critical CSS/JS Bugs (2026-07-25 CRITICAL)

- **BÀI HỌC #4**: Khi chuyển `.nm-line` sang `display:inline`, `.join('')` PHẢI đổi thành `.join(' ')`. Inline elements không có whitespace giữa chúng nếu HTML source không có space → chữ dính liền.
- **BÀI HỌC #5**: `overflow-wrap: break-word` BẺ ĐÔI từ tiếng Việt (NGUY-/ỄN). Dùng `display: inline-block; white-space: nowrap` per token + `word-break: keep-all` trên container.
- **BÀI HỌC #6**: `line-height: 1.15` quá chật cho chữ HOA tiếng Việt có dấu (Ấ,Ầ,Ể,Ỗ,Ứ). Tối thiểu `1.35` cho uppercase Vietnamese.
- **BÀI HỌC #7**: KHÔNG liệt kê CSS selector thủ công (d3,d4,...d9) → dùng `:not(.d0):not(.d1):not(.d2)` để phủ tất cả đời tương lai (d10+).
- **BÀI HỌC #8**: Chạy 5 subagent song song review code TRƯỚC khi release → phát hiện 24 issues mà 1 người bỏ sót.

## ROOT CAUSE: Word-per-line vs Wrap Text (2026-07-25 CRITICAL)

- **VẤN ĐỀ GỐC**: Đời 4+ dùng word-per-line (mỗi từ 1 dòng, `display:block; white-space:nowrap`) → với ô 148px cao, max 9 từ vừa ở 13.3px. Nhưng 48% ô D4+ có 10+ từ → TRÀN → cần nới rộng hoặc co chữ.
- **HẬU QUẢ**: Cố fix bằng co chữ (fit riêng) → font lệch nhau. Cố fix bằng nới rộng → 48% ô bị nới → layout loạn.
- **FIX ĐÚNG**: D4+ dùng **WRAP TEXT** (`display:inline; white-space:normal` trên `.nm-line`):
  - Nhiều từ xếp trên 1 dòng → chiều cao giảm mạnh
  - 10px + wrap: chỉ 5/678 ô (0.7%) tràn → expansion tối thiểu
  - 13.3px + wrap: 155/678 ô (22%) tràn → quá nhiều → chọn 10px
- **BÀI HỌC #1**: LUÔN simulate với dữ liệu thật TRƯỚC khi code. Chạy phân tích distribution (word count, overflow %) để chọn giải pháp đúng.
- **BÀI HỌC #2**: KHÔNG push code mà chưa test. Mở HTTP server, verify output trước.
- **BÀI HỌC #3**: Khi user nói "cỡ chữ bằng nhau", giải pháp đúng là THAY ĐỔI DISPLAY MODE (inline vs block) chứ không phải fit riêng rồi sync MIN.

## Tree Layout & Measurement Logic (2026-07-25)
- **Đồng bộ cỡ chữ Đời 3 (depth 2 / d2)**:
  - Cụ Hán, Cụ Quyết, Cụ Huấn ở Đời 3 có độ dài tên khác nhau (Cụ Hán 35 từ, Cụ Quyết/Huấn 12 từ). Để tránh lệch thị giác (Cụ Hán chữ bé 8px, Cụ Quyết/Huấn chữ to 18px), `fitNodeText()` được bổ sung cơ chế đo cỡ chữ vừa vặn của cả 3 ô Đời 3 và ép dùng chung cỡ chữ tối thiểu vừa vặn của Đời 3 cho cả 3 ô.

- **Nới rộng chiều ngang chọn lọc cho ô Nhiều Vợ ở Đời 4+ (depth >= 3)**:
  - Giữ nguyên 95% các ô 1 vợ / tên ngắn ở kích thước chuẩn 1.5cm (~56.7px).
  - Với các ô có nhiều vợ (hoặc tên quá dài), thay vì ép cỡ chữ co nhỏ xíu (~5px), `measureFitWidths` tiến hành đo đạc và nới rộng chiều ngang riêng cho ô đó (~80px - 120px) sao cho **CỠ CHỮ VẪN GIỮ NGUYÊN MỨC CHUẨN (~12px)** và **CHIỀU CAO GIỮ NGUYÊN 150px**.

## Critical Bug Patterns (2026-07-25 Session 2)

- **BUG: Regex quá rộng gây ảnh hưởng toàn cục**:
  - `BÀ\d?` (digit TÙY CHỌN) match cả standalone "BÀ" (title nữ) → `clauseTokenize` áp dụng sai cho ô bình thường → hỏng layout.
  - **FIX**: `BÀ\d` (BẮT BUỘC digit) → chỉ match BÀ1, BÀ2, BÀ3... (ô nhiều vợ thực sự).
  - **BÀI HỌC**: Regex phát hiện pattern phải NGHIÊM NGẶT nhất có thể. Luôn test với false positive cases.

- **BUG: `overflow: visible` làm `scrollWidth` sai trên Chrome**:
  - Chrome trả `scrollWidth === clientWidth` khi `overflow: visible` → thuật toán TƯỞNG ô đủ rộng → KHÔNG nới → clause bị clip mất chữ hoàn toàn.
  - **FIX**: Giữ `overflow: hidden` (CSS mặc định) → `scrollWidth` luôn trả đúng chiều rộng nội dung thực.
  - **BÀI HỌC**: Khi đo DOM, KHÔNG thay đổi overflow. scrollWidth/scrollHeight chỉ chính xác với overflow: hidden/auto/scroll.

- **BUG: measureFitWidths nới rộng ô tràn CHIỀU CAO (vô nghĩa)**:
  - Ô tràn chiều cao (nhiều từ word-per-line) → binary search chạy đến MAX_W → nới rộng vô ích vì chiều rộng không giảm số dòng block.
  - **FIX**: Pre-check `fitsAtNormalFont(MAX_W)` — nếu ở MAX_W vẫn tràn → tràn chiều cao → giữ `defaultWidthPx`.
  - **BÀI HỌC**: Phân biệt rõ HEIGHT overflow vs WIDTH overflow. Nới rộng chỉ giải quyết width overflow.

- **NGUYÊN TẮC VÀNG**: Khi fix cho nhóm ô A, phải đảm bảo nhóm ô B (95% còn lại) KHÔNG bị ảnh hưởng. Test both paths.
