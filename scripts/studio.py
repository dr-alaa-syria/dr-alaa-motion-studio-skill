#!/usr/bin/env python3
"""
Dr Alaa Motion Studio: command-line production tool.

Commands:
  check                          Check tools and paths
  init                           Create the workspace folders
  templates                      List templates and brands
  new --type remotion --template promo --name My_Promo [--brand example]
  new --type blender  --template product --name Shot_01 [--brand example] [--product model.glb]
  build --project Shot_01        Build the Blender scene for a product project
  render --project My_Promo --comp Promo-Short-9x16[,Promo-Short-16x9] [--preview] [--alpha]
  still --project My_Promo --comp Promo-Short-9x16 --frames 30,90 [--scale 0.5]
  blender-shot --project Shot_01 --shot push --format 9x16 [--percent 50] [--transparent]
  export --input file.mp4 --preset social_9x16_native
  sfx [--overwrite]              Generate the sound effects pack
  music [--bpm 120] [--bars 32]  Generate the music bed
  lockups --brand example        Re-extract logo lockups from the brand SVGs
  archive --project My_Promo     Zip a project (without node_modules and renders)

Settings (first match wins):
  Workspace: MOTION_STUDIO_WORKSPACE, then "workspace" in studio.config.json, then ~/MotionStudio
  Blender:   BLENDER_PATH, then "blender" in studio.config.json, then auto-detect
  Chrome:    CHROME_PATH, then "chrome" in studio.config.json, then auto-detect
"""

from __future__ import annotations

import argparse
import datetime as dt
import glob
import json
import os
import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCRIPTS = REPO / "scripts"
TEMPLATES = REPO / "templates"
BRANDS = REPO / "brands"
PRESETS_FILE = REPO / "presets" / "export_presets.json"
CONFIG_FILE = REPO / "studio.config.json"
KIT_DIR = TEMPLATES / "remotion-kit"

NAME_RE = re.compile(r"^[A-Za-z0-9_-]{1,60}$")
ARCHIVE_EXCLUDE = {"node_modules", "out", ".cache", ".remotion"}
WORKSPACE_DIRS = [
    "audio/sfx", "audio/music",
    "projects/remotion", "projects/blender",
    "renders/remotion", "renders/blender",
    "exports/final", "exports/social", "exports/masters", "exports/audio",
    "archive",
]


def log(msg: str) -> None:
    print(msg, flush=True)


def fail(msg: str) -> None:
    raise SystemExit(f"ERROR: {msg}")


# ---------------------------------------------------------------- settings

def load_config() -> dict:
    if CONFIG_FILE.exists():
        return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    return {}


def setting(key: str, env: str | None = None) -> str | None:
    if env and os.environ.get(env):
        return os.environ[env]
    return load_config().get(key) or None


def workspace() -> Path:
    value = setting("workspace", "MOTION_STUDIO_WORKSPACE")
    return Path(value).expanduser() if value else Path.home() / "MotionStudio"


def ensure_workspace() -> Path:
    ws = workspace()
    for d in WORKSPACE_DIRS:
        (ws / d).mkdir(parents=True, exist_ok=True)
    return ws


def find_blender() -> Path | None:
    explicit = setting("blender", "BLENDER_PATH")
    if explicit and Path(explicit).exists():
        return Path(explicit)
    found = shutil.which("blender")
    if found:
        return Path(found)
    base = os.environ.get("ProgramFiles", r"C:\Program Files")
    matches = sorted(glob.glob(os.path.join(base, "Blender Foundation", "Blender *", "blender.exe")), reverse=True)
    return Path(matches[0]) if matches else None


def find_chrome() -> Path | None:
    explicit = setting("chrome", "CHROME_PATH")
    if explicit and Path(explicit).exists():
        return Path(explicit)
    roots = [os.environ.get("ProgramFiles"), os.environ.get("ProgramFiles(x86)"), os.environ.get("LOCALAPPDATA")]
    for root in roots:
        if root:
            candidate = Path(root) / "Google" / "Chrome" / "Application" / "chrome.exe"
            if candidate.exists():
                return candidate
    return None


