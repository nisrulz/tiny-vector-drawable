import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../scripts/dev-server.mjs';

function request(path, method = 'GET') {
  const server = createServer();
  const handler = server.listeners('request')[0];
  const response = { status: null, headers: null };
  handler(
    { method, url: path, headers: { host: '127.0.0.1' } },
    {
      writeHead(status, headers) {
        response.status = status;
        response.headers = headers;
      },
      end() {},
    },
  );
  return response;
}

test('development server sends security headers and handles malformed paths', () => {
  const response = request('/', 'HEAD');
  assert.equal(response.status, 200);
  assert.match(response.headers['Permissions-Policy'], /camera=\(\)/);
  assert.equal(response.headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(response.headers['X-Frame-Options'], 'DENY');
  assert.equal(response.headers['Referrer-Policy'], 'no-referrer');

  assert.equal(request('/%').status, 400);
});
