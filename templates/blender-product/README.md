# Product shot template (Blender)

A dark Eevee scene built by script. It has a turntable pedestal with an accent ring, rim lighting, rising pixels, and three camera moves:

| Shot | Move |
|---|---|
| `push` | Slow approach to the product |
| `orbit` | About 70 degrees around the product |
| `top` | From above down to a three-quarter view |

Each shot renders in `16x9` and `9x16`. Vertical framing uses a slightly wider lens so the base stays in frame.

## Product

- Without `--product`, the brand mark is drawn in 3D from `brand.json`.
- With `--product`, copy a GLB, GLTF, FBX, or OBJ file. The model is scaled to fit the pedestal and placed on it automatically. Check the scale and framing on a preview before a final render.

## Commands

```powershell
python scripts/studio.py new --type blender --template product --name Shot_01 --brand example --product "D:\models\bottle.glb"
python scripts/studio.py blender-shot --project Shot_01 --shot push --format 16x9 --percent 50
python scripts/studio.py blender-shot --project Shot_01 --shot push --format 16x9 --percent 100
python scripts/studio.py blender-shot --project Shot_01 --shot push --format 9x16 --percent 100 --to-remotion My_Promo
python scripts/studio.py blender-shot --project Shot_01 --shot orbit --transparent
```

## Timing and performance

These numbers come from the author's machine (Intel UHD 630, 16 GB RAM), not from a benchmark suite:

- The first frame takes about 27 seconds (shader compilation).
- A 90-frame shot takes about 3 minutes at 50%.
- A 90-frame shot takes about 7 minutes at 100%.

Keep shots between 2 and 4 seconds. Close other heavy programs during a render.

## Manual changes

`python scripts/studio.py build --project Shot_01` regenerates `Shot_01.blend` from the script and overwrites manual edits. Do not run it after editing the file by hand.

## Notes

- Renders resume: frames that already exist are skipped on the next run.
- The scripts use Blender Python APIs that changed between Blender versions. Only Blender 5.3 has been tested.