def require_tool(name: str) -> str:
    path = shutil.which(name)
    if not path:
        fail(f"'{name}' was not found on PATH. Install it and try again (see docs/INSTALL.md).")
    return path


def run(cmd: list[str], cwd: Path | None = None) -> None:
    """Run an external tool. Failures end with a short message; the tool's own output is shown above it."""
    try:
        subprocess.run(cmd, cwd=cwd, check=True)
    except subprocess.CalledProcessError as exc:
        fail(f"'{Path(cmd[0]).name}' stopped with exit code {exc.returncode}. See the messages above for the cause.")
    except OSError as exc:
        fail(f"could not start '{cmd[0]}': {exc}")


def first_line(cmd: list[str]) -> str:
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=60)
    except (OSError, subprocess.SubprocessError):
        return ""
    lines = (out.stdout or out.stderr).strip().splitlines()
    return lines[0].strip() if lines else ""


def python_script(script: str, *args: str) -> list[str]:
    return [sys.executable, "-I", str(SCRIPTS / script), *args]


# ---------------------------------------------------------------- templates and brands

def list_templates() -> list[dict]:
    found = []
    for meta_file in sorted(TEMPLATES.glob("*/TEMPLATE.json")):
        meta = json.loads(meta_file.read_text(encoding="utf-8"))
        meta["path"] = meta_file.parent
        found.append(meta)
    return found


def find_template(ttype: str, tid: str) -> dict:
    for meta in list_templates():
        if meta.get("type") == ttype and meta.get("id") == tid:
            return meta
    available = ", ".join(f"{m['type']}/{m['id']}" for m in list_templates()) or "none"
    fail(f"no template '{tid}' of type '{ttype}'. Available: {available}")
    raise AssertionError  # unreachable


def list_brands() -> list[str]:
    if not BRANDS.exists():
        return []
    return sorted(p.name for p in BRANDS.iterdir() if (p / "brand.json").exists())


def find_brand(bid: str) -> Path:
    bdir = BRANDS / bid
    if not (bdir / "brand.json").exists():
        fail(f"brand '{bid}' not found in {BRANDS}. Available: {', '.join(list_brands()) or 'none'}")
    if not (bdir / "lockups.json").exists():
        log(f"Extracting logo lockups for brand '{bid}'...")
        run(python_script("brand_extract_lockups.py", "--brand", bid))
    return bdir


def kit_version() -> str:
    index = KIT_DIR / "src" / "kit" / "index.ts"
    match = re.search(r"KIT_VERSION\s*=\s*'([^']+)'", index.read_text(encoding="utf-8")) if index.exists() else None
    return match.group(1) if match else "unknown"


def write_meta(pdir: Path, name: str, ptype: str, tid: str, brand: str) -> None:
    meta = {
        "name": name,
        "type": ptype,
        "template": tid,
        "brand": brand,
        "created": dt.datetime.now().isoformat(timespec="seconds"),
        "kit_version": kit_version() if ptype == "remotion" else None,
    }
    (pdir / "project.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")


# ---------------------------------------------------------------- shared assets

def ensure_sfx(ws: Path) -> Path:
    sfx_dir = ws / "audio" / "sfx"
    if not any(sfx_dir.glob("*.wav")):
        log("Generating the sound effects pack...")
        run(python_script("sfx_synth.py", "--out", str(sfx_dir)))
    return sfx_dir


def ensure_music(ws: Path, name: str) -> Path:
    path = ws / "audio" / "music" / name
    if not path.exists():
        log("Generating the music bed...")
        run(python_script("music_bed.py", "--out", str(path)))
    return path


# ---------------------------------------------------------------- project creation

