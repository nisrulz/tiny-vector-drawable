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
│   ├── model.js            # Item class — one file's state machine (pure)
│   ├── scheduler.js        # TaskQueue — bounded-concurrency async queue (pure)
│   ├── optimizer.js        # Lazy dynamic-import wrapper for the avocado bundle
│   ├── util.js             # DOM + formatting helpers (el, toast, uid, safeFilename)
│   ├── zip.js              # Store-only ZIP writer, table-driven crc32 (pure)
│   ├── optimize.js         # File intake + per-file optimization through the queue
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
│   ├── scheduler.test.js   # TaskQueue concurrency semantics
│   ├── zip.test.js         # crc32 vectors + full ZIP structure round-trip
│   └── util.test.js        # byteLength, formatPct, safeFilename, uid, isXmlFile
└── package.json
```

## Why bundle instead of the npm package

avocado ships as a Node package. Its core, `Avocado.prototype.optimize(xml)`, is
a pure string-in/string-out function. The CLI wrapper uses Node built-ins
(`fs`, `path`, `commander`, `os.EOL`) that don't exist in a browser. So the
browser build keeps the core and drops the wrapper.

`build/entry.js` imports only `dist/lib/avocado.js` and exposes:

```js
export function optimizeVectorDrawable(xml, options = {})
// options.pretty = false gives a minified single-line output
```

`build/bundle.js` runs esbuild with `platform: 'browser'`, minifies, and swaps
Node's `os` module for a one line shim (`EOL = "\n"`). The core never touches
`Buffer`, `fs`, or `path`, so those stay out of the bundle.

The result, `lib/avocado.bundle.js` (~49 KB minified, no runtime deps), is
committed so the site works at deploy time with no build step.

## Run locally

```bash
make serve         # serves the folder over http (npm run serve)
```

A static server is required because the app uses ES modules and a service
worker. Opening `index.html` from `file://` will not register the worker.

The server is `scripts/dev-server.mjs`, a ~70-line zero-dependency Node script
(no `serve`/`npx` download needed). It binds to `127.0.0.1` only, rejects paths
that escape the project root, and serves correct MIME types for every asset
including `text/javascript` for ES modules and `application/manifest+json`.
Override the port with `PORT` (default `5173`).

## Build

```bash
make install       # npm install (esbuild, devDependency only)
make build         # regenerates lib/avocado.bundle.js
make all           # install, build, and verify everything
```

esbuild is pinned as a devDependency so the bundle stays reproducible. After
upgrading esbuild, run `make build` and `make test:all` again.

## Test

Two layers, both runnable with `make verify` (or `npm run test:all`):

1. **Unit tests** (`npm test`, `node --test test/*.test.js`): the DOM-free
   modules — `Item` state machine, `TaskQueue` concurrency, the ZIP writer
   (crc32 vectors + full structure round-trip), and `util` helpers.
2. **Parity test** (`npm run test:parity`): optimizes committed samples with
   the bundled browser build and asserts byte-identical output against the
   fixtures in `test/fixtures`. If it breaks after an esbuild upgrade, the
   browser shim or batching logic in `build/entry.js` likely needs a tweak.

## How the app calls the optimizer

`js/optimizer.js` wraps a dynamic `import()` of `lib/avocado.bundle.js`, so the
~49 KB optimizer is fetched only on the first file drop — never on startup.

Each file becomes an `Item` (`js/model.js`) and is pushed through a
`TaskQueue` (`js/scheduler.js`) with concurrency 2. Because the optimizer is
CPU-heavy and single-threaded, the bounded queue keeps the UI responsive when
many files are dropped at once. Results go to the DOM with `textContent` only,
which is what keeps the XSS surface closed (see Security). A per-item `token`
dropped stale results if the output format changes mid-flight.

## Security

XSS is handled by never using `innerHTML`. All user content (original/optimized
XML, filenames, errors) goes to the DOM through `textContent` or `setAttribute`.

Downloads are safe too. `safeFilename()` strips path separators and control
characters from filenames in single downloads and `.zip` entries. This blocks
path traversal and Zip-Slip attacks.

No external requests. The app never sends user data over the network. The only
fetches are same-origin static assets for the service worker.

No secrets, no backend.

## Service worker

`sw.js` caches same-origin `GET` requests first and falls back to the network.
Bump the `CACHE` constant (`tvd-v1`) when you change a cached asset, so clients
pick up the new version.

## Performance and bandwidth

- The optimizer bundle is ~49 KB minified, loaded lazily on first use.
- No CDN dependencies. Everything is same-origin.
- The ZIP writer is inline (store mode, table-driven crc32). No JSZip dependency.
- Optimization runs through a concurrency-limited queue (2 at a time) so bulk
  drops don't jank the main thread.
- Icons are small. The SVG icon is used wherever possible.

That's it. The rest is just wiring in `app.js` and keeping the SW asset list in
sync.
