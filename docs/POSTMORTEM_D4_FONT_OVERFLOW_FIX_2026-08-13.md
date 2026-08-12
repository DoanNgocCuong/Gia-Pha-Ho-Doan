# Postmortem: Cỡ chữ quá to gây cắt chữ ở ô Đời 4+ (2 bug độc lập trong cơ chế tự nới rộng ô)

**Ngày:** 2026-08-13
**Phạm vi:** Hiển thị + export cây gia phả cho Đời 4-10 (`utils/tree-text-v2.js`, `utils/tree-layout-v2.js`)
**Trạng thái:** Đã fix, đã verify bằng Playwright trên DOM thật (689/689 ô Đời 4+ không còn ô nào tràn chữ). Chưa export lại 1 bản PNG thật để đối chiếu bằng mắt.

---

## 1. Bối cảnh & vấn đề

Người dùng báo lỗi trên bản export PNG thực tế: cỡ chữ ở các ô Đời 4+ quá to, chiều dài ô không đủ để chứa hết text nên bị tự động cắt chữ ở những đoạn dài.

Yêu cầu ban đầu: tính P95/P97/P99 số từ trên toàn bộ 689 ô Đời 4-10 để có căn cứ chọn kích thước ô, kèm định hướng thiết kế rõ ràng: **"Với các ô nào mà bị chiều cao vượt quá lên do text nhiều thì tự động điều chỉnh chiều rộng của đúng cái ô đó sang ngang"** — tức là: đa số ô dùng kích thước mặc định, chỉ ô nào thực sự tràn mới tự nới rộng, không nới đại trà (tránh lặp lại lỗi lịch sử "48% ô bị nới ngang, phá grid" đã ghi trong `docs/3-reference/CKP_PlanImplement/2025-07-25-postmortem-font-layout-d4-d13.md`).

Người dùng chốt ngưỡng: **P99 = 22 từ làm ranh giới "bình thường"** (683/689 ô, 99.1%) — chỉ 6 ô outlier (>22 từ, 0.9%) mới cần tự nới rộng.

---

## 2. Đo thực nghiệm để chọn cỡ chữ — không đoán mò

Viết `scripts/measure_d4_required_height.py` (Playwright), đo trực tiếp trên DOM thật của `data/GiaPhaHoDoan.json`: với mỗi cỡ chữ ứng viên (16/14/13/12/11/10/9px), set `node.style.height = 'auto'` + `nm.style.maxHeight = 'none'` rồi đọc `scrollHeight` tự nhiên cần thiết để wrap-fit text ở width mặc định 2.0cm, tách nhóm "bình thường" (≤22 từ) và nhóm outlier (>22 từ).

Kết quả chính:

| Font | normal_p50 | normal_p90 | normal_p95 | normal_p99 | normal_max |
|---|---|---|---|---|---|
| 16px (cũ) | — | — | — | 324px | 367px |
| 12px | 97px | 130px | 146px | 178px | 194px |

`height_cm=5.2cm` mặc định của `data/print-size-config.json` ≈ 198px. Ở 16px, ngay cả `normal_p99` (324px) đã vượt xa 198px → đây là nguyên nhân trực tiếp gây cắt chữ. Ở 12px, `normal_max` (194px) vừa khít trong 198px — **không cần đổi thêm config nào khác**, chỉ cần đổi cỡ chữ.

**Fix:** `D4_UNIFORM_FONT_PX` trong `utils/tree-text-v2.js`: `16 → 12`.

---

## 3. Verify ngay sau khi đổi cỡ chữ — phát hiện fix chưa đủ

Viết `scripts/verify_d4_font_fix.py`: reload app bình thường (không giả lập gì), để tự chạy `fitNodeText()` + `measureFitWidths()` như production, rồi đo số ô được đánh dấu `nm-expanded` và số ô còn tràn thật (`nm.scrollHeight > node.clientHeight` hoặc `nm.scrollWidth > node.clientWidth`, đo sau khi mọi thứ đã render xong, kể cả sau khi đã nới rộng ngang).

Kết quả lần chạy đầu: `expandedCount: 0`, `stillOverflowCount: 4`. Cơ chế tự nới rộng ngang (vốn đã có sẵn trong code từ trước, `measureFitWidths()`) **hoàn toàn không hoạt động** — chỉ đổi cỡ chữ không đủ để hết cắt chữ.

---

## 4. Bug 1 — `measureFitWidths()` bị chính CSS `!important` của hệ thống vô hiệu hoá

Đọc `utils/tree-text-v2.js`: hàm `fits(w)` bên trong `measureFitWidths()` set `node.style.width = w + 'px'` (inline thường, không `!important`) để đo thử node có vừa không ở độ rộng `w` trong quá trình binary-search tìm width tối thiểu.

Đối chiếu `index.html`:

```css
body.print-size-config-active .node {
  width: var(--node-width) !important;
  height: var(--node-height) !important;
  ...
}
```