def install_brand(pdir: Path, bdir: Path) -> None:
    (pdir / "src" / "brand").mkdir(parents=True, exist_ok=True)
    for f in ("brand.json", "lockups.json"):
        shutil.copy2(bdir / f, pdir / "src" / "brand" / f)
    for sub in ("logo", "fonts"):
        if (bdir / sub).is_dir():
            shutil.copytree(bdir / sub, pdir / "public" / "brand" / sub, dirs_exist_ok=True)


def create_remotion_project(ws: Path, args: argparse.Namespace, tpl: dict, bdir: Path) -> None:
    pdir = ws / "projects" / "remotion" / args.name
    if pdir.exists():
        fail(f"project already exists and will not be overwritten: {pdir}")
    shutil.copytree(KIT_DIR, pdir, ignore=shutil.ignore_patterns("README.md"))
    shutil.copytree(tpl["path"], pdir, dirs_exist_ok=True,
                    ignore=shutil.ignore_patterns("TEMPLATE.json", "README.md", "__pycache__"))
    install_brand(pdir, bdir)
    shutil.copytree(ensure_sfx(ws), pdir / "public" / "sfx", dirs_exist_ok=True)
    music = ensure_music(ws, tpl.get("music", "music_bed_120bpm.wav"))
    (pdir / "public" / "music").mkdir(parents=True, exist_ok=True)
    shutil.copy2(music, pdir / "public" / "music" / "bed.wav")
    (pdir / "assets").mkdir(exist_ok=True)
    (pdir / "exports").mkdir(exist_ok=True)
    write_meta(pdir, args.name, "remotion", tpl["id"], args.brand)
    log(f"OK: project created: {pdir}")
    log("NEXT: " + tpl.get("next", "").replace("{name}", args.name))


def create_blender_project(ws: Path, args: argparse.Namespace, tpl: dict, bdir: Path) -> None:
    pdir = ws / "projects" / "blender" / args.name
    if pdir.exists():
        fail(f"project already exists and will not be overwritten: {pdir}")
    pdir.mkdir(parents=True)
    for f in tpl["path"].iterdir():
        if f.is_file() and f.name not in ("TEMPLATE.json", "README.md"):
            shutil.copy2(f, pdir / f.name)
    (pdir / "brand").mkdir()
    shutil.copy2(bdir / "brand.json", pdir / "brand" / "brand.json")
    if args.product:
        src = Path(args.product).expanduser().resolve()
        if not src.exists():
            fail(f"product model not found: {src}")
        (pdir / "models").mkdir()
        shutil.copy2(src, pdir / "models" / src.name)
    write_meta(pdir, args.name, "blender", tpl["id"], args.brand)
    log(f"OK: project created: {pdir}")
    if find_blender():
        build_blender(pdir, args.name)
    else:
        log("WARN: Blender was not found. Set BLENDER_PATH or 'blender' in studio.config.json, then run:")
        log(f"      python scripts/studio.py build --project {args.name}")
    log("NEXT: " + tpl.get("next", "").replace("{name}", args.name))


def build_blender(pdir: Path, name: str) -> None:
    blender = find_blender()
    if not blender:
        fail("Blender was not found. Set BLENDER_PATH or 'blender' in studio.config.json.")
    models = sorted((pdir / "models").glob("*")) if (pdir / "models").exists() else []
    cmd = [str(blender), "--background", "--factory-startup",
           "--python", str(pdir / "build_product_scene.py"), "--",
           "--brand", str(pdir / "brand" / "brand.json"), "--out", str(pdir / f"{name}.blend")]
    if models:
        cmd += ["--product", str(models[0])]
    log("Building the Blender scene...")
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if "SCENE_SAVED" not in result.stdout:
        log(result.stdout[-2000:])
        log(result.stderr[-2000:])
        fail("Blender scene build failed (details above).")
    log(f"OK: scene ready: {pdir / (name + '.blend')}")


# ---------------------------------------------------------------- project lookup

def resolve_project(kind: str, value: str) -> Path:
    direct = Path(value).expanduser()
    if direct.is_dir():
        return direct.resolve()
    pdir = ensure_workspace() / "projects" / kind / value
    if pdir.is_dir():
        return pdir
    fail(f"{kind} project not found: {value} (looked in {pdir.parent})")
    raise AssertionError  # unreachable


