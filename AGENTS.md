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
  state.js        Shared `items` array, DOM refs, currentFormat(), isXmlFile()
  util.js         el(), toast(), safeFilename(), triggerDownload(), format helpers
  zip.js          store-only ZIP writer (makeZip), no dependency
  optimize.js     handleFiles(), processItem(), reoptimizeAll()
  ui.js           renderItem(), updateItemCard(), download*, updateToolbar(), clearAll()
  theme.js        initTheme(), light/dark toggle persisted in localStorage
  credits.js      initCredits(), footer attribution popup
app.js            Entry: wires events, theme, credits, service worker
lib/avocado.bundle.js   Committed browser build of avocado (esbuild)
build/            bundle.js (esbuild) + entry.js (re-exports optimizeVectorDrawable)
test/parity.js    Asserts bundle output is byte-identical to avocado CLI
sw.js             App-shell cache; asset list MUST list every css/js asset
manifest.webmanifest, icons/   PWA metadata
```

## Module rules
- ES modules. `state.js` is the single source of shared DOM refs and `items`.
- Every module imports its dependencies explicitly; no globals.
- Never use `innerHTML` with user data. Render via `el()` or `textContent` only.
- Filenames flow through `safeFilename()` before download or zip entry (Zip-Slip safe).
- No network calls carry user files. Only same-origin static asset fetches (SW).

## Common tasks
- Add UI behavior: extend the matching `js/*.js` module; wire in `app.js`.
- Add or remove a stylesheet: edit the `<link>` list in `index.html` and the `ASSETS`
  array in `sw.js` (keep both in sync or offline install breaks).
- Change a cached asset: bump `CACHE` (`tvd-vN`) in `sw.js`.
- Rebuild optimizer: `npm install && npm run build` then `npm run test:parity`.
- Local serve (ES modules + SW need http): `npx -y serve .`.
  `file://` will not register the SW.

## Verifications
- `npm run test:parity` checks the bundle matches avocado CLI.
- Serve and load `index.html`; confirm 200 for css/*, js/*, app.js, lib/*.
- Keep CSS brace counts balanced per file; keep `sw.js` ASSETS in sync with `index.html`.

## Constraints
- MIT licensed. avocado attribution stays in THIRD_PARTY_LICENSES.md and footer popup.
- Do not add runtime dependencies for features already inline (ZIP writer).
- Do not introduce a backend or any upload path.

## Generated artifacts
- Never edit generated/build outputs by hand. `lib/avocado.bundle.js` is produced by
  the esbuild step (`npm run build` from `build/entry.js` + `vendor/avocado/src/`).
  Fix the source in `vendor/avocado/src/` and rebuild instead.
- Treat any minified/bundled output as read-only; changes there are lost on the next build.
