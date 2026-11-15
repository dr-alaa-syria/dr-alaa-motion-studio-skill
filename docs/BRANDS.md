# Brands

A brand is a folder in `brands/<id>/`. Templates read it through `brand.json` and never hard-code colors, fonts, logos, or contact details.

## Create a brand

1. Copy `brands/example/` to `brands/<your-id>/`. Use lowercase letters, digits, and hyphens for the id.
2. Replace the values in `brand.json`.
3. Put your logo SVG files in `logo/` and update `logo.lockupSources`.
4. Put the font files in `fonts/` and update `fonts.*.faces`.
5. Run `python scripts/studio.py lockups --brand <your-id>`. This writes `lockups.json`.
6. Create a project with `--brand <your-id>`.

Only use logos, fonts, and contact details you have the right to use.

## brand.json fields

| Field | Used for |
|---|---|
| `id`, `name`, `nameAr` | Labels and identifiers |
| `tagline.text`, `taglineAr` | Tagline under the logo, and outro labels |
| `colors` | **Required:** `ink`, `paper`, `accent`, `gray700`, `gray800`. Other keys are optional. |
| `themes.dark`, `themes.light`, `themes.lime` | Background, text, accent, surfaces, and logo variant for each theme. Templates choose a theme per project or per scene. |
| `fonts.arabic`, `fonts.latin` | Font families and files. Each face needs `weight` and `file` (relative to `fonts/`). |
| `type` | Headline weight, line heights, label tracking |
| `logo.mark.viewBox` | Coordinate box for the mark (`[x, y, width, height]`) |
| `logo.mark.parts` | The mark's shapes. Each part has a `role`: `base` (drawn first), `accent`, or `pixel`. Types are `polygon` (with `points`) or `rect` (with `x`, `y`, `w`, optional `h`). |
| `logo.wordmark.files` | Wordmark-only SVG files, one per variant |
| `logo.lockupSources` | Paths to the horizontal, horizontal without tagline, and stacked SVG files |
| `contact` | Phone, instagram, facebook, email, website. Only the values you fill in are shown. |
| `rules` | Notes for humans. Templates do not read them. |

## Logo files

The lockup SVGs must follow this structure, because `lockups.json` is extracted from it:

- A root `<svg>` with a `viewBox`.
- One `<g>` directly inside the root, with three child groups in order:
  1. The mark group, with `transform="translate(x,y) scale(s)"`.
  2. The wordmark group, with `transform="translate(x,y)"` and its text or paths.
  3. The tagline group (optional), with the same transform form.
- Inside the wordmark and tagline groups, use the exact fill colors from `themes.dark` (`fg` and `accent`). The extractor replaces them with tokens.

Look at `brands/example/logo/Stacked/Example-Stacked-Color-OnDark.svg` for a working example.

## Fonts

Fonts are not stored in this repository. Each brand's `fonts/` folder holds the files you download. Make sure each file's license allows your use. Templates load fonts from the project's `public/brand/fonts`. A missing font stops the render with an error that names the file.

## Checklist before use

- [ ] `brand.json` passes the check (run `python scripts/studio.py lockups --brand <id>` and read any error).
- [ ] All required colors are present.
- [ ] Contacts are real values you own, or are removed.
- [ ] Logo, fonts, and any images have licenses that allow your use.
- [ ] The logo renders flat: no shadows, glows, rotation, or stretching in the templates.
