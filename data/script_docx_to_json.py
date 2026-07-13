import json
import re
from datetime import datetime, timezone

# Các pattern nhận diện dòng footer/ghi chú (bỏ qua không parse vào cây)
_FOOTER_PATTERNS = [
    re.compile(r'lần cuối cập nhật', re.IGNORECASE),
    re.compile(r'^—+$'),
]

def _is_footer(text: str) -> bool:
    """Kiểm tra dòng có phải ghi chú/footer cần bỏ qua không.

    Các dòng bị loại: ghi chú "lần cuối cập nhật", dòng phân cách "—".
    Trả về True nếu dòng cần bỏ qua, False nếu là dữ liệu gia phả.
    """
    return any(p.search(text) for p in _FOOTER_PATTERNS)

def _detect_gender(name_upper: str) -> str:
    """Xác định giới tính dựa trên từ mở đầu của tên.

    Chỉ xét phần đầu tên (trước dấu gạch ngang chồng-vợ nếu có) để tránh nhầm với tên vợ/chồng
    đi kèm trong cùng một entry (vd: "ÔNG A - BÀ B" phải là male).

    Quy tắc (ưu tiên theo thứ tự):
      - Bắt đầu bằng "BÀ" hoặc "CỤ BÀ" → female
      - Chứa chữ "THỊ" hoặc tên nữ cụ thể "HÀ VY", "QUỲNH TRÂM" → female
      - Bắt đầu bằng "ÔNG" hoặc "CỤ ÔNG" → male
      - Không rõ → male (mặc định)
    """
    # Split bằng các loại dấu gạch ngang phổ biến: - (hyphen), – (en-dash), — (em-dash), ~ (tilde)
    parts = re.split(r'[-–—~]', name_upper)
    primary = parts[0].strip()
    
    if primary.startswith("BÀ") or primary.startswith("CỤ BÀ"):
        return "female"
    
    # Bổ sung kiểm tra các tên nữ không bắt đầu bằng "Bà" (như các cháu nhỏ)
    # Ngoại lệ đặc biệt: Cụ Đoàn Đỗ Thị Nghĩa là Nam giới
    if "ĐOÀN ĐỖ THỊ NGHĨA" in primary:
        return "male"

    if re.search(r'\bTHỊ\b', primary) or "HÀ VY" in primary or "QUỲNH TRÂM" in primary:
        return "female"
        
    return "male"

def _make_node(name: str, depth: int) -> dict:
    """Tạo một node gia phả theo schema chuẩn.

    Args:
        name:  Tên gốc (chưa uppercase) của người trong gia phả.
        depth: Cấp đời tính từ root (root = 0).

    Returns:
        dict với các trường: name (uppercase), gender, depth, children.
        Giới tính được suy ra từ từ mở đầu của tên qua _detect_gender().
    """
    name_upper = name.strip().upper()
    gender = _detect_gender(name_upper)
    return {"name": name_upper, "gender": gender, "depth": depth, "children": []}

def parse_docx_to_json(docx_path: str) -> dict:
    """Chuyển file .docx gia phả thành cây JSON.

    Dùng thuộc tính `left_indent` (đơn vị EMU) của từng paragraph trong Word
    để xác định quan hệ cha-con. Paragraph có indent nhỏ hơn là cha của
    paragraph có indent lớn hơn ngay sau nó.

    Xử lý đặc biệt cho paragraph thiếu indent (left_indent = None, không có tab):
    - Paragraph đầu tiên trong tài liệu → root tuyệt đối (indent nội bộ = -1).
    - Paragraph None ngay sau root (chưa có indent thực nào) → con trực tiếp của root.
    - Paragraph None xuất hiện giữa chừng → kế thừa indent của paragraph
      có indent thực gần nhất (xử lý trường hợp người dùng quên indent trong Word).

    Args:
        docx_path: Đường dẫn tới file .docx (yêu cầu thư viện python-docx).

    Returns:
        dict gồm familyName, exportedAt (ISO 8601 UTC), và root (cây node).
    """
    from docx import Document

    doc = Document(docx_path)
    stack = []
    root = None

    last_real_indent = None  # indent EMU của paragraph có fmt_indent thực sự gần nhất

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text or _is_footer(text):
            continue

        fmt_indent = para.paragraph_format.left_indent
        tab_count = len(para.text) - len(para.text.lstrip('\t'))

        if fmt_indent is None and tab_count == 0:
            if not stack:
                # Paragraph đầu tiên → root tuyệt đối (indent=-1 không bị pop bởi ai)
                indent = -1
            elif last_real_indent is None:
                # Ngay sau root, chưa thấy indent thực → level 0, là con của root
                indent = 0
            else:
                # Giữa chừng tài liệu: kế thừa indent của paragraph trước có indent thực
                # (paragraph bị quên không indent trong Word)
                indent = last_real_indent
        else:
            indent = (fmt_indent or 0) + tab_count * 457200
            last_real_indent = indent

        node = _make_node(text, depth=0)

        while stack and stack[-1]['indent'] >= indent:
            stack.pop()

        if not stack:
            node['depth'] = 0
            root = node
        else:
            parent = stack[-1]['node']
            node['depth'] = parent['depth'] + 1
            parent['children'].append(node)

        stack.append({'indent': indent, 'node': node})

    return {
        "familyName": "Họ Đoàn",
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "root": root,
    }

def parse_markdown_to_json(file_path: str) -> dict:
    """Chuyển file text/markdown gia phả thành cây JSON.

    Dùng số khoảng trắng đầu dòng (leading spaces) để xác định quan hệ cha-con.
    Tab được quy đổi thành 4 spaces trước khi đếm. Dòng có ít indent hơn
    là cha của dòng có nhiều indent hơn ngay sau nó.

    Dùng hàm này khi không có file .docx; kết quả kém chính xác hơn
    parse_docx_to_json vì markdown có thể mất thông tin indent của Word.

    Args:
        file_path: Đường dẫn tới file .txt hoặc .md, encoding UTF-8.

    Returns:
        dict gồm familyName, exportedAt (ISO 8601 UTC), và root (cây node).
    """
    stack = []
    root = None

    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            text = line.strip()
            if not text or _is_footer(text):
                continue

            expanded = line.replace('\t', '    ')
            leading_spaces = len(expanded) - len(expanded.lstrip(' '))

            node = _make_node(text, depth=0)

            while stack and stack[-1]['indent'] >= leading_spaces:
                stack.pop()

            if not stack:
                node['depth'] = 0
                root = node
            else:
                parent = stack[-1]['node']
                node['depth'] = parent['depth'] + 1
                parent['children'].append(node)

            stack.append({'indent': leading_spaces, 'node': node})

    return {
        "familyName": "Họ Đoàn",
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "root": root,
    }

if __name__ == "__main__":
    import sys, os

    docx_file = os.path.join(os.path.dirname(__file__), "sua gia pha 8.5.docx")
    md_file   = os.path.join(os.path.dirname(__file__), "sua gia pha 8.5 .docx.md")
    output_file = os.path.join(os.path.dirname(__file__), "GiaPhaHoDoan_updated.json")

    try:
        if os.path.exists(docx_file):
            print(f"Parsing từ docx: {docx_file}")
            data = parse_docx_to_json(docx_file)
        else:
            print(f"Không tìm thấy .docx, dùng markdown: {md_file}")
            data = parse_markdown_to_json(md_file)

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Đã xuất JSON: {output_file}")
    except Exception as e:
        print(f"Lỗi: {e}", file=sys.stderr)
        raise