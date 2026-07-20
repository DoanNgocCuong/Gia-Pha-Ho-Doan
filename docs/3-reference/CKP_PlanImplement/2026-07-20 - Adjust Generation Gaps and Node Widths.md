# Kế hoạch điều chỉnh khoảng cách thế hệ và kích thước ô (Cập nhật - Sửa lỗi đè chữ & Hẹp Gap Đời 1-2)

*Ngày tạo: 2026-07-20*

## Yêu cầu
1. Sửa lại khoảng cách đời 2 đến đời 3 cho dài ra như cũ (đời 1->2 ngắn gọn, đời 2->3 kéo dài ra bằng `between_generations_gap_cm` là 7.0cm). (Đã hoàn thành)
2. Sửa lại chiều rộng các ô đời 4+ về kích thước mặc định `1.5 x 8.0 cm`, các ô không chứa đủ chữ sẽ tự động kéo giãn chiều ngang sang. (Đã hoàn thành)
3. Tăng kích thước (chiều rộng + chiều ngang) và tăng cỡ chữ cho các ô Đời 1, 2, 3 (landscape d0-d2). (Đã hoàn thành)
4. Sửa lỗi chữ Đời 1, 2, 3 bị đè sát viền trên và bị mũi tên đè lên chữ; giãn rộng thêm khoảng cách Đời 1 -> Đời 2 cho thoáng tương xứng với kích thước ô mới. (Mới thêm)

## Các thay đổi chi tiết mới

### 1. data/print-size-config.json
- Tăng khoảng cách thế hệ landscape dọc `between_generations_gap_landscape_cm` từ `3.0` lên **`5.0`** (cm) để giãn khoảng cách dọc Đời 1 -> 2.

### 2. index.html
- Khôi phục padding lớn cho các ô đời 1, 2, 3 (`d0`, `d1`, `d2`) bằng cách thêm `padding` với thuộc tính `!important` vào CSS:
  ```css
  body.print-size-config-active .node.d0 {
      width: calc(var(--node-height) * 1.5) !important;
      height: calc(var(--node-width) * var(--node-scale-d0)) !important;
      padding: 12px 18px !important;
  }
  body.print-size-config-active .node.d1 {
      width: calc(var(--node-height) * 1.5) !important;
      height: calc(var(--node-width) * var(--node-scale-d1)) !important;
      padding: 10px 14px !important;
  }
  body.print-size-config-active .node.d2 {
      width: calc(var(--node-height) * 1.5) !important;
      height: calc(var(--node-width) * var(--node-scale-d2)) !important;
      padding: 8px 12px !important;
  }
  ```

## Kế hoạch kiểm tra
1. Chạy HTTP server local.
2. Kiểm tra trực quan trên trình duyệt các điểm:
   - Khoảng cách dọc Đời 1 -> 2 thoáng và đẹp mắt (5.0 cm).
   - Chữ trong các ô đời 1-3 thụt xuống dưới một chút, không chạm viền trên, đầu mũi tên không đè lên chữ.
