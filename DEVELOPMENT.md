# Developer Documentation

How this thing is built, how avocado gets bundled for the browser, and where to
poke around when you need to change something.

## Architecture

```
tiny-vector-drawable/
├── index.html              # UI shell (drop zone, toolbar, results, footer)
├── css/                    # Split stylesheets (loaded in order from <head>)
│   ├── theme.css           # CSS custom properties + dark/light/system themes
│   ├── base.css            # Reset, html/body, links, code
│   ├── layout.css          # Header, main, footer, toast
│   └── components.css      # Dropzone, toolbar, buttons, cards, code, credits
├── js/                     # ES modules (app.js is the entry point)
│   ├── state.js            # Shared items[] + DOM refs + isPrettyFormat()
│   ├── model.js            # Item class, one file's state machine (pure)
│   ├── file-validation.js  # File count and byte limits (pure)
│   ├── optimizer.js        # Lazy import wrapper used by the Worker
│   ├── optimizer-worker.js # Serial optimizer queue, off the main thread
│   ├── util.js             # DOM and formatting helpers
│   ├── zip.js              # Store-only ZIP writer, table-driven crc32 (pure)
│   ├── optimize.js         # File intake and Worker messages
│   ├── ui.js               # Row rendering, downloads, toolbar
│   ├── theme.js            # Light/dark theme toggle (localStorage)
│   └── credits.js          # Footer credits popup
├── app.js                  # App entry: wires events, theme, credits, SW
├── scripts/
│   └── dev-server.mjs      # Zero-dependency static server (npm run serve)
├── manifest.webmanifest    # PWA metadata
├── sw.js                   # Service worker (app-shell cache, offline/installable)
├── icons/                  # PWA icons (svg + 192/512 png) and favicon
├── lib/
│   └── avocado.bundle.js   # Browser build of avocado's optimize(), committed
├── build/
│   ├── bundle.js           # esbuild script that produces lib/avocado.bundle.js
│   └── entry.js            # Entry module re-exporting optimizeVectorDrawable
├── test/
│   ├── parity.js           # Checks bundle output matches committed fixtures
│   ├── model.test.js       # Item state machine
│   ├── optimizer-security.test.js # XML and path validation
│   ├── optimizer-worker.test.js   # Worker queue behavior
│   ├── pwa.test.js         # Service worker cache and asset list
│   ├── dev-server.test.js  # Local server and security headers
│   ├── zip.test.js         # ZIP structure and boundary checks
│   └── util.test.js        # Formatting and filename helpers
└── package.json
```

## Why bundle instead of the npm package

avocado ships as a Node package. Its core, `Avocado.prototype.optimize(xml)`, is
a pure string-in/string-out function. The CLI wrapper uses Node built-ins
(`fs`, `path`, `commander`, `os.EOL`) that don't exist in a browser. So the
browser build keeps the core and drops the wrapper.

The upstream avocado repository was archived (read-only) on Aug 7, 2026, so
this project vendors the source instead of depending on a package that can no
longer be updated. Vendoring keeps the build reproducible and lets this
repository carry its own fixes (see `THIRD_PARTY_LICENSES.md`).

`build/entry.js` imports only `dist/lib/avocado.js` and exposes:

```js
export function optimizeVectorDrawable(xml, options = {})
// options.pretty = false gives a minified single-line output
```

`build/bundle.js` runs esbuild with `platform: 'browser'`, minifies, and swaps
Node's `os` module for a one line shim (`EOL = "\n"`). It also provides a small
`string_decoder` shim for SAX's unused Node stream path. Browser input is always
a string, so the shim does not process user XML.

The result, `lib/avocado.bundle.js` (~49 KB minified, no runtime deps), is
committed so the site works at deploy time with no build step.

## Run locally

```bash
make serve         # serves the folder over http (npm run serve)
```

A static server is required because the app uses ES modules and a service
worker. Opening `index.html` from `file://` will not register the worker.

