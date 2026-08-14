# Service worker

`sw.js` precaches the app shell, Worker, and optimizer bundle. It serves
same-origin `GET` requests from the named cache first, then stores successful
network responses. Activation deletes only older caches with the `tvd-` prefix,
so it does not touch caches owned by another app on the same origin.

Bump the `CACHE` constant when a cached asset changes. Keep `ASSETS` in sync
with `index.html` and all static module imports, or offline use will break.