def browser_flags() -> list[str]:
    chrome = find_chrome()
    return [f"--browser-executable={chrome}"] if chrome else []


def find_npx() -> str:
    return require_tool("npx")


def check_deps(pdir: Path) -> None:
    if not (pdir / "node_modules").exists():
        fail(f"dependencies are not installed. Run 'npm ci' inside: {pdir}")


# ---------------------------------------------------------------- commands

def cmd_check(_: argparse.Namespace) -> int:
    log(f"Python: {sys.version.split()[0]}")
    try:
        import numpy  # noqa: F401
        log(f"numpy: {numpy.__version__}")
    except ImportError:
        log("numpy: NOT FOUND (run: pip install -r requirements.txt)")
    for tool in ("ffmpeg", "ffprobe", "node", "npm", "npx"):
        path = shutil.which(tool)
        log(f"{tool}: {path or 'NOT FOUND (required)'}")
    chrome = find_chrome()
    log(f"Chrome (for Remotion): {chrome or 'not found; set CHROME_PATH or let Remotion handle it'}")
    blender = find_blender()
    if blender:
        version = first_line([str(blender), "--version"])
        log(f"Blender (optional, product template): {version or 'version unknown'} at {blender}")
    else:
        log("Blender (optional, product template): not found")
    inkscape = os.environ.get("INKSCAPE_PATH") or shutil.which("inkscape")
    log(f"Inkscape (optional, lockup bounding boxes): {inkscape or 'not found'}")
    log(f"Workspace: {workspace()}")
    log(f"Config file: {CONFIG_FILE} ({'present' if CONFIG_FILE.exists() else 'absent'})")
    return 0


def cmd_init(_: argparse.Namespace) -> int:
    ws = ensure_workspace()
    log(f"OK: workspace ready: {ws}")
    if not CONFIG_FILE.exists():
        log("TIP: copy studio.config.example.json to studio.config.json to set custom paths.")
    return 0


def cmd_templates(_: argparse.Namespace) -> int:
    log("Templates (python scripts/studio.py new --type <type> --template <id> --name <name>):")
    for meta in list_templates():
        log(f"  {meta['type']}/{meta['id']}: {meta.get('title', '')}")
        for comp in meta.get("compositions", []):
            log(f"      - {comp}")
    log(f"Brands (--brand): {', '.join(list_brands()) or 'none'}")
    return 0


def cmd_new(args: argparse.Namespace) -> int:
    if not NAME_RE.match(args.name):
        fail("project name may contain only English letters, digits, '_' and '-' (max 60 characters)")
    ws = ensure_workspace()
    tpl = find_template(args.type, args.template)
    bdir = find_brand(args.brand)
    if args.type == "remotion":
        create_remotion_project(ws, args, tpl, bdir)
    else:
        create_blender_project(ws, args, tpl, bdir)
    return 0


def cmd_build(args: argparse.Namespace) -> int:
    pdir = resolve_project("blender", args.project)
    build_blender(pdir, pdir.name)
    return 0


def cmd_render(args: argparse.Namespace) -> int:
    pdir = resolve_project("remotion", args.project)
    check_deps(pdir)
    npx = find_npx()
    out_dir = ensure_workspace() / "renders" / "remotion" / pdir.name
    out_dir.mkdir(parents=True, exist_ok=True)
    for comp in [c.strip() for c in args.comp.split(",") if c.strip()]:
        suffix = "_preview" if args.preview else ""
        if args.alpha:
            out = out_dir / f"{comp}{suffix}_alpha.mov"
            extra = ["--codec=prores", "--prores-profile=4444", "--pixel-format=yuva444p10le", "--image-format=png"]
        else:
            out = out_dir / f"{comp}{suffix}.mp4"
            extra = []
        if out.exists() and not args.overwrite:
            fail(f"file exists and will not be replaced (use --overwrite): {out}")
        cmd = [npx, "remotion", "render", "src/index.ts", comp, str(out), *extra, *browser_flags()]
        if args.preview:
            cmd.append("--scale=0.5")
        if args.props:
            cmd.append(f"--props={Path(args.props).resolve()}")
        if args.frames:
            cmd.append(f"--frames={args.frames}")
        log(f"RENDER: {comp} -> {out}")
        run(cmd, cwd=pdir)
        log(f"OK: {out}")
    return 0


