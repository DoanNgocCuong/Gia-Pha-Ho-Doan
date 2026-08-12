# 📜 NHẬT KÝ KIỂM TOÁN & QUY TRÌNH HẤP THU BÀI HỌC (SOP-POSTMORTEM.md)

> **Chủ trì Kaizen:** Phó Chủ tịch Đoàn Ngọc Cường — Chief Architect  
> **Quy chuẩn:** DoanNgocCuong Review Protocol (`/doanngoccuong_review`) & Zero-Trust Audit (`/bmad-guru-zero-trust-adversarial-audit`)  
> **Trạng thái:** ACTIVATED, CERTIFIED & SYNCHRONIZED 100% SSOT

---

## 💎 1. ĐÓNG GÓI VIÊN KIM CƯƠNG STAR (STAR MATRIX PACKING)

### 📌 S — SITUATION (BỐI CẢNH THỰC TẾ)
Phát hiện hiện tượng đoạn văn Chú thích/Chú giải (`GHI CHÚ: NS: NĂM SINH, NM: NĂM MẤT...`) nằm ở cuối file Word bị parser biến thành 1 "Node thành viên giả" trong cây gia phả JSON ở Đời 2, làm giao diện Web Application hiển thị 1 ô khung chữ nhật dị biệt trên sơ đồ.

### 🧠 T — THOUGHT (CHUYỂN HÓA TƯ DUY NGUYÊN BẢN)
* **Lỗi tư duy cũ:** Coi mọi đoạn văn trong file Word đều là thành viên gia phả nếu không chứa từ "lần cuối cập nhật".
* **Tư duy Nguyên Bản mới (First Principles):** 
  Văn bản chú thích/chú giải (`legend`/`notes`) là **Document Metadata (Dữ liệu tả dữ liệu)**, KHÔNG PHẢI là một thành viên huyết thống (`genealogy node`). Parser bắt buộc phải phân tách metadata lên tầng Root Metadata của JSON (`"legend": "..."`), CẤM CHO PHÉP biến metadata thành node con trên sơ đồ cây.

### ⚡ A — ACTION 24H (HÀNH ĐỘNG TRIỆT ĐỂ)
1. **Phẫu thuật Hàm `is_footer()` & Metadata Extractor:** Cập nhật `scripts/convert_docx_to_json_master.py` nhận diện từ khóa `ghi chú` / `ghi chú:`, trích xuất chuỗi chú thích đưa vào trường `"legend"` và `"notes"` ở root JSON.
2. **Loại bỏ Node Giả khỏi Cây Gia phả:** Chạy lại script tạo file `data/GiaPhaHoDoan.json` (giảm từ 693 xuống đúng 692 nodes thực tế).
3. **Thẩm định Tự động:** Chạy `full_giapha_audit.py` xác nhận 0 node giả, 0 lỗi depth.

### 📈 R — RESULT & LESSON (KẾT QUẢ & BÀI HỌC)
* **Kết quả:** Đã diệt sạch 100% node chú thích giả trên Web Application. Khung hình chữ nhật dị biệt biến mất, giao diện sơ đồ cây sạch đẹp hoàn hảo.
* **Bài học kim cương:** *"Đừng bao giờ nhầm lẫn giữa Dữ liệu Thực thể (Entity Data) và Dữ liệu Chú thích (Metadata). Hãy luôn lọc sạch nhiễu trước khi nạp vào cây quan hệ."*

---

## 🧗 2. KỸ THUẬT 5 WHYS ROOT CAUSE ANALYSIS

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

## 🛡️ 3. BỘ 9 QUY TẮC CỨNG (HARD RULES TO PREVENT REPEATED FAILURES)

> [!CAUTION]
> **HARD RULE #9 (DOCUMENT METADATA SEPARATION GUARD):**  
> Mọi đoạn văn chứa từ khóa `GHI CHÚ:`, `CHÚ GIẢI:`, `CHÚ THÍCH:` BẮT BUỘC phải bị loại bỏ khỏi mảng node cây gia phả (`children[]`) và trích xuất lưu vào trường Root Metadata (`"legend"`, `"notes"`). CẤM TUYỆT ĐỐI biến ghi chú tài liệu thành node thành viên gia phả!
