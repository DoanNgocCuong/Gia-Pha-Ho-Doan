# Lessons Learned & Technical Patterns

## Tree Layout & Measurement Logic (2026-07-25)
- **Lỗi ô bị phình to bất thường theo chiều ngang (Width Distortion in Generation 9 / Depth 8)**:
  - **Nguyên nhân gốc rễ**: Hàm `measureFitWidths` trong `utils/tree-text-v2.js` thực hiện đo đạc nhị phân chiều rộng ô (`scrollWidth` / `scrollHeight`) ở cỡ chữ mặc định 12px trước khi `fitNodeText()` được gọi. Đối với các tên có chữ dài hoặc nhiều dòng, hàm này tính toán chiều rộng riêng cho từng ô và cố tình nới rộng chiều ngang ô (từ 56.7px lên 150px - 397px). Điều này phá vỡ hợp đồng giao diện: các ô dọc Đời 4+ (bao gồm Đời 9) phải giữ nguyên kích thước đồng nhất `defaultWidthPx` (1.5cm = ~56.7px), còn việc co chữ vừa khung hoàn toàn do `fitNodeText()` tự động đảm nhiệm.
  - **Khắc phục triệt để**: Cố định `measureFitWidths` luôn trả về `defaultWidthPx` cho tất cả các ô d3+, triệt tiêu hoàn toàn cơ chế nới rộng ô riêng lẻ. Mọi ô ở Đời 9 đều phẳng đẹp, đồng đều và vuông vắn, chữ tự động co vừa ô nhờ `fitNodeText()`.
