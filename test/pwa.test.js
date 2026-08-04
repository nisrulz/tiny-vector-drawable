import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const listeners = {};
globalThis.self = {
  location: new URL('https://example.com/tiny-vector-drawable/'),
  clients: { claim: async () => {} },
  skipWaiting: async () => {},
  addEventListener(type, listener) {
    listeners[type] = listener;
  },
};

await import('../sw.js');

test('service worker precaches files that exist', async () => {
  let assets;
  globalThis.caches = {
    open: async () => ({ addAll: async (entries) => { assets = entries; } }),
  };
  let install;
  listeners.install({ waitUntil(promise) { install = promise; } });
  await install;

  assert.ok(assets.includes('js/optimizer-worker.js'));
  assert.equal(assets.includes('icons/favicon.svg'), false);
  for (const asset of assets) {
    assert.equal(existsSync(join(root, asset)), true, `${asset} must exist`);
  }
});

test('service worker deletes only stale Tiny Vector Drawable caches', async () => {
  const deleted = [];
  globalThis.caches = {
    keys: async () => ['other-app-v1', 'tvd-v4', 'tvd-v5'],
    delete: async (key) => { deleted.push(key); },
  };
  let activation;
  listeners.activate({ waitUntil(promise) { activation = promise; } });
  await activation;
  assert.deepEqual(deleted, ['tvd-v4']);
});

test('service worker reads from the current named cache', async () => {
  let opened;
  let matched;
  globalThis.caches = {
    open: async (name) => {
      opened = name;
      return { match: async (request) => { matched = request.url; return new Response('cached'); } };
    },
  };
  const request = new Request('https://example.com/tiny-vector-drawable/app.js');
  let response;
  listeners.fetch({ request, respondWith(promise) { response = promise; } });
  assert.equal(await (await response).text(), 'cached');
  assert.equal(opened, 'tvd-v5');
  assert.equal(matched, request.url);
});

test('service worker stores successful network responses before returning', async () => {
  let stored = false;
  const networkResponse = {
    ok: true,
    type: 'basic',
    clone: () => ({ copy: true }),
  };
  globalThis.caches = {
    open: async () => ({
      match: async () => null,
      put: async (_request, response) => {
        await Promise.resolve();
        stored = response.copy;
      },
    }),
  };
  globalThis.fetch = async () => networkResponse;

  const request = new Request('https://example.com/tiny-vector-drawable/new.js');
  let response;
  listeners.fetch({ request, respondWith(promise) { response = promise; } });

  assert.equal(await response, networkResponse);
  assert.equal(stored, true);
});
