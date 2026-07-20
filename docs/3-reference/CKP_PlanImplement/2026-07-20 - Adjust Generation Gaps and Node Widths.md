# Kế hoạch điều chỉnh khoảng cách thế hệ và kích thước ô (Cập nhật - Sửa lỗi lệch Đời 1-2)

*Ngày tạo: 2026-07-20*

## Yêu cầu
1. Sửa lại khoảng cách đời 2 đến đời 3 cho dài ra như cũ (đời 1->2 ngắn gọn, đời 2->3 kéo dài ra bằng `between_generations_gap_cm` là 7.0cm). (Đã hoàn thành)
2. Sửa lại chiều rộng các ô đời 4+ về kích thước mặc định `1.5 x 8.0 cm`, các ô không chứa đủ chữ sẽ tự động kéo giãn chiều ngang sang. (Đã hoàn thành)
3. Tăng kích thước (chiều rộng + chiều ngang) và tăng cỡ chữ cho các ô Đời 1, 2, 3 (landscape d0-d2). (Đã hoàn thành)
4. Sửa lỗi chữ Đời 1, 2, 3 bị đè sát viền trên và bị mũi tên đè lên chữ; giãn rộng thêm khoảng cách Đời 1 -> Đời 2 cho thoáng tương xứng với kích thước ô mới. (Đã hoàn thành)
5. Sửa lỗi Đời 1 và Đời 2 bị lệch sang phải sơ đồ tổng thể, không ở chính giữa. (Mới thêm)

## Các thay đổi chi tiết mới

### 1. utils/tree-layout-v2.js
- Thêm **Phase 2e** để căn chỉnh lại vị trí X cho Đời 1 và Đời 2 sau khi các đời dưới đã bị dịch chuyển bởi Phase 2b/2c:
  ```javascript
  // ── Phase 2e: Re-center ancestors over their children after shifting (only for d0 & d1) ──
  for (let d = 1; d >= 0; d--) {
      const dRow = levels[d];
      if (!dRow || !dRow.length) continue;
      
      const childCxByParent = new Map();
      levels[d + 1].forEach(function (childEntry) {
          const cp = positions.get(childEntry.id);
          if (!cp) return;
          const pid = childEntry.parentId;
          const curCx = childCxByParent.get(pid);
          if (!curCx) {
              childCxByParent.set(pid, { left: cp.x, right: cp.x });
          } else {
              if (cp.x < curCx.left)  curCx.left  = cp.x;
              if (cp.x > curCx.right) curCx.right = cp.x;
          }
      });

      dRow.forEach(function (entry) {
          const cc = childCxByParent.get(entry.id);
          if (cc) {
              const newCx = (cc.left + cc.right) / 2;
              positions.set(entry.id, { x: newCx, y: positions.get(entry.id).y });
          }
      });
  }
  ```

## Kế hoạch kiểm tra
1. Chạy HTTP server local.
2. Kiểm tra trực quan trên trình duyệt các điểm:
   - Khoảng cách dọc Đời 1 -> 2 thoáng và đẹp mắt (5.0 cm).
   - Chữ trong các ô đời 1-3 thụt xuống dưới một chút, không chạm viền trên, đầu mũi tên không đè lên chữ.
   - Ô Đời 1 và Đời 2 nằm ở chính giữa sơ đồ tổng thể, thẳng hàng trên trung điểm của 3 nhánh lớn.
