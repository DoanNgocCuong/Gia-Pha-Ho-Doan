# Kế hoạch điều chỉnh khoảng cách thế hệ và kích thước ô (Cập nhật)

*Ngày tạo: 2026-07-20*

## Yêu cầu
1. Sửa lại khoảng cách đời 2 đến đời 3 cho dài ra như cũ (đời 1->2 ngắn gọn 3.0cm, đời 2->3 kéo dài ra bằng `between_generations_gap_cm` là 7.0cm).
2. Sửa lại chiều rộng các ô đời 4+ về kích thước mặc định `1.5 x 8.0 cm`, các ô không chứa đủ chữ sẽ tự động kéo giãn chiều ngang sang (thuật toán tự động co giãn hoạt động cho toàn bộ các node bị tràn chữ).

## Các thay đổi chi tiết

### 1. data/print-size-config.json
- Cập nhật lại kích thước ô mặc định (`node.default`):
  - `width_cm`: 1.5
  - `height_cm`: 8.0
- Giữ nguyên scale cho đời 1, 2, 3 (`generation_overrides` "1", "2", "3") thành 2. Khi đó kích thước các ô đời 1-3 (landscape) sẽ là `8.0 x 3.0 cm`.

### 2. utils/tree-layout-v2.js
- Trong hàm `yOf(d)`:
  - `vg0` (khoảng cách đời 1-2) = `gap_landscape_cm * cmPx` (3.0cm).
  - `vg1` (khoảng cách đời 2-3) = `VG` (7.0cm, kéo dài ra như cũ).
  - `vg2` (khoảng cách đời 3-4) = `VG` (7.0cm).

## Kế hoạch kiểm tra
1. Chạy HTTP server local.
2. Kiểm tra trực quan trên trình duyệt các điểm:
   - Khoảng cách đời 2 -> 3 dài hơn rõ rệt so với đời 1 -> 2.
   - Các ô đời 4+ thon gọn lại (1.5cm).
   - Ô nào không chứa đủ chữ sẽ tự động phình to ra theo chiều rộng.
   - Chữ trong các ô vẫn tự động căn chỉnh và co nhỏ font size để hiển thị trọn vẹn, không bị mất chữ.
