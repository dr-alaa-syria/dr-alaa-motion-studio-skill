# Dr Alaa Motion Studio Skill v0.1.0

First public release. A reusable production pipeline for motion graphics. Each template renders 16:9 and 9:16 from one `content.json`, and the visual identity comes from a swappable `brand.json`.

## What is included

- **Templates:** logo reveal (sting, intro, outro), promo (short and full cuts), Arabic kinetic typography reel, and a 3D product shot built in Blender.
- **Shared kit:** motion, Arabic word-by-word text, logo lockups, backgrounds, icons, and sound effects.
- **CLI:** `scripts/studio.py` with `check`, `init`, `templates`, `new`, `build`, `render`, `still`, `blender-shot`, `export`, `sfx`, `music`, `lockups`, and `archive`.
- **Example brand:** a neutral, fictional placeholder in `brands/example`, with its own SVG logo files. No fonts are included.
- **Documentation:** README (English and Arabic), install, usage, brands, pipeline, troubleshooting, and licensing notes.

## Tested

On the author's machine (Windows 11, kernel 10.0.26300):

- Python 3.12.10 with numpy 2.5.4; Node.js v26.13.0 with npm 11.20.0.
- Remotion 4.0.540; typecheck and renders for all three Remotion templates.
- Blender 5.3.0; product scene build and one-frame shots.
- FFmpeg 9.0.2 (gyan.dev full build); exports `social_9x16_native` and `web_1080p_loud`.
- Arabic and English paths with spaces; missing-tool messages; cache behaviour.

## Not tested

- A clean Windows account or machine (the author reports a second-machine pass, but no logs are attached to this release).
- Node.js and Python versions other than those listed above.
- Blender versions other than 5.3.0.
- Export presets other than the two listed above.
- Claude's automatic invocation of the skill in a live session.
- The voiceover sync and Remotion Studio.

## Known issues

- Without Inkscape, the stacked logo wordmark was clipped. This is fixed, and the result was checked visually.
- The first render after changing a kit file can, once, use a stale bundle. Clear `node_modules\.cache` if you see an old result. See `docs/TROUBLESHOOTING.md`.

## Licensing

- Original code: MIT, Copyright (c) 2026 Dr Alaa.
- Remotion is **not** MIT. It is installed by the user with npm and is governed by its own license. Eight Remotion packages have **no confirmed license yet**; this release does not claim otherwise. See `THIRD_PARTY_NOTICES.md`.
- FFmpeg, Blender, Chrome, and the fonts are not included in this repository.

## Requirements

Windows 11 64-bit. See `docs/INSTALL.md` for the full list.
