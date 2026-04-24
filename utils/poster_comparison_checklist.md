# Checklist so sánh 4 mẫu thử — Poster Gia Phả

**Mục đích:** Đánh giá 4 bộ xuất ảnh để chốt preset chính cho poster in khổ 1.5m × 2m.

---

## Cách tạo 4 mẫu thử

Mở `index.html` bằng trình duyệt, nhìn vào panel điều khiển phía trên cây, lần lượt click:

| Mẫu | Nút cần bấm | File tạo ra |
|-----|------------|-------------|
| 1 | 📄 Draft 72 DPI (cột "Ngang 2m × 1.5m") | `Gia-Pha-Ho-Doan_2x1.5m_draft_72dpi.png` |
| 2 | 🖨 In bạt 150 DPI (cột "Ngang 2m × 1.5m") | `Gia-Pha-Ho-Doan_2x1.5m_print_150dpi.png` |
| 3 | 📄 Draft 72 DPI (cột "Đứng 1.5m × 2m") | `Gia-Pha-Ho-Doan_1.5x2m_draft_72dpi.png` |
| 4 | 🖨 In bạt 150 DPI (cột "Đứng 1.5m × 2m") | `Gia-Pha-Ho-Doan_1.5x2m_print_150dpi.png` |

> **Lưu ý:** Trước khi bấm xuất, trang tự động bật `poster-mode` (compact) — đây là đúng theo thiết kế.
> Sau khi xuất xong trang sẽ trở về chế độ trước.

---

## Bảng đánh giá (điền vào sau khi xem ảnh)

### Mẫu 1: Ngang 2m × 1.5m — Draft 72 DPI

| Tiêu chí | Tốt ✅ | Chấp nhận ⚠️ | Cần sửa ❌ | Ghi chú |
|----------|--------|--------------|-----------|---------|
| Node d0-d2 đọc được từ 1m | | | | |
| Node d5-d7 đọc được từ 0.5m | | | | |
| Node d8-d10 đọc được sát màn hình | | | | |
| Không bị chồng node/connector | | | | |
| Màu sắc rõ nét khi in | | | | |
| Dung lượng file < 50 MB | | | | |
| Chiều rộng/cao ảnh ≈ poster thực | | | | |

**Kích thước file thực tế:** ___ MB  
**Kích thước pixel thực tế:** ___×___ px  
**Kích thước vật lý @72DPI:** ___ cm × ___ cm  

---

### Mẫu 2: Ngang 2m × 1.5m — In bạt 150 DPI

| Tiêu chí | Tốt ✅ | Chấp nhận ⚠️ | Cần sửa ❌ | Ghi chú |
|----------|--------|--------------|-----------|---------|
| Node d0-d2 đọc được từ 1m | | | | |
| Node d5-d7 đọc được từ 0.5m | | | | |
| Node d8-d10 đọc được sát màn hình | | | | |
| Không bị chồng node/connector | | | | |
| Màu sắc rõ nét khi in | | | | |
| Dung lượng file < 150 MB | | | | |
| Chiều rộng/cao ảnh ≈ poster thực | | | | |

**Kích thước file thực tế:** ___ MB  
**Kích thước pixel thực tế:** ___×___ px  
**Kích thước vật lý @150DPI:** ___ cm × ___ cm  

---

### Mẫu 3: Đứng 1.5m × 2m — Draft 72 DPI

| Tiêu chí | Tốt ✅ | Chấp nhận ⚠️ | Cần sửa ❌ | Ghi chú |
|----------|--------|--------------|-----------|---------|
| Node d0-d2 đọc được từ 1m | | | | |
| Node d5-d7 đọc được từ 0.5m | | | | |
| Node d8-d10 đọc được sát màn hình | | | | |
| Không bị chồng node/connector | | | | |
| Màu sắc rõ nét khi in | | | | |
| Dung lượng file < 50 MB | | | | |
| Chiều rộng/cao ảnh ≈ poster thực | | | | |

