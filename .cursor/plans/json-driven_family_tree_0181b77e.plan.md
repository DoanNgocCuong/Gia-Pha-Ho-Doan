---
name: JSON-driven Family Tree
overview: Chuyển `index.html` từ hardcode cây gia phả sang render động từ `GiaPhaHoDoan.json`, đồng thời giữ nguyên giao diện và các tính năng export hiện có.
todos:
  - id: analyze-render-points
    content: Xác định và thay thế điểm hardcode cây trong index.html bằng vùng render động
    status: completed
  - id: implement-json-loader
    content: Thêm hàm load/validate dữ liệu từ GiaPhaHoDoan.json và quản lý state currentTreeData
    status: completed
  - id: implement-recursive-renderer
    content: Dựng DOM đệ quy từ node JSON với class tương thích CSS hiện có
    status: completed
  - id: wire-init-and-exports
    content: Nối luồng khởi tạo trang và cập nhật export JSON/YAML dùng dữ liệu state
    status: completed
  - id: verify-behavior
    content: Kiểm thử render, pan, export ảnh và export data sau thay đổi
    status: completed
isProject: false
---

# Kế hoạch chuyển render gia phả sang JSON

## Mục tiêu
Tách dữ liệu khỏi HTML để từ nay trang đọc dữ liệu từ file JSON (`GiaPhaHoDoan.json`) và dựng cây động, tránh sửa tay khối `ul/li` rất lớn trong `index.html`.

## Phạm vi thay đổi
- Cập nhật [D:/GIT/Gia-Pha-Ho-Doan/index.html](D:/GIT/Gia-Pha-Ho-Doan/index.html) để:
  - Bỏ phần cây hardcode trong `.tree` và thay bằng vùng render động.
  - Thêm luồng tải dữ liệu JSON từ [D:/GIT/Gia-Pha-Ho-Doan/GiaPhaHoDoan.json](D:/GIT/Gia-Pha-Ho-Doan/GiaPhaHoDoan.json).
  - Tạo hàm dựng DOM đệ quy từ schema node `{ name, gender, depth, children }`.
  - Giữ nguyên CSS class hiện tại (`node`, `ancestor|male|female`, `dN`, `nm`) để không phá layout.
  - Gọi lại `fitNodeText()` sau mỗi lần render.

## Thiết kế kỹ thuật
- Nạp dữ liệu:
  - `loadTreeData()` dùng `fetch('./GiaPhaHoDoan.json')`.
  - Validate tối thiểu `payload.root` trước khi render; nếu lỗi thì hiển thị thông báo thân thiện.
- Dựng cây:
  - `createTreeLi(node, isRoot)` tạo `<li>` + `<div class="node ...">` + nhánh con `<ul>`.
  - `renderTreeFromData(rootNode)` gắn kết quả vào `.tree` theo cấu trúc `ul > li` tương thích CSS connector.
- Quản lý state:
  - Biến toàn cục nhẹ `currentTreeData` lưu JSON đang hiển thị.
  - Export JSON/YAML đọc từ `currentTreeData` (ưu tiên nguồn dữ liệu), fallback parse DOM khi cần.
- Khởi tạo trang:
  - `DOMContentLoaded` -> `loadTreeData()` -> `renderTreeFromData()` -> `fitNodeText()`.

## Tương thích tính năng hiện có
- Giữ nguyên:
  - kéo thả/pan (`.tree-wrapper` events),
  - xuất ảnh (`exportImage()`),
  - chuẩn hóa text node,
  - auto-fit text.
- Chỉnh nhẹ export data:
  - `exportDataAsJson()` và `exportDataAsYaml()` xuất đúng theo `currentTreeData` + metadata (`familyName`, `exportedAt`).

## Kiểm thử sau khi đổi
- Mở trang trực tiếp và qua local server để xác nhận `fetch` JSON hoạt động.
- So sánh hình cây trước/sau (độ sâu, màu, connector).
- Test 3 nút export: PNG / JSON / YAML.
- Test lỗi có kiểm soát: đổi tạm tên file JSON để đảm bảo thông báo lỗi rõ ràng.

## Kết quả mong đợi
- Dữ liệu gia phả chỉ cần sửa trong `GiaPhaHoDoan.json`.
- `index.html` không còn khối hardcode hàng nghìn dòng `ul/li`.
- Không thay đổi UI/UX hiện tại ngoài việc thêm tính linh hoạt dữ liệu.