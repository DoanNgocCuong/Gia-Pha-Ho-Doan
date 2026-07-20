# Kế hoạch điều chỉnh khoảng cách thế hệ và kích thước ô (Cập nhật - Tăng kích thước Đời 1-3)

*Ngày tạo: 2026-07-20*

## Yêu cầu
1. Sửa lại khoảng cách đời 2 đến đời 3 cho dài ra như cũ (đời 1->2 ngắn gọn 3.0cm, đời 2->3 kéo dài ra bằng `between_generations_gap_cm` là 7.0cm). (Đã hoàn thành)
2. Sửa lại chiều rộng các ô đời 4+ về kích thước mặc định `1.5 x 8.0 cm`, các ô không chứa đủ chữ sẽ tự động kéo giãn chiều ngang sang. (Đã hoàn thành)
3. Tăng kích thước (chiều rộng + chiều ngang) và tăng cỡ chữ cho các ô Đời 1, 2, 3 (landscape d0-d2). (Mới thêm)

## Các thay đổi chi tiết mới

### 1. data/print-size-config.json
- Tăng hệ số scale của 3 đời đầu (`generation_overrides` "1", "2", "3") từ `2` lên **`3`**.
- Chiều dọc hiển thị của các ô đời 1-3 tăng từ `1.5 * 2 = 3.0 cm` lên **`1.5 * 3 = 4.5 cm`**.

### 2. index.html
- Cập nhật CSS định dạng kích thước hiển thị của `.node.d0`, `.node.d1`, `.node.d2` để tăng chiều ngang hiển thị lên 1.5 lần:
  ```css
  body.print-size-config-active .node.d0 {
      width: calc(var(--node-height) * 1.5) !important; /* Tăng chiều ngang từ 8cm lên 12cm */
      height: calc(var(--node-width) * var(--node-scale-d0)) !important;
  }
  body.print-size-config-active .node.d1 {
      width: calc(var(--node-height) * 1.5) !important;
      height: calc(var(--node-width) * var(--node-scale-d1)) !important;
  }
  body.print-size-config-active .node.d2 {
      width: calc(var(--node-height) * 1.5) !important;
      height: calc(var(--node-width) * var(--node-scale-d2)) !important;
  }
  ```

### 3. utils/tree-layout-v2.js
- Trong hàm `widthAtDepth(d)`:
  - Cập nhật chiều ngang tính toán cho các ô đời 1-3 (`d <= 2`) tăng lên 1.5 lần:
    ```javascript
    function widthAtDepth(d) {
        return (d <= 2) ? (H * 1.5) : W;
    }
    ```

### 4. utils/tree-text-v2.js
- Trong hàm `fitNodeText()`:
  - Cỡ chữ đời 1 và đời 2 sẽ tự động tăng tương ứng với scale mới (`scale = 3`).
  - Đối với Đời 3 (`depth === 2`), khống chế trần cỡ chữ tối đa (`maxFontSize`) tăng từ `14px` lên **`18px`** để chữ hiển thị to rõ tương xứng với kích thước ô mới, đồng thời giữ nguyên sự đồng đều giữa các ô đời 3.
    ```javascript
    if (depth === 2) {
        maxFontSize = 18; // Khống chế trần font-size đời 3 ở 18px để chữ bằng nhau cân đối
    }
    ```

## Kế hoạch kiểm tra
1. Chạy HTTP server local.
2. Kiểm tra trực quan trên trình duyệt các điểm:
   - Các ô đời 1, 2, 3 có kích thước to rõ rệt (12.0 x 4.5 cm).
   - Chữ trong các ô đời 1, 2, 3 to đẹp, rõ ràng.
   - Các ô đời 4+ vẫn thon gọn (1.5 x 8.0 cm).
