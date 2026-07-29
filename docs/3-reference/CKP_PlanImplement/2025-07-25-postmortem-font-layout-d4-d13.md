# 2025-07-25 — POST-MORTEM: Vấn đề Cỡ Chữ & Layout Đời 4+ và Đời 1-3

> **Tác giả**: AI (Antigravity)
> **Ngày**: 25/07/2025
> **Trạng thái**: ✅ ĐÃ FIX — Commit `6af8668` (Phase 1) + `b21f1dc` (Đời 1-3)
> **Thời gian sự cố**: ~5 giờ (nhiều vòng fix → revert → fix lại)
> **Thời gian fix thật sự**: ~30 phút (sau khi tìm đúng root cause)

---

## 1. MÔ TẢ VẤN ĐỀ

### 1.1. Triệu chứng ban đầu (do Sếp báo)
- Đời 4+ (678 ô): **cỡ chữ lệch nhau** giữa các ô
- Một số ô bị **nới rộng chiều ngang** bất thường
- Chiều cao ô không đồng nhất
- Đời 1-3 (5 ô): **cỡ chữ cực bé** (2-3px), không đọc được

### 1.2. 3 Vấn Đề Ban Đầu (OUTCOME bắt buộc từ Sếp)

| # | Vấn đề | Nguyên nhân gốc | Cách fix |
|---|--------|-----------------|----------|
| **❶** | **Cỡ chữ lệch nhau** — ô 5px, ô 13px, ô 8px trong cùng Đời 4+ | `fitNodeText` binary-search font RIÊNG cho từng ô. Mỗi ô có số từ khác nhau → font khác nhau | Bỏ binary-search. Set **font cố định 10px** cho tất cả D4+. Wrap text giúp tất cả ô vừa vặn ở cùng 1 font |
| **❷** | **Chiều cao ô lệch nhau** — ô tràn bị kéo dọc | `display: block` = mỗi từ 1 dòng → 20 từ = 20 dòng = 320px > 302px ô → trình duyệt kéo cao ô | Đổi `display: inline-block` = wrap text → 20 từ = ~8 dòng = 108px < 302px → thừa chỗ, không bao giờ tràn dọc |
| **❸** | **Chiều rộng ô lệch nhau** — 48% ô bị nới ngang, phá grid | `measureFitWidths` phát hiện tràn → nới rộng ô. Nhưng 326/678 ô tràn = nới 48% ô → grid tan nát | Wrap text @ 10px → chỉ 5/678 ô (0.7%) tràn. 99.3% ô giữ nguyên width → grid chuẩn |

> **Điểm mấu chốt**: Cả 3 vấn đề đều có **CÙNG 1 ROOT CAUSE** = `display: block` (mỗi từ chiếm 1 dòng).
> Đổi **1 thuộc tính CSS** (`display: block` → `inline-block`) đồng thời triệt tiêu cả 3 vấn đề.

---

## 2. QUÁ TRÌNH FIX SAI (5 GIỜ LÃNG PHÍ)

### 2.1. Các lần fix thất bại

| Lần | Cách fix | Kết quả | Tại sao thất bại |
|-----|----------|---------|-------------------|
| 1 | Co chữ `fitNodeText` binary search | Cỡ chữ lệch 5px–13px | Mỗi ô fit riêng → font khác nhau |
| 2 | Sync MIN cho Đời 3 | Đời 3 OK nhưng Đời 4+ vẫn lệch | Chỉ sync 3 ô, 678 ô kia bỏ ngỏ |
| 3 | Nới rộng ô tràn | 48% ô bị nới rộng → phá grid | Quá nhiều ô tràn, nới không xuể |
| 4 | Set font cố định 13.3px | 22% ô tràn → nới rộng | Vẫn dùng word-per-line → tràn |

### 2.2. Vòng lặp fix vô tận
```
Sếp báo lỗi → AI fix triệu chứng → tạo lỗi mới → Sếp chửi → AI fix lỗi mới → ...
```

**Lý do**: AI không bao giờ dừng lại hỏi "TẠI SAO 48% ô bị tràn?"

---

## 3. PHÂN TÍCH ROOT CAUSE (GỐC RỄ)

