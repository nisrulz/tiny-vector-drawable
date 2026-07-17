# Third-Party Licenses

This project bundles code from the following open-source project. Its license
and copyright notice are reproduced below as required by its terms.

## avocado

The vector drawable optimization engine bundled in `lib/avocado.bundle.js` is
derived from [avocado](https://github.com/alexjlockwood/avocado) by Alex
Lockwood. It is a **locally modified, vendored copy** (snapshot of the source
in `vendor/avocado/`, built to the browser bundle via esbuild). The original
MIT-licensed source is unmaintained, so the source has been vendored into this
repository and patched locally. The original copyright and license notice below
are preserved as required by the MIT License. Local modifications:

- `vendor/avocado/src/plugins/mergePaths.ts`: added a guard that prevents
  merging sibling paths when the combined `android:pathData` would exceed ~3000
  characters (avoids the Android crash described in avocado issue #55).
- `build/entry.js` / `build/bundle.js`: build the optimizer directly from the
  vendored TypeScript source instead of the published npm package.

### Vendored snapshot

The copy in `vendor/avocado/` was snapshotted from the upstream `v1.0.0` tag at
commit
[`bba21b828073bac745649b9c46f6bdb7b15e5cc8`](https://github.com/alexjlockwood/avocado/commit/bba21b828073bac745649b9c46f6bdb7b15e5cc8).
The only source difference from that tag is the local `mergePaths.ts` guard
described above. To refresh, re-snapshot from a newer upstream commit and
re-apply the local modifications, then run `make build` and `make test`.

It is distributed under the MIT License.

```
MIT License

Copyright (c) 2017 Alex Lockwood

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction-free use, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Build tooling

`esbuild` (used only at build time to produce `lib/avocado.bundle.js`) is
licensed under the MIT License, Copyright (c) 2020 Evan Wallace. It is a
devDependency and is not distributed in the deployed site.
