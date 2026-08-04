import { test } from 'node:test';
import assert from 'node:assert/strict';

const messages = [];
let receive;
globalThis.self = {
  addEventListener(type, listener) {
    if (type === 'message') receive = listener;
  },
  postMessage(message) {
    messages.push(message);
  },
};

await import('../js/optimizer-worker.js');

const open = '<vector xmlns:android="http://schemas.android.com/apk/res/android">';
const valid = `${open}<path android:pathData="M0 0 L1 1"/></vector>`;

async function waitFor(predicate) {
  const timeout = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > timeout) throw new Error('Timed out waiting for worker output.');
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

test('optimizer worker returns results and errors', async () => {
  receive({ data: { type: 'optimize', id: 'ok', token: 1, xml: valid, pretty: false } });
  await waitFor(() => messages.some((message) => message.type === 'done' && message.id === 'ok'));

  receive({
    data: {
      type: 'optimize',
      id: 'bad',
      token: 1,
      xml: `${open}<path android:pathData="M0 0 L1"/></vector>`,
      pretty: false,
    },
  });
  await waitFor(() => messages.some((message) => message.type === 'error' && message.id === 'bad'));
  assert.match(
    messages.find((message) => message.type === 'error' && message.id === 'bad').error,
    /Invalid android:pathData/,
  );
});

test('optimizer worker drops queued jobs when cleared', async () => {
  receive({ data: { type: 'optimize', id: 'first', token: 1, xml: valid, pretty: false } });
  receive({ data: { type: 'optimize', id: 'dropped', token: 1, xml: valid, pretty: false } });
  receive({ data: { type: 'clear' } });
  receive({ data: { type: 'optimize', id: 'last', token: 1, xml: valid, pretty: false } });

  await waitFor(() => messages.some((message) => message.type === 'done' && message.id === 'last'));
  assert.equal(messages.some((message) => message.id === 'dropped'), false);
});