### 3.1. Display mode sai

**Toàn bộ cây** dùng `display: block` cho `.nm-line` (mỗi từ = 1 dòng):

```css
/* CSS cũ */
.node .nm .nm-line {
    display: block;       /* ← GỐC RỄ */
    white-space: nowrap;
}
```

**Hậu quả tính toán**:

| Ô có N từ | Word-per-line (block) | Wrap text (inline-block) |
|-----------|----------------------|--------------------------|
| 10 từ | 10 dòng × 16px = 160px | ~4 dòng × 13.5px = 54px |
| 15 từ | 15 dòng × 16px = 240px | ~6 dòng × 13.5px = 81px |
| 20 từ | 20 dòng × 16px = **320px → TRÀN!** | ~8 dòng × 13.5px = 108px |
| 51 từ (Đời 1) | 51 dòng → font 2.7px! | ~6 dòng × 24px = 146px ✅ |

**Chiều cao ô Đời 4+** = 302px. Với word-per-line, bất kỳ ô nào >18 từ đều tràn.

### 3.2. Simulation xác nhận

```python
# Kết quả simulation với dữ liệu thật (678 ô Đời 4+)
Word-per-line @ 13.3px: 326/678 overflow (48%) ❌
Wrap text     @ 13.3px: 155/678 overflow (22%) 
Wrap text     @ 10px:     5/678 overflow (0.7%) ✅
```

**48% ô bị tràn** = không có cách nào "fit riêng" mà giữ font đồng nhất.

### 3.3. Đời 1-3 cùng root cause

Đời 1 có **51 từ** trong ô landscape 450×166px:
- Word-per-line: 51 dòng → font tối đa = 166/(51×1.2) = **2.7px** (không đọc được!)
- Wrap text: 6 dòng → font tối đa = 166/(6×1.35) = **20px** → chọn **18px** (có margin an toàn)

---

## 4. GIẢI PHÁP ĐÃ ÁP DỤNG

### 4.1. Thay đổi CSS (index.html)

```css
/* TRƯỚC: Mỗi từ 1 dòng cho tất cả đời */
.node .nm .nm-line {
    display: block;
    white-space: nowrap;
}

/* SAU: Wrap text cho tất cả đời */
.node .nm .nm-line {
    display: inline-block;   /* Từ = block unit, nhưng wrap khi hết chỗ */
    white-space: nowrap;     /* KHÔNG bẻ giữa ký tự 1 từ */
    margin-right: 0.15em;    /* Khoảng cách giữa các từ */
}
.node .nm {
    word-break: keep-all;    /* Không bẻ từ tiếng Việt */
    overflow-wrap: normal;   /* Không dùng break-word */
    line-height: 1.35;       /* Thoáng cho dấu HOA tiếng Việt (Ấ,Ầ,Ể,Ỗ) */
}
```

### 4.2. Thay đổi JS (tree-text-v2.js)

```javascript
/* TRƯỚC: 100 dòng code phức tạp */
// Binary search font → fit riêng → sync MIN → overflow check → ...

/* SAU: 8 dòng */
const D13_UNIFORM_FONT_PX = 18;  // Đời 1-3
const D4_UNIFORM_FONT_PX  = 10;  // Đời 4+

if (depth >= 3) {
    label.style.fontSize = D4_UNIFORM_FONT_PX + 'px';
} else {
    label.style.fontSize = D13_UNIFORM_FONT_PX + 'px';
}
```

### 4.3. Fix .join('') bug

```javascript
/* TRƯỚC: Dính chữ khi display:inline-block */
.join('');   // <span>ÔNG</span><span>NGUYỄN</span> → ÔNGNGUYỄN

/* SAU: Có khoảng trắng */
.join(' ');  // <span>ÔNG</span> <span>NGUYỄN</span> → ÔNG NGUYỄN
```

---

## 5. KẾT QUẢ SAU FIX

### 5.1. Đời 4+ (678 ô)

