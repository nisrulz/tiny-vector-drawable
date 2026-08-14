# Deploy to GitHub Pages

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
