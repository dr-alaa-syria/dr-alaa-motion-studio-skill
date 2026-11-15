# Promo template

An ad built from scenes listed in `content.json`. Each scene's length is set in beats. At 120 BPM, one beat is 15 frames (half a second), so every cut falls on the music.

| Composition | Content |
|---|---|
| `Promo-Short-16x9` / `-9x16` | Scenes marked `inShort` (about 15 s in the example) |
| `Promo-Full-16x9` / `-9x16` | All scenes (about 27 s in the example) |

## Scene types

| `type` | Main fields | Look |
|---|---|---|
| `hook` | `label`, `headline`, `sub` | Large word-by-word headline and an outline of the mark |
| `statement` | `index`, `kicker`, `headline` | Small kicker, then a large headline, with an accent bar |
| `features` | `title`, `items[]` (`icon`, `title`, `text`) | 1 to 4 cards with line icons |
| `product` | `src`, `src9x16`, `label`, `badge`, `headline` | Full-screen product video (see the Blender template), with a label and headline |
| `media` | `src`, `kind`, `bw`, `caption` | Image or video from `public/media`. Without `src`, a placeholder chart appears. |
| `stat` | `value`, `prefix`, `suffix`, `label` | Counting number with a bar chart |
| `cta` | `headline`, `button`, `showLogo`, `contacts` | Call to action with a cursor click, then the logo and contacts |

Every scene also accepts:

- `beats`: 2 to 32.
- `theme`: override the theme for this scene.
- `transition`: `auto`, `whip`, `zoom`, `wipe`, or `cut`.
- `inShort`: include the scene in the short cut.

Icon names: `phone`, `instagram`, `email`, `facebook`, `website`, `arrow`, `play`, `check`, `plus`, `spark`.

## Sound

- `music.file` defaults to `music/bed.wav`, a generated 120 BPM bed. Replace it with your own licensed track, and set `bpm` to match.
- `voiceover.file` is optional. When set, the music lowers to `duckTo`.
- Sound effects are placed on every transition and element. Set `"sound": false` to turn them off.

## Commands

```powershell
python scripts/studio.py render --project <Name> --comp Promo-Short-9x16 --preview
python scripts/studio.py render --project <Name> --comp Promo-Short-9x16,Promo-Short-16x9
python scripts/studio.py export --input "<workspace>\renders\remotion\<Name>\Promo-Short-9x16.mp4" --preset social_9x16_native
```
