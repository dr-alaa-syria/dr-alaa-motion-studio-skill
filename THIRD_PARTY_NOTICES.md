# Third-party notices

This file lists every external component this project depends on, its license, its status, and whether it is distributed here. Nothing listed as "not bundled" is distributed in this repository.

**Status key**
- **CONFIRMED**: a primary source states the license (package file, LICENSE file, or official repository).
- **UNRESOLVED**: no primary source states the license. Not classified as MIT. Needs confirmation before v0.1.0.

Versions are the ones pinned in `templates/remotion-kit/package.json` and `package-lock.json`, or the ones used in testing.

## 1. Remotion (npm, pinned 4.0.540)

Primary source: the official Remotion repository at tag `v4.0.540`, file `LICENSE.md` (fetched from GitHub, 2,823 bytes), and `remotion.dev/license`.

| Package | Status | License evidence |
|---|---|---|
| `remotion` 4.0.540 | CONFIRMED | `package.json` says `SEE LICENSE IN LICENSE.md`. Official `LICENSE.md` applies. |
| `@remotion/cli` 4.0.540 | CONFIRMED | Same. |
| `@remotion/renderer`, `@remotion/bundler`, `@remotion/player`, `@remotion/web-renderer`, `@remotion/sdk`, `@remotion/studio-protocol` | CONFIRMED (by metadata) | `SEE LICENSE IN LICENSE.md` or `Remotion License` in the lock. |
| `@remotion/fonts` 4.0.540 | MIT per npm metadata | Confirm the LICENSE file inside the package before release. |
| `@remotion/compositor-darwin-arm64`, `-darwin-x64`, `-linux-arm64-gnu`, `-linux-arm64-musl`, `-linux-x64-gnu`, `-linux-x64-musl`, `-win32-x64-msvc` (7) | **UNRESOLVED** | No `license` field in the lock or npm metadata. The packages contain no LICENSE file. The official repository's `packages/compositor/package.json` says `SEE LICENSE IN LICENSE.md`, which points to the Remotion License by inference. The platform packages are not confirmed individually. |
| `@remotion/media` 4.0.540 | **UNRESOLVED** | No `license` field in the lock, in npm metadata, or in the official repository's `packages/media/package.json`. No LICENSE file in the package or the repository path. |

### What the Remotion License says (verified text, tag v4.0.540)

- Individuals, non-profit organizations, for-profit organizations with up to 3 employees, and evaluation use: free, including commercial use.
- A Company License is required for other for-profit organizations.
- It is not allowed to copy or modify Remotion code to sell, rent, license, or sublicense your own derivative.
- The text states that the license will change in Remotion 5.0.
- The official website says the same: free for individuals and companies up to three people; Company License required for entities not eligible for the free license.

This repository does not contain Remotion code. The templates call Remotion's public API, which is installed by `npm ci` on the user's machine.

### Unresolved items to confirm with Remotion

1. Does the Remotion License apply to the seven `@remotion/compositor-*` platform packages? Suggested question: "The compositor-* and @remotion/media npm packages have no license field and no LICENSE file. Which license applies to them in version 4.0.540?"
2. Same question for `@remotion/media`.

No contact was made with Remotion. Contacting them is an outward action that needs your approval. Channels: `remotion.dev/docs/support` or a GitHub issue on `remotion-dev/remotion`.

### FFmpeg inside the compositor packages

The `@remotion/compositor-win32-x64-msvc` package contains `ffmpeg.exe` and related DLLs. Its build (`ffmpeg version n7.1`) is configured with `--enable-gpl`, `--enable-libx264`, `--enable-libx265`, and `--enable-libfdk-aac`. The `fdk-aac` library is not redistributable under a free license. This repository does not redistribute these binaries. Remotion is responsible for their licensing. Users should know that the FFmpeg inside Remotion is a GPL build with non-free components.

## 2. Other npm packages (pinned in `templates/remotion-kit/package.json`)

| Package | Pinned version | License (package metadata) | Status |
|---|---|---|---|
| `react` | 19.1.10 | MIT | CONFIRMED (metadata) |
| `react-dom` | 19.1.10 | MIT | CONFIRMED (metadata) |
| `zod` | 4.6.7 | MIT | CONFIRMED (metadata) |
| `@types/react` | 19.1.17 | MIT | CONFIRMED (metadata) |
| `typescript` | 5.9.3 | Apache-2.0 | CONFIRMED (metadata) |

## 3. Transitive npm packages (lock file)

The lock pins **293 packages**. The full inventory with per-package status is in `docs/npm-license-inventory.json`.

