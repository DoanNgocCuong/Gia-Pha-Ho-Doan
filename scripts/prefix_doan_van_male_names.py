#!/usr/bin/env python3
"""Insert 'Đoàn Văn ' after each 'Ô.' in names for gender=male, excluding one subtree."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

# Byte-for-byte match with data/GiaPhaHoDoan.json (zero-width space U+200B before B1).
EXCLUDED_SUBTREE_ROOT_NAME = (
    "I. Cụ Hán M6.5-\u200bB1 Đức M19.8, B2 Ruyên M17.7, B3 Lý M11.9"
)

_PREFIX_PATTERN = re.compile(r"Ô\.\s*(?!\s*Đoàn Văn\b)")


def transform_name(name: str) -> str:
    return _PREFIX_PATTERN.sub("Ô. Đoàn Văn ", name)


def walk(node: dict, in_excluded_subtree: bool) -> None:
    name = node.get("name")
    in_subtree = in_excluded_subtree or name == EXCLUDED_SUBTREE_ROOT_NAME

    if (
        node.get("gender") == "male"
        and isinstance(name, str)
        and not in_subtree
    ):
        node["name"] = transform_name(name)

    for child in node.get("children") or []:
        walk(child, in_subtree)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Prefix male names: Ô. -> Ô. Đoàn Văn (except excluded subtree)."
    )
    parser.add_argument(
        "json_path",
        nargs="?",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "data" / "GiaPhaHoDoan.json",
        help="Path to GiaPhaHoDoan.json",
    )
    args = parser.parse_args()
    path: Path = args.json_path

    text = path.read_text(encoding="utf-8")
    data = json.loads(text)

    root = data.get("root")
    if not isinstance(root, dict):
        raise SystemExit("JSON missing object 'root'.")

    walk(root, False)

    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Updated {path}")


if __name__ == "__main__":
    main()
