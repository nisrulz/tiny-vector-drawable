# AGENTS.md

## Purpose
Tiny Vector Drawable is a 100% client-side web app that optimizes Android
VectorDrawable / AnimatedVectorDrawable XML using the [avocado](https://github.com/alexjlockwood/avocado)
optimizer. No backend, no uploads, no analytics. Deployable as a static GitHub
Pages site and installable PWA. Optimizer output is an `.xml` file, not a PNG.

## Layout
```
index.html        UI shell; loads css/* and app.js (type=module)
css/              theme.css, base.css, layout.css, components.css (linked in <head>)
js/
  state.js        Shared `items` array + DOM refs; isPrettyFormat()
  util.js         el(), toast(), uid(), safeFilename(), triggerDownload(), format helpers
  zip.js          store-only ZIP writer (makeZip) with table-driven crc32; no dependency
  model.js        Item class: state machine (queued/optimizing/done/error)
  file-validation.js  File count and byte limits
  optimizer.js    Lazy dynamic-import wrapper used by the Worker
  optimizer-worker.js Serial optimizer queue off the main thread
  optimize.js     handleFiles(), reoptimizeAll(), resetAll()
  ui.js           renderItem(), updateToolbar(), download*, clearAll()
  theme.js        initTheme(), light/dark toggle persisted in localStorage
  credits.js      initCredits(), footer attribution popup
app.js            Entry: wires events, theme, credits, service worker
lib/avocado.bundle.js   Committed browser build of avocado (esbuild)
build/            bundle.js (esbuild) + entry.js (re-exports optimizeVectorDrawable)
scripts/dev-server.mjs  Zero-dependency static server (npm run serve)
test/             parity.js (bundle vs fixtures) + *.test.js unit tests (node:test)
sw.js             App-shell cache; asset list MUST list every css/js asset
manifest.webmanifest, icons/   PWA metadata
```

## Module rules
- ES modules (`"type": "module"`). `state.js` is the single source of shared DOM
  refs and `items`. Pure logic (model, file validation, zip, util) stays DOM-free so it
  is unit-testable in Node.
- Every module imports its dependencies explicitly; no globals. No import cycles.
- Never use `innerHTML` with user data. Render via `el()` or `textContent` only.
- Filenames flow through `safeFilename()` before download or zip entry (Zip-Slip safe).
- No network calls carry user files. Only same-origin static asset fetches (SW).
- The service worker precaches the optimizer bundle. A module Worker imports it
  lazily so parsing and optimization never block the main thread.

## Common tasks
- Add UI behavior: extend the matching `js/*.js` module; wire in `app.js`.
- Add a stylesheet: edit the `<link>` list in `index.html` and the `ASSETS`
  array in `sw.js` (keep both in sync or offline install breaks).
- Change a cached asset: bump `CACHE` (`tvd-vN`) in `sw.js`.
- Rebuild optimizer: `npm ci --ignore-scripts && npm run build`, then run
  `npm run test:parity` and check that the committed bundle matches.
- Add a unit test: put a `*.test.js` in `test/` (Node built-in test runner,
  `node --test`). Pure logic lives in DOM-free modules precisely so this works.
- Local serve (ES modules + SW need http): `npm run serve` (zero-dep static
  server on http://127.0.0.1:5173, PORT env to override).
  `file://` will not register the SW.

## Verifications
- `npm test` runs the unit tests; `npm run test:parity` checks the bundle
  matches the committed fixtures. `npm run test:all` (or `make verify`) runs both.
- Serve and load `index.html`; confirm 200 for css/*, js/*, app.js, lib/*.
- Keep CSS brace counts balanced per file; keep `sw.js` ASSETS in sync with `index.html`.
- `npm audit` should report 0 vulnerabilities. Build dependencies are pinned in
  the root lockfile.

## Constraints
- MIT licensed. avocado attribution stays in THIRD_PARTY_LICENSES.md and footer popup.
- Do not add runtime dependencies for features already inline (ZIP writer).
- Do not introduce a backend or any upload path.

## Generated artifacts
- Never edit generated/build outputs by hand. `lib/avocado.bundle.js` is produced by
  the esbuild step (`npm run build` from `build/entry.js` + `vendor/avocado/src/`).
  Fix the source in `vendor/avocado/src/` and rebuild instead.
- Treat any minified/bundled output as read-only; changes there are lost on the next build.
