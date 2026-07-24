# Lessons Learned & Technical Patterns

## Tree Layout & Measurement Logic (2026-07-25)
- **Lỗi ô bị phình to bất thường theo chiều ngang (Width Distortion in Generation 9 / Depth 8)**:
  - **Nguyên nhân gốc rễ**: Hàm `measureFitWidths` trong `utils/tree-text-v2.js` thực hiện đo đạc nhị phân chiều rộng ô (`scrollWidth` / `scrollHeight`) ở cỡ chữ mặc định 12px trước khi `fitNodeText()` được gọi. Việc mở rộng chiều rộng ô riêng lẻ làm ô bị phình to (200px - 397px), phá vỡ độ rộng đồng nhất 1.5cm của các ô Đời 4+.
  - **Khắc phục**: Ép `measureFitWidths` luôn trả về `defaultWidthPx` (1.5cm = ~56.7px) cho tất cả các ô d3+, triệt tiêu hiện tượng phình ô.

- **Lệch cỡ chữ tại Đời 3 (Equalizing Font Size for Generation 3 Ancestor Nodes)**:
  - **Vấn đề**: Cụ Hán (Đời 3, bên trái) tên quá dài (35 từ) nên `fitNodeText` co xuống nhỏ (~8-10px), trong khi Cụ Quyết và Cụ Huấn tên ngắn nên giữ cỡ chữ to (18px), gây mất cân đối thị giác giữa 3 ô Đời 3.
  - **Khắc phục**: Trong `fitNodeText()`, tính toán cỡ chữ cho cả 3 ô Đời 3 (`depth === 2`), lấy giá trị cỡ chữ nhỏ nhất (`minD2FontSize`) và gán chung cho cả 3 ô (Cụ Hán, Cụ Quyết, Cụ Huấn). Đảm bảo cả 3 ô Đời 3 có **kích thước ô bằng nhau 100% AND cỡ chữ bằng nhau 100%**.
