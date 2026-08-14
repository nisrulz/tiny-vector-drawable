# Development

How to run, build, and test this project.

## Common commands

| Command | What it does |
| --- | --- |
| `make help` | List every target |
| `make install` | Clean install from package-lock.json (`npm ci --ignore-scripts`) |
| `make serve` | Serve the site on http://127.0.0.1:5173 |
| `make build` | Regenerate lib/avocado.bundle.js |
| `make test` | Run the unit tests |
| `make parity` | Check the bundle matches test/fixtures |
| `make verify` | Test + parity, what CI runs |
| `make all` | Install, build, and verify |

Each `make` target wraps an npm script, so you can call either form. Run a
single test file, or serve on a different port:

```bash
node --test test/zip.test.js
PORT=8080 npm run serve
```

## Run locally

A static server is required because the app uses ES modules and a service
worker. Opening `index.html` from `file://` will not register the worker.

The server is `scripts/dev-server.mjs`, a small zero-dependency Node script
(no `serve`/`npx` download needed). It binds to `127.0.0.1` only, rejects paths
that escape the project root, and serves correct MIME types for every asset
including `text/javascript` for ES modules and `application/manifest+json`.
Override the port with `PORT` (default `5173`).

## Build

The public npm lockfile pins `esbuild` and SAX. `make install` uses
`npm ci --ignore-scripts` so local and CI installs use the same dependency tree
without running package lifecycle scripts. After changing either dependency,
run `make build` and `make test:all` again.

CI performs the clean install, rebuilds the bundle, runs every test, and fails
if the rebuilt `lib/avocado.bundle.js` differs from the committed file. It also
runs `npm audit` and verifies package registry signatures. Workflow actions are
pinned to full commit hashes. The CI workflow itself is
`.github/workflows/verify.yml`; it skips runs that touch only Markdown files.

## Test

Two layers, both runnable with `make verify` (or `npm run test:all`):

1. **Unit tests** (`npm test`): file limits, the `Item` state machine, Worker
   messages, optimizer validation, ZIP boundaries, PWA assets, the local
   server, and utility helpers.
2. **Parity test** (`npm run test:parity`): optimizes committed samples with
   the bundled browser build and asserts byte-identical output against the
   fixtures in `test/fixtures`. If it breaks after an esbuild upgrade, the
   browser shim or batching logic in `build/entry.js` likely needs a tweak.
