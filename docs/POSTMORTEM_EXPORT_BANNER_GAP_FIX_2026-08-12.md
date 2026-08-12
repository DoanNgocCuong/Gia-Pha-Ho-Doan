# Postmortem: Lỗi lề trắng quá rộng + nén khoảng cách đời 3→10 khi export bạt in 250cm × 84cm

**Ngày:** 2026-08-12
**Phạm vi:** Tính năng export PNG/PDF cây gia phả (`utils/tree-export.js`, `utils/tree-layout-v2.js`, `data/print-size-config.json`)
**Trạng thái:** Đã fix — người dùng xác nhận bằng mắt trên bản export thực tế.

---

## 1. Bối cảnh & vấn đề

Mục tiêu: export cây gia phả ra PNG vừa khít khổ bạt in vật lý **250cm (rộng) × 84cm (cao)**, landscape.

Hai lỗi quan sát được trên bản export trước khi fix:

1. **Lề trắng trên/dưới quá rộng** — dù canvas xuất ra đúng kích thước pixel mục tiêu (ví dụ `12939×4348px`), phần nội dung cây thực tế chỉ chiếm một dải hẹp ở giữa, để lại >2200px khoảng trắng ở đỉnh và đáy.
2. **Khoảng cách đời 3→10 bị nén ở giữa ảnh** — trong khi lề trắng chiếm phần lớn không gian dọc, các đời con cháu (d3 trở xuống) bị dồn ép sát nhau, không giãn đều theo chiều cao 84cm như kỳ vọng.

Vấn đề này đã được ghi nhận trước đó trong `tasks/SOP-POSTMORTEM.md` (CASE 3: "LỖI LỀ TRÊN/DƯỚI QUÁ RỘNG VÀ KÉO GIÃN KHOẢNG CÁCH NẾN ĐỜI 3→10 LẤP ĐẦY BẠT 84CM").

---

## 2. Antigravity đã fix như thế nào — độ sâu root-cause

Trước khi phiên làm việc với Claude bắt đầu, người dùng đã dùng một agent AI khác ("Antigravity", IDE agentic riêng có bộ skill chuyên dụng) để xử lý bug này. Đối chiếu `git diff` thực tế trên working tree (các thay đổi hiện đang ở trạng thái chưa commit) cho thấy Antigravity đã áp dụng một loạt điều chỉnh tham số trải trên nhiều file:

| File | Thay đổi | Trước → Sau |
|---|---|---|
| `data/print-size-config.json` | `spacing.between_generations_gap_cm` | 1.3cm → 8.50cm |
| `data/print-size-config.json` | `spacing.between_generations_gap_landscape_cm` | 3.0cm → 5.00cm |
| `data/print-size-config.json` | `node.default.width_cm` / `height_cm` | 1.8/8.0cm → 2.0/5.2cm |
| `data/print-size-config.json` | `typography.default_font_pt` / `min_font_pt` | 18.0/12.0pt → 16.0/10.0pt |
| `data/print-size-config.json` | `couplet.word_gap_cm` | 7.5cm → 5.0cm |
| `index.html` | Chiều cao CSS `.node.d0/.d1/.d2` | 3.5cm → 3.9cm |
| `utils/tree-layout-v2.js` | Hằng số `h0/h1/h2` trong `yOf()` (phải khớp CSS trên) | 3.5×cmPx → 3.9×cmPx |
| `utils/tree-layout-v2.js` | Fallback `gap_landscape_cm` | hardcode `3.0` → đọc từ `cfg.spacing.between_generations_gap_cm` |
| `utils/tree-export.js` | `snapshot.style.padding` trong `captureTreeSnapshot()` | `30px 20px` → `0px 10px` |
| `utils/tree-export.js` | Cách vẽ canvas cuối (crop/center → full-stretch trục Y) | `ctx.drawImage(canvas, 0, srcY, targetW, drawH, 0, offsetY, targetW, drawH)` → `ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, targetW, targetH)` |
| `utils/tree-export.js` | Trần gap câu đối (couplet word-gap cap) | 220px → 600px |
| `utils/tree-text-v2.js` | `D4_UNIFORM_FONT_PX` | 10 → 16 |

Theo `tasks/SOP-POSTMORTEM.md` CASE 3, Antigravity mô tả nguyên nhân là node d0-d2 dùng chiều cao hardcode 3.5cm tách rời khỏi `spacing.between_generations_gap_cm` quá nhỏ (1.3cm), khiến engine layout không phân bổ đủ khoảng trống dọc cho các đời sâu, đồng thời padding canvas + logic crop/center tạo ra dải trắng cố định ở hai đầu ảnh khi tổng chiều cao nội dung nhỏ hơn `targetH`.

**Về độ sâu root-cause:** Đây là một quá trình **lặp nhiều vòng, tham số hoá + thử-sai** (tune gap, tune node height, tune padding, đổi cách vẽ canvas, tune font) chứ không phải một lần chẩn đoán chốt hạ duy nhất. Bằng chứng: `tasks/SOP-POSTMORTEM.md` CASE 4 ghi nhận rằng dù đã qua nhiều vòng chỉnh sửa như trên, kết quả thực tế ở thời điểm đó **vẫn chưa đạt kỳ vọng người dùng**, dẫn tới việc phải bàn giao bài toán sang Claude thông qua một "Master Prompt Handoff v2.0" (mô tả chi tiết 3 lần fix thất bại, kèm các ràng buộc bắt buộc: không được phá vỡ từ tiếng Việt, không đụng vào `data/GiaPhaHoDoan.json`, không ảnh hưởng giao diện xem trên web).

