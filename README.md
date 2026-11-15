# Dr Alaa Motion Studio Skill

Reusable production templates for motion graphics: a logo reveal (intro, outro, sting), a promo, an Arabic kinetic typography reel, and a 3D product shot. Each template renders **16:9 and 9:16** from the same `content.json`. The visual identity is a separate `brand.json`, so the same templates work for any brand.

> **Status: v0.1.0 in preparation.** The packaging is complete, but the installation and rendering steps have **not yet been tested** on a clean machine. Read `CHANGELOG.md` before relying on it.

Arabic version: [README.ar.md](README.ar.md)

## What's included

| Template | Engine | Outputs |
|---|---|---|
| `templates/remotion-logo` | Remotion | Sting, Intro, Outro in 16:9 and 9:16 |
| `templates/remotion-promo` | Remotion | Short (about 15 s) and full (about 27 s) ad cuts in 16:9 and 9:16 |
| `templates/remotion-kinetic` | Remotion | Arabic word-by-word reel with the emphasized word set apart |
| `templates/blender-product` | Blender (Eevee) | Product shot with three camera moves, composited into a Remotion promo |

Shared code lives in `templates/remotion-kit`. The CLI is `scripts/studio.py`. The example brand is `brands/example` (a neutral placeholder).

## Requirements (Windows 11 64-bit, for v0.1.0)

You install these yourself. They are not bundled. Details are in [docs/INSTALL.md](docs/INSTALL.md).

| Tool | Needed for | Notes |
|---|---|---|
| Python 3.12 + numpy | Sound and music generation, the CLI | Only numpy is a third-party package |
| Node.js | Remotion projects | Tested with v26.13.0 only. Remotion declares no minimum. See `THIRD_PARTY_NOTICES.md` |
| FFmpeg and ffprobe | Encoding, exports, contact sheets | Must be on PATH |
| Google Chrome or Chromium | Remotion rendering | Auto-detected, or set in config |
| Blender 5.3.0 | Product template only | Optional. Tested with 5.3.0 only |
| Inkscape | Lockup bounding boxes only | Optional |

## Quick start

```powershell
pip install -r requirements.txt
copy studio.config.example.json studio.config.json      # optional: edit your paths
python scripts/studio.py check
python scripts/studio.py init
python scripts/studio.py new --type remotion --template promo --name My_Promo --brand example
npm ci --prefix "<workspace>\projects\remotion\My_Promo"
python scripts/studio.py render --project My_Promo --comp Promo-Short-9x16 --preview
```

The full workflow, including the fonts you must download, is in [docs/USAGE.md](docs/USAGE.md). To use your own identity, see [docs/BRANDS.md](docs/BRANDS.md).

## Licensing

- The original code in this repository is licensed under the **MIT License**. See [LICENSE](LICENSE).
- **Remotion is not MIT.** Its license is source-available and free only for individuals and organizations below a size limit. Companies above that limit need a paid license. Check the current terms at remotion.dev. This repository does not include or redistribute Remotion.
- **Fonts are not included.** Download them from Google Fonts. They use the SIL Open Font License.
- **Blender, FFmpeg, Chrome, and Inkscape are not included.** Each has its own license.

Full details: [LICENSES.md](LICENSES.md), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), [docs/LICENSES.md](docs/LICENSES.md).

## Tested vs. not yet tested

| Area | Status |
|---|---|
| Rendering all templates on the author's machine (Windows 11, Remotion 4.0.540, Blender 5.3) | Tested during development |
| Clean-machine installation | **Not tested yet** |
| Paths containing Arabic letters or spaces | **Not tested yet** |
| macOS and Linux | **Not supported in v0.1.0** |
| Automated test suite | **Not yet written** |

## Excluded from this edition

Client brand assets, personal project files, rendered outputs, and any font whose redistribution terms are unclear are not part of this repository.

## Contributing

Issues and pull requests are welcome after v0.1.0 is published. Please keep brand files out of contributions: each brand belongs in its own `brands/<id>/` folder with placeholder assets only.
