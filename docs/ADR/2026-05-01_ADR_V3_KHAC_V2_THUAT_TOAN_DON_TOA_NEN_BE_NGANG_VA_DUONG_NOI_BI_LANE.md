# 📜 QUYẾT ĐỊNH KIẾN TRÚC V3 (ADR V3) — KHÁC V2: THUẬT TOÁN DỒN TOA NÉN BỀ NGANG & PHÂN LUỒNG ĐƯỜNG NỐI BI-LANE

> **Ngày ghi nhận:** 01/05/2026  
> **Phiên bản:** Version 3.0  
> **ĐIỂM KHÁC BIỆT NỔI BẬT SO VỚI VERSION 2 (V2):**  
> Khác với V2 bị lãng phí diện tích do "bức tường khoảng trống `ul/li`", V3 ra mắt **Thuật toán dồn toa không gian (`compactTreeLayout`)** giúp dồn ép các nhánh đứng sát rạt nhau mà không đè ô, đồng thời phát minh **Cơ chế phân luồng đường nối 2 chiều (Bi-lane Edge Routing)** triệt tiêu 100% việc đường kẻ đâm xuyên qua thân ô.

---

## 💡 1. NGUYÊN NHÂN NÂNG CẤP TỪ V2 LÊN V3
Bản V2 bị khoảng hở chiều ngang quá lớn làm sơ đồ kéo dài tới vài mét. Ngoài ra khi vẽ đường rẽ nhánh vuông góc, các đường bus nằm ngang của người cha này bị trùng đè lên đường bus của người cha khác cùng hàng.

---

## 🎯 2. QUYẾT ĐỊNH KIẾN TRÚC THAY ĐỔI TRONG V3

### 1. Thuật Toán Dồn Toa Không Gian (`compactTreeLayout`):
* Quét khoảng trống từ dưới lên (Bottom-Up).
* Cho phép nhánh nhà ít con trượt thẳng vào gầm không gian trống của nhà hàng xóm bên cạnh, ép chiều ngang sơ đồ thu hẹp lại tới **40%**.

### 2. Đường Nối Gấp Khúc 2 Chiều (Bi-lane Orthogonal Edge Routing):
* Phân chia đường kẻ ngang (bus) thành 2 luồng riêng biệt:
  * Nhóm con nằm bên trái cha: Phân luồng từ Trái ➔ Phải.
  * Nhóm con nằm bên phải cha: ĐẢO LUỒNG từ Phải ➔ Trái (Right-to-Left).
* **Kết quả**: Giảm từ 156 đoạn đường nối bị chồng nhau xuống đúng **0 đoạn bị chồng**.

---

## ⚠️ HẠN CHẾ CỦA BẢN V3 (TIỀN ĐỀ CHO V4)
* Chưa xử lý được hiện tượng các nhánh tổ tiên ở đời cao (Đời 1-3) bị trồi ra khỏi lề bên phải khi dồn toa.
* Chưa có cơ chế khóa lề thụt OpenXML MS Word nên vẫn còn nguy cơ bị lỗi Nhảy Đời.
