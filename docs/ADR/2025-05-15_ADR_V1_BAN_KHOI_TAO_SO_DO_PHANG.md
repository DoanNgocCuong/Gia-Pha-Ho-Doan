# 📜 QUYẾT ĐỊNH KIẾN TRÚC V1 (ADR V1) — PHIÊN BẢN KHỞI TẠO SƠ ĐỒ PHẢ ĐỒ DẠNG PHẲNG

> **Ngày ghi nhận:** 15/05/2025  
> **Phiên bản:** Version 1.0 (Bản Khởi Tạo)  
> **Điểm khác biệt so với khởi thủy:** Là bản sơ đồ phả đồ Web Application đầu tiên, hiển thị danh sách gia phả dạng khối phẳng (Flat HTML Tree Layout).

---

## 💡 1. BỐI CẢNH & NHU CẦU
Khởi tạo nền tảng Web Application hiển thị cây gia phả Họ Đoàn từ dữ liệu gốc, cho phép xem cấu trúc dòng tộc trực quan trên trình duyệt thay vì đọc file văn bản MS Word tĩnh.

---

## 🎯 2. QUYẾT ĐỊNH KIẾN TRÚC V1
* **Mô hình layout:** Sử dụng cấu trúc HTML phẳng (`div` xếp theo hàng) kết hợp với các đường nối tuyệt đối.
* **Xử lý cỡ chữ & ô:** Định dạng ô vuông nhỏ tiêu chuẩn chứa Tên và Năm sinh.

---

## ⚠️ HẠN CHẾ CỦA BẢN V1 (TIỀN ĐỀ CHO V2)
* Khi sơ đồ phả đồ phát triển lên nhiều nhánh, các đường nối rẽ nhánh bị đan chéo đè lên nhau gây rối mắt.
* Chưa có cơ chế phân cấp tự động và chưa nén được khoảng cách chiều ngang.
