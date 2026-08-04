# About Tiny Vector Drawable

_Your vector drawables, but make them tiny._

## Why use it

Android Studio warns about over-long path data. It ships drawables larger than
they need to be. avocado fixes that on the command line. This app puts the same
optimization behind a drag and drop. No install needed.

## Features

Everything runs in the browser. Files are read locally and optimized with a JS
bundle. Your drawables never leave your machine.

Choose minified or pretty output before adding files. Drop up to 100 files at
once, with a 5 MB limit per file and a 25 MB limit for the full batch. Download
one result or wait for the batch and download a `.zip`. Duplicate filenames get
safe, unique names, so every successful result stays in the ZIP.

Optimization runs in a Web Worker to keep the page responsive. The layout also
works on mobile. The app works offline and can be installed as a PWA. There are
no analytics, cookies, or backend.

The download is an optimized VectorDrawable or AnimatedVectorDrawable `.xml`.
Not a PNG. You get smaller vector sources ready for your app.

## Privacy

No backend. No network calls carrying your files. Everything runs in your
browser.

## Deploy to GitHub Pages

The app is static and served from the repo root. Enable GitHub Pages (Settings,
Pages, source: `main`, `/root`) and push. Set the custom domain to `nisrulz.com`
and enable **Enforce HTTPS**. No env vars or secrets are needed.

GitHub Pages cannot set every response header. If Cloudflare fronts the site,
configure these rules there:

1. Redirect every direct HTTP request to HTTPS.
2. Enable HSTS only after HTTPS works on the domain and its subdomains.
3. Send `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
   `Referrer-Policy: no-referrer`, and
   `Permissions-Policy: camera=(), geolocation=(), microphone=()`.

A Content-Security-Policy is intentionally not used: the app is static with no
user-generated markup, no inline scripts, and no third-party resources, so a CSP
would only fight deployment tooling (e.g. Cloudflare's Rocket Loader) without
protecting anything.

Check the deployed redirect chain after either setup. No response or redirect
location should contain `http://`. HSTS and the response headers are deployment
settings, so this repository cannot enforce them by itself.

## License

This project is MIT licensed, see [LICENSE](LICENSE).

The optimizer in `lib/avocado.bundle.js` is avocado by Alex Lockwood, MIT
licensed. Its notice and license text are in
[THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md). Same optimizer compiled with
esbuild, so output matches the CLI.
