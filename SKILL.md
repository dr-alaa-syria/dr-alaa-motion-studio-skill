---
name: dr-alaa-motion-studio
description: Build reusable motion-graphics and video production templates (logo reveal, promo, Arabic kinetic typography reel, 3D product shot) with Remotion and Blender, rendered in 16:9 and 9:16 from one JSON content file and a swappable brand.json. Use when the user asks for a motion graphic, intro/outro, logo animation, ad or promo video, Arabic reel with word-by-word text, or a 3D product shot, or wants a production pipeline with FFmpeg rendering and loudness-normalized export.
---

# Dr Alaa Motion Studio

A production pipeline for motion graphics. The brand is data (`brands/<id>/brand.json`), the content is data (`content.json` in each project), and the templates are code that renders both aspect ratios from the same content.

Read `README.md` for the overview and `docs/INSTALL.md` before the first run. This skill is currently v0.1.0, Windows 11 only.

## When to use

- Logo reveal, intro, outro, or sting for a brand.
- Promo or ad videos built from scenes (hook, statement, features, media, product, stat, call to action).
- Arabic kinetic typography reels with the emphasized word set apart.
- Product shots rendered from a Blender scene and composited into a promo.
- Generated music bed and sound effects with no sample licensing issues.

## Workflow

1. Check the environment with `python scripts/studio.py check`. Install anything marked missing (see `docs/INSTALL.md`).
2. Choose a brand. Start from `brands/example/`, or create `brands/<id>/` from it (see `docs/BRANDS.md`). Never invent logo files or fonts.
3. Create a project: `python scripts/studio.py new --type remotion --template promo --name <Name> --brand <id>`.
4. Edit `content.json` in the project. Put the emphasized word between asterisks, for example `*word*`. Put images and videos in `public/media`.
5. Run `npm ci` once inside the project folder.
6. Preview with `python scripts/studio.py render --project <Name> --comp <Comp> --preview`, then render the final version without `--preview`.
7. Export for delivery with `python scripts/studio.py export --input <file> --preset social_9x16_native`.

Full command reference: `docs/USAGE.md`.

## Rules

- Do not bundle or redistribute Remotion, Blender, FFmpeg, Chrome, or fonts. The user installs them and must follow their licenses. Remotion's free tier is limited; check its current terms before commercial use.
- Keep the brand separate from the templates. Colors, fonts, logos, and contact details come only from `brand.json`.
- Never write user-specific absolute paths into project files. Use the paths in `studio.config.json` or environment variables.
- Do not overwrite existing renders or exports unless the user asks for `--overwrite`.
- Do not invent contact details or claims for a brand. Use the values the user provides, or placeholders.

## Status

v0.1.0 in preparation. Rendering was verified on the author's machine (Windows 11, Remotion 4.0.540, Blender 5.3). Clean-machine installation and Arabic-path support are not yet verified.
