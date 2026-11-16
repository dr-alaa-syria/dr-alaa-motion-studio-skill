# Licenses (summary)

- **This project's original code** is licensed under the MIT License. See `LICENSE` (Copyright (c) 2026 Dr Alaa).
- **Remotion is not MIT.** It is source-available. It is free for individuals and organizations up to three people, and needs a Company License above that. The official text is `LICENSE.md` at tag v4.0.540. This repository does not include Remotion.
- **Release status:** the pre-release `v0.1.0-rc.1` was published before Remotion's answer. Remotion replied in writing on 2026-11-16 (issue #13426 on `remotion-dev/remotion`): their packages are either Remotion License or MIT, and distributing MIT-licensed original templates that import Remotion APIs is fine if they contain no Remotion code. The final `v0.1.0` waits for the per-package check of the eight packages below.
- **Codec patents:** a Remotion license does not cover patents on codecs such as H.264, HEVC, or AAC. Users are responsible for those.
- **Eight Remotion packages are answered but not yet checked per package.** Seven `@remotion/compositor-*` platform packages and `@remotion/media` lacked a license field at 4.0.540. Remotion's written answer says their packages are Remotion License or MIT, but it does not name these eight for that version. They are not classified as MIT until their npm metadata is checked. Details: `THIRD_PARTY_NOTICES.md`, section 1.
- **FFmpeg and Blender are not included.** The FFmpeg build used in testing is GPL. Blender is GPL-2.0-or-later. Install them yourself and follow their licenses.
- **Fonts are not included.** Cairo and Poppins are SIL OFL 1.1. Download them from Google Fonts.
- **Brand assets** (logos, fonts, guidelines, contacts) belong to their owners. Only the placeholder example brand is included, and it contains no real identity.

Details and versions: `THIRD_PARTY_NOTICES.md`. Per-package inventory: `docs/npm-license-inventory.json`. Longer explanation: `docs/LICENSES.md`.
