import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('page declares local-only browser security policies', () => {
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /worker-src 'self'/);
  assert.match(html, /object-src 'none'/);
  assert.match(html, /<meta name="referrer" content="no-referrer"/);
});

test('format selection is visible before upload and defaults to minified', () => {
  assert.match(html, /value="min" checked/);
  assert.doesNotMatch(html, /device-notice/);
  assert.match(html, /up to 100 files and 25 MB total/);
});