| License (as recorded in the lock) | Packages | Notes |
|---|---|---|
| MIT | 230 | Permissive |
| ISC | 17 | Permissive |
| BSD-2-Clause / BSD-3-Clause | 9 / 6 | Permissive |
| Apache-2.0 | 5 | Permissive, with patent terms |
| 0BSD, Unlicense | 1, 2 | Permissive |
| Python-2.0 (npm `argparse`) | 1 | Permissive |
| BlueOak-1.0.0 (`graceful-fs`) | 1 | Permissive |
| CC-BY-4.0 (`caniuse-lite`, data) | 1 | Attribution required |
| MPL-2.0 (`mediabunny`, `@mediabunny/*`) | 4 | File-level copyleft. Not modified or redistributed here. |
| Remotion License (`SEE LICENSE IN LICENSE.md`) | 6 | See section 1 |
| Remotion License (`Remotion License`) | 2 | See section 1 |
| **UNKNOWN in the lock** | **8** | The 7 compositor platform packages and `@remotion/media`. **UNRESOLVED.** |

The 8 UNRESOLVED packages are not classified as MIT.

**Release status (v0.1.0):** the release decision was taken without waiting for an answer. A written inquiry was sent to Remotion at `hi@remotion.dev`, the address listed in the official license FAQ. No reply had been received at release time. The eight UNRESOLVED packages stay UNRESOLVED in this file until a written answer is received and recorded here.

**Codec patents (not covered by any Remotion license):** the Remotion FAQ states that a Remotion license does not include licenses to third-party patents, for example patents on H.264/AVC, HEVC, or AAC. Users are responsible for determining whether they need additional licenses for the encoders this project calls.

No transitive package is distributed by this repository. They are installed by `npm ci` on the user's machine.

## 4. Runtime tools (not bundled; the user installs them)

Versions below are the ones used in testing on the author's machine. Windows 11 (kernel `10.0.26300`), AMD64.

| Tool | Version tested | License | Status | Notes |
|---|---|---|---|---|
| Python | 3.12.10 | PSF License | CONFIRMED | The CLI uses only the standard library. |
| numpy | 2.5.4 | `BSD-3-Clause AND 0BSD AND MIT AND Zlib AND CC0-1.0` (installed metadata) | CONFIRMED | Used by the sound and music generators. |
| Node.js | v26.13.0 | MIT and bundled components | CONFIRMED | No minimum version is declared by Remotion. Other versions untested. |
| npm | 11.20.0 | Artistic License 2.0 | CONFIRMED | Installs packages. |
| FFmpeg, ffprobe | `9.0.2-full_build-www.gyan.dev` (Gyan.FFmpeg, WinGet) | GPL (build configured with `--enable-gpl`) | CONFIRMED (build config) | Not bundled. The build includes `libx264` (GPL). Redistributing this build requires GPL compliance. |
| Blender | 5.3.0 | GPL-2.0-or-later | CONFIRMED | Not bundled. The product scripts run inside Blender. |
| Google Chrome | 157.0.8103.78 | Proprietary | CONFIRMED | Used by Remotion for rendering. Not bundled. |
| Inkscape | Not tested in this phase | GPL-2.0-or-later | Optional | Used only for bounding boxes. |

## 5. Fonts (not bundled; download from Google Fonts)

| Font | License | Status | Notes |
|---|---|---|---|
| Cairo | SIL Open Font License 1.1 | CONFIRMED (copyright header of OFL.txt on Google Fonts) | Used by the example brand. Test copy used the variable font file `Cairo[slnt,wght].ttf` for both weights. |
| Poppins | SIL Open Font License 1.1 | CONFIRMED (copyright header of OFL.txt on Google Fonts) | Used by the example brand. |

Dubai (bundled with Windows) is not used. Its redistribution terms are unclear.

## 6. Original material in this repository

| Item | License |
|---|---|
| Scripts, templates, shared kit, and documentation | MIT, Copyright (c) 2026 Dr Alaa |
| Sound effects and music bed produced by the generators | Produced by code in this repository. No third-party samples. Covered by the MIT License. |
| Example brand: `brand.json`, `lockups.json`, and placeholder SVG logo files | MIT, Copyright (c) 2026 Dr Alaa. Fictional content only. |

## 7. Excluded

- Any client or organization brand asset, logo, font, guideline, or contact detail.
- Rendered videos, exports, and personal project files.
- Generated binary audio files (regenerate them with the scripts).
- Remotion binaries and FFmpeg binaries (installed by the user through npm and the FFmpeg installer).