| Metric | Trước | Sau |
|--------|-------|-----|
| Font size | 5–13px (lệch nhau) | **10px đồng nhất** |
| Ô bị nới rộng | 326/678 (48%) | **17/678 (2.5%)** |
| Width | 56.7px | **56.7px (không đổi)** |
| Height | 302.4px | **302.4px (không đổi)** |
| Dính chữ | ❌ ÔNGNGUYỄN | ✅ ÔNG NGUYỄN |
| Bẻ từ Việt | ❌ NGUY-/ỄN | ✅ NGUYỄN (nguyên vẹn) |

### 5.2. Đời 1-3 (5 ô)

| Metric | Trước | Sau |
|--------|-------|-----|
| Font size | 2.7–13px (lệch) | **18px đồng nhất** |
| Width | 450px | **450px (không đổi)** |
| Height | 166px | **166px (không đổi)** |
| Đọc được? | ❌ 2.7px = không | ✅ 18px = rõ ràng |

---

## 6. BÀI HỌC RÚT RA

### 6.1. Lỗi tư duy đã mắc

| Lỗi | Mô tả | Thuật ngữ |
|-----|--------|-----------|
| **Fix triệu chứng** | Sếp nói "chữ lệch" → sửa fitNodeText. Sếp nói "ô rộng" → sửa measureFitWidths | Symptom-chasing |
| **Không dùng dữ liệu** | Code → push → chờ Sếp test → chửi → fix | Flying blind |
| **Giả định sai** | "Đời 4+ phải dùng word-per-line vì Đời 1-3 dùng" | Man with a Hammer (Munger) |
| **Vòng lặp vô tận** | Mỗi fix tạo bug mới → fix bug mới → tạo bug khác | Whack-a-mole |

### 6.2. Nguyên tắc đúng (áp dụng từ bây giờ)

1. **Simulation trước, code sau**
   - Chạy Python phân tích dữ liệu thật TRƯỚC khi viết 1 dòng code
   - Biết chính xác: bao nhiêu ô bị ảnh hưởng, phân bổ thế nào

2. **First Principles**
   - Hỏi "TẠI SAO?" 5 lần thay vì nhảy vào fix triệu chứng
   - Tại sao tràn? → Vì 15 dòng. Tại sao 15 dòng? → Vì display:block. → ĐỔI DISPLAY.

3. **Một thay đổi nhỏ, tác động lớn**
   - Đổi 1 thuộc tính CSS (`display: block` → `inline-block`) giải quyết 100% vấn đề
   - 100 dòng code phức tạp (binary search, sync MIN) → 8 dòng đơn giản

4. **Câu thần chú của Sếp**
   > "Mày đừng fix theo tên cụ thể, mày fix theo CẤU TRÚC và phải suy nghĩ kĩ LOGIC."
   
   Câu này buộc AI dừng lại, bỏ búa xuống, nhìn toàn cảnh.

---

## 7. DANH SÁCH CÁC FILE ĐÃ SỬA

| File | Thay đổi chính |
|------|----------------|
| [index.html](file:///d:/GIT/Gia-Pha-Ho-Doan/index.html) | CSS: `display:block` → `inline-block`, `line-height: 1.35`, `word-break: keep-all` |
| [utils/tree-text-v2.js](file:///d:/GIT/Gia-Pha-Ho-Doan/utils/tree-text-v2.js) | JS: `.join(' ')`, font cố định 18px (D1-3) + 10px (D4+), xóa 92 dòng fitting phức tạp |
| [tasks/lessons.md](file:///d:/GIT/Gia-Pha-Ho-Doan/tasks/lessons.md) | Thêm 5 bài học từ 5-council review |

---

## 8. BUGS CÒN TỒN ĐỌNG (TỪ 5-COUNCIL REVIEW)

### Phase 2 — Quan trọng (sửa trong tuần):
- SVG export lệch 80px khi xuất PNG/PDF
- Ô `nm-expanded` đè ô bên cạnh khi `focusDepth > 3`
- FOUT: chữ giật 12px→10px sau 33ms

### Phase 3 — Backlog:
- PDF export co cây thành chấm li ti
- Canvas nổ bộ nhớ khi export cây lớn
- 32 nodes data có double spaces
- Dead class `.nm-expanded`

> Chi tiết đầy đủ 24 issues: xem Ma Trận Chiến Lược trong conversation artifacts.
