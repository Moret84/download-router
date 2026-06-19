# Download Router for Firefox

Route downloads into subfolders of your Firefox download directory based on
user-defined rules, like email filters.

Firefox natively offers only a single fixed download folder or an "ask every
time" prompt. This extension intercepts each download through
`browser.downloads.onDeterminingFilename` and rewrites its destination
according to the first matching rule.

## Features (MVP)

- Rule matching on domain, full URL (regex), filename (regex), extension and
  MIME type. All criteria set on a rule must match.
- Priority ordering: rules are evaluated by ascending priority, first match
  wins.
- Options page to add, edit, delete, enable/disable and reorder rules.
- Rule tester to preview the matched rule and resulting destination.
- Local history of the last 100 routed downloads.
- Storage via `browser.storage.local`. No backend, no tracking, no external
  service.

## Requirements

- Node.js 22+ (the build script is TypeScript, run natively by Node).
- Firefox 115+.

## Build

```sh
npm install
npm run build        # outputs the unpacked extension to dist/
npm run watch        # rebuild on change
npm run typecheck    # type-check without emitting
```

## Load in Firefox

1. Run `npm run build`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select `dist/manifest.json`.

## Project layout

```
src/
  manifest.json        Manifest V3 (Firefox)
  types.ts             Shared types (Rule, DownloadLog, MatchInput)
  matcher.ts           Rule matching engine and destination building
  storage.ts           browser.storage.local access and seeding
  defaults.ts          Default rules
  background.ts        onDeterminingFilename listener
  options/             Options page (rules CRUD, tester, history)
build.ts               esbuild bundling + static file copy
```

## License

MIT
