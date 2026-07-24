# Lessons Learned & Technical Patterns

## Tree Layout & Measurement Logic (2026-07-25)
- **Đồng bộ cỡ chữ Đời 3 (depth 2 / d2)**:
  - Cụ Hán, Cụ Quyết, Cụ Huấn ở Đời 3 có độ dài tên khác nhau (Cụ Hán 35 từ, Cụ Quyết/Huấn 12 từ). Để tránh lệch thị giác (Cụ Hán chữ bé 8px, Cụ Quyết/Huấn chữ to 18px), `fitNodeText()` được bổ sung cơ chế đo cỡ chữ vừa vặn của cả 3 ô Đời 3 và ép dùng chung cỡ chữ tối thiểu vừa vặn của Đời 3 cho cả 3 ô.

- **Nới rộng chiều ngang chọn lọc cho ô Nhiều Vợ ở Đời 4+ (depth >= 3)**:
  - Giữ nguyên 95% các ô 1 vợ / tên ngắn ở kích thước chuẩn 1.5cm (~56.7px).
  - Với các ô có nhiều vợ (hoặc tên quá dài), thay vì ép cỡ chữ co nhỏ xíu (~5px), `measureFitWidths` tiến hành đo đạc và nới rộng chiều ngang riêng cho ô đó (~80px - 120px) sao cho **CỠ CHỮ VẪN GIỮ NGUYÊN MỨC CHUẨN (~12px)** và **CHIỀU CAO GIỮ NGUYÊN 150px**.
