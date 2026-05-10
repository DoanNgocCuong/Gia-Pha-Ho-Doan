#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Thêm trường tùy chọn wifeName cho node gender == "male" trong GiaPhaHoDoan.json.

Quy ước (theo plan):
- Giữ nguyên name.
- Chỉ thêm wifeName khi tách được đuôi không rỗng sau dấu phân tách đầu tiên.
- Chuẩn hoá: xoá U+200B (zero-width space) trước khi tách.
- Tách: regex whitespace, dấu -, whitespace (tối đa 1 lần) -> 2 phần -> wifeName = phần 2 strip (xem SPLIT_RE).
- Không ghi đè nếu đã có wifeName (string).
- Không thêm key nếu không tách được.

Chạy từ thư mục gốc repo:
  python utils/migrate_wife_name.py --dry-run
  python utils/migrate_wife_name.py
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

ZWSP = "\u200b"
SPLIT_RE = re.compile(r"\s*-\s*")


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def normalize_for_split(name: str) -> str:
    s = name.replace(ZWSP, "")
    # Gộp khoảng trắng thừa (giữ nguyên name gốc trong JSON; chỉ dùng cho logic tách)
    s = re.sub(r"[ \t]+", " ", s)
    return s.strip()


def extract_wife_tail(name: str) -> str | None:
    """Trả về đuôi sau dấu - đầu tiên, hoặc None nếu không hợp lệ."""
    if not name or not isinstance(name, str):
        return None
    norm = normalize_for_split(name)
    parts = SPLIT_RE.split(norm, maxsplit=1)
    if len(parts) != 2:
        return None
    tail = parts[1].strip()
    return tail if tail else None


def walk_nodes(node: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = [node]
    for ch in node.get("children") or []:
        if isinstance(ch, dict):
            out.extend(walk_nodes(ch))
    return out


def migrate_tree(root: Dict[str, Any], dry_run: bool) -> Tuple[int, int, int, int]:
    """
    Returns: (male_count, added_count, skipped_no_split, skipped_has_wife)
    """
    male_count = 0
    added = 0
    skipped_no = 0
    skipped_has = 0

    for n in walk_nodes(root):
        if n.get("gender") != "male":
            continue
        male_count += 1
        if "wifeName" in n and isinstance(n.get("wifeName"), str):
            skipped_has += 1
            continue
        tail = extract_wife_tail(n.get("name") or "")
        if tail is None:
            skipped_no += 1
            continue
        if not dry_run:
            n["wifeName"] = tail
        added += 1

    return male_count, added, skipped_no, skipped_has


def main() -> int:
    parser = argparse.ArgumentParser(description="Migrate wifeName for male nodes in GiaPhaHoDoan.json")
    parser.add_argument(
        "--input",
        type=Path,
        default=None,
        help="Đường dẫn JSON (mặc định: data/GiaPhaHoDoan.json dưới repo)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Ghi ra file này (mặc định: trùng --input khi không dry-run)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Chỉ in thống kê, không ghi file",
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Không tạo file .bak trước khi ghi (mặc định: có backup)",
    )
    args = parser.parse_args()

    root_dir = repo_root()
    in_path = args.input or (root_dir / "data" / "GiaPhaHoDoan.json")
    if not in_path.is_file():
        print(f"Không thấy file: {in_path}", file=sys.stderr)
        return 1

    with open(in_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, dict) or "root" not in data or not isinstance(data["root"], dict):
        print("JSON không có key root hợp lệ.", file=sys.stderr)
        return 1

    tree_root = data["root"]
    male_count, added, skipped_no, skipped_has = migrate_tree(tree_root, dry_run=args.dry_run)

    print("--- migrate_wife_name ---")
    print(f"input:     {in_path}")
    print(f"dry_run:   {args.dry_run}")
    print(f"male:      {male_count}")
    print(f"added:     {added}")
    print(f"skip(split): {skipped_no}")
    print(f"skip(has wifeName): {skipped_has}")

    if args.dry_run:
        return 0

    out_path = args.output or in_path
    if not args.no_backup and out_path == in_path:
        bak = in_path.with_suffix(in_path.suffix + ".bak")
        shutil.copy2(in_path, bak)
        print(f"backup:    {bak}")

    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"written:   {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