Rule stylesheet `!important` này đè mọi `node.style.width` set theo cách thường — khiến độ rộng node **không bao giờ thực sự đổi** trong lúc đo, dù JS tưởng là đã set. Hệ quả: `fits(MAX_W)` luôn cho kết quả giống hệt `fits(defaultWidthPx)` (vì node vật lý không đổi kích thước) → binary search luôn rơi vào nhánh "kể cả nới tối đa cũng không vừa" (Bước 2, give-up) → **không ô nào từng được nới rộng, kể từ khi cơ chế này được viết ra** (bug tồn tại từ trước, không phải lỗi mới phát sinh trong phiên gần đây).

**Fix:** đổi `fits(w)` sang:

```js
node.style.setProperty('width', w + 'px', 'important');
```

Theo đúng CSS cascade spec: cùng tier importance (đều `!important`), inline style luôn thắng stylesheet vì specificity cao nhất — nên inline `!important` mới thắng được rule stylesheet `!important`. Thêm hàm `restoreWidth()` dọn dẹp đúng ở cả 3 điểm return của `measureFitWidths()`.

**Verify lại:** `expandedCount: 0 → 4` — binary search đã nhận diện đúng 4 ô cần nới rộng và gắn nhãn `nm-expanded`.

---

## 5. Bug 2 — width đã tính đúng nhưng bị `computeAbsoluteLayout()` âm thầm ghi đè về mặc định

Chạy lại verify sau Bug 1: `expandedCount: 4` nhưng `stillOverflowCount` vẫn là 4 — **đúng 4 ô đó**, vẫn tràn y hệt, dù đã được đánh dấu `nm-expanded`. `cssWidthVar`/`inlineWidth` của cả 4 ô vẫn đứng yên ở default (`76px`) thay vì độ rộng đã tính ra trong `nodeWidthsMap`.

Đọc trực tiếp `utils/tree-layout-v2.js` — `computeAbsoluteLayout()` dùng khái niệm "hàng focus" (đời có nhiều node nhất, `treeState.treeCompactFocusDepth`) làm neo, rồi lan toả layout ra 2 hướng:

- **Phase 1 (focus row)** và **Phase 3 (con cháu, d = focus+1 → max)**: đều dùng đúng `getWd(entry, d)` — hàm tra cứu `nodeWidthsMap` theo từng node, fallback về `W` mặc định nếu không có.
- **Phase 2 (tổ tiên, d = focus-1 → 0)**: dùng `const Wd = widthAtDepth(d)` — một độ rộng **đồng nhất cho cả hàng**, hoàn toàn bỏ qua `nodeWidthsMap`. Mọi node trong hàng "tổ tiên" bị ép về cùng 1 width, kể cả node đã được `measureFitWidths()` tính ra width lớn hơn.
- **Phase 2b/2c** (clamp/pack không cho hàng tổ tiên tràn ra ngoài hàng focus): cũng dùng `widthAtDepth(d)` đồng nhất tương tự — trong khi **Phase 3b/3c** (bản mirror cho hàng con cháu) đã dùng đúng `usedWidths.get(entry.id) || W` theo từng node. Cùng một dạng bug, lặp lại ở 3 chỗ trong cùng 1 hàm.

Kết quả: nếu 1 ô outlier rơi vào hàng "tổ tiên" so với hàng focus (nông hơn), width đã nới rộng của nó bị Phase 2/2b/2c âm thầm ghi đè về `W` mặc định — đúng như quan sát thực tế.

**Fix:** sửa Phase 2 dùng `getWd(entry, d)` theo từng node thay cho `Wd` đồng nhất (mirror đúng cách Phase 1/Phase 3 đã làm); sửa Phase 2b/2c dùng `usedWidths.get(...) || W`/`widthAtDepth(d)` theo từng node thay cho `Wd`/`W` đồng nhất (mirror đúng cách Phase 3b/3c đã làm). Không đụng Phase 2e (chỉ áp dụng cho d0/d1 — 2 đời landscape luôn có width đồng nhất theo đúng thiết kế gốc, không node nào ở 2 đời này từng được nới rộng riêng).

**Verify lại:** `expandedCount: 4`, `stillOverflowCount: 0` — cả 4 ô đều hiển thị đúng width đã nới (107px/87px/89px/111px thay vì 76px mặc định), không còn ô nào tràn chữ thật trong toàn bộ 689 ô Đời 4+.

---

## 6. Verify chéo với ngưỡng P99 đã chốt — đủ 6/6 ô outlier, không sót ô nào khác

Theo đúng ngưỡng người dùng đã chốt (P99 = 22 từ, 6 ô outlier), quét lại toàn bộ 689 ô Đời 4+ theo đúng ngưỡng này để đối chiếu:

