# 📜 QUYẾT ĐỊNH KIẾN TRÚC V2 (ADR V2) — KHÁC V1: CHUYỂN SANG CẤU TRÚC CÂY LỒNG NHAU UL/LI CHỐNG ĐAN CHÉO

> **Ngày ghi nhận:** 10/11/2025  
> **Phiên bản:** Version 2.0  
> **ĐIỂM KHÁC BIỆT NỔI BẬT SO VỚI VERSION 1 (V1):**  
> Khác hoàn toàn với mô hình phẳng V1, V2 **chuyển đổi toàn bộ sơ đồ sang cấu trúc cây lồng nhau (`<ul>/<li>`)**. Việc này giúp ô của Cha luôn bám chặt thẳng đứng trên đỉnh đầu nhóm các Con, triệt tiêu 100% tình trạng các đường rẽ nhánh đâm xuyên chéo qua nhau.

---

## 💡 1. NGUYÊN NHÂN NÂNG CẤP TỪ V1 LÊN V2
Trong bản V1, mỗi đời được dàn hàng ngang độc lập. Khi gia đình đông con, các đường nối từ cha xuống con phải chạy ngang dọc cắt qua các ô của gia đình khác, gây ra hiện tượng "chồng chéo mạng nhện" cực kỳ khó nhìn.

---

## 🎯 2. QUYẾT ĐỊNH KIẾN TRÚC THAY ĐỔI TRONG V2
* **Đổi cấu trúc DOM sang `<ul>/<li>` lồng nhau**:
  * Mỗi người cha chứa một danh sách `<ul>` các con trực tiếp của mình.
  * Đảm bảo tính liên kết huyết thống khép kín, đường nối từ cha xuống các con luôn vuông góc (Trunk-Bus-Drop) mượt mà.
* **Tự động căn giữa Cha so với cụm Con**:
  * Người cha luôn tự động nằm chính giữa khoảng rộng của toàn bộ nhóm con cháu bên dưới.

---

## ⚠️ HẠN CHẾ CỦA BẢN V2 (TIỀN ĐỀ CHO V3)
* Mặc dù xóa sổ được lỗi đan chéo, trình duyệt lại tạo ra các "bức tường không gian vô hình" xung quanh nhà đông con, làm đẩy các ô anh em chú bác ra xa, gây hở hang và lãng phí diện tích chiều ngang bạt in.
