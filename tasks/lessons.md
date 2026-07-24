# Lessons Learned & Technical Patterns

## Tree Layout & Measurement Logic (2026-07-25)
- **Lỗi ô bị phình to bất thường theo chiều ngang (Width Distortion in Generation 9 / Depth 8)**:
  - **Nguyên nhân gốc rễ**: Hàm `measureFitWidths` trong `utils/tree-text-v2.js` thực hiện đo đạc nhị phân chiều rộng ô (`scrollWidth` / `scrollHeight`) ở cỡ chữ mặc định 12px trước khi `fitNodeText()` được gọi. Việc mở rộng chiều rộng ô riêng lẻ làm ô bị phình to (200px - 397px), phá vỡ độ rộng đồng nhất 1.5cm của các ô Đời 4+.
  - **Khắc phục**: Ép `measureFitWidths` luôn trả về `defaultWidthPx` (1.5cm = ~56.7px) cho tất cả các ô d3+, triệt tiêu hiện tượng phình ô.

- **Đồng bộ & Khống chế cỡ chữ sàn Đời 3 (Font Floor & Unification for Generation 3)**:
  - **Vấn đề**: Cụ Hán (Đời 3) có chuỗi text rất dài (35 từ gồm 3 bà vợ + thông tin mộ), nếu để tự động co vừa khung mà không có sàn font-size thì chữ Cụ Hán bị nén xuống quá nhỏ (~3.5px-4px). Khi ép cỡ chữ Cụ Hán sang Cụ Quyết và Cụ Huấn, toàn bộ Đời 3 bị chữ siêu nhỏ không đọc được.
  - **Khắc phục**: Trong `fitNodeText()`, đặt trần/sàn cỡ chữ tối thiểu cho Đời 3 (`depth === 2`) là **12px** (`Math.max(12, minD2FontSize)`). Đảm bảo cả 3 ô Cụ Hán, Cụ Quyết, Cụ Huấn vừa **bằng kích thước ô 100%**, vừa **bằng cỡ chữ 100% (12px - 13px)**, chữ to rõ, sắc nét, cân đối và trang trọng.
