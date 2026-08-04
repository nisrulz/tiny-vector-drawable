// Zero-dependency static file server for local development.
// ES modules and the service worker both require http:// (file:// will not work),
// and bundling everything into a script avoids pulling in a network-fetched
// `serve` binary every time you run `npm run serve`.
import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, dirname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 5173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
};

// Resolve a URL path to an absolute file path, rejecting anything that would
// escape the project root (defense-in-depth against path traversal).
function resolvePath(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const filePath = normalize(join(ROOT, decoded));
  if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) return null;
  return filePath;
}

const server = http.createServer((req, res) => {
  const method = req.method || 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end('Method not allowed');
    return;
  }

  let urlPath = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = resolvePath(urlPath);
  if (!filePath) {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }

  let stats;
  try {
    stats = statSync(filePath);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  if (stats.isDirectory()) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  res.writeHead(200, {
    'Content-Type': MIME[extname(filePath)] || 'application/octet-stream',
    'Content-Length': stats.size,
    'Cache-Control': 'no-cache',
  });
  if (method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(filePath).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Tiny Vector Drawable dev server: http://127.0.0.1:${PORT}/`);
});
