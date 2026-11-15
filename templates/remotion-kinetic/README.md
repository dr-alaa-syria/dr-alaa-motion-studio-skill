# Kinetic typography reel template (Arabic)

A vertical reel of short lines revealed word by word on the beat. The emphasized word is set large on its own line. The background can flip to the accent color on a beat, and a line can have a punch (shake and impact) and an echo.

Compositions: `Kinetic-9x16` (main format for reels) and `Kinetic-16x9`.

## Edit `content.json`

| Field | Meaning |
|---|---|
| `lines[].text` | The line. Put the emphasized word between asterisks, for example `"المحتوى *قصة.*"`. |
| `lines[].beats` | Length in beats (at 120 BPM, one beat is half a second). Three or four beats per line is typical. |
| `lines[].layout` | `stack` (default: each group on its own line) or `flow` (one wrapped line) |
| `lines[].flip` | `lime` or `light`: flip the background on this line's beat |
| `lines[].punch` | Shake and impact on the emphasized word |
| `lines[].echo` | Faded echo above and below the emphasized word |
| `lines[].exit` | `auto`, `up`, `whip`, or `zoom` |
| `lines[].at` | Start time in seconds, to align with a voiceover |
| `frame` | Top bar: `showMark`, `tag`, `handle`, `progressBar` |
| `end` | End card: `enabled`, `beats`, `headline`, `showLogo` |
| `music`, `voiceover` | Same as the promo template |

## Voiceover sync

Put the audio file in `public/` and set `voiceover.file`. Add an `at` value (in seconds) to each line to match the voice. The emphasized word lands on the next half beat. Automatic timing from speech is not included yet.

## Commands

```powershell
python scripts/studio.py render --project <Name> --comp Kinetic-9x16 --preview
python scripts/studio.py render --project <Name> --comp Kinetic-9x16
```
