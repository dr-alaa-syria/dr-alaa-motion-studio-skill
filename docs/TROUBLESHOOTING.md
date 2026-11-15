# Troubleshooting

Common problems with Dr Alaa Motion Studio Skill, and what to do. Each entry says what was tested and what was not.

## Remotion cache (stale renders)

**What the cache is.** Remotion bundles the project with webpack and keeps the bundle cache in the project folder:

```text
<workspace>\projects\remotion\<project>\node_modules\.cache\webpack
```

It can grow to about 200 MB per project. It is safe to delete. The next render rebuilds it.

**When to clear it.** Clear the cache after you change files in `src\kit`, `src\brand`, or `public\brand\fonts`, and a render still shows the old result. Also clear it if a missing font seems to be ignored.

**How to clear it (PowerShell):**

```powershell
Remove-Item -Recurse -Force "<workspace>\projects\remotion\<project>\node_modules\.cache"
```

Then render again. If the problem remains, reinstall the project's dependencies:

```powershell
Remove-Item -Recurse -Force "<workspace>\projects\remotion\<project>\node_modules"
npm ci --prefix "<workspace>\projects\remotion\<project>"
```

**What was tested.** In the author's environment (Remotion 4.0.540, Chrome 157.0.8103.78, Windows 11 kernel 10.0.26300):

- A render with a font file removed fails every time, and the message names the file.
- Restoring the file makes the render succeed every time.
- Clearing the cache does not change those results.
- Once, the first render after changing a kit file ignored a removed font and succeeded. Three controlled reruns did not reproduce it. The cause is **not confirmed**. Clearing the cache is the recommended step if you see this behaviour.

## Missing brand font

Message: `Brand font not found: /public/brand/fonts/<file> (HTTP 404)`.

Fix: put the file in `brands/<id>/fonts/` with the exact name listed in `brand.json`, then create the project again, or copy the file into the project's `public/brand/fonts/` folder and clear the cache. See `docs/BRANDS.md`.

Tested: a missing `Cairo-Bold.ttf` stops the render with that message (repeated three times).

## Silent or missing audio in an export

Old behaviour: the export failed with an encoder error.

Current behaviour: the loudness step is skipped and a note is printed. The file is still exported.

Tested: a silent 2-second clip exports to 1080x1920 and 1920x1080. A clip with a 440 Hz tone exports to -14.0 LUFS.

## "Blender was not found"

Set `blender` in `studio.config.json` to the full path of `blender.exe`, or set the `BLENDER_PATH` environment variable. Check with `python scripts/studio.py check`.

Tested with Blender 5.3.0 only.

## "'ffmpeg' was not found on PATH"

Install an FFmpeg build that includes `ffprobe`, add its `bin` folder to PATH, and open a new terminal. Check with `ffmpeg -version` and `ffprobe -version`.

Tested with `ffmpeg version 9.0.2-full_build-www.gyan.dev`. See `THIRD_PARTY_NOTICES.md` for its license.

## Chrome not found

Set `chrome` in `studio.config.json` to the full path of `chrome.exe`, or set `CHROME_PATH`. Remotion uses this browser for rendering.

## "'npx' was not found on PATH"

Install Node.js and open a new terminal. Version v26.13.0 is the only one tested. The version used in testing was Node.js 26.13.0. No minimum version is declared by Remotion; see `THIRD_PARTY_NOTICES.md`.

## `npm ci` fails

- Check that Node and npm are on PATH: `node --version`, `npm --version`.
- Delete `node_modules` in the project folder and run `npm ci` again.
- Check that `package-lock.json` is present in the project. It is copied from the kit when the project is created.

## PowerShell refuses to run `Studio.ps1`

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Or run the Python CLI directly: `python scripts/studio.py <command>`.

## Paths with Arabic letters or spaces

Tested on the author's machine: a repository path and a workspace path that both contain Arabic letters and spaces, and an English path with spaces. Projects were created, typechecked, and rendered there.

**Not tested** on a separate clean Windows account.

## Errors from a tool show a short message

The CLI prints the tool's own output above the message and ends with `'<tool>' stopped with exit code N`. Read the lines above the message for the cause.
