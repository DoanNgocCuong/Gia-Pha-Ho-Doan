# Kế hoạch điều chỉnh khoảng cách thế hệ và kích thước ô (Cập nhật - Đồng bộ font chữ Đời 3)

*Ngày tạo: 2026-07-20*

## Yêu cầu
1. Sửa lại khoảng cách đời 2 đến đời 3 cho dài ra như cũ (đời 1->2 ngắn gọn 3.0cm, đời 2->3 kéo dài ra bằng `between_generations_gap_cm` là 7.0cm). (Đã hoàn thành)
2. Sửa lại chiều rộng các ô đời 4+ về kích thước mặc định `1.5 x 8.0 cm`, các ô không chứa đủ chữ sẽ tự động kéo giãn chiều ngang sang. (Đã hoàn thành)
3. Đồng bộ cỡ chữ các ô Đời 3 (class `.node.d2`) để chữ hiển thị bằng nhau, cân đối, tránh ô chữ to ô chữ nhỏ cộc lệch. (Mới thêm)

## Các thay đổi chi tiết mới

### 1. utils/tree-text-v2.js
- Trong hàm `fitNodeText()`:
  - Chỉ cho phép tính toán `scale` tăng cỡ chữ tự động dựa trên độ rộng ô đối với Đời 1 và Đời 2 (`depth <= 1`).
  - Đối với Đời 3 (`depth === 2`), khống chế trần cỡ chữ tối đa (`maxFontSize`) cố định ở mức **`14px`**.
  - Việc khống chế trần `14px` giúp các ô đời 3 (có cùng chiều rộng 8.0cm) hiển thị chữ đồng đều nhau ở mức `14px`. Chỉ những ô đặc biệt dài mới tự động co nhỏ lại một chút để vừa khít, triệt tiêu hiện tượng chữ to chữ nhỏ cộc lệch giữa các ô cùng hàng.
  - Đoạn code điều chỉnh:
    ```javascript
    let scale = 1;
    if (depth <= 1) {
        scale = getNodeWidthScale(label);
    }
    let maxFontSize = Math.max(MIN_FONT_SIZE, BASE_MAX_FONT_SIZE * scale);
    if (depth === 2) {
        maxFontSize = 14; // Khống chế trần font-size đời 3 ở 14px để chữ bằng nhau cân đối
    }
    ```

## Kế hoạch kiểm tra
1. Chạy HTTP server local.
2. Kiểm tra trực quan trên trình duyệt các điểm:
   - Các ô đời 3 (`d2`) hiển thị chữ đồng đều nhau (đa phần là 14px), không còn tình trạng ô chữ quá to, ô chữ quá nhỏ.
   - Các ô đời 3 vẫn giữ nguyên kích thước ô bằng nhau (rộng 8.0 cm).
