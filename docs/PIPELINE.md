# Pipeline

How a finished video moves through Dr Alaa Motion Studio Skill, from brand to delivery.

## Stages

| Stage | Tool | Output |
|---|---|---|
| 1. Brand | `brands/<id>/brand.json`, SVG logo files, font files | `lockups.json` (generated) |
| 2. Project | `scripts/studio.py new` | A project folder in the workspace, with the kit, template, brand, sounds, and music |
| 3. Content | `content.json` in the project | The scene list, text, timings, and media references |
| 4. Preview | `studio.py render --preview` or `still` | Low-resolution video or still frames for checking |
| 5. Final render | `studio.py render` | Full-resolution video in `renders\remotion\<project>` |
| 6. Export | `studio.py export --preset ...` | Delivery files in `exports\...`, with loudness set for the target |
| 7. Archive | `studio.py archive` | A zip of the project, in `archive\` |

Product shots add a Blender branch:

| Stage | Tool | Output |
|---|---|---|
| A. Scene | `studio.py new --type blender --template product` (runs `build_product_scene.py`) | `<name>.blend` in the project |
| B. Shot | `studio.py blender-shot` (runs `render_shot.py`) | PNG sequence, then MP4 or ProRes 4444 with alpha |
| C. Composite | `blender-shot --to-remotion <promo project>` | Video copied into the promo's `public/media`, referenced by a `product` scene |

## Rules that keep the pipeline safe

- **Never overwrite by default.** Renders and exports stop if the file exists. Use `--overwrite` to replace one on purpose.
- **Projects are copies.** A new project copies the kit and template at creation time. Updating the kit does not change existing projects.
- **Brands are data.** Templates read colors, fonts, logos, and contacts only from `brand.json`.
- **Frames resume.** A Blender shot skips frames that already exist.
- **Previews first.** Check a `--preview` render or a still before the full render.

## Where files go

Everything produced goes to the workspace (`workspace` in `studio.config.json`, default `%USERPROFILE%\MotionStudio`). The repository folder itself is not changed by normal use. The layout is listed in `docs/USAGE.md`.

## Loudness

The `social_9x16_native` and `web_1080p_loud` presets use the `loudnorm` filter to reach -14 LUFS with a true-peak limit of -1.5 dBTP. These are the only two presets tested so far. The other presets do not normalize loudness. Source audio from generated beds and sound effects measures around -17 LUFS, so the export raises it to the target. If the source has silent or no audio, the loudness step is skipped and the export still completes.

## Known limits (v0.1.0)

- Windows 11 only.
- Blender scene scripts were tested on Blender 5.3 only.
- No automated test suite is included yet.
