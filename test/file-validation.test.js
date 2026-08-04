import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_FILE_BYTES,
  MAX_FILE_COUNT,
  MAX_TOTAL_BYTES,
  validateFileBatch,
} from '../js/file-validation.js';

const file = (name, size = 10, type = 'application/xml') => ({ name, size, type });

test('validateFileBatch accepts XML within the limits', () => {
  const files = validateFileBatch([file('icon.xml'), file('notes.txt', 2, 'text/plain')]);
  assert.deepEqual(files.map((item) => item.name), ['icon.xml']);
});

test('validateFileBatch rejects empty and oversized selections', () => {
  assert.throws(() => validateFileBatch([file('notes.txt', 2, 'text/plain')]), /No .xml/);
  assert.throws(() => validateFileBatch([file('large.xml', MAX_FILE_BYTES + 1)]), /larger than 5 MB/);
  assert.throws(
    () => validateFileBatch(Array.from({ length: MAX_FILE_COUNT + 1 }, (_, i) => file(`${i}.xml`))),
    /at most 100 files/,
  );
});

test('validateFileBatch applies limits across existing items', () => {
  assert.throws(
    () => validateFileBatch([file('next.xml')], { count: MAX_FILE_COUNT }),
    /at most 100 files/,
  );
  assert.throws(
    () => validateFileBatch([file('next.xml', 1)], { bytes: MAX_TOTAL_BYTES }),
    /below 25 MB/,
  );
});
