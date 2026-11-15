# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Public edition identity: official name **Dr Alaa Motion Studio Skill**, repository `dr-alaa-motion-studio-skill`, skill name `dr-alaa-motion-studio`.
- `LICENSE` (MIT, Copyright (c) 2026 Dr Alaa), applying to the original code only.
- `LICENSES.md`, `THIRD_PARTY_NOTICES.md`, and `docs/LICENSES.md` documenting every external component and its license.
- Templates: `remotion-logo`, `remotion-promo`, `remotion-kinetic`, `blender-product`, plus the shared `remotion-kit`.
- `scripts/studio.py`: a single CLI for check, init, templates, new, build, render, still, blender-shot, export, sfx, music, lockups, and archive. Workspace and tool paths are configurable.
- `brands/example`: a neutral placeholder brand with its own SVG logo files. Fonts are not included.
- `presets/export_presets.json`: export presets, including loudness normalization to -14 LUFS.
- Documentation: `README.md` and `README.ar.md`, `docs/INSTALL.md` and `docs/INSTALL.ar.md`, `docs/USAGE.md`, `docs/BRANDS.md`.

### Changed
- Brand validation now requires the colors that templates use (`ink`, `paper`, `accent`, `gray700`, `gray800`).
- Logo lockup tagline falls back to the full lockup when no bounding box is available, instead of being hidden.
- Logo extraction no longer requires Inkscape. It is used only for bounding boxes when found.

### Fixed (after the Phase 3 test run)
- Export with silent or missing audio no longer fails: loudness normalization is skipped with a note.
- `studio.py` now shows a short message when an external tool fails, instead of a Python traceback.
- `studio.py lockups` checks the brand before running extraction.
- `studio.py check` shows the Blender version, not only the path.
- `studio.py blender-shot` checks for Blender before checking for the scene file.
- Font files are checked before loading. A missing font stops the render with a message that names the file.
- Brand `tagline` and `contact` are optional. Templates hide missing values instead of failing.
- Stacked logo wordmark is fully visible when no bounding box is available (Inkscape absent).
- Package name is consistent: `dr-alaa-motion-studio-project`.
- Added `docs/npm-license-inventory.json` and expanded `THIRD_PARTY_NOTICES.md` with the transitive licenses.

### Verified in the final pre-release pass (not published)
- Remotion license evidence checked against the official `LICENSE.md` at tag v4.0.540. Eight packages remain **UNRESOLVED** (seven compositor platform packages and `@remotion/media`).
- Remotion bundle cache behaviour documented in `docs/TROUBLESHOOTING.md`. Clearing `node_modules/.cache` is the recommended fix.
- Clean Windows account test: **NOT TESTED**.

### Release audit corrections (documentation only)
- Node.js and Blender are documented as tested only with v26.13.0 and 5.3.0. The "LTS" and "5.x" claims were removed.
- Export presets are marked with their test status. Only `social_9x16_native` and `web_1080p_loud` were tested.
- The loudness note in `docs/PIPELINE.md` no longer claims that all web exports are normalized.

### Removed from this edition
- Krita, Inkscape, Kdenlive, and Audacity workflows (planned for a later version).
- The legacy `remotion_base` template, because it used a font that cannot be redistributed.
- The personal project folders, rendered outputs, and generated audio binaries of the private studio.

### Notes
- Brand assets, logos, fonts, and contact details belonging to any other organization are excluded from this edition by design.
- Installation on a clean Windows machine and Arabic-path support are not yet verified. No automated test suite exists yet.
