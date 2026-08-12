import docx
import json
import re
import sys
import os
from datetime import datetime, timezone

sys.stdout.reconfigure(encoding='utf-8')

def extract_year(text):
    m = re.search(r'\b(NS|SN)\s*([12][0-9]{3})\b', text, re.IGNORECASE)
    if m:
        return int(m.group(2))
    m2 = re.findall(r'\b([12][0-9]{3})\b', text)
    for y_str in m2:
        y = int(y_str)
        if 1850 <= y <= 2026:
            return y
    return None

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

def parse_visual_docx(docx_path):
    doc = docx.Document(docx_path)
    
    raw_entries = []
    document_notes = []
    
    for idx, para in enumerate(doc.paragraphs):
        t = para.text.strip()
        if not t:
            continue
        if "ghi chú:" in t.lower() or t.lower().startswith("ghi chú"):
            document_notes.append(t)
            continue
        if is_footer(t):
            continue
            
        pPr = para._element.pPr
        ind = pPr.find(docx.oxml.ns.qn('w:ind')) if pPr is not None else None
        
        w_left = safe_int(ind.attrib.get(docx.oxml.ns.qn('w:left'))) if ind is not None else 0
        w_firstLine = safe_int(ind.attrib.get(docx.oxml.ns.qn('w:firstLine'))) if ind is not None else 0
        w_hanging = safe_int(ind.attrib.get(docx.oxml.ns.qn('w:hanging'))) if ind is not None else 0
        
        tabs = len(para.text) - len(para.text.lstrip('\t'))
        
        # Calculate EXACT visual horizontal start position in dxa
        visual_dxa = w_left + w_firstLine - w_hanging + tabs * 720
        
        match_doi = re.match(r'^\[Đ(\d+)\]\s*(.*)', t, re.IGNORECASE)
        explicit_doi = int(match_doi.group(1)) if match_doi else None
        clean_text = match_doi.group(2) if match_doi else t
        
        raw_entries.append({
            'index': idx,
            'text': clean_text,
            'text_upper': clean_text.strip().upper(),
            'visual_dxa': visual_dxa,
            'explicit_doi': explicit_doi,
            'birth_year': extract_year(clean_text)
        })
        
    print(f"Read {len(raw_entries)} valid entries using Visual Indent Calculation.")

    stack = []
    root = None
    
    for entry in raw_entries:
        name_upper = entry['text_upper']
        gender = detect_gender(name_upper)
        year = entry['birth_year']
        visual_dxa = entry['visual_dxa']
        explicit_doi = entry['explicit_doi']
        
        node = {
            "name": name_upper,
            "gender": gender,
            "depth": 0,
            "children": [],
            "visual_dxa": visual_dxa,
            "year": year
        }
        
        if not stack:
            node['depth'] = (explicit_doi - 1) if explicit_doi else 0
            root = node
            stack.append(node)
        else:
            # Pop stack if current line visual_dxa is smaller or equal (with 100 dxa tolerance)
            while len(stack) > 1 and stack[-1]['visual_dxa'] >= (visual_dxa - 100):
                stack.pop()
                
            parent = stack[-1]
            
            # Safeguard 1: Honorific / Early Death
            while len(stack) > 1 and any(term in parent['name'] for term in ["CHẾT SỚM", "(K.CON)", "KHÔNG CON"]):
                stack.pop()
                parent = stack[-1]
                
            # Safeguard 2: Biological Age
            while len(stack) > 1:
                p_year = parent.get('year')
                if year and p_year and (0 <= (year - p_year) < 15 or (year - p_year) < 0):
                    stack.pop()
                    parent = stack[-1]
                else:
                    break
                    
            node['depth'] = (explicit_doi - 1) if explicit_doi else (parent['depth'] + 1)
            parent['children'].append(node)
            stack.append(node)

    def clean_tree(n):
        return {
            "name": n['name'],
            "gender": n['gender'],
            "depth": n['depth'],
            "children": [clean_tree(c) for c in n['children']]
        }

    return {
        "familyName": "Họ Đoàn",
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "legend": document_notes[0] if document_notes else "",
        "notes": document_notes,
        "root": clean_tree(root)
    }

if __name__ == "__main__":
    docx_file = "data/sua gia pha 2026-08-12.docx"
    print(f"=== TESTING VISUAL INDENT PARSER ON: {docx_file} ===")
    res = parse_visual_docx(docx_file)
    with open("data/GiaPhaHoDoan.json", "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=2)
    print("Successfully updated GiaPhaHoDoan.json with Visual Indent Formula!")
