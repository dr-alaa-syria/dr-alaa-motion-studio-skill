"""
يستخرج تركيبات الشعار الرسمية (Horizontal و Stacked) من ملفات SVG الخاصة بهوية ما،
ويكتبها إلى brands/<id>/lockups.json ليحرّكها قالب Remotion بدقة الملف الأصلي.

التشغيل:
  python -I scripts/brand_extract_lockups.py --brand example

الافتراض: ملف الـ lockup (نسخة Color-OnDark) فيه مجموعة <g> رئيسية تحتوي بالترتيب:
  1) مجموعة الرمز (transform فيها translate + scale)
  2) مجموعة الاسم (wordmark)
  3) مجموعة الجملة (tagline) — اختيارية
ألوان نسخة OnDark تُستبدل برموز: لون النص {fg}، ولون التمييز في الاسم {wmAccent} وفي الجملة {tagAccent}.
الإحداثيات (bbox) تُقاس بـ Inkscape إن وُجد، وإلا تُترك فارغة.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

STUDIO_ROOT = Path(__file__).resolve().parents[1]
BRANDS = STUDIO_ROOT / "brands"
# Inkscape اختياري: يُقاس منه bbox فقط. المسار من INKSCAPE_PATH أو من PATH، وإلا لا يُستخدم
INKSCAPE = Path(os.environ.get("INKSCAPE_PATH") or shutil.which("inkscape") or "inkscape-not-found")
SVG_NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG_NS)

TRANSFORM_RE = re.compile(r"translate\(([-\d.]+)[ ,]+([-\d.]+)\)(?:\s*scale\(([-\d.]+)\))?")


def parse_transform(value: str) -> dict:
    m = TRANSFORM_RE.search(value or "")
    if not m:
        raise SystemExit(f"ERROR: transform غير متوقع: {value!r}")
    return {"x": float(m.group(1)), "y": float(m.group(2)), "scale": float(m.group(3) or 1.0)}


def inner_markup(group: ET.Element, fg: str, accent: str, accent_token: str) -> str:
    parts = []
    for child in group:
        s = ET.tostring(child, encoding="unicode")
        s = s.replace(f' xmlns="{SVG_NS}"', "")
        s = re.sub(fg, "{fg}", s, flags=re.IGNORECASE)
        s = re.sub(accent, "{" + accent_token + "}", s, flags=re.IGNORECASE)
        parts.append(s)
    return "".join(parts)


def query_bboxes(svg_path: Path) -> dict[str, list[float]]:
    if not INKSCAPE.exists():
        return {}
    out = subprocess.run([str(INKSCAPE), "--query-all", str(svg_path)], capture_output=True, text=True, check=False)
    boxes = {}
    for line in out.stdout.splitlines():
        cols = line.strip().split(",")
        if len(cols) == 5:
            try:
                boxes[cols[0]] = [round(float(v), 3) for v in cols[1:]]
            except ValueError:
                pass
    return boxes


def extract(svg_path: Path, fg: str, accent: str) -> dict:
    root = ET.parse(svg_path).getroot()
    vb = [float(v) for v in root.attrib["viewBox"].split()]
    top = root.find(f"{{{SVG_NS}}}g")
    groups = list(top) if top is not None else []
    if len(groups) < 2:
        raise SystemExit(f"ERROR: لم أجد مجموعات الرمز والاسم في {svg_path.name}")

    mark_tr = parse_transform(groups[0].attrib.get("transform", ""))
    result = {
        "source": svg_path.name,
        "viewBox": vb,
        "mark": mark_tr,
        "wordmark": {
            "transform": parse_transform(groups[1].attrib.get("transform", "")),
            "svg": inner_markup(groups[1], fg, accent, "wmAccent"),
        },
    }
    if len(groups) > 2:
        result["tagline"] = {
            "transform": parse_transform(groups[2].attrib.get("transform", "")),
            "svg": inner_markup(groups[2], fg, accent, "tagAccent"),
        }

    # Inkscape يرقّم العناصر تلقائياً حسب ترتيبها: g6 = الرمز، g7 = الاسم، g9 = الجملة (لهذا الملف)
    # أول مجموعة هي الرئيسية، ثم الرمز والاسم والجملة بالترتيب
    boxes = query_bboxes(svg_path)
    sub = [v for k, v in boxes.items() if re.fullmatch(r"g\d+", k)][1:]
    if sub:
        result["markBox"] = sub[0]
    if len(sub) > 1:
        result["wordmark"]["bbox"] = sub[1]
    if len(sub) > 2 and "tagline" in result:
        result["tagline"]["bbox"] = sub[2]
    return result


def main() -> int:
    p = argparse.ArgumentParser(description="استخراج تركيبات الشعار إلى lockups.json")
    p.add_argument("--brand", required=True)
    args = p.parse_args()

    brand_dir = BRANDS / args.brand
    brand = json.loads((brand_dir / "brand.json").read_text(encoding="utf-8"))
    fg = brand["themes"]["dark"]["fg"]
    accent = brand["themes"]["dark"]["accent"]

    sources = {
        "horizontal": "logo/Horizontal/Example-Horizontal-Color-OnDark.svg",
        "horizontalNoTagline": "logo/Horizontal/Example-Horizontal-NoTagline-Color-OnDark.svg",
        "stacked": "logo/Stacked/Example-Stacked-Color-OnDark.svg",
    }
    sources = brand.get("logo", {}).get("lockupSources", sources)

    out = {}
    for key, rel in sources.items():
        path = brand_dir / rel
        if not path.exists():
            print(f"skip: {rel} غير موجود")
            continue
        out[key] = extract(path, fg, accent)
        print(f"OK: {key} <- {rel}")

    dst = brand_dir / "lockups.json"
    dst.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"OK: كُتب {dst}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
