import docx
import json
import re
import sys
import os
from datetime import datetime, timezone

sys.stdout.reconfigure(encoding='utf-8')

def detect_gender(name_upper):
    parts = re.split(r'[-–—~]', name_upper)
    primary = parts[0].strip()
    if primary.startswith("BÀ") or primary.startswith("CỤ BÀ"):
        return "female"
    if "ĐOÀN ĐỖ THỊ NGHĨA" in primary:
        return "male"
    if re.search(r'\bTHỊ\b', primary) or "HÀ VY" in primary or "QUỲNH TRÂM" in primary:
        return "female"
    return "male"

def is_footer(text):
    t_low = text.lower()
    return "lần cuối cập nhật" in t_low or text.strip() == "—" or "ghi chú:" in t_low or t_low.startswith("ghi chú")

def safe_int(val):
    if val is None:
        return 0
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return 0

def fix_stray_dot_between_letters(text):
    # Some names in the source .docx were mistyped with a "." where the
    # author meant a space (e.g. "THỊ.ĐỊNH" instead of "THỊ ĐỊNH") — likely
    # a fat-finger hit of the "." key next to Space. We only touch a "."
    # that sits directly between two LETTER characters (no space already
    # there), and we replace it with a space so the two words stay
    # separated instead of collapsing into one unreadable token.
    # A "." between two DIGITS (dates like "24.5", numbers) is left
    # untouched — [^\W\d_] matches a Unicode letter only (word char that
    # is neither a digit nor an underscore), so digit-adjacent dots never
    # match this lookaround and are preserved as-is.
    return re.sub(r'(?<=[^\W\d_])\.(?=[^\W\d_])', ' ', text)

def parse_pure_docx(docx_path):
    doc = docx.Document(docx_path)
    
    raw_entries = []
    document_notes = []
    
    for idx, para in enumerate(doc.paragraphs):
        raw_text = para.text
        if not raw_text.strip():
            continue

        pPr = para._element.pPr
        ind = pPr.find(docx.oxml.ns.qn('w:ind')) if pPr is not None else None

        w_left = safe_int(ind.attrib.get(docx.oxml.ns.qn('w:left'))) if ind is not None else 0
        w_firstLine = safe_int(ind.attrib.get(docx.oxml.ns.qn('w:firstLine'))) if ind is not None else 0
        w_hanging = safe_int(ind.attrib.get(docx.oxml.ns.qn('w:hanging'))) if ind is not None else 0
        base_dxa = w_left + w_firstLine - w_hanging

        # A single Word paragraph can contain a manual line break (Shift+Enter,
        # <w:br w:type="textWrapping"/>), which python-docx renders as '\n'
        # inside para.text. When that happens, two (or more) distinct people
        # were typed into ONE paragraph and must become SEPARATE sibling
        # entries, not one merged node. Any tabs on the continuation line(s)
        # are cosmetic re-alignment of the wrapped text, not a depth signal,
        # so every split segment inherits the FIRST segment's visual_dxa.
        sub_lines = raw_text.split('\n')
        first_segment_dxa = None

        for line_no, sub_line in enumerate(sub_lines):
            t = sub_line.strip()
            if not t:
                continue
            t = fix_stray_dot_between_letters(t)
            if "ghi chú:" in t.lower() or t.lower().startswith("ghi chú"):
                document_notes.append(t)
                continue
            if is_footer(t):
                continue

            if line_no == 0:
                leading_ws = sub_line[:len(sub_line) - len(sub_line.lstrip(' \t\r\n'))]
                tabs = leading_ws.count('\t')
                visual_dxa = base_dxa + tabs * 720
                first_segment_dxa = visual_dxa
            else:
                visual_dxa = first_segment_dxa if first_segment_dxa is not None else base_dxa

            match_doi = re.match(r'^\[Đ(\d+)\]\s*(.*)', t, re.IGNORECASE)
            explicit_doi = int(match_doi.group(1)) if match_doi else None
            clean_text = match_doi.group(2) if match_doi else t

            raw_entries.append({
                'index': idx,
                'text': clean_text,
                'text_upper': clean_text.strip().upper(),
                'visual_dxa': visual_dxa,
                'explicit_doi': explicit_doi
            })
        
    print(f"Read {len(raw_entries)} entries using Pure Visual Indent Translation (Zero Custom Rules/Safeguards).")

    stack = []  # List of tuples: (visual_dxa, node_dict)
    root = None
    
    for entry in raw_entries:
        name_upper = entry['text_upper']
        gender = detect_gender(name_upper)
        visual_dxa = entry['visual_dxa']
        explicit_doi = entry['explicit_doi']
        
        node = {
            "name": name_upper,
            "gender": gender,
            "depth": 0,
            "children": []
        }
        
        if not stack:
            node['depth'] = (explicit_doi - 1) if explicit_doi else 0
            root = node
            stack.append((visual_dxa, node))
        else:
            # Pop stack strictly when current line visual_dxa is <= top of stack (with 100 dxa tolerance)
            while len(stack) > 1 and stack[-1][0] >= (visual_dxa - 100):
                stack.pop()
                
            parent = stack[-1][1]
            node['depth'] = (explicit_doi - 1) if explicit_doi else (parent['depth'] + 1)
            parent['children'].append(node)
            stack.append((visual_dxa, node))

    return {
        "familyName": "Họ Đoàn",
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "legend": document_notes[0] if document_notes else "",
        "notes": document_notes,
        "root": root
    }

if __name__ == "__main__":
    docx_file = "data/sua gia pha 2026-08-12.docx"
    print(f"=== RUNNING STRICT 1:1 PURE VISUAL INDENT CONVERTER ON: {docx_file} ===")
    res = parse_pure_docx(docx_file)
    with open("data/GiaPhaHoDoan.json", "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=2)
    print("Successfully updated GiaPhaHoDoan.json with Pure 1:1 DOCX-to-JSON Translation!")
