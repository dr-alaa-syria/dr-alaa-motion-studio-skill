# Installation

**Platform for v0.1.0:** Windows 11 64-bit only.

> **Status:** the steps were run on the author's machine (Windows 11, kernel 10.0.26300). A **clean Windows account or machine has NOT been tested**. Report any step that does not work. Versions used are listed in `THIRD_PARTY_NOTICES.md`, section 4.

## 1. Install the tools

| Tool | How | Check |
|---|---|---|
| Python 3.12 | Download from python.org. Tick "Add python.exe to PATH". | `python --version` |
| numpy | `pip install -r requirements.txt` (from the repository folder) | `python -c "import numpy"` |
| Node.js | Download from nodejs.org. Tested with v26.13.0 only. | `node --version`, `npm --version` |
| FFmpeg (with ffprobe) | Install a Windows build (for example from gyan.dev or with winget). Add its `bin` folder to PATH. | `ffmpeg -version`, `ffprobe -version` |
| Google Chrome | Install normally. Chromium also works. | Auto-detected, or set `chrome` in the config |
| Blender 5.3.0 (optional) | Download from blender.org. Needed for the product template only. Tested with 5.3.0 only. | Set `blender` in the config if not auto-detected |
| Inkscape (optional) | Download from inkscape.org. Used only to measure logo bounding boxes. | Not required |

FFmpeg must include `libx264`, `prores_ks`, and `libmp3lame`. Check with `ffmpeg -encoders`.

## 2. Configure paths (optional)

Copy the example file and edit it:

```powershell
copy studio.config.example.json studio.config.json
```

| Key | Purpose | Default when empty |
|---|---|---|
| `workspace` | Where projects, renders, and exports are written | `%USERPROFILE%\MotionStudio` |
| `blender` | Full path to `blender.exe` | Auto-detected in `Program Files\Blender Foundation` |
| `chrome` | Full path to `chrome.exe` | Auto-detected in the standard install folders |
| `inkscape` | Full path to `inkscape.exe` (optional) | Read from PATH |

Environment variables override the file: `MOTION_STUDIO_WORKSPACE`, `BLENDER_PATH`, `CHROME_PATH`, `INKSCAPE_PATH`. `studio.config.json` is listed in `.gitignore` because it may contain personal paths.

## 3. Fonts for the example brand

Download **Cairo** (400 and 700) and **Poppins** (400 and 700) from Google Fonts, then place these files in `brands/example/fonts/`:

`Cairo-Regular.ttf`, `Cairo-Bold.ttf`, `Poppins-Regular.ttf`, `Poppins-Bold.ttf`

The fonts are not included in this repository. Their licenses are in `docs/LICENSES.md`.

## 4. Verify the setup

```powershell
python scripts/studio.py check
python scripts/studio.py init
```

`check` reports each tool as found or missing. Only Python, numpy, FFmpeg, ffprobe, Node.js, npm, and npx are required for Remotion templates. Chrome, Blender, and Inkscape are needed only for specific features.

## 5. PowerShell script policy

If PowerShell blocks `scripts\Studio.ps1`, allow local scripts for your user account only:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

You can also run the Python CLI directly with `python scripts/studio.py`, which avoids the wrapper.

## 6. Install the skill for Claude (untested)

The skill is a folder with `SKILL.md` at its root. Copy the whole repository folder into your Claude skills directory and name it `dr-alaa-motion-studio`:

```text
%USERPROFILE%\.claude\skills\dr-alaa-motion-studio\
```

Confirm the exact skills location in your Claude version before copying. This step has not been tested in this edition.

## Versions tested

| Tool | Version |
|---|---|
| Windows | 11 (kernel 10.0.26300), AMD64 |
| Python | 3.12.10 (numpy 2.5.4) |
| Node.js / npm | v26.13.0 / 11.20.0 |
| Remotion | 4.0.540 (pinned in the kit) |
| FFmpeg | 9.0.2-full_build-www.gyan.dev |
| Blender | 5.3.0 |
| Google Chrome | 157.0.8103.78 |

## Not yet verified

- Clean Windows account or machine: **NOT TESTED**.
- Minimum Node.js version: Remotion declares none. Only v26 was tested.
- Minimum Python version: only 3.12 was tested.
- Other FFmpeg builds (for example the GPL-free ones): untested. The `libx264` and `prores_ks` encoders are required.
- Other Blender versions: untested.

Cache problems and other fixes: see `TROUBLESHOOTING.md`.
