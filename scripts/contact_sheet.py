"""
لوحة إطارات (contact sheet) من فيديو للمراجعة السريعة، عبر FFmpeg.

أمثلة:
  python -I contact_sheet.py --input clip.mp4 --frames 0,10,20,30 --cols 4
  python -I contact_sheet.py --input clip.mp4 --count 12 --cols 4 --width 480
الناتج افتراضياً بجانب الفيديو: <الاسم>_sheet.png (يُستبدل إن وُجد لأنه ملف مراجعة مؤقت).
"""

from __future__ import annotations

import argparse
import json
import math
import shutil
import subprocess
from pathlib import Path


def probe_frames(path: Path) -> int:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets",
         "-show_entries", "stream=nb_read_packets", "-of", "json", str(path)],
        capture_output=True, text=True, check=True,
    )
    return int(json.loads(out.stdout)["streams"][0]["nb_read_packets"])


def main() -> int:
    p = argparse.ArgumentParser(description="لوحة إطارات من فيديو")
    p.add_argument("--input", required=True)
    p.add_argument("--frames", help="أرقام الإطارات مفصولة بفواصل")
    p.add_argument("--count", type=int, default=12, help="عدد إطارات موزعة بالتساوي (إن لم تُحدد --frames)")
    p.add_argument("--cols", type=int, default=4)
    p.add_argument("--width", type=int, default=480, help="عرض الخلية بالبكسل")
    p.add_argument("--out")
    args = p.parse_args()

    if not shutil.which("ffmpeg"):
        raise SystemExit("ERROR: ffmpeg غير موجود في PATH")
    src = Path(args.input).resolve()
    if args.frames:
        frames = [int(f) for f in args.frames.split(",") if f.strip()]
    else:
        total = probe_frames(src)
        frames = [round(i * (total - 1) / max(1, args.count - 1)) for i in range(args.count)]
    rows = math.ceil(len(frames) / args.cols)
    sel = "+".join(f"eq(n\\,{f})" for f in frames)
    vf = (
        f"select='{sel}',scale={args.width}:-2,"
        f"tile={args.cols}x{rows}:padding=4:color=0x333333"
    )
    # الإطارات مرتبة من اليسار لليمين ومن الأعلى للأسفل، وأرقامها تُطبع في الطرفية
    out = Path(args.out) if args.out else src.with_name(f"{src.stem}_sheet.png")
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src), "-vf", vf,
         "-frames:v", "1", "-fps_mode", "passthrough", str(out)],
        check=True,
    )
    print(f"OK: {out}")
    print("frames:", ",".join(map(str, frames)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
