"""
========================================================================
 Công cụ 3: DỰNG CÂY GIA PHẢ HTML TỪ FILE WORD
========================================================================

Mục đích:
---------
Đây là công cụ CHÍNH của dự án. Nó:
    1) Đọc file "Cụ Liễu.docx" (gia phả gốc).
    2) Tính THẾ HỆ (depth) cho từng người dựa trên thụt lề (indent) + tab.
    3) Phân loại GIỚI TÍNH / VAI VẾ (tổ tiên / nam / nữ / khác).
    4) Chuẩn hoá lại thế hệ để không bị "nhảy bước" (con cháu không thể
       sâu hơn cha+1 cấp).
    5) Sinh mã HTML dạng cây <ul><li>...</li></ul> lồng nhau.
    6) Thay thế phần cây cũ trong file "index.html" bằng cây mới sinh ra.

NGUYÊN TẮC BẤT DI BẤT DỊCH:
---------------------------
** KHÔNG BỊA THÊM DỮ LIỆU. **
Mọi tên, quan hệ đều lấy từ file .docx. Nếu docx viết "ô Vĩnh" thì HTML
ra đúng "ô Vĩnh" - không tự ý viết hoa, không tự ý thêm chức danh.

Yêu cầu:
--------
- Python 3.8+
- Thư viện python-docx:  pip install python-docx

Cách chạy (PowerShell, từ thư mục gốc dự án):
---------------------------------------------
    python utils\build_tree.py

Sau khi chạy xong, mở file index.html sẽ thấy cây gia phả cập nhật.

Kiến trúc (SOLID):
------------------
Mỗi hàm = 1 trách nhiệm duy nhất:
    - get_left_twips()     : đọc độ thụt lề từ XML
    - compute_depth()      : công thức tính thế hệ
    - classify()           : phân loại giới tính/vai vế
    - build_nodes()        : ghép (depth, class, name) cho từng người
    - normalize_depths()   : chỉnh lại thế hệ cho liên tục
    - render_tree()        : sinh HTML <ul><li> lồng nhau
    - inject_into_html()   : chèn cây vào index.html

Cách chỉnh sửa an toàn:
-----------------------
- Đổi cách phân loại giới tính: chỉ sửa hàm classify().
- Đổi cách tính thế hệ: chỉ sửa hàm compute_depth().
- Đổi cách render HTML: chỉ sửa hàm render_tree().
========================================================================
"""

import re           # Xử lý biểu thức chính quy (regex)
import html as htmllib  # Escape các ký tự đặc biệt (&, <, >, ") trong HTML
from docx import Document
from docx.oxml.ns import qn

# ──────────────────────────────────────────────────────────────────────
# CẤU HÌNH ĐƯỜNG DẪN FILE
# ──────────────────────────────────────────────────────────────────────
DOCX_PATH = r'd:\GIT\Gia-Pha-Ho-Doan\Cụ Liễu.docx'
HTML_PATH = r'd:\GIT\Gia-Pha-Ho-Doan\index.html'

# ──────────────────────────────────────────────────────────────────────
# HẰNG SỐ CHO CÔNG THỨC THỤT LỀ
# ──────────────────────────────────────────────────────────────────────
# Một bước thụt lề "chuẩn" trong Word = 720 twips = 0.5 inch
TWIPS_PER_LEVEL = 720

# Giới hạn class CSS size: chỉ có d0..d10 được định nghĩa trong index.html
MAX_DEPTH_CLASS = 10


# ═══════════════════════════════════════════════════════════════════════
# BƯỚC 1: ĐỌC METADATA TỪ FILE WORD
# ═══════════════════════════════════════════════════════════════════════

def get_left_twips(paragraph) -> int:
    """
    Đọc độ thụt lề trái của paragraph (tính bằng twips).

    Trả về:
        int nếu có, None nếu paragraph không khai báo độ thụt lề.
    """
    pPr = paragraph._p.find(qn('w:pPr'))
    if pPr is None:
        return None
    ind = pPr.find(qn('w:ind'))
    if ind is None:
        return None
    # Word đời mới dùng w:start, đời cũ dùng w:left - đọc cả hai
    for attr in ('w:left', 'w:start'):
        value = ind.get(qn(attr))
        if value is not None:
            try:
                return int(value)
            except ValueError:
                return None
    return None


# ═══════════════════════════════════════════════════════════════════════
# BƯỚC 2: CÔNG THỨC TÍNH THẾ HỆ (DEPTH)
# ═══════════════════════════════════════════════════════════════════════

