# Architecture

How the app is laid out, and how avocado gets bundled for the browser.

## Layout

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
│   ├── file-validation.test.js # File count and byte limits
│   ├── optimizer-security.test.js # XML and path validation
│   ├── optimizer-worker.test.js   # Worker queue behavior
│   ├── pwa.test.js         # Service worker cache and asset list
│   ├── dev-server.test.js  # Local server and security headers
│   ├── html.test.js        # index.html content and security policies
│   ├── zip.test.js         # ZIP structure and boundary checks
│   ├── util.test.js        # Formatting and filename helpers
│   ├── fixtures/           # Expected bundle output for parity tests
│   └── samples/            # Input vectors for optimizer tests
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
repository carry its own fixes (see
[third-party-licenses.md](third-party-licenses.md)).

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

## How the app calls the optimizer

The service worker precaches the ~49 KB optimizer bundle for reliable offline
use. `js/optimizer.js` still imports it lazily inside `js/optimizer-worker.js`,
so parsing the bundle does not delay page startup.

Each file becomes an `Item` (`js/model.js`) and is sent to one module Worker.
The Worker processes one file at a time and yields before the next job. This
keeps CPU-heavy XML and path processing off the main thread without running
several optimizers at once. A per-item token drops stale results if the output
format changes during a batch, and queued work is replaced with the new format.

## Performance and bandwidth

- The optimizer bundle is ~49 KB minified and parsed lazily in a Worker.
- No CDN dependencies. Everything is same-origin.
- The ZIP writer is inline (store mode, table-driven crc32). No JSZip dependency.
- Optimization runs one file at a time off the main thread, so bulk drops do not
  block interaction or create competing CPU-heavy jobs.
- Icons are small. The SVG icon is used wherever possible.
