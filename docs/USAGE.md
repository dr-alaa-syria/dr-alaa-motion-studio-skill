# Usage

All commands run from the repository root. Project files go to your workspace (`workspace` in the config, default `%USERPROFILE%\MotionStudio`).

## Workspace layout

```text
<workspace>\
  audio\sfx\        generated sound effects (python scripts/studio.py sfx)
  audio\music\      generated music beds (python scripts/studio.py music)
  projects\remotion\<name>\     Remotion projects
  projects\blender\<name>\      Blender product projects
  renders\remotion\<name>\      Remotion renders and stills
  renders\blender\<name>\       Blender frame sequences and videos
  exports\final\  exports\social\  exports\masters\  exports\audio\
  archive\          zip archives
```

## Commands

### Check and set up

```powershell
python scripts/studio.py check          # tools and paths
python scripts/studio.py init           # create the workspace folders
python scripts/studio.py templates      # list templates and brands
```

### Create a Remotion project

```powershell
python scripts/studio.py new --type remotion --template promo --name My_Promo --brand example
cd "<workspace>\projects\remotion\My_Promo"
npm ci
cd <repository root>
```

Templates: `logo`, `promo`, `kinetic`. Each creates a project that includes the shared kit, the template files, your brand, the sound effects, and the music bed.

Run `npm ci` once per project. It installs the exact versions in `package-lock.json`.

### Preview and render

```powershell
python scripts/studio.py render --project My_Promo --comp Promo-Short-9x16 --preview
python scripts/studio.py render --project My_Promo --comp Promo-Short-9x16,Promo-Short-16x9
python scripts/studio.py still --project My_Promo --comp Promo-Short-9x16 --frames 30,90
```

| Option | Meaning |
|---|---|
| `--preview` | Half resolution, for quick checks |
| `--alpha` | ProRes 4444 with transparency (logo template) |
| `--props file.json` | JSON values that override `content.json` for this render |
| `--frames 0-59` | Render a frame range |
| `--overwrite` | Replace an existing output file |

Composition IDs are listed by `python scripts/studio.py templates`.

### Content

Edit `content.json` in the project. Put the emphasized word between asterisks: `"headline": "فكرتك *تستحق* الظهور."`. Put images and videos in `public/media` and reference them as `media/<file>`.

### Product shot (Blender)

```powershell
python scripts/studio.py new --type blender --template product --name Shot_01 --brand example --product "D:\models\bottle.glb"
python scripts/studio.py blender-shot --project Shot_01 --shot push --format 9x16 --percent 50
python scripts/studio.py blender-shot --project Shot_01 --shot push --format 9x16 --percent 100 --to-remotion My_Promo
```

- `--product` is optional. Without it, the brand mark is used as the product.
- `--shot`: `push`, `orbit`, or `top`.
- Use `--percent 50` for previews and `--percent 100` for final renders. Rendering at 100% takes several minutes per shot.
- Frames already rendered are skipped on a rerun.
- `--transparent` renders ProRes 4444 with alpha, without the background.
- `python scripts/studio.py build --project Shot_01` regenerates `Shot_01.blend` from the build script. **It overwrites manual edits made in Blender.** After editing the `.blend` by hand, do not run `build` again. `blender-shot` always renders the project's `<name>.blend`.

After `--to-remotion`, reference the video in a promo's `content.json` as a `product` scene: `"src": "media/Shot_01_push_9x16.mp4"`.

### Export

```powershell
python scripts/studio.py export --input "<workspace>\renders\remotion\My_Promo\Promo-Short-9x16.mp4" --preset social_9x16_native
```

| Preset | Use | Test status |
|---|---|---|
| `social_9x16_native` | Vertical video from a 9:16 source, loudness -14 LUFS | Tested (audible and silent sources) |
| `web_1080p_loud` | Web and YouTube master, loudness -14 LUFS | Tested (audible and silent sources) |
| `web_1080p` | Web master without loudness normalization | NOT TESTED |
| `social_9x16` | Vertical video from a 16:9 source (letterboxed) | NOT TESTED |
| `master_prores_hq` | Editing master (large files) | NOT TESTED |
| `audio_wav_48k` | Uncompressed audio for editing | NOT TESTED |
| `audio_mp3_320` | Audio for publishing | NOT TESTED |
| `web_1080p_qsv` | Intel Quick Sync encode (Intel GPUs only, optional) | NOT TESTED |

### Audio

```powershell
python scripts/studio.py sfx                 # sound effects pack
python scripts/studio.py music --bpm 120     # music bed (32 bars)
```

Both are generated with numpy and contain no sample library. Replace the music with your own licensed track by putting it at `public/music/bed.wav` in a project.

### Logos and archives

```powershell
python scripts/studio.py lockups --brand example   # rebuild lockups.json from the SVG files
python scripts/studio.py archive --project My_Promo
```

`archive` writes a zip to `<workspace>\archive\` and skips `node_modules`, `out`, and caches. It does not change the project.
