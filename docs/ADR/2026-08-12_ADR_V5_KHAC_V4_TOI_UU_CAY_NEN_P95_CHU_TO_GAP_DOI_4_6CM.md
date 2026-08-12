# 📜 QUYẾT ĐỊNH KIẾN TRÚC V5 (ADR V5) — KHÁC V4: TỐI ƯU CÂY NẾN P95, CỠ CHỮ TO LẤP ĐẦY VÀ KHOẢNG CÁCH ĐỜI RỘNG THƯA (4.63cm)

> **Ngày ghi nhận:** 12/08/2026  
> **Phiên bản:** Version 5.0 (Bản Nâng Cấp Bố Cục Hoàn Hảo)  
> **ĐIỂM KHÁC BIỆT NỔI BẬT SO VỚI VERSION 4 (V4):**  
> Khác với V4 có khoảng cách đời bị hẹp (~1.2cm) và cây nến quá dài (8.0cm) làm chữ chưa đạt mức tối đa, V5 **chốt hạ Kích thước Cây Nến P95 (Cao 4.5cm, Rộng 2.0cm)**, **giải phóng không gian dọc tăng khoảng cách các Đời 4-10 lên 4.63cm (Thưa rộng gấp 4 LẦN V4)**, **nâng cỡ chữ lên 14px lấp đầy chiều ngang ô** và **kéo rộng ngang tự động với các ô ngoại lệ (> 16 từ)**.

---

## 💡 1. NGUYÊN NHÂN NÂNG CẤP TỪ V4 LÊN V5

Bản V4 mặc dù đã xử lý xong lỗi trồi lề phải và chống nhảy đời, nhưng khi kiểm tra ảnh xuất in thực tế trên khổ bạt `0.84m x 2.5m` cho thấy:
1. **Cây nến quá dài (`8.0 cm`)**: Chiếm quá nhiều diện tích dọc, khiến khoảng cách giữa các Đời 4➔10 bị ép ngắn lại chỉ còn `1.2 cm`, gây cảm giác các đời bị chật chội.
2. **Cỡ chữ chưa đạt mức tối đa**: Font chữ `10px` cũ làm 2 từ/chữ đứng dính ngang trên cùng 1 dòng, người lớn tuổi nhìn từ xa khó đọc.

---

## 🎯 2. QUYẾT ĐỊNH KIẾN TRÚC THAY ĐỔI TRONG V5

### 1. Phân Tích Thống Kê P95 & Giảm Chiều Cao Cây Nến ($H = 4.5\text{ cm}$):
* Thống kê 687 ô Đời 4-10 cho thấy: **95% số ô chứa $\le 16$ từ (Phân vị P95)**.
* Chốt chiều cao cây nến Đời 4-10 xuống **`4.5 cm`** (giảm gần 50% so với `8.0cm` cũ) ➔ Giúp lấp đầy P95 mà không lãng phí không gian.

### 2. Giải Phóng Không Gian Dọc — Tăng Khoảng Cách Đời 4-10 ($G = 4.63\text{ cm}$):
* Với chiều cao cây nến `4.5 cm`, toàn bộ không gian dọc trên khổ bạt `84cm` được giải phóng.
* Khoảng cách các Đời 4-10 tăng từ `1.2 cm` lên **`4.63 cm`** (~4.6 phân - **Thưa rộng gấp 4 LẦN V4**).

### 3. Phóng To Cỡ Chữ Lấp Đầy Chiều Ngang Ô ($14\text{px}$ / $10.5\text{pt}$):
* Chiều rộng ô tăng từ `1.3cm` ➔ **`2.0cm`**.
* Cỡ chữ nâng từ `10px` ➔ **`14px`** (`10.5pt`), mỗi từ/ký tự đứng thẳng 1 hàng dọc to nét, dễ đọc.

### 4. Xử Lý Kéo Ngang Tự Động Với Ô > P95 (> 16 từ):
* Với 5% số ô đặc biệt (> 16 từ): **Cố định chiều cao `4.5 cm`** (để giữ đường nối các đời thẳng hàng).
* Tự động **KÉO NGANG chiều rộng ô** từ `2.0cm` ➔ `2.8cm` - `3.5cm` theo cơ chế `measureFitWidths`.

---

## 📈 3. KẾT QUẢ ĐẠT ĐƯỢC BẢN V5

| Tiêu chí | Bản V4 | **Bản V5 (Hoàn Hảo Mới)** | Tác động thị giác |
|---|---|---|---|
| **Chiều cao Cây nến (D4-10)** | 8.0 cm | **4.5 cm (Theo P95)** | Ô gọn gàng, vừa vặn |
| **Khoảng cách Đời (D4-10)** | 1.2 cm | **4.63 cm (~4.6 phân)** | **Rộng thưa gấp 4 LẦN** |
| **Chiều rộng ô (D4-10)** | 1.3 cm | **2.0 cm** | Chữ đứng 1 cột lấp đầy ô |
| **Cỡ chữ Đời 4-10** | 10px (~7pt) | **14px (~10.5pt)** | Chữ to, nét rõ, cực dễ đọc |
| **Cấu hình bạt in** | 0.84m x 2.5m | **0.84m x 2.5m (250cm x 84cm)** | Căn chuẩn tỷ lệ 2.9762 |

---
*Bản ADR V5 chính thức ghi nhận quyết định kiến trúc nâng cấp bố cục cây phả đồ Họ Đoàn.*