def cmd_still(args: argparse.Namespace) -> int:
    pdir = resolve_project("remotion", args.project)
    check_deps(pdir)
    npx = find_npx()
    out_dir = ensure_workspace() / "renders" / "remotion" / pdir.name / "stills"
    out_dir.mkdir(parents=True, exist_ok=True)
    for frame in [int(f) for f in args.frames.split(",") if f.strip()]:
        out = out_dir / f"{args.comp}_f{frame:04d}.png"
        cmd = [npx, "remotion", "still", "src/index.ts", args.comp, str(out), f"--frame={frame}", *browser_flags()]
        if args.scale != 1:
            cmd.append(f"--scale={args.scale}")
        if args.props:
            cmd.append(f"--props={Path(args.props).resolve()}")
        run(cmd, cwd=pdir)
        log(f"OK: {out}")
    return 0


def encode_sequence(frames_dir: Path, out: Path, transparent: bool) -> None:
    ffmpeg = require_tool("ffmpeg")
    if transparent:
        enc = ["-c:v", "prores_ks", "-profile:v", "4444", "-pix_fmt", "yuva444p10le"]
    else:
        enc = ["-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
               "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-movflags", "+faststart"]
    run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-framerate", "30",
         "-i", str(frames_dir / "frame_%04d.png"), *enc, str(out)])


def cmd_blender_shot(args: argparse.Namespace) -> int:
    pdir = resolve_project("blender", args.project)
    blender = find_blender()
    if not blender:
        fail("Blender was not found. Set BLENDER_PATH or 'blender' in studio.config.json.")
    blend = pdir / f"{pdir.name}.blend"
    if not blend.exists():
        fail(f"scene file missing: {blend}. Run: python scripts/studio.py build --project {pdir.name}")
    script = pdir / "render_shot.py"
    tag = f"{args.shot}_{args.format}" + ("_alpha" if args.transparent else "")
    ws = ensure_workspace()
    seq_dir = ws / "renders" / "blender" / pdir.name / tag
    cmd = [str(blender), "--background", str(blend), "--python", str(script), "--",
           "--shot", args.shot, "--format", args.format, "--percent", str(args.percent), "--out", str(seq_dir)]
    if args.frames:
        cmd += ["--frames", str(args.frames)]
    if args.samples:
        cmd += ["--samples", str(args.samples)]
    if args.transparent:
        cmd.append("--transparent")
    log(f"RENDER: {blend.name} [{tag}] at {args.percent}% -> {seq_dir}")
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    done = [line for line in result.stdout.splitlines() if line.startswith("SHOT_DONE")]
    if result.returncode != 0 or not done:
        log(result.stdout[-2000:])
        log(result.stderr[-2000:])
        fail("Blender render failed (details above).")
    log(f"OK: {done[-1]}")
    if args.no_encode:
        return 0
    video = seq_dir.parent / f"{tag}.{'mov' if args.transparent else 'mp4'}"
    if video.exists() and not args.overwrite:
        fail(f"file exists and will not be replaced (use --overwrite): {video}")
    encode_sequence(seq_dir, video, args.transparent)
    log(f"OK: video: {video}")
    if args.to_remotion:
        target = resolve_project("remotion", args.to_remotion) / "public" / "media"
        target.mkdir(parents=True, exist_ok=True)
        dst = target / f"{pdir.name}_{video.name}"
        shutil.copy2(video, dst)
        log(f"OK: copied to Remotion project: {dst} (in content.json use: \"src\": \"media/{dst.name}\")")
    return 0


