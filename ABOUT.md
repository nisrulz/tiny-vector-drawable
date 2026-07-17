# About Tiny Vector Drawable

_Your vector drawables, but make them tiny._

## Why use it

Android Studio warns about over-long path data. It ships drawables larger than
they need to be. avocado fixes that on the command line. This app puts the same
optimization behind a drag and drop. No install needed.

## Features

Everything runs in the browser. Files are read locally and optimized with a JS
bundle. Your drawables never leave your machine.

Drop multiple files at once. Pick pretty or minified output. Download individual
files or everything as a `.zip`. Works offline too. Ships as a PWA, installable
to your home screen. No analytics, no cookies, no backend.

The download is an optimized VectorDrawable or AnimatedVectorDrawable `.xml`.
Not a PNG. You get smaller vector sources ready for your app.

## Privacy

No backend. No network calls carrying your files. Everything runs in your
browser.

## Deploy to GitHub Pages

The app is static and served from the repo root. Enable GitHub Pages (Settings,
Pages, source: `main`, `/root`) and push. No env vars or secrets.

## License

This project is MIT licensed, see [LICENSE](LICENSE).

The optimizer in `lib/avocado.bundle.js` is avocado by Alex Lockwood, MIT
licensed. Its notice and license text are in
[THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md). Same optimizer compiled with
esbuild, so output matches the CLI.
