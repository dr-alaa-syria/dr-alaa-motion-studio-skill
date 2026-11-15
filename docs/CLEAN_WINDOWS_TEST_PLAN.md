# Clean Windows test plan

Status: **PLAN ONLY. Nothing in this plan has been run.** A clean-environment test is NOT TESTED until the steps below are executed and evidence is recorded.

## 1. Why this test is needed

Passing tests on the author's machine do not prove that the package installs and runs elsewhere. This machine has every tool installed, a personal profile, and an existing `npm` cache. A clean test removes those advantages.

## 2. Environment options

| Option | Requirements | Admin needed? | Notes |
|---|---|---|---|
| A. Windows Sandbox | Windows 11 Pro/Enterprise with the "Windows Sandbox" optional feature enabled, and a reboot | Yes (enable feature) | Best isolation. Discarded after each session. Current state on this PC: `WindowsSandbox.exe` is not installed; the feature state cannot be queried without elevation. |
| B. Separate Windows user account | Administrator creates a standard user, then signs in as that user | Yes | Not using the existing accounts on this PC. Shares the machine and system-wide installs. |
| C. Hyper-V virtual machine | Hyper-V role enabled; Windows 11 ISO | Yes | Full isolation. This PC reports hypervisor and virtualization-based security running. |
| D. Another physical machine | Any clean Windows 11 64-bit PC | No | Simplest for a real clean result. |

**Current state:** no option can be started from this session without changing Windows settings or using administrator rights, which were not granted. Option A, C, or D is required. Option B is weaker, because machine-wide installs persist.

## 3. Tool versions to install (inside the test environment only)

Record the exact version and the download source (URL and SHA-256) for each.

| Tool | Version to test | Source | Notes |
|---|---|---|---|
| Windows | 11 64-bit (build recorded with `winver`) | Microsoft | |
| Python | 3.12.10 (also test 3.13.x if available) | python.org | Tick "Add to PATH". Then `pip install -r requirements.txt`. |
| Node.js | 26.13.0 (also test current LTS) | nodejs.org | Record `node --version`, `npm --version`. |
| FFmpeg | `9.0.2-full_build` from gyan.dev, and one other build (for example the "essentials" build) | gyan.dev or WinGet | Record `ffmpeg -buildconf` output. Check `libx264`, `prores_ks`, `libmp3lame`. |
| Google Chrome | 157 or current stable | google.com/chrome | Record version with `chrome.exe --version`. |
| Blender | 5.3.0 | blender.org | Only for the product template. |
| Git | not required | | The package does not need Git. |

No other software is installed. Do not use the author's existing installs.

## 4. Preparation

1. Copy the package folder into the test environment as a plain folder. Use a path containing Arabic letters and spaces, for example `C:\Test مساحة عربية\Dr Alaa Motion Studio Skill`.
2. Record the SHA-256 of every file in the package. Compare it with the copy on the author's machine.
3. Do not copy `node_modules`, `studio.config.json`, or any rendered output.

## 5. Test steps (in order)

| # | Step | Expected result | Evidence to keep |
|---|---|---|---|
| 1 | `python --version`, `node --version`, `npm --version`, `ffmpeg -version`, `ffprobe -version` | Versions as listed in section 3 | Console output |
| 2 | `pip install -r requirements.txt` | numpy installs | `pip show numpy` |
| 3 | `python scripts/studio.py check` | Tools reported; missing tools reported without a crash | Output |
| 4 | `python scripts/studio.py init` | Workspace folders created in the test workspace | Folder list |
| 5 | `python scripts/studio.py templates` | Four templates and the example brand listed | Output |
| 6 | For each template (logo, promo, kinetic): `new`, then `npm ci --prefix`, then `npm run typecheck` | Project created; no typecheck errors | Output |
| 7 | For each template: `render --preview --frames 0-14` | One low-resolution MP4 per template | `ffprobe` output |
| 8 | `still` one frame per template | PNG created | Visual check |
| 9 | `sfx`, `music`, `export --preset social_9x16_native` on a short generated clip | Files created | `ffprobe` output |
| 10 | If Blender is installed: `new --type blender --template product`, then `blender-shot --frames 1 --percent 25` | `.blend` and one frame | `ffprobe` output |
| 11 | Missing-tool checks: run with a PATH that lacks FFmpeg, then with no Chrome | Short, clear messages | Output |
| 12 | Remove the project's `node_modules\.cache` and render again | Render completes | Output |

Each step must be recorded as PASS, FAIL (with the exact output), or NOT TESTED (with the reason). No step may be marked PASS from a simulation.

## 6. Failure handling

- Keep the full output of each failing command.
- Do not change the package during the test. Record the problem, then fix it in a later phase after review.
- Reboot the environment between runs for Sandbox (it resets by design), or restore the VM snapshot.

## 7. Evidence to deliver

- Table of versions and SHA-256 values.
- Log of every step with PASS, FAIL, or NOT TESTED.
- Screenshots of the four rendered previews (optional).
- A statement of the environment type (Sandbox, VM, separate account, or physical machine).

## 8. Remaining prerequisites before running

1. Choose option A, C, or D (section 2). Option B is weaker and should be used only with explicit approval.
2. Approve any change to Windows features or any new software in the test environment.
3. Confirm that the Remotion licence answer is not required before this test (the test does not depend on it).
