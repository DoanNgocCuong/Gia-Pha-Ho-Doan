"""
========================================================================
 Công cụ 1: TRÍCH XUẤT VĂN BẢN THÔ từ file Word (.docx)
========================================================================

Mục đích:
---------
- Đọc toàn bộ đoạn văn (paragraph) trong file .docx của gia phả.
- Ghi ra file .txt dạng UTF-8 để tiện xem nhanh nội dung.
- Mỗi dòng xuất ra có định dạng:
        [<style>|tabs=<n>] <nội dung paragraph>

Khi nào dùng:
-------------
- Khi bạn muốn "xem nhanh" xem docx có những dòng nào trước khi dựng cây.
- Khi muốn debug encoding (tiếng Việt có dấu, ký tự đặc biệt).
- Đây là bước "tiền khảo sát" - không ảnh hưởng đến index.html.

Yêu cầu:
--------
- Python 3.8+
- Thư viện python-docx:  pip install python-docx

Cách chạy (PowerShell):
-----------------------
    python utils\extract_text.py

Sẽ tạo ra file:
    d:\GIT\Gia-Pha-Ho-Doan\utils\_out_text.txt

Nguyên tắc thiết kế (SOLID):
---------------------------
- Single Responsibility: file này CHỈ làm một việc - đọc & xuất text.
- Không sửa file gốc, không build HTML - chỉ "đọc-ghi".
========================================================================
"""

from docx import Document  # Thư viện đọc file Word .docx

# ──────────────────────────────────────────────────────────────────────
# CẤU HÌNH ĐƯỜNG DẪN
# ──────────────────────────────────────────────────────────────────────
# Đường dẫn tuyệt đối tới file gia phả Word
DOCX_PATH = r'd:\GIT\Gia-Pha-Ho-Doan\Cụ Liễu.docx'

# Đường dẫn file đầu ra (text thuần)
OUT_PATH = r'd:\GIT\Gia-Pha-Ho-Doan\utils\_out_text.txt'


def count_leading_tabs(text: str) -> int:
    """
    Đếm số ký tự tab (\t) ở đầu đoạn văn.

    Tại sao cần đếm tab?
    --------------------
    Trong file Word gia phả, có những dòng không dùng "thụt lề đoạn" (ind.left)
    mà dùng phím Tab để đẩy con chữ vào sâu. Những dòng này khi đọc ra sẽ có
    nhiều ký tự \t ở đầu - số tab chính là gợi ý thế hệ sâu thêm bao nhiêu cấp.

    Ví dụ: "\t\t\tb Sinh CB2..." -> có 3 tab -> dòng này sâu hơn bình thường 3 cấp.
    """
    tabs = 0
    for ch in text:
        if ch == '\t':
            tabs += 1
        else:
            # Gặp ký tự không phải tab -> dừng đếm
            break
    return tabs


def extract_paragraphs(docx_path: str) -> list:
    """
    Đọc tất cả paragraph trong file .docx và trả về list các dòng đã format.

    Mỗi phần tử trong list là một chuỗi dạng:
        [<tên_style>|tabs=<số_tab>] <nội_dung_dòng>

    - style_name: kiểu định dạng Word (ví dụ "Normal", "Heading 1"...)
    - tabs: số tab ở đầu dòng (để biết mức thụt lề)
    - nội_dung: chữ của dòng đó (giữ nguyên dấu tiếng Việt)

    Tham số:
        docx_path: đường dẫn tới file .docx

    Trả về:
        list[str] - danh sách các dòng đã format sẵn
    """
    # Mở file Word bằng python-docx
    doc = Document(docx_path)

    lines = []
    # Duyệt qua từng đoạn văn (paragraph) trong document theo đúng thứ tự xuất hiện
    for paragraph in doc.paragraphs:
        raw_text = paragraph.text

        # Lấy tên kiểu định dạng (style) nếu có
        style_name = ''
        try:
            if paragraph.style and paragraph.style.name:
                style_name = paragraph.style.name
        except Exception:
            # Nếu gặp lỗi khi đọc style (hiếm khi xảy ra), cứ bỏ qua
            style_name = ''

        # Đếm tab ở đầu dòng
        leading_tabs = count_leading_tabs(raw_text)

        # Ghép thành một dòng kết quả
        formatted = f'[{style_name}|tabs={leading_tabs}] {raw_text}'
        lines.append(formatted)

    return lines


def write_lines_utf8(lines: list, out_path: str) -> None:
    """
    Ghi danh sách dòng ra file .txt với encoding UTF-8.

    Tại sao phải ép UTF-8?
    ----------------------
    Console Windows mặc định dùng cp1252/cp437 - sẽ "nát" chữ tiếng Việt
    khi print trực tiếp. Ghi thẳng vào file UTF-8 là cách an toàn nhất
    để giữ nguyên các ký tự như ô, ũ, ễ, ạ, đ...
    """
    with open(out_path, 'w', encoding='utf-8') as f:
        for line in lines:
            f.write(line + '\n')


def main() -> None:
    """Hàm điều phối: đọc docx → xuất txt."""
    print(f'[1/2] Đang đọc: {DOCX_PATH}')
    lines = extract_paragraphs(DOCX_PATH)

    print(f'[2/2] Đang ghi ra: {OUT_PATH}')
    write_lines_utf8(lines, OUT_PATH)

    print(f'Hoàn tất! Tổng cộng {len(lines)} paragraph đã được xuất.')


# Chỉ chạy main() khi file này được gọi trực tiếp bằng `python extract_text.py`
# (không chạy khi được import từ file khác)
if __name__ == '__main__':
    main()