def compute_depth(left_twips, leading_tabs: int) -> int:
    """
    Chuyển đổi (left, tabs) → depth (số thế hệ tính từ gốc).

    Công thức chính (đã kiểm chứng với docx gốc):
        base  = (left / 720) + 1   nếu có left
              = 0                  nếu paragraph không khai báo left
        depth = base + leading_tabs

    Giải thích:
        - 720 twips (= 0.5 inch) là 1 bước thụt lề tiêu chuẩn của Word
          -> tương ứng với 1 thế hệ.
        - +1 vì thế hệ 0 & 1 là Cụ Ô Liễu và Cụ Rũng (chưa có left trong docx,
          ta gán cứng). Các mục có left=720 (nhỏ nhất) chính là I./II./III.
          (Cụ Hán, Cụ Quyết, Cụ Huấn) - ở thế hệ 2.
        - Cộng thêm số tab vì có những dòng dùng Tab để thụt sâu hơn
          thay vì tăng ind.left.

    Ví dụ:
        left=720, tabs=0 → depth = 2   (Cụ Hán)
        left=1440, tabs=0 → depth = 3  (B.Tọa / B Tiếp / 1.ô Thiệu ...)
        left=720, tabs=2 → depth = 4   (cháu của Cụ Hán qua 1 lần thụt + 2 tab)
    """
    if left_twips is None:
        base = 0
    else:
        base = (left_twips // TWIPS_PER_LEVEL) + 1
    return base + leading_tabs


# ═══════════════════════════════════════════════════════════════════════
# BƯỚC 3: PHÂN LOẠI GIỚI TÍNH / VAI VẾ
# ═══════════════════════════════════════════════════════════════════════

def classify(raw_name: str) -> tuple:
    """
    Phân loại một dòng tên trong gia phả.

    Quy ước nhận dạng (theo cách viết trong docx):
        - "Cụ ..." hoặc "I.", "II.", "III." ở đầu  → tổ tiên (ancestor)
        - "ô" hoặc "Ô" ở đầu                        → nam (male)
        - "b" hoặc "B" hoặc "Bà" ở đầu              → nữ (female)
        - Khác (ví dụ "1trai – 3 gái")              → khác (other)

    Ngoài ra:
        - Tiền tố số thứ tự ở đầu dòng (vd "1.", "2 ", "3. ") sẽ bị cắt bỏ
          trước khi phân loại - nhưng dòng "1.ô Thiệu" sau khi cắt sẽ thành
          "ô Thiệu" -> vẫn phân loại được là nam.

    Tham số:
        raw_name: chuỗi gốc lấy từ docx (đã strip whitespace/tab bên ngoài)

    Trả về:
        (css_class, clean_name)
        - css_class: 'ancestor' | 'male' | 'female' | 'other'
        - clean_name: tên sau khi cắt tiền tố số (để hiển thị gọn hơn)
    """
    s = raw_name.strip()

    # Cắt tiền tố dạng "1." , "2 ", "10. " ...
    s = re.sub(r'^(\d+)[.\s]+', '', s)
    s = s.strip()

    if not s:
        # Chuỗi rỗng sau khi cắt -> không có dữ liệu để hiển thị
        return 'other', ''

    # ── Tổ tiên ────────────────────────────────────────────────────
    # Bắt đầu bằng "cụ" / "Cụ" (không phân biệt hoa thường)
    if s.lower().startswith('cụ'):
        return 'ancestor', s
    # Bắt đầu bằng số La Mã viết hoa: I., II., III., IV. ...
    if re.match(r'^[IVX]+\.', s):
        return 'ancestor', s

    # ── Nam ────────────────────────────────────────────────────────
    first_char = s[0]
    if first_char in ('ô', 'Ô'):
        return 'male', s

    # ── Nữ ─────────────────────────────────────────────────────────
    # "b" thường, "B" hoa, và "Bà" đều được coi là nữ.
    # Các dòng "B.Tọa CB1", "B Tiếp CB2" cũng rơi vào nhánh này.
    if first_char in ('b', 'B'):
        return 'female', s

    # ── Khác (ghi chú không phải người cụ thể) ─────────────────────
    return 'other', s


# ═══════════════════════════════════════════════════════════════════════
# BƯỚC 4: GHÉP (DEPTH, CLASS, NAME) CHO TỪNG PARAGRAPH
# ═══════════════════════════════════════════════════════════════════════

def count_leading_tabs(text: str) -> int:
    """Đếm số ký tự tab ở đầu chuỗi (helper nhỏ)."""
    tabs = 0
    for ch in text:
        if ch == '\t':
            tabs += 1
        else:
            break
    return tabs


def build_nodes(docx_path: str) -> list:
    """
    Đọc file .docx và xây dựng danh sách node cho cây gia phả.

    Trả về:
        list[tuple] - mỗi phần tử dạng (depth, css_class, clean_name)

    Lưu ý quan trọng về 2 dòng đầu:
        - paragraph[0] = "Cụ ô Liễu ..."   -> ta gán cứng depth=0 (gốc)
        - paragraph[1] = "Cụ Rũng ..."     -> ta gán cứng depth=1 (con cụ Liễu)
        Vì trong docx 2 dòng này không có ind.left, nếu tính theo công thức
        chung sẽ ra depth=0 cho cả hai - sai về quan hệ.
    """
    doc = Document(docx_path)
    nodes = []

    for idx, paragraph in enumerate(doc.paragraphs):
        raw = paragraph.text

        # Đếm tab ở đầu & cắt tab để lấy nội dung thực
        leading_tabs = count_leading_tabs(raw)
        text_content = raw[leading_tabs:].strip()

        if not text_content:
            # Bỏ qua các dòng trống hoàn toàn
            continue

        left = get_left_twips(paragraph)

        # Ép cứng 2 dòng đầu làm 2 thế hệ tổ (xem giải thích ở docstring)
        if idx == 0:
            depth = 0
        elif idx == 1:
            depth = 1
        else:
            depth = compute_depth(left, leading_tabs)

        css_class, clean_name = classify(text_content)

        # Nếu classify trả tên rỗng -> bỏ qua node này
        if not clean_name:
            continue

        nodes.append((depth, css_class, clean_name))

    return nodes


# ═══════════════════════════════════════════════════════════════════════
# BƯỚC 5: CHUẨN HOÁ THẾ HỆ (NORMALIZE)
# ═══════════════════════════════════════════════════════════════════════

def normalize_depths(nodes: list) -> list:
    """
    Đảm bảo thế hệ không bị "nhảy bước" theo chiều sâu.

    Vấn đề:
        Nếu raw depth đi từ 3 → 7 (nhảy 4 cấp), cây HTML sẽ có "lỗ hổng"
        vì không có node ở thế hệ 4, 5, 6 để làm cầu nối.

    Giải pháp:
        Duyệt tuần tự theo thứ tự xuất hiện trong docx. Dùng stack để theo
        dõi CHUỖI TỔ TIÊN hiện tại. Với mỗi node mới:
            - Pop khỏi stack tất cả node có depth >= depth hiện tại
              (những node đó không thể là tổ tiên của node mới).
            - Node mới sẽ có depth = min(raw_depth, parent_depth + 1).

    Tham số:
        nodes: list các (depth, css_class, name) từ build_nodes()

    Trả về:
        list đã được chuẩn hoá, giữ nguyên thứ tự và tên.
    """
    fixed = []
    stack = []  # stack chứa fixed_depth của các tổ tiên hiện hành

    for raw_depth, css_class, name in nodes:
        # Bỏ khỏi stack những node không còn là tổ tiên
        while stack and stack[-1] >= raw_depth:
            stack.pop()

        # Cha trực tiếp là phần tử trên cùng stack (nếu có)
        parent_depth = stack[-1] if stack else -1

        # Depth cuối cùng KHÔNG được vượt quá (cha + 1)
        final_depth = min(raw_depth, parent_depth + 1)

        stack.append(final_depth)
        fixed.append((final_depth, css_class, name))

    return fixed


# ═══════════════════════════════════════════════════════════════════════
# BƯỚC 6: SINH MÃ HTML <UL><LI> LỒNG NHAU
# ═══════════════════════════════════════════════════════════════════════

def render_tree(nodes: list) -> str:
    """
    Sinh mã HTML cây gia phả từ danh sách nodes đã chuẩn hoá.

    Nguyên tắc so sánh depth giữa node hiện tại và node trước đó:
        - depth > prev_depth  → mở thêm (depth - prev_depth) cặp <ul><li>.
        - depth == prev_depth → đóng </li> cũ, mở <li> mới (anh em cùng cấp).
        - depth < prev_depth  → đóng (prev - depth) tầng </li></ul>, sau đó
                                đóng </li> và mở <li> mới.

    Kết quả là một chuỗi HTML hợp lệ có dạng:
        <li>
          <div class="node ancestor d0">...</div>
          <ul>
            <li>...</li>
            <li>...</li>
          </ul>
        </li>

    Tham số:
        nodes: list[(depth, css_class, name)] đã normalize

    Trả về:
        str - HTML của cây (KHÔNG bao gồm <ul> ngoài cùng, vì index.html
        đã có sẵn <ul> mở/đóng).
    """
    out = []
    prev_depth = -1

    for idx, (depth, css_class, name) in enumerate(nodes):
        # Escape các ký tự đặc biệt trong HTML: < > & "
        safe_name = htmllib.escape(name)

        # Chọn class size theo depth - giới hạn tối đa MAX_DEPTH_CLASS
        depth_class = f'd{min(depth, MAX_DEPTH_CLASS)}'

        # HTML của node hiện tại
        node_html = (
            f'<div class="node {css_class} {depth_class}">'
            f'<span class="nm">{safe_name}</span>'
            f'</div>'
        )

        # ── Node đầu tiên: chỉ mở <li> và đặt node vào ────────────
        if idx == 0:
            out.append('<li>')
            out.append(node_html)
            prev_depth = depth
            continue

        # ── Node tiếp theo: xử lý 3 trường hợp so với prev_depth ──
        if depth > prev_depth:
            # Sâu hơn: mở thêm <ul><li> cho mỗi tầng sâu thêm
            for _ in range(depth - prev_depth):
                out.append('<ul>')
                out.append('<li>')
            out.append(node_html)

        elif depth == prev_depth:
            # Ngang cấp: đóng node cũ, mở node mới (anh em)
            out.append('</li>')
            out.append('<li>')
            out.append(node_html)

        else:  # depth < prev_depth
            # Quay về cấp nông hơn: đóng nhiều tầng </li></ul>
            for _ in range(prev_depth - depth):
                out.append('</li>')
                out.append('</ul>')
            out.append('</li>')
            out.append('<li>')
            out.append(node_html)

        prev_depth = depth

    # Đóng toàn bộ các tầng còn mở ở cuối
    for _ in range(prev_depth):
        out.append('</li>')
        out.append('</ul>')
    out.append('</li>')

    return '\n'.join(out)


# ═══════════════════════════════════════════════════════════════════════
# BƯỚC 7: CHÈN CÂY MỚI VÀO INDEX.HTML
# ═══════════════════════════════════════════════════════════════════════

def inject_into_html(html_path: str, tree_html: str) -> None:
    """
    Mở file index.html, tìm khối <div class="tree"><ul>...</ul></div>
    và thay thế phần <ul>...</ul> bên trong bằng cây mới.

    Lưu ý:
        - Không động vào CSS, JavaScript, header, footer, nút xuất ảnh.
        - Chỉ thay duy nhất phần NỘI DUNG giữa <ul> và </ul> ngoài cùng
          của khối .tree.

    Tham số:
        html_path: đường dẫn index.html
        tree_html: HTML cây gia phả (đã sinh từ render_tree)
    """
    # Đọc toàn bộ file HTML
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Regex tìm khối <div class="tree"><ul> ... </ul></div>
    # Cờ re.DOTALL để . khớp cả ký tự xuống dòng.
    pattern = re.compile(
        r'(<div class="tree">\s*<ul>)(.*?)(</ul>\s*</div>)',
        re.DOTALL
    )

    # Nội dung mới nhét vào giữa <ul> và </ul>
    new_inner = '\n' + tree_html + '\n    '

    new_html, count_replaced = pattern.subn(
        lambda m: m.group(1) + new_inner + m.group(3),
        html,
        count=1  # Chỉ thay 1 lần duy nhất (phòng trường hợp có nhiều khối)
    )

    if count_replaced == 0:
        raise RuntimeError(
            'Không tìm thấy khối <div class="tree"><ul>...</ul></div> '
            'trong index.html. Bạn đã sửa cấu trúc file HTML ư?'
        )

    # Cập nhật tiêu đề phụ (h2) cho khớp với cụ tổ trong docx
    new_html = re.sub(
        r'<h2>[^<]*</h2>',
        '<h2>Cụ Tổ: Cụ Ô Liễu M20.10 — V.Cụ B.Hàng (hiệu Từ Cần) M4.7</h2>',
        new_html,
        count=1
    )

    # Ghi đè file HTML
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_html)


