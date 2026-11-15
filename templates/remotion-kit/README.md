# Remotion kit

Shared code for all Remotion templates in this skill. `scripts/studio.py new` copies it into every new Remotion project, together with the template files, the brand, the sound effects, and the music bed.

## Contents

| Path | Role |
|---|---|
| `package.json`, `package-lock.json` | Pinned versions of Remotion 4.0.540, React 19.1.10, zod 4.6.7, TypeScript 5.9.3 |
| `tsconfig.json`, `remotion.config.ts` | TypeScript settings and render settings (JPEG frames, H.264, bt709, yuv420p) |
| `src/kit/brand.ts` | Reads and validates `src/brand/brand.json` and `lockups.json` with zod |
| `src/kit/fonts.ts` | Loads brand fonts from `public/brand/fonts` |
| `src/kit/layout.ts` | Formats (16:9 and 9:16), safe areas, and the scale unit |
| `src/kit/motion.ts` | Easing, springs, and progress helpers |
| `src/kit/text.tsx` | Word-by-word text for Arabic and Latin, with `*emphasis*` |
| `src/kit/logo.tsx` | Mark drawn from its parts, and the logo lockup |
| `src/kit/backgrounds.tsx`, `chrome.tsx`, `shapes.tsx`, `icons.tsx` | Backgrounds, corner marks, shapes, and line icons |
| `src/kit/sfx.tsx` | Places a sound effect on a given frame |
| `src/kit/blur.tsx` | Directional motion blur |

## Editing the kit

Make permanent changes here, then create new projects. Changing a generated project does not change other projects. After changing the kit, run `npm run typecheck` in a project to catch type errors. This check has not yet been run as part of a test suite.

## Notes

- Remotion is a dependency installed by `npm ci`. It is not included in this repository. See `THIRD_PARTY_NOTICES.md`.
- The kit reads brand colors `ink`, `paper`, `accent`, `gray700`, and `gray800`. See `docs/BRANDS.md`.
