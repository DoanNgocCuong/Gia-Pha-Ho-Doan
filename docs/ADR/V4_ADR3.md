# ADR V4_ADR3 — Ô nam có `wifeName`: hai vùng chồng / vợ (chia ngang)

**Trạng thái:** Đã triển khai trong code (`utils/tree-bootstrap-v2.js`, `utils/tree-text-v2.js`, `index.html`; dữ liệu: `data/GiaPhaHoDoan.json` + script [`utils/migrate_wife_name.py`](../../utils/migrate_wife_name.py))  
**Ngày:** 2026-05-10  
**Cập nhật:** 2026-05-10 — ghi rõ **chia ngang** (trên/dưới + vạch ngang), không dùng layout hai cột trái/phải.  
**Liên quan:** [V4.md](V4.md), [CHANGELOG.md](../../CHANGELOG.md)

---

## 1. Bối cảnh

- Dữ liệu gốc thường gộp **họ tên chồng và vợ** trong một chuỗi `fullName` (ví dụ tách bằng ` - `).
- Cần **tách hiển thị** trên ô cây gia phả khi `gender === "male"` và có thông tin vợ, để đọc rõ hai phần mà không làm méo layout cây.

---

## 2. Quyết định đã chốt

### 2.1 Dữ liệu

1. **Cập nhật JSON:** thêm trường `wifeName` (chuỗi, có thể rỗng) cho node nam; migrate từ `fullName` theo cùng quy tắc tách như script migrate (bỏ ZWSP, chuẩn hóa khoảng trắng, tách lần đầu theo `\s*-\s*`).
2. Node **nam không có `wifeName`** (hoặc rỗng): giữ **một vùng tên** như trước (không chia ô).

### 2.2 UI (`gender === "male"` và `wifeName` khác rỗng)

- **Hai vùng bằng nhau trong ô:** một nửa **chồng** (nhãn primary lấy từ `fullName` theo logic mirror migrate), một nửa **vợ** (`wifeName`).
- **Chia ngang:** `flex-direction: column` — **trên** chồng, **vạch ngang** 1px, **dưới** vợ; mỗi vùng `flex: 1 1 0` để **cao bằng nhau** trong khung ô. **Không** dùng hai cột trái/phải với vạch dọc (đó là “chia dọc” theo cách gọi trong phiên làm việc).
- Chuẩn hóa và **fit chữ** (normalize / scale font) áp dụng cho `.nm-primary` và `.nm-spouse` giống hướng xử lý `.nm` đơn.

### 2.3 File tham chiếu

| Phần | File |
|------|------|
| DOM ô dual | [`utils/tree-bootstrap-v2.js`](../../utils/tree-bootstrap-v2.js) — `nm-row`, `nm-primary`, `nm-divider`, `nm-spouse` |
| Tách nhãn chồng + fit | [`utils/tree-text-v2.js`](../../utils/tree-text-v2.js) — `getMalePrimaryLabelFromFullName`, `normalizeAllNodeLabels`, `fitNodeText` |
| Style chia ngang | [`index.html`](../../index.html) — `.node.male .nm-row`, `.nm-divider` (chiều cao 1px, full width) |

---

## 3. Hệ quả

- Ô nam có vợ **cao hơn** cảm quan so với một dòng tên đơn (chấp nhận để đọc rõ hai phần).
- Nội dung dài vẫn dựa vào overflow scroll trong từng nửa + fit text như các ô khác.