# ═══════════════════════════════════════════════════════════════════════
# HÀM ĐIỀU PHỐI (MAIN)
# ═══════════════════════════════════════════════════════════════════════

def main() -> None:
    """Chạy toàn bộ pipeline: đọc docx → dựng cây → cập nhật index.html."""
    print(f'[1/5] Đọc dữ liệu từ: {DOCX_PATH}')
    raw_nodes = build_nodes(DOCX_PATH)
    print(f'      -> tổng {len(raw_nodes)} node (chưa chuẩn hoá)')

    print('[2/5] Chuẩn hoá thế hệ (normalize depths)...')
    fixed_nodes = normalize_depths(raw_nodes)

    # Thống kê độ sâu để debug (dùng Counter - import cục bộ cho gọn)
    from collections import Counter
    dist = Counter(d for d, _, _ in fixed_nodes)
    print(f'      -> phân bố thế hệ: {dict(sorted(dist.items()))}')

    print('[3/5] Sinh mã HTML cây...')
    tree_html = render_tree(fixed_nodes)

    print(f'[4/5] Chèn vào: {HTML_PATH}')
    inject_into_html(HTML_PATH, tree_html)

    print('[5/5] Hoàn tất!')
    print()
    print('Bây giờ bạn có thể mở index.html bằng trình duyệt để xem cây.')


if __name__ == '__main__':
    main()
