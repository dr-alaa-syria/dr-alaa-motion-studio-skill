# Fonts for the example brand

Font files are **not included** in this repository. Download them yourself from Google Fonts. Both families are licensed under the SIL Open Font License 1.1.

Place these files in this folder with these exact names (the brand file refers to them):

| File | Family and weight |
|---|---|
| `Cairo-Regular.ttf` | Cairo 400 (Arabic and Latin) |
| `Cairo-Bold.ttf` | Cairo 700 |
| `Poppins-Regular.ttf` | Poppins 400 (Latin) |
| `Poppins-Bold.ttf` | Poppins 700 |

When a project is created, `scripts/studio.py new` copies this folder into `public/brand/fonts/`. If a file is missing, the render stops with an error that names the missing font.

To use your own brand, see `docs/BRANDS.md`.
