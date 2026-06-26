# Download Router for Firefox

Route downloads into subfolders of your Firefox download directory based on
user-defined rules, like email filters.

Firefox natively offers only a single fixed download folder or an "ask every
time" prompt. This project organizes downloads by user-defined rules, the way
email filters sort mail.

> This project was written with substantial help from an AI coding assistant.

## How routing works

Firefox has no `downloads.onDeterminingFilename` (a Chrome-only API) and an
extension cannot move files on disk. So routing happens **after** a download
finishes: the extension matches the completed download against the rules and
asks a small **native helper** to move the file to the rule's destination.

This has two consequences:

- A native messaging host (a tiny Go program) must be installed separately; the
  extension alone cannot move files. See [Installation](#installation).
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

- Firefox 115+.
- To build from source: Node.js 24+ (the build script is TypeScript, run
  natively by Node) and Go 1.23+ (for the native host).

## Installation

Download Router has two parts and you need both: the **extension** and the
**native host**. Grab them from the
[latest release](https://github.com/Moret84/download-router/releases/latest).

### 1. Native host

Install the package for your OS (all unsigned, so the OS will warn): the `.pkg`
on macOS, the setup `.exe` on Windows, or the Linux tarball. It registers itself
with Firefox and seeds a default `config.json` (allowed root: home) next to
itself. Edit `config.json` to restrict where downloads may be moved. See
[installers/README.md](installers/README.md) for per-OS details and uninstall.

### 2. Extension

The extension is not on [addons.mozilla.org](https://addons.mozilla.org) (AMO)
yet, so the release ships an **unsigned** package. Stable Firefox refuses to
install unsigned extensions permanently, so for now:

- **Firefox Developer Edition, Nightly or ESR**: set
  `xpinstall.signatures.required` to `false` in `about:config`, then install the
  package from the release.
- **Any Firefox**: load it temporarily (see [Development](#development)); it
  stays until you restart the browser.

Once the extension is published to AMO, this step will become a one-click,
auto-updating install.

## Development

The extension lives in `extension/`; run its commands from there.

```sh
cd extension
npm install
npm run build        # outputs the unpacked extension to extension/dist/
npm run watch        # rebuild on change
npm run typecheck    # type-check without emitting
```

Load the built extension temporarily in Firefox:

1. Run `npm run build` in `extension/`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select `extension/dist/manifest.json`.

Build and register the native host from source:

```sh
cd host && go build -o download-router-host . && ./download-router-host install
```

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