**Kích thước file thực tế:** ___ MB  
**Kích thước pixel thực tế:** ___×___ px  
**Kích thước vật lý @72DPI:** ___ cm × ___ cm  

---

### Mẫu 4: Đứng 1.5m × 2m — In bạt 150 DPI

| Tiêu chí | Tốt ✅ | Chấp nhận ⚠️ | Cần sửa ❌ | Ghi chú |
|----------|--------|--------------|-----------|---------|
| Node d0-d2 đọc được từ 1m | | | | |
| Node d5-d7 đọc được từ 0.5m | | | | |
| Node d8-d10 đọc được sát màn hình | | | | |
| Không bị chồng node/connector | | | | |
| Màu sắc rõ nét khi in | | | | |
| Dung lượng file < 150 MB | | | | |
| Chiều rộng/cao ảnh ≈ poster thực | | | | |

**Kích thước file thực tế:** ___ MB  
**Kích thước pixel thực tế:** ___×___ px  
**Kích thước vật lý @150DPI:** ___ cm × ___ cm  

---

## Quyết định chốt preset

Sau khi đánh giá 4 mẫu, điền vào bảng so sánh tổng hợp:

| | Ngang 2×1.5m | Đứng 1.5×2m |
|---|---|---|
| **Draft 72DPI** dùng xem thử, preview | Mẫu 1 | Mẫu 3 |
| **Print 150DPI** dùng gửi nhà in | Mẫu 2 | Mẫu 4 |

**Orientation được chọn:** ☐ Ngang   ☐ Đứng  
**Lý do:** _______________________________________________

### Khóa preset Kiểu 1 (đề xuất)

- Preset mặc định đã cài sẵn trong giao diện:
  - `Orientation`: `landscape (2m x 1.5m)`
  - `Profile`: `print 150 DPI`
- Khi mở trang, nút mặc định được highlight là `In bạt 150 DPI` của cột ngang.
- Chỉ đổi preset mặc định nếu:
  - Mẫu landscape không đạt readability ở `d6-d10`, hoặc
  - Bản in thử cho thấy nhánh dày bị chồng đáng kể.

---

## Gợi ý điều chỉnh nếu có vấn đề

### Nếu node d8-d10 quá nhỏ, không đọc được:
Sửa trong `index.html`, tìm đoạn:
```css
body.poster-mode .node.d8,
body.poster-mode .node.d9,
body.poster-mode .node.d10 { font-size: 6.5px; padding: 1px 3px; }
```
Tăng `font-size` lên `7.5px` hoặc `8px`.

### Nếu cây quá rộng, chữ d0-d2 nhỏ tí hon khi in:
Sửa `connector-h` và `li-pad` trong `body.poster-mode`:
```css
body.poster-mode {
    --connector-h: 10px;  /* giảm từ 13 xuống 10 */
    --li-pad: 1px;        /* giảm từ 2 xuống 1 */
}
```
Cây sẽ compact hơn → scale tăng → chữ to hơn trong ảnh xuất.

### Nếu dung lượng file quá lớn (>200MB):
1. Dùng Draft 72 DPI thay vì 150 DPI để preview.
2. Hoặc thêm xuất JPG (thay `image/png` → `image/jpeg` trong `_runPosterExport`).

### Nếu muốn tăng DPI cho in chất lượng cao (offset/canvas):
Thay `dpi=150` bằng `dpi=200` hoặc `dpi=300` khi gọi:
```html
<button onclick="exportPoster('landscape', 300, this)">🖨 300 DPI</button>
```

---

## Lý thuyết tính toán (để hiểu scale)

```
target_pixels = physical_mm / 25.4 × dpi

Ví dụ ngang 2m × 150 DPI:
  W = 2000mm / 25.4 × 150 = 11,811 px
  H = 1500mm / 25.4 × 150 =  8,858 px

Nếu cây render ở 8,000px × 4,000px:
  scale = min(11811/8000, 8858/4000)
        = min(1.476, 2.214)
        = 1.476

Output ảnh: 8000×1.476 = 11,811px wide → đúng 2m @ 150DPI ✅
```