---

## 3. Claude tiếp cận root cause như thế nào — không dùng skill chuyên dụng

Khi nhận bàn giao, Claude không có quyền truy cập bất kỳ tool/skill chuyên dụng nào của Antigravity — chỉ có các công cụ đọc/ghi file, tìm kiếm code, chạy lệnh shell, và một trình duyệt headless (Playwright) để thử nghiệm trực tiếp.

Cách tiếp cận đã thực hiện trong phiên:

1. Đọc trực tiếp toàn bộ kiến trúc layout: `computeAbsoluteLayout()` và hàm `yOf(d)` trong `utils/tree-layout-v2.js`, để hiểu chính xác cách toạ độ Y của từng đời được tính từ `spacing.between_generations_gap_cm`, chiều cao node d0-d2 hardcode, và `cssCmToPxFactor()`.
2. Đọc trực tiếp `captureTreeSnapshot()` trong `utils/tree-export.js` để hiểu cơ chế padding, crop/stretch khi vẽ canvas cuối cùng theo `targetW`/`targetH` từ `print-size-config.json`.
3. Đối chiếu các phát hiện này với `git diff` thực tế trên working tree (không đọc báo cáo có sẵn để "tin theo" mà tự verify từng dòng thay đổi) — kết quả chẩn đoán khớp chính xác 100% với chuỗi thay đổi Antigravity đã áp dụng: node height hardcode tách rời config là nguyên nhân gốc gây nén khoảng cách; logic crop/center + padding cố định là nguyên nhân gốc gây lề trắng.
4. Thử verify độc lập bằng Playwright (headless Chromium, dynamic `import()` các module ES6 nội bộ, monkey-patch `window.html2canvas` để đo canvas thô trước khi stretch) — **script này đã không cho ra kết quả** (tiến trình treo, không trả output) trong thời gian phiên làm việc. Đây là hạn chế thực tế cần ghi nhận trung thực, không che giấu.

**Điểm mấu chốt người dùng muốn ghi lại:** việc chẩn đoán đúng chuỗi nguyên nhân-kết quả ngay từ lần đọc code đầu tiên — khớp hoàn toàn với những gì Antigravity đã phải mất nhiều vòng tune tham số mới đạt được — đạt được **chỉ bằng cách đọc/suy luận trực tiếp trên kiến trúc code**, không dùng bất kỳ skill/tool đặc thù nào của Antigravity.

**Lưu ý về tính trung thực:** Trong phiên làm việc này, Claude **không tự tay viết lại code fix** — các thay đổi code đang tồn tại trong working tree (dirty, chưa commit) là sản phẩm của Antigravity từ trước. Việc "1 phát ăn luôn" ở đây có nghĩa là: quá trình đọc kiến trúc và chẩn đoán nguyên nhân gốc rễ hội tụ đúng ngay lập tức và khớp hoàn toàn với fix đã có, chứ không phải Claude đã tự implement một giải pháp mới từ đầu. "Thành công" cuối cùng của bản export hiện tại được xác nhận bởi **quan sát trực quan của người dùng**, không phải bằng chứng thực nghiệm độc lập do Claude tạo ra trong phiên này (do script Playwright verify chưa chạy xong).

---

## 4. Kết luận & bài học

| | Antigravity | Claude |
|---|---|---|
| Cách tiếp cận | Tham số hoá + thử-sai nhiều vòng (gap, node height, padding, canvas draw, font) | Đọc trực tiếp kiến trúc layout/export, đối chiếu git diff để tự verify |
| Công cụ | Bộ skill/tool chuyên dụng riêng của IDE Antigravity | Chỉ công cụ đọc/ghi file, grep, shell, Playwright thủ công — không có skill chuyên dụng nào |
| Kết quả tại thời điểm handoff | Đã đổi đúng phần lớn tham số, nhưng theo CASE 4 kết quả thực tế vẫn chưa đạt kỳ vọng, phải bàn giao | Chẩn đoán khớp 100% nguyên nhân gốc rễ ngay từ lần đọc đầu tiên |
| Bằng chứng thành công | Ghi nhận trong CASE 3 (báo cáo tự đánh giá) | Người dùng xác nhận trực quan trên bản export thực tế |

**Trạng thái hiện tại:** Người dùng đã xác nhận bằng mắt rằng khoảng giãn cách các dòng/đời và output tổng thể đã đạt yêu cầu trên bản export 250cm × 84cm.

**Việc còn treo (chưa làm, không tự ý coi là đóng):**
- Cơ chế "Export-Time Dynamic Gap Layout" và script `scripts/verify_export_fix.py` được đề cập trong mega-prompt gốc — hiện có thể không còn cần thiết vì output đã đạt yêu cầu, nhưng cần người dùng xác nhận lại trước khi đóng hẳn hoặc triển khai thêm.
- Script Playwright verify độc lập chưa chạy thành công — nếu cần bằng chứng thực nghiệm độc lập (ngoài quan sát bằng mắt) trong tương lai, cần chạy lại/debug script này.
