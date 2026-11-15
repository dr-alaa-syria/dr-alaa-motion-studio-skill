# Logo reveal template

Three versions of a logo animation. The mark builds from its parts (stem, accent stroke, then pixels), then the wordmark and tagline appear.

| Composition | Length | Purpose |
|---|---|---|
| `Logo-Sting-16x9` / `-9x16` | 1.5 s | Mark only. For transitions and short social clips. |
| `Logo-Intro-16x9` / `-9x16` | 3 s | Opening: mark, then full lockup, then a quick exit |
| `Logo-Outro-16x9` / `-9x16` | 5.5 s | Closing: a call to action, then the lockup and contacts, ending still |

The 16:9 version uses the horizontal lockup. The 9:16 version uses the stacked lockup.

## Edit `content.json`

| Field | Values |
|---|---|
| `theme` | `dark`, `light`, or `lime` |
| `transparent` | `true` for a transparent render (use `--alpha`) |
| `sound` | Enable or disable sound effects |
| `showTagline` | Show the tagline under the logo |
| `background` | `grid`, `plain`, or `pixels` |
| `outro.headline` | Call-to-action text. Put the emphasized word between asterisks. |
| `outro.contacts` | Any of `phone`, `instagram`, `facebook`, `email`, `website`. Values come from the brand. |

## Commands

```powershell
python scripts/studio.py render --project <Name> --comp Logo-Intro-16x9 --preview
python scripts/studio.py render --project <Name> --comp Logo-Sting-16x9 --alpha --props alpha.json
```

`alpha.json` contains `{"transparent": true}`.
