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
