# Thư mục `utils/` - Bộ công cụ xử lý Gia phả Họ Đoàn

Thư mục này chứa các script Python hỗ trợ **đọc file Word (.docx) → sinh cây HTML** cho file `index.html`.

---

## 1. Cài đặt (chỉ làm 1 lần)

Mở PowerShell, chạy:

```powershell
pip install python-docx
```

---

## 2. Ba công cụ trong thư mục này

| File | Vai trò | Khi nào dùng |
|------|---------|--------------|
| `extract_text.py`        | Xuất text thô từ docx ra .txt | Xem nhanh nội dung file Word |
| `extract_with_indent.py` | Xuất text + thông tin thụt lề | Debug cấu trúc thế hệ |
| `build_tree.py`          | Dựng cây HTML & cập nhật `index.html` | **Chạy chính** mỗi khi docx đổi |

---

## 3. Cách chạy (từ thư mục gốc `D:\GIT\Gia-Pha-Ho-Doan`)

### 3.1. Xem nhanh nội dung docx

```powershell
python utils\extract_text.py
```

→ Sinh ra `utils\_out_text.txt`

### 3.2. Xem chi tiết thụt lề

```powershell
python utils\extract_with_indent.py
```

→ Sinh ra `utils\_out_indent.txt`

### 3.3. Dựng cây gia phả (công cụ chính)

```powershell
python utils\build_tree.py
```

→ Cập nhật trực tiếp `index.html`

---

## 4. Quy trình khi bạn SỬA gia phả

```
┌─────────────────────────────┐
│ 1. Mở & chỉnh file          │
│    "Cụ Liễu.docx" bằng Word │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│ 2. (Tuỳ chọn) Chạy          │
│    extract_with_indent.py   │
│    để kiểm tra thụt lề      │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│ 3. Chạy build_tree.py       │
│    → index.html tự cập nhật │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│ 4. Mở index.html bằng       │
│    trình duyệt để kiểm tra  │
└─────────────────────────────┘
```

---

## 5. Công thức tính THẾ HỆ (quan trọng để sửa docx đúng)

```
depth = (left / 720) + 1 + số_tab_đầu_dòng
```

Trong đó:
- `left` = độ thụt lề trái của đoạn văn trong Word (twips)
- Mỗi bước Tab/Thụt lề chuẩn của Word = **720 twips = 0.5 inch = 1 thế hệ**

**Bảng tra nhanh:**

| Thụt lề (inch) | `left` (twips) | Thế hệ | Ví dụ |
|---|---|---|---|
| 0.0 (gốc) | 0 / không có | 0-1 | Cụ Liễu, Cụ Rũng |
| 0.5 | 720 | 2 | I. Cụ Hán / II. Cụ Quyết / III. Cụ Huấn |
| 1.0 | 1440 | 3 | Con/vợ của 3 cụ thế hệ 2 |
| 1.5 | 2160 | 4 | Cháu |
| 2.0 | 2880 | 5 | Chắt |
| ... | ... | ... | ... |

---

## 6. Quy ước ký hiệu trong file Word

| Ký tự đầu dòng | Phân loại | Màu hiển thị |
|---|---|---|
| `Cụ ...` hoặc `I.`, `II.`, `III.` | Tổ tiên | Đỏ-Vàng |
| `ô ...` / `Ô ...` | Nam | Xanh dương |
| `b ...` / `B ...` / `Bà ...` | Nữ | Hồng |
| Khác (ghi chú) | Other | Xanh lá |

**Lưu ý:** Tiền tố số thứ tự như `1.`, `2.`, `3 ` ở đầu dòng sẽ được **giữ lại trong tên** nhưng **không ảnh hưởng** đến phân loại giới tính (script tự cắt đi khi xét).

---

## 7. Nguyên tắc BẤT DI BẤT DỊCH

> **KHÔNG BỊA THÊM DỮ LIỆU.**
> Toàn bộ tên, quan hệ đều phải nằm sẵn trong file `Cụ Liễu.docx`.
> Script chỉ **đọc & trình bày lại** - không bao giờ tự sinh tên mới.

---

## 8. Khi gặp lỗi

| Triệu chứng | Nguyên nhân có thể | Cách xử lý |
|---|---|---|
| `ModuleNotFoundError: No module named 'docx'` | Chưa cài `python-docx` | `pip install python-docx` |
| `UnicodeEncodeError` khi print | Console Windows không hỗ trợ UTF-8 | Chạy `chcp 65001` trước khi chạy script |
| Cây hiển thị sai thế hệ | Ai đó chỉnh docx làm lệch thụt lề | Chạy `extract_with_indent.py` để dò dòng nào sai |
| `Không tìm thấy khối <div class="tree">...` | `index.html` đã bị thay cấu trúc | Khôi phục `index.html` từ git |
