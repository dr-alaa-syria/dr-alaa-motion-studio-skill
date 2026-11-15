# Example brand

A neutral, fictional brand used for demos, tests, and as a template to copy. It contains no real company's identity.

| Item | Status |
|---|---|
| `brand.json` | Included. Colors, themes, font family names, mark geometry, and placeholder contacts. |
| `logo/` | Included. Simple placeholder SVGs drawn for this project. |
| `lockups.json` | Generated from the SVGs by `scripts/brand_extract_lockups.py --brand example`. |
| `fonts/` | **Not included.** See `fonts/README.md`. |

Contacts use placeholders (`+000 000 0000`, `hello@example.com`). Replace them before any real use.

To make your own brand, copy this folder to `brands/<your-id>/`, edit `brand.json`, and see `docs/BRANDS.md`.
