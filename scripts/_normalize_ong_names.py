"""One-off: male nodes whose name starts with Ô. -> Ô. Đoàn Văn ... (if not already)."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "GiaPhaHoDoan.json"

# Ô + optional dot + spaces, capture rest
_PREFIX = re.compile(r"^Ô\.?\s*(.+)$", re.UNICODE)


def normalize_name(name: str) -> str:
    if not name or not isinstance(name, str):
        return name
    s = name.strip()
    m = _PREFIX.match(s)
    if not m:
        return name
    rest = m.group(1).strip()
    if rest.startswith("Đoàn Văn"):
        return name
    return "Ô. Đoàn Văn " + rest


def walk(o, stats: dict) -> None:
    if isinstance(o, dict):
        if o.get("gender") == "male" and isinstance(o.get("name"), str):
            old = o["name"]
            new = normalize_name(old)
            if new != old:
                o["name"] = new
                stats["changed"] += 1
        for v in o.values():
            walk(v, stats)
    elif isinstance(o, list):
        for item in o:
            walk(item, stats)


def main() -> int:
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DATA
    text = path.read_text(encoding="utf-8")
    data = json.loads(text)
    stats = {"changed": 0}
    walk(data, stats)
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    # ASCII-only for Windows consoles that are not UTF-8
    print("Updated %s male O.* names in %s" % (stats["changed"], path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
