## Learned User Preferences
- Luôn phản hồi bằng tiếng Việt.
- Khi người dùng yêu cầu triển khai theo plan đính kèm, thực thi trực tiếp theo todo sẵn có và không sửa file plan.
- Với workflow "Implement the plan as specified...", không tạo lại todo; cập nhật trạng thái todo tuần tự (bắt đầu `in_progress` từ todo đầu tiên) và hoàn tất toàn bộ trước khi dừng.
- Ưu tiên chỉnh sửa trực tiếp `index.html` để thay đổi giao diện/cách hiển thị cây gia phả.
- Ưu tiên hiển thị chữ đầy đủ trong ô, tránh cắt chữ bằng ellipsis và tránh ngắt giữa ký tự trong một từ.
- Khi thao tác nội dung gia phả, giữ nguyên nghĩa từ tiếng Việt và tránh các biến đổi regex làm sai chữ.

## Learned Workspace Facts
- Workspace là repo Git tại `D:/GIT/Gia-Pha-Ho-Doan`.
- Dữ liệu gia phả chính nằm trong `GiaPhaHoDoan.json`.
- Giao diện cây gia phả và logic hiển thị đang tập trung trong `index.html`.
- Trạng thái continual-learning nằm trong `.cursor/hooks/state/`.