def has_audible_audio(ffmpeg: str, src: Path) -> bool:
    """True when the first audio stream has a measurable level above -70 dB (volumedetect)."""
    probe = subprocess.run([ffmpeg, "-hide_banner", "-nostats", "-i", str(src), "-map", "0:a:0", "-vn",
                            "-af", "volumedetect", "-f", "null", "-"],
                           capture_output=True, text=True, encoding="utf-8", errors="replace")
    match = re.search(r"mean_volume:\s*(-?[\d.]+|-inf) dB", probe.stderr)
    if not match or match.group(1) == "-inf":
        return False
    return float(match.group(1)) > -70.0


def cmd_export(args: argparse.Namespace) -> int:
    ffmpeg = require_tool("ffmpeg")
    presets = json.loads(PRESETS_FILE.read_text(encoding="utf-8"))
    if args.preset not in presets:
        fail(f"unknown preset '{args.preset}'. Available: {', '.join(presets)}")
    preset = presets[args.preset]
    src = Path(args.input).expanduser().resolve()
    if not src.exists():
        fail(f"input not found: {src}")
    dest_dir = ensure_workspace() / preset["dest"]
    dest_dir.mkdir(parents=True, exist_ok=True)
    dst = dest_dir / f"{src.stem}_{args.preset}.{preset['ext']}"
    if dst.exists() and not args.overwrite:
        fail(f"file exists and will not be replaced (use --overwrite): {dst}")
    cmd = [ffmpeg, "-hide_banner", "-loglevel", "error", "-y" if args.overwrite else "-n", "-i", str(src)]
    if "vf" in preset:
        cmd += ["-vf", preset["vf"]]
    preset_args = list(preset["args"])
    # loudnorm returns NaN on silent or missing audio and the encoder then fails; skip it in that case
    if "-af" in preset_args and "loudnorm" in preset_args[preset_args.index("-af") + 1] \
            and not has_audible_audio(ffmpeg, src):
        i = preset_args.index("-af")
        del preset_args[i:i + 2]
        log("NOTE: source audio is silent or missing, so loudness normalization was skipped.")
    cmd += preset_args
    cmd.append(str(dst))
    run(cmd)
    log(f"OK: exported: {dst}")
    return 0


def cmd_sfx(args: argparse.Namespace) -> int:
    ws = ensure_workspace()
    cmd = python_script("sfx_synth.py", "--out", str(ws / "audio" / "sfx"))
    if args.overwrite:
        cmd.append("--overwrite")
    run(cmd)
    return 0


def cmd_music(args: argparse.Namespace) -> int:
    ws = ensure_workspace()
    out = ws / "audio" / "music" / f"music_bed_{int(args.bpm)}bpm.wav"
    cmd = python_script("music_bed.py", "--bpm", str(args.bpm), "--bars", str(args.bars), "--out", str(out))
    if args.overwrite:
        cmd.append("--overwrite")
    run(cmd)
    return 0


def cmd_lockups(args: argparse.Namespace) -> int:
    if not (BRANDS / args.brand / "brand.json").exists():
        fail(f"brand '{args.brand}' not found in {BRANDS}. Available: {', '.join(list_brands()) or 'none'}")
    run(python_script("brand_extract_lockups.py", "--brand", args.brand))
    return 0


