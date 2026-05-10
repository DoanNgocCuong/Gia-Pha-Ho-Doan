# Thư mục `utils/` - Bộ công cụ xử lý Gia phả Họ Đoàn

Thư mục này chứa các script Python hỗ trợ **đọc file Word (.docx) → sinh cây HTML** cho file `index.html`, và các **module JavaScript (ESM)** chạy trên trình duyệt để vẽ cây gia phả, in/xuất file.

---

## 9. JavaScript (trình duyệt) — trạng thái hiện tại

Logic giao diện cây **không** nằm inline trong `index.html`; `index.html` chỉ nạp **một** entry module:

| File | Vai trò |
|------|---------|
| [`tree-bootstrap-v2.js`](./tree-bootstrap-v2.js) | Entry: `DOMContentLoaded` → tải config in, JSON gia phả, layout, pan; import toàn bộ pipeline. |
| [`tree-state-v2.js`](./tree-state-v2.js) | `treeState` — payload, model, observer, typography px, v.v. |
| [`print-config-v2.js`](./print-config-v2.js) | `print-size-config.json`, áp CSS `:root` bằng **px** (từ cm/mm) qua [`css-units-v2.js`](./css-units-v2.js). |
| [`tree-text-v2.js`](./tree-text-v2.js) | Chuẩn hoá nhãn tiếng Việt, fit chữ trong ô. |
| [`tree-edges-v2.js`](./tree-edges-v2.js) | Vẽ cạnh SVG. |
| [`tree-layout-v2.js`](./tree-layout-v2.js) | Model tầng, layout tuyệt đối, nhãn đời / Nam–Nữ, đo kích thước. |
| [`tree-pan-v2.js`](./tree-pan-v2.js) | Kéo để pan vùng `.tree-wrapper`. |
| [`tree-export.js`](./tree-export.js) | Xuất JSON/YAML/PNG/PDF, drawer xem JSON; được bootstrap import (side effect gán `window.*` cho nút `onclick` trong HTML). |
| [`tree-shell-config.js`](./tree-shell-config.js) | Tải [`data/tree-shell-config.json`](../data/tree-shell-config.json), gán biến CSS cho `#treeStage` và rail trái/phải. |

Thứ tự phụ thuộc tổng quát: `tree-state-v2` → `print-config-v2` / `tree-text-v2` → `tree-edges-v2` → `tree-layout-v2` → `tree-pan-v2`; `tree-export` dùng `tree-state-v2` + `tree-edges-v2`.

Trong `index.html`, `#treeStage` bọc ngoài (viền + padding trên/dưới); hai rail trái/phải chứa nhãn đời / Nam–Nữ; vùng cuộn + pan chỉ là `.tree-wrapper`. `tree-layout-v2` căn nhãn theo rail và lắng nghe `scroll` trên `.tree-wrapper`.

### 9.1. Phiên bản không hậu tố `-v2` (legacy)

Các file `tree-state.js`, `tree-bootstrap.js`, `print-config.js`, `tree-text.js`, `tree-edges.js`, `tree-layout.js`, `tree-pan.js`, `css-units.js` là **bản cũ / tham chiếu**; **`index.html` không nạp chúng**. Giữ trong repo để đối chiếu lịch sử hoặc tài liệu ADR; khi sửa hành vi runtime, ưu tiên chỉnh file `*-v2.js` và `tree-export.js`.

### 9.2. `wifeName` trong [`data/GiaPhaHoDoan.json`](../data/GiaPhaHoDoan.json)

Với node **`"gender": "male"`**, có thể có thêm **`wifeName`** (chuỗi): phần đuôi sau dấu phân tách `-` đầu tiên (sau khi bỏ ký tự zero-width); trường **`name`** giữ nguyên như nguồn.

Migrate / thống kê (từ thư mục gốc repo): `python utils/migrate_wife_name.py --dry-run` hoặc `python utils/migrate_wife_name.py` (ghi file + tạo `data/GiaPhaHoDoan.json.bak`). Chi tiết quy tắc tách nằm trong [`migrate_wife_name.py`](./migrate_wife_name.py).

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
