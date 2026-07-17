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
│   ├── state.js            # Shared state + DOM refs + format/XML helpers
│   ├── util.js             # DOM + formatting helpers (el, toast, safeFilename)
│   ├── zip.js              # Tiny store-only ZIP writer (no dependency)
│   ├── optimize.js         # File intake + per-file optimization
│   ├── ui.js               # Card rendering, downloads, toolbar
│   ├── theme.js            # Light/dark theme toggle (localStorage)
│   └── credits.js          # Footer credits popup
├── app.js                  # App entry: wires events, theme, credits, SW
├── manifest.webmanifest    # PWA metadata
├── sw.js                   # Service worker (app-shell cache, offline/installable)
├── icons/                  # PWA icons (svg + 192/512 png) and favicon
├── lib/
│   └── avocado.bundle.js   # Browser build of avocado's optimize(), committed
├── build/
│   ├── bundle.js           # esbuild script that produces lib/avocado.bundle.js
│   └── entry.js            # Entry module re-exporting optimizeVectorDrawable
├── test/
│   └── parity.js           # Checks bundle output matches the avocado CLI
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

The result, `lib/avocado.bundle.js` (~81 KB minified, no runtime deps), is
committed so the site works at deploy time with no build step.

## Run locally

```bash
make serve         # serves the folder over http
```

A static server is required because the app uses ES modules and a service
worker. Opening `index.html` from `file://` will not register the worker.

## Build

```bash
make install       # npm install (avocado + esbuild, devDependencies only)
make build         # regenerates lib/avocado.bundle.js
make all           # install, build, and verify parity in one step
```

avocado is pinned as a devDependency so the bundle stays reproducible. After
upgrading avocado, run `make build` and `make test` again.

## Test parity

`test/parity.js` optimizes a few VectorDrawable and AnimatedVectorDrawable
samples two ways and asserts byte-identical output:

1. The bundled browser build (`lib/avocado.bundle.js`).
2. The real avocado CLI (`avocado <in> -o <out>`).

```bash
make test
```

Or use `make parity`. If it breaks after an avocado upgrade, the browser shim or
batching logic in `build/entry.js` likely needs a tweak.

## How the app calls the optimizer

`js/optimize.js` calls `optimizeVectorDrawable(item.original, { pretty })` per
file. The call is async and deferred with `setTimeout(…, 0)` so the UI can show a
"Queued" or "Optimizing" state first. Results go to the DOM with `textContent`
only, which is what keeps the XSS surface closed (see Security).

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

- The optimizer bundle is ~81 KB minified, ~25 KB gzipped.
- No CDN dependencies. Everything is same-origin.
- The ZIP writer is inline (store mode). No JSZip dependency to ship.
- Icons are small. The SVG icon is used wherever possible.

That's it. The rest is just wiring in `app.js` and keeping the SW asset list in
sync.