| Ô | Số từ | Đã nới rộng? | Width | scrollH/nodeH | scrollW/nodeW |
|---|---|---|---|---|---|
| ÔNG ĐOÀN ĐỖ VĂN MƯỢC... | 33 | ✅ Có | 74→109px | 194/196 | 105/109 |
| ÔNG ĐOÀN VĂN TỰ... | 32 | ✅ Có | 76→105px | 194/196 | 101/105 |
| ÔNG ĐOÀN VĂN CẦU CB2... | 25 | ✅ Có | 76→85px | 194/196 | 81/85 |
| ÔNG ĐOÀN VĂN CẤN... | 25 | ✅ Có | 74→87px | 194/196 | 83/87 |
| ÔNG ĐOÀN VĂN TUÂN CB1... | 23 | ❌ Không cần | 74px (mặc định) | 194/196 | 70/74 |
| ÔNG ĐOÀN VĂN THỤC (đi tu)... | 23 | ❌ Không cần | 74px (mặc định) | 194/196 | 70/74 |

Đúng 6/6 ô outlier P99 được tìm thấy; 4/6 ô cần nới rộng đã được nới đúng; 2/6 ô còn lại (23 từ, sát ngưỡng) tự vừa ở width mặc định (194px ≤ 196px) nên không cần nới — đúng thiết kế "chỉ nới khi thật sự tràn", không nới máy móc theo số từ.

Quét thêm toàn bộ các ô còn lại (≤22 từ, không thuộc nhóm outlier): `otherOverflowCount: 0` — không phát hiện ô nào khác bị tràn ngoài 6 ô outlier đã biết.

**Kiểm tra hướng nới rộng (đo `getBoundingClientRect()` thật + khoảng cách tới ô lân cận):** cả 4 ô được nới đều nở **đối xứng 2 bên** quanh tâm (ví dụ +15.5px trái / +15.5px phải), không phải chỉ nới sang phải — do `applyAbsoluteLayout()` set `el.style.left = pos.x - w/2` (canh giữa theo tâm `pos.x`). Khoảng cách tới ô lân cận gần nhất sau khi nới vẫn dương ở mọi trường hợp (nhỏ nhất 1.9px) → không ô nào bị đè lên ô khác dù nới rộng.

---

## 7. Kết quả & bài học

- `D4_UNIFORM_FONT_PX`: `16px → 12px`, dựa trên đo thực nghiệm thật (không phải áng chừng).
- 2 bug độc lập, tồn tại từ trước (không phải lỗi mới), khiến cơ chế tự nới rộng ô — vốn đã được thiết kế đúng trên giấy — chưa từng hoạt động thật:
  1. `measureFitWidths()` tự đo bằng inline style thường, bị chính CSS `!important` của hệ thống vô hiệu hoá khi đo thử.
  2. `computeAbsoluteLayout()` tính đúng width nới rộng nhưng Phase "Ancestors" (và 2 sub-phase clamp/pack đi kèm) dùng width đồng nhất theo hàng, âm thầm ghi đè width đã tính về mặc định cho các node rơi vào nhánh "tổ tiên".
- Bài học quy trình: **luôn verify lại bằng dữ liệu thật sau mỗi lần fix, không dừng lại sau lần fix đầu tiên có vẻ đúng.** Nếu chỉ dừng sau Bug 1 (thấy `expandedCount` từ 0 lên 4 và kết luận "đã xong"), sẽ bỏ sót Bug 2 hoàn toàn — vì bug đó không lộ ra qua chỉ số `expandedCount`, chỉ lộ ra khi đối chiếu `cssWidthVar`/`inlineWidth` thực tế trên DOM với `stillOverflowCount`.
- Bài học kiến trúc: khi một hàm layout có nhiều "phase" xử lý các nhóm node khác nhau (focus / ancestors / descendants), một per-node behavior (như `nodeWidthsMap`) cần được áp dụng **nhất quán ở tất cả các phase**, không chỉ ở phase được test đầu tiên (Phase 1). Phase 3 vốn đã làm đúng từ trước (dùng `getWd()`) — có thể do được viết sau và copy đúng pattern, trong khi Phase 2 (viết trước) giữ nguyên cách làm cũ (`widthAtDepth()` đồng nhất).

---

## 8. Việc còn treo — chưa làm, không tự ý coi là đóng

- **Chưa export lại 1 bản PNG thật** để đối chiếu bằng mắt với đúng bug ban đầu người dùng báo cáo — mọi verify ở trên chạy trên DOM live-preview qua Playwright (`http://127.0.0.1:8792/index.html`), chưa chạy qua đúng luồng `captureTreeSnapshot()`/export thật.
- **Chưa commit/push** — code fix (`utils/tree-text-v2.js`, `utils/tree-layout-v2.js`) đang ở working tree, đợi người dùng xác nhận trước khi lên git.
- **Hướng nới rộng đối xứng 2 bên** (không phải chỉ sang phải) — hiện đã xác nhận an toàn (không đè ô nào), nhưng người dùng có thể muốn đổi sang chỉ nới về 1 phía (ví dụ chỉ sang phải, neo cố định mép trái) tuỳ mục đích trình bày — cần xác nhận thêm nếu có yêu cầu cụ thể.
