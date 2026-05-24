# Ghi Chú Việc Còn Cần Làm

**Ngày tạo**: 2026-05-10 23:39 (UTC+7)

## Danh Sách Việc Cần Xử Lý

1. Ở đời 1, đời 2, đời 3, các từ trong ô cần viết theo chiều ngang.

2. Kiểm tra lỗi khi export ra ảnh: chữ câu đối ở hai bên đang bị sát/rúm lại với nhau, không giữ được độ thoáng như khi xem trên giao diện.

3. Kiểm tra hiện tượng trong mỗi ô vẫn còn một lớp nền/viền "ẩn ẩn" bên trong dù đã bỏ `inset box-shadow`; cần xác định còn do `background: linear-gradient(...)`, lớp SVG edge, opacity, border nội bộ, hoặc style clone/export nào khác.

4. Thêm chi tiết trang trí "rồng bay phượng múa" cho gia phả.

5. Cập nhật lại mũi tên/đường nối để các đoạn nối đi vuông góc, rõ hướng cha-con và tránh cảm giác cong/lệch khó nhìn.

## Ghi Chú Kỹ Thuật Ban Đầu

- Đời 1, 2, 3 hiện tương ứng với các class `.node.d0`, `.node.d1`, `.node.d2` vì giao diện hiển thị `Đời = depth + 1`.
- Lỗi câu đối khi export nhiều khả năng liên quan đến logic clone/export trong `utils/tree-export.js`, đặc biệt phần điều chỉnh khoảng cách cho `.couplet-words` trước khi gọi `html2canvas`.
- Vấn đề lớp "ẩn ẩn" trong ô đã thử xử lý bằng cách bỏ `inset box-shadow` trong `index.html`, nhưng nếu vẫn còn thì bước tiếp theo nên kiểm tra nền gradient của `.node.ancestor/.node.male/.node.female/.node.other` và thứ tự layer của `.tree-edges`.
