"""
يرندر لقطة من مشهد المنتج إلى تسلسل PNG، ويكمل من حيث توقف (يتخطى الإطارات الموجودة).

التشغيل (عادةً عبر studio.py blender-shot):
  blender --background MyShot.blend --python render_shot.py -- \
      --shot push --format 16x9 --frames 90 --percent 50 --out <مجلد> [--samples 24] [--transparent]

--shot        push | orbit | top
--format      16x9 | 9x16 (العمودي: عدسة أوسع قليلاً حتى تبقى القاعدة داخل الإطار الضيق)
--frames      المدة بالفريمات (الحركة تُعاد توقيتها لتناسبها)
--transparent بدون الخلفية المنحنية والعالم (PNG بقناة شفافية) للتركيب في Remotion أو Kdenlive
"""

import argparse
import os
import sys
import time

import bpy


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--shot", default="push", choices=["push", "orbit", "top"])
    p.add_argument("--format", default="16x9", choices=["16x9", "9x16"])
    p.add_argument("--frames", type=int, default=0)
    p.add_argument("--percent", type=int, default=50)
    p.add_argument("--samples", type=int, default=0)
    p.add_argument("--transparent", action="store_true")
    p.add_argument("--only", default="", help="إطارات محددة مثل 1,45,90 (للمعاينة)")
    p.add_argument("--out", required=True)
    return p.parse_args(argv)


def main():
    a = parse_args()
    scene = bpy.context.scene
    base = int(scene.get("studio_frames", scene.frame_end))
    frames = a.frames or base

    cam = bpy.data.objects.get(f"CAM_{a.shot}")
    if cam is None:
        raise SystemExit(f"ERROR: الكاميرا CAM_{a.shot} غير موجودة في المشهد")
    scene.camera = cam
    base_lens = float(cam.data.get("base_lens", cam.data.lens))
    r = scene.render
    if a.format == "9x16":
        r.resolution_x, r.resolution_y = 1080, 1920
        cam.data.lens = base_lens * 0.82
    else:
        r.resolution_x, r.resolution_y = 1920, 1080
        cam.data.lens = base_lens
    r.resolution_percentage = max(10, min(100, a.percent))

    # إعادة توقيت الحركة لتناسب المدة المطلوبة
    r.frame_map_old = base
    r.frame_map_new = frames
    scene.frame_start, scene.frame_end = 1, frames

    if a.samples and hasattr(scene.eevee, "taa_render_samples"):
        scene.eevee.taa_render_samples = a.samples

    r.film_transparent = a.transparent
    cyc = bpy.data.objects.get("Cyclorama")
    if cyc is not None:
        cyc.hide_render = a.transparent
    r.image_settings.file_format = "PNG"
    r.image_settings.color_mode = "RGBA" if a.transparent else "RGB"

    os.makedirs(a.out, exist_ok=True)
    todo = [int(x) for x in a.only.split(",") if x.strip()] if a.only else list(range(1, frames + 1))
    done = skipped = 0
    t0 = time.time()
    for f in todo:
        path = os.path.join(a.out, f"frame_{f:04d}.png")
        if os.path.exists(path) and os.path.getsize(path) > 0:
            skipped += 1
            continue
        scene.frame_set(f)
        r.filepath = path
        bpy.ops.render.render(write_still=True)
        done += 1
        el = time.time() - t0
        print(f"FRAME {f}/{frames}  {el / done:.2f}s/frame", flush=True)
    print(f"SHOT_DONE rendered={done} skipped={skipped} seconds={time.time() - t0:.0f} out={a.out}", flush=True)


if __name__ == "__main__":
    main()
