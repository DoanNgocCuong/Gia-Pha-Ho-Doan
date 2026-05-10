# ADR V4_ADR2 — Clamp mép phải theo đời focus (tổ tiên và hậu duệ)

**Trạng thái:** Đã triển khai trong code (`utils/tree-layout.js` và `utils/tree-layout-v2.js` — `index.html` dùng bản `-v2`: Phase 2b/2c + **3b/3c**)  
**Ngày:** 2026-05-10  
**Cập nhật:** 2026-05-10 — bổ sung Phase 3b/3c (mirror 2b/2c cho `d > focus`)  
**Liên quan:** [V4.md](V4.md) (Phụ lục B–C, §3.1, §4), [SDD.md](../SDD.md)

---

## 1. Bối cảnh

- **Đời focus** = đời có số ô lớn nhất (`computeBusiestGenerationDepth` trong [`utils/tree-layout.js`](../../utils/tree-layout.js)), dùng làm mốc **Phase 1** của `computeAbsoluteLayout`.
- **Mép phải tham chiếu** `R_focus`: max trên hàng focus của `cx + W/2` (định nghĩa trong [V4.md — Phụ lục B](V4.md#L244)).

**Yêu cầu sản phẩm:** Các đời **trước và sau** đời focus không được để mép phải hàng **lọt** ra ngoài mép phải của đời đông nhất (trừ khi bị chặn cứng bởi mép trái `x ≥ 0` như logic 2b đã mô tả).

---

## 2. Quyết định đã chốt (theo V4 + code)

### 2.1 Tổ tiên (`depth d < focus`)

- **Phase 2b** — Nếu mép phải hàng vượt `R_focus`, **shift cả hàng sang trái** `min(overflow, lRow)` (không đẩy ô qua `x < 0`).
- **Phase 2c** — Nếu vẫn trồi sau 2b, **suffix shift** trên cùng các đời `d < focus` để nén khe.

### 2.2 Hậu duệ (`depth d > focus`)

- **Phase 3** — Cụm con quanh `parent.x`, sweep `prevRight` (như cũ).
- **Phase 3b** — **Mirror 2b:** với mỗi `d ∈ [focus+1, D−1]`, nếu mép phải hàng vượt `R_focus` thì shift cả hàng trái cùng công thức cap `lRow`.
- **Phase 3c** — **Mirror 2c:** suffix pack trên các hàng `d > focus` còn trồi sau 3b.
- **Phase 2d** — Chạy **sau** 3b/3c: clamp `parent.cx` trong `[L,R]` con + sweep (giữ invariant cạnh, chỉnh lại sau khi con đã bị kéo trái).

### 2.3 Hệ quả và rủi ro

- **Đối xứng:** Tổ tiên và hậu duệ đều bị ràng buộc cùng ý tưởng `R_focus` như Phụ lục B–C của V4.
- **Trade-off giống 2c:** Khe ngang trên một số hàng hậu duệ có thể không còn đều sau 3c.
- **Giới hạn vật lý:** Nếu `lRow` (khoảng cách mép trái nhỏ nhất tới 0) không đủ, vẫn có thể còn trồi nhẹ — cùng hạng mục với tổ tiên; khi đó cần scale toàn cây hoặc nới `R_focus` (ngoài phạm vi ADR này).

---

## 3. Đối chiếu code (`computeAbsoluteLayout`)

| Nội dung | File | Dòng (khoảng) |
|----------|------|----------------|
| Phase 2b — `for (d = 0; d < focus; d++)` | [`utils/tree-layout.js`](../../utils/tree-layout.js) | 330–366 |
| Phase 2c — `for (d = 0; d < focus; d++)` | cùng file | 368–413 |
| Phase 3 — `for (d = focus + 1; d < D; d++)` | cùng file | 415–450 |
| **Phase 3b** — `for (d = focus + 1; d < D; d++)`, so `rRow` với `R_focus` | cùng file | 452–488 |
| **Phase 3c** — suffix pack trên `d > focus` | cùng file | 490–535 |
| Phase 2d — `clampParentRange` + hai vòng gọi | cùng file | 537–635 |

**Kết luận:** Hậu duệ **được** ép theo `R_focus` qua 3b/3c; Phase 2d **sau đó** đảm bảo cha nằm trong khoảng con và không chồng ô giữa các nút cùng hàng.

---

## 4. Ghi chú tương lai (tuỳ chọn)

- Nếu cần **một** pass tính `R_focus` dùng chung (DRY) hoặc đo lại sau khi focus row từng bị ảnh hưởng bởi phase khác — hiện tại hàng focus **không** bị 2b/2c/3b/3c dịch chuyển, nên quét `focusRow` lặp lại là an toàn.
- Nếu vẫn thấy “lọt phải” sau khi cap trái cạn: xem xét co giãn toàn bộ subtree hoặc tăng chiều rộng vùng in.

---

## 5. Tham chiếu nhanh

- [V4.md — §3.1 Layout node](V4.md#L46)  
- [V4.md — Phụ lục B (Phase 2b)](V4.md#L244)  
- [V4.md — Phụ lục C (Phase 2c)](V4.md#L283)  
- [SDD.md](../SDD.md) — các mục Phase 2b / 2c / 3 tương ứng (nên bổ sung mô tả 3b/3c khi đồng bộ tài liệu chính)
