# Download Router for Firefox

Route downloads into subfolders of your Firefox download directory based on
user-defined rules, like email filters.

Firefox natively offers only a single fixed download folder or an "ask every
time" prompt. This project organizes downloads by user-defined rules, the way
email filters sort mail.

## How routing works

Firefox has no `downloads.onDeterminingFilename` (a Chrome-only API) and an
extension cannot move files on disk. So routing happens **after** a download
finishes: the extension matches the completed download against the rules and
asks a small **native helper** to move the file to the rule's destination.

This has two consequences:

- A native messaging host (a tiny Go program) must be installed separately; the
  extension alone cannot move files. See [Install the native host](#install-the-native-host).
- The file is moved after completion, so Firefox's own download panel entry
  still points at the original location.

In exchange, destinations are **not limited to the download folder**: a rule can
target any path allowed by the host's allowlist.

## Features

- Rule matching on domain, full URL (regex), filename (regex), extension and
  MIME type. All criteria set on a rule must match.
- Priority ordering: rules are evaluated by ascending priority, first match
  wins.
- Destinations with variables: `{domain}`, `{filename}`, `{extension}`,
  `{year}`, `{month}` (e.g. `~/Documents/Sites/{domain}`).
- Options page to add, edit, delete, enable/disable and reorder rules.
- Rule tester to preview the matched rule and resulting destination.
- Rules sync across devices via `browser.storage.sync`; JSON import/export.
- History of the last 100 routed downloads (`browser.storage.local`).
- No backend, no tracking, no external service.

## Requirements

- Node.js 24+ (the build script is TypeScript, run natively by Node).
- Go 1.23+ (to build the native host).
- Firefox 115+.

## Build

The extension lives in `extension/`; run its commands from there.

```sh
cd extension
npm install
npm run build        # outputs the unpacked extension to extension/dist/
npm run watch        # rebuild on change
npm run typecheck    # type-check without emitting
```

## Load in Firefox

1. Run `npm run build` in `extension/`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select `extension/dist/manifest.json`.

## Install the native host

Build the helper and register it with Firefox (macOS/Linux):

```sh
cd host && go build -o download-router-host . && cd ..
installers/install.sh host/download-router-host
```

On Windows, use `installers\install.ps1`. The installer copies the binary,
seeds a default `config.json` (allowed root: home) and writes the native
messaging manifest. Edit `config.json` to restrict where downloads may be
moved. See [installers/README.md](installers/README.md) for details and
uninstall.

## Project layout

```
extension/             Firefox add-on (TypeScript)
  src/
    manifest.json      Manifest V3 (Firefox)
    types.ts           Shared types (Rule, DownloadLog, MatchInput)
    matcher.ts         Rule matching engine and destination building
    storage.ts         storage access (sync for rules, local for history)
    defaults.ts        Default rules
    background.ts      Download trigger and routing
    options/           Options page (rules CRUD, tester, history)
  build.ts             esbuild bundling + static file copy
host/                  Native messaging helper (Go) that moves the file
installers/            Per-OS installers for the native host
```

## License

MIT