def cmd_archive(args: argparse.Namespace) -> int:
    ws = ensure_workspace()
    pdir = None
    for kind in ("remotion", "blender"):
        candidate = ws / "projects" / kind / args.project
        if candidate.is_dir():
            pdir = candidate
            break
    if pdir is None:
        fail(f"project not found in the workspace: {args.project}")
    stamp = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_path = ws / "archive" / f"{pdir.name}_{stamp}.zip"
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in pdir.rglob("*"):
            if any(part in ARCHIVE_EXCLUDE for part in path.relative_to(pdir).parts):
                continue
            if path.is_file():
                zf.write(path, path.relative_to(pdir.parent))
                count += 1
    log(f"OK: archive: {zip_path} ({count} files). The original project was not changed.")
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Dr Alaa Motion Studio")
    sub = p.add_subparsers(dest="command", required=True)

    sub.add_parser("check", help="check tools and paths").set_defaults(func=cmd_check)
    sub.add_parser("init", help="create the workspace folders").set_defaults(func=cmd_init)
    sub.add_parser("templates", help="list templates and brands").set_defaults(func=cmd_templates)

    s = sub.add_parser("new", help="create a project from a template")
    s.add_argument("--type", required=True, choices=["remotion", "blender"])
    s.add_argument("--template", required=True)
    s.add_argument("--name", required=True)
    s.add_argument("--brand", default="example")
    s.add_argument("--product", help="blender product template: model file (GLB, GLTF, FBX or OBJ)")
    s.set_defaults(func=cmd_new)

    s = sub.add_parser("build", help="build the Blender scene of a product project")
    s.add_argument("--project", required=True)
    s.set_defaults(func=cmd_build)

    s = sub.add_parser("render", help="render Remotion compositions")
    s.add_argument("--project", required=True)
    s.add_argument("--comp", required=True, help="composition id, or several separated by commas")
    s.add_argument("--preview", action="store_true", help="half resolution for quick checks")
    s.add_argument("--alpha", action="store_true", help="ProRes 4444 with transparency")
    s.add_argument("--props", help="JSON file with values that override content.json")
    s.add_argument("--frames", help="frame range such as 0-59")
    s.add_argument("--overwrite", action="store_true")
    s.set_defaults(func=cmd_render)

    s = sub.add_parser("still", help="render still frames from a composition")
    s.add_argument("--project", required=True)
    s.add_argument("--comp", required=True)
    s.add_argument("--frames", required=True, help="for example 10,45,80")
    s.add_argument("--scale", type=float, default=1.0)
    s.add_argument("--props")
    s.set_defaults(func=cmd_still)

    s = sub.add_parser("blender-shot", help="render a product shot and encode it")
    s.add_argument("--project", required=True)
    s.add_argument("--shot", default="push", choices=["push", "orbit", "top"])
    s.add_argument("--format", default="16x9", choices=["16x9", "9x16"])
    s.add_argument("--frames", type=int, default=0)
    s.add_argument("--percent", type=int, default=50, help="resolution percent (50 for previews, 100 for finals)")
    s.add_argument("--samples", type=int, default=0)
    s.add_argument("--transparent", action="store_true", help="no background, ProRes 4444 with alpha")
    s.add_argument("--no-encode", action="store_true", help="keep the PNG sequence only")
    s.add_argument("--to-remotion", help="copy the video into a Remotion project's public/media")
    s.add_argument("--overwrite", action="store_true")
    s.set_defaults(func=cmd_blender_shot)

    s = sub.add_parser("export", help="export with a preset")
    s.add_argument("--input", required=True)
    s.add_argument("--preset", required=True)
    s.add_argument("--overwrite", action="store_true")
    s.set_defaults(func=cmd_export)

    s = sub.add_parser("sfx", help="generate the sound effects pack")
    s.add_argument("--overwrite", action="store_true")
    s.set_defaults(func=cmd_sfx)

    s = sub.add_parser("music", help="generate the music bed")
    s.add_argument("--bpm", type=float, default=120)
    s.add_argument("--bars", type=int, default=32)
    s.add_argument("--overwrite", action="store_true")
    s.set_defaults(func=cmd_music)

    s = sub.add_parser("lockups", help="re-extract logo lockups from a brand's SVG files")
    s.add_argument("--brand", required=True)
    s.set_defaults(func=cmd_lockups)

    s = sub.add_parser("archive", help="zip a project from the workspace")
    s.add_argument("--project", required=True)
    s.set_defaults(func=cmd_archive)
    return p


def main() -> int:
    args = build_parser().parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
