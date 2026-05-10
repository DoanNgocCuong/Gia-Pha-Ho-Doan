## Learned User Preferences
- Luôn phản hồi bằng tiếng Việt.
- Khi triển khai theo plan / “Implement the plan…”: thực thi theo todo có sẵn, không sửa file plan, không tạo lại todo; cập nhật trạng thái tuần tự (bắt đầu `in_progress` từ mục đầu) và hoàn tất trước khi dừng.
- Ưu tiên chỉnh sửa `utils/*.js` cho logic cây (layout, cạnh, chữ, export, pan, bootstrap, in); chỉnh `index.html` cho shell, CSS, markup nút và thứ tự `<script type="module" src="./utils/...">`.
- Ưu tiên hiển thị chữ đầy đủ trong ô; tránh ellipsis và tránh ngắt giữa ký tự trong một từ.
- Khi thao tác nội dung gia phả, giữ nguyên nghĩa tiếng Việt và tránh các biến đổi regex làm sai chữ.
- Tên trên ô cây hiển thị chữ HOA bằng CSS (`text-transform: uppercase` trên `.node .nm`), không đổi chuỗi trong JSON.
- Font UI ưu tiên stack Arial / Helvetica / sans-serif khi chọn kiểu không chân (Arial Body).
- Theme mong muốn: nền giấy trắng nhạt, chữ đen đậm, đường nối và palette cạnh/cạnh cây tông xám trung tính.
- Nhãn trong ô: **mỗi từ một dòng** (tách theo khoảng trắng), **không** xuống dòng từng ký tự; cỡ chữ **lớn nhất vừa khung**; **không được làm “mất chữ”** — cho phép cuộn trong `.node .nm` khi ô cố định; `.nm-line` dùng `white-space: nowrap` để trình duyệt không bẻ từng chữ và làm `fitNodeText` sai.
- Chuẩn hoá trong JSON: nút `gender === "male"` có `name` bắt đầu kiểu `Ô.` → thành `Ô. Đoàn Văn …` khi chưa có sẵn; có thể tái chạy `scripts/_normalize_ong_names.py`.
- Lề/shell ngang: khi đổi padding, cập nhật **đồng bộ** `index.html` (`body`, `#treeStage`, `.tree`), `data/tree-shell-config.json` và `utils/tree-shell-config.js`.

## Learned Workspace Facts
- Workspace là repo Git tại `D:/GIT/Gia-Pha-Ho-Doan`.
- Dữ liệu gia phả chính nằm trong `data/GiaPhaHoDoan.json`; mobile chủ yếu để xem, chỉnh sửa dữ liệu qua JSON.
- Logic cây (bản đang dùng trong `index.html`): `utils/tree-state-v2.js`, `utils/print-config-v2.js`, `utils/tree-text-v2.js`, `utils/tree-edges-v2.js`, `utils/tree-layout-v2.js`, `utils/tree-export.js`, `utils/tree-pan-v2.js`, `utils/tree-bootstrap-v2.js`; `index.html` là shell (CSS, markup, thứ tự import module).
- Các nút export/JSON drawer dùng inline `onclick`; handler ES module gắn lên `window` trong `utils/tree-export.js`; `treeState.activePrintSizeConfig` gán sau validate trong `applyPrintConfigToCss`; `utils/css-units.js` quy đổi cm/mm → px cho biến layout.
- JSON lưu `depth` **0-based**; giao diện hiển thị **Đời = `depth + 1`** (dễ nhầm nếu chỉ nhìn UI).
- `utils/tree-text-v2.js`: chuẩn hoá nhãn (`normalizeNodeLabel`), từng từ → `<span class="nm-line">`, lưu chuỗi gốc ở `data-gp-nm`, `fitNodeText` chỉnh cỡ chữ.
- `utils/tree-layout-v2.js`: `computeAbsoluteLayout` có Phase **3b/3c** (mirror 2b/2c) để **hậu duệ không lọt mép phải** so với `R_focus` của đời focus.
- `utils/tree-edges-v2.js`: vẽ cạnh SVG với gán **lane greedy** theo `busInterval` (tinh thần SDD §13) để giảm chồng đoạn bus ngang; mũi tên qua `<marker>` + `marker-end`.
- Kiểm thử local: mở qua HTTP server (không chỉ `file://`) để `fetch('./data/GiaPhaHoDoan.json')` và tải `./data/print-size-config.json` hoạt động đúng.
- Định hướng print-first: khổ bản in tổng thể mục tiêu khoảng 2.3m × 2.7m; ô mặc định khoảng 1.5cm × 12cm; khoảng cách giữa hai ô khoảng 0.25cm (sau có thể phóng to nhẹ cho đời 1–4).
- Cần mở rộng metadata người để có ngày/tháng/năm mất.
- UX/UI tham chiếu tinh thần sang trọng, tối giản kiểu iPhone/iPad; ưu tiên độ chính xác khi in và khớp preview–in.
- Workflow BMAD `bmad-create-architecture` trong repo yêu cầu có PRD trước khi tiếp tục sang các bước kiến trúc.
