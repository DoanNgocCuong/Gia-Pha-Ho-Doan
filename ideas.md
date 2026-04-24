# Brainstorm: Thiết kế Gia Phả Họ Đoàn — Khổ 1.5m × 2m

## Phân tích yêu cầu
- Dữ liệu: Gia phả Họ Đoàn, ~10 thế hệ (d0-d9), 3 nhánh chính (I, II, III)
- Kích thước in: 1.5m × 2m (dọc - portrait)
- Hình mẫu: Phong cách truyền thống Việt Nam với rồng vàng, câu đối, hoa sen
- Cần compact, đọc được tất cả tên khi in

---

<response>
<text>

## Ý tưởng 1: "Hoàng Cung Cổ Điển" — Imperial Vietnamese Scroll

**Design Movement**: Vietnamese Imperial Court aesthetics (Cung đình Huế) blended with traditional genealogy scroll (cuốn thư)

**Core Principles**:
1. Vertical hierarchy — ancestor at top, descendants flow downward like a waterfall
2. Ornamental framing — mỗi thế hệ được đóng khung bằng viền hoa văn truyền thống
3. Dense but legible — tối ưu mật độ thông tin nhưng vẫn đọc được ở khoảng cách 50cm

**Color Philosophy**: 
- Nền: Giấy dó cổ (#F5E6C8) — gợi cảm giác gia phả cổ truyền
- Chữ chính: Nâu đậm (#3C1810) — mực tàu
- Viền/trang trí: Vàng hoàng gia (#DAA520) + Đỏ son (#8B0000)
- Nam: Xanh đậm (#1a3a5c), Nữ: Hồng cánh sen (#8B2252)

**Layout Paradigm**: Top-down tree với CSS flexbox, mỗi node là một ô nhỏ có border. Cây phân nhánh từ trên xuống, 3 nhánh chính chia đều chiều ngang.

**Signature Elements**:
1. Header với rồng chầu (dragon motif) bao quanh tên họ
2. Câu đối hai bên: "Phúc Đức Tổ Tiên Gieo Trồng Từ Thuở Trước" / "Nhân Tâm Con Cháu Bồi Đắp Mãi Về Sau"
3. Hoa sen trang trí ở footer

**Interaction Philosophy**: Static print-optimized — no hover effects, pure CSS for print

**Animation**: None — this is a print-first design

**Typography System**: 
- Tiêu đề: Noto Serif Vietnamese Bold, 24-36px
- Node ancestor: 13px bold
- Node thường: 7-10px tùy thế hệ
- Tất cả dùng serif font cho cảm giác trang trọng

</text>
<probability>0.08</probability>
</response>

<response>
<text>

## Ý tưởng 2: "Mộc Bản Truyền Thống" — Woodblock Print Style

**Design Movement**: Vietnamese woodblock print (Đông Hồ / Hàng Trống) — monochrome with accent colors

**Core Principles**:
1. Minimalist ornamentation — chỉ dùng đường kẻ và border, không gradient
2. High-density grid — node xếp theo lưới chặt, tận dụng tối đa diện tích
3. Contrast-first — đảm bảo in đen trắng vẫn đọc được

**Color Philosophy**:
- Nền: Trắng ngà (#FFFEF5) — sạch sẽ, dễ in
- Border/line: Nâu đen (#2C1810) — nét khắc gỗ
- Accent: Đỏ cinnabar (#CC3333) cho ancestor nodes
- Nam/Nữ phân biệt bằng border style (solid vs dashed) thay vì màu

**Layout Paradigm**: Compact horizontal tree — ancestor ở giữa trên cùng, con cháu lan ra hai bên rồi xuống dưới. Dùng CSS Grid cho alignment chính xác.

**Signature Elements**:
1. Border kiểu khắc gỗ (double border) cho header
2. Số La Mã đánh dấu nhánh (I, II, III)
3. Đường kẻ nối kiểu tre trúc (bamboo connector lines)

**Interaction Philosophy**: Pure static, print-ready

**Animation**: None

**Typography System**:
- Tiêu đề: Be Vietnam Pro Black
- Body: Be Vietnam Pro Regular/Medium
- Monospace cho số thứ tự

</text>
<probability>0.05</probability>
</response>

<response>
<text>

## Ý tưởng 3: "Đền Thờ Tổ" — Ancestral Temple Aesthetic

**Design Movement**: Vietnamese temple architecture aesthetic — warm tones, ornate but structured

**Core Principles**:
1. Sacred hierarchy — Cụ tổ được tôn vinh ở vị trí trung tâm cao nhất
2. Warm, inviting palette — màu sắc ấm áp như trong đền thờ
3. Balanced density — compact nhưng có breathing room giữa các nhánh

**Color Philosophy**:
- Nền: Vàng nhạt ấm (#FDF5E6) gradient nhẹ xuống (#F5E0B8)
- Header: Đỏ thẫm (#6B0000) với viền vàng (#DAA520)
- Node nam: Gradient xanh navy (#1a3a5c → #2a5580)
- Node nữ: Gradient hồng đậm (#8B2252 → #B83070)
- Node ancestor: Gradient đỏ vàng (#6B0000 → #9B1B1B) với text vàng
- Connector lines: Nâu gỗ (#8B4513)

**Layout Paradigm**: Top-down tree, CSS flexbox nested ul/li. Header trang trọng ở trên, cây gia phả chiếm toàn bộ chiều ngang. Mỗi thế hệ nhỏ dần để fit trong khổ giấy.

**Signature Elements**:
1. Mái đền cách điệu ở header (dùng CSS clip-path hoặc SVG)
2. Câu đối đỏ hai bên (vertical text banners)
3. Hoa sen cách điệu ở góc dưới

**Interaction Philosophy**: Print-first with optional screen viewing (drag-to-pan, zoom)

**Animation**: None for print; subtle hover on screen mode

**Typography System**:
- Tiêu đề: Noto Serif Vietnamese, 700 weight
- Node text: Times New Roman / Noto Serif
- Kích thước giảm dần theo thế hệ: d0=13px, d1=10.5px, d2=9px, d3=8px, d4=7.5px, d5-d7=7px, d8-d9=6.5px

</text>
<probability>0.07</probability>
</response>

---

## Lựa chọn: Ý tưởng 3 — "Đền Thờ Tổ"

Lý do: Phù hợp nhất với hình mẫu mà người dùng cung cấp (phong cách đền thờ, rồng vàng, câu đối đỏ, hoa sen). Giữ nguyên cấu trúc dữ liệu từ HTML gốc, tối ưu kích thước node và connector cho khổ 1.5m × 2m.