The server is `scripts/dev-server.mjs`, a small zero-dependency Node script
(no `serve`/`npx` download needed). It binds to `127.0.0.1` only, rejects paths
that escape the project root, and serves correct MIME types for every asset
including `text/javascript` for ES modules and `application/manifest+json`.
Override the port with `PORT` (default `5173`).

## Build

```bash
make install       # clean install from package-lock.json, without lifecycle scripts
make build         # regenerates lib/avocado.bundle.js
make all           # install, build, and verify everything
```

The public npm lockfile pins `esbuild` and SAX. `make install` uses
`npm ci --ignore-scripts` so local and CI installs use the same dependency tree
without running package lifecycle scripts. After changing either dependency,
run `make build` and `make test:all` again.

CI performs the clean install, rebuilds the bundle, runs every test, and fails
if the rebuilt `lib/avocado.bundle.js` differs from the committed file. It also
runs `npm audit` and verifies package registry signatures. Workflow actions are
pinned to full commit hashes.

## Test

Two layers, both runnable with `make verify` (or `npm run test:all`):

1. **Unit tests** (`npm test`, `node --test test/*.test.js`): file limits, the
   `Item` state machine, Worker messages, optimizer validation, ZIP boundaries,
   PWA assets, the local server, and utility helpers.
2. **Parity test** (`npm run test:parity`): optimizes committed samples with
   the bundled browser build and asserts byte-identical output against the
   fixtures in `test/fixtures`. If it breaks after an esbuild upgrade, the
   browser shim or batching logic in `build/entry.js` likely needs a tweak.

## How the app calls the optimizer

The service worker precaches the ~49 KB optimizer bundle for reliable offline
use. `js/optimizer.js` still imports it lazily inside `js/optimizer-worker.js`,
so parsing the bundle does not delay page startup.

Each file becomes an `Item` (`js/model.js`) and is sent to one module Worker.
The Worker processes one file at a time and yields before the next job. This
keeps CPU-heavy XML and path processing off the main thread without running
several optimizers at once. A per-item token drops stale results if the output
format changes during a batch, and queued work is replaced with the new format.

## Security

XSS is handled by never using `innerHTML`. All user content (original/optimized
XML, filenames, errors) goes to the DOM through `textContent` or `setAttribute`.

Downloads are safe too. `safeFilename()` strips path separators and control
characters from filenames in single downloads and `.zip` entries. ZIP names
are made unique without case-sensitive collisions. The writer rejects classic
ZIP count, filename, entry size, and archive size overflows.

Input is limited to 100 files, 5 MB per file, and 25 MB for the current batch.
The XML parser accepts only VectorDrawable and AnimatedVectorDrawable roots. It
rejects DOCTYPE declarations, text and CDATA nodes, excessive nesting, excessive
element counts, and invalid path commands or arc flags. These checks bound local
resource use and prevent malformed paths from being silently removed.

No external requests. The app never sends user data over the network. The only
fetches are same-origin static assets for the service worker.

No secrets, no backend.

## Service worker

`sw.js` precaches the app shell, Worker, and optimizer bundle. It serves
same-origin `GET` requests from the named cache first, then stores successful
network responses. Activation deletes only older caches with the `tvd-` prefix,
so it does not touch caches owned by another app on the same origin.

Bump the `CACHE` constant when a cached asset changes. Keep `ASSETS` in sync
with `index.html` and all static module imports, or offline use will break.

## Performance and bandwidth

- The optimizer bundle is ~49 KB minified and parsed lazily in a Worker.
- No CDN dependencies. Everything is same-origin.
- The ZIP writer is inline (store mode, table-driven crc32). No JSZip dependency.
- Optimization runs one file at a time off the main thread, so bulk drops do not
  block interaction or create competing CPU-heavy jobs.
- Icons are small. The SVG icon is used wherever possible.

That's it. The rest is just wiring in `app.js` and keeping the SW asset list in
sync.
