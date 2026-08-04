import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  byteLength,
  formatPct,
  isXmlFile,
  safeFilename,
  uid,
  uniqueFilenames,
} from '../js/util.js';

test('byteLength', () => {
  assert.equal(byteLength(''), 0);
  assert.equal(byteLength('abc'), 3);
  assert.equal(byteLength('é'), 2); // 2 UTF-8 bytes
  assert.equal(byteLength('👋'), 4); // 4 UTF-8 bytes
});

test('formatPct', () => {
  assert.equal(formatPct(12.345), '12.3% smaller');
  assert.equal(formatPct(-12.345), '12.3% larger');
  assert.equal(formatPct(0), 'no change');
});

test('isXmlFile', () => {
  assert.equal(isXmlFile({ name: 'icon.xml' }), true);
  assert.equal(isXmlFile({ name: 'ICON.XML' }), true); // case-insensitive
  assert.equal(isXmlFile({ name: 'icon.xml', type: 'application/xml' }), true);
  assert.equal(isXmlFile({ name: 'note.txt', type: 'text/xml' }), true);
  assert.equal(isXmlFile({ name: 'icon.xml.png' }), false); // suffix only
  assert.equal(isXmlFile({ name: 'icon.xmls' }), false);
  assert.equal(isXmlFile({ name: 'notes.txt', type: 'text/plain' }), false);
});

test('safeFilename strips path separators and control chars', () => {
  assert.equal(safeFilename('icon.xml'), 'icon.xml');
  assert.equal(safeFilename('../../etc/passwd'), 'passwd');
  assert.equal(safeFilename('C:\\Users\\me\\icon.xml'), 'icon.xml');
  assert.equal(safeFilename('a\x00b\x1fc.xml'), 'abc.xml'); // control chars removed
  assert.equal(safeFilename('/'), 'download.xml'); // empty result -> fallback
  assert.equal(safeFilename(''), 'download.xml');
});

test('uid returns unique non-empty strings', () => {
  const ids = new Set(Array.from({ length: 1000 }, () => uid()));
  assert.equal(ids.size, 1000);
  for (const id of ids) assert.ok(id.length > 0);
});

test('uniqueFilenames avoids case-insensitive ZIP collisions', () => {
  assert.deepEqual(
    uniqueFilenames(['icon.xml', 'icon.xml', 'ICON.XML', '../../icon.xml', 'readme']),
    ['icon.xml', 'icon (2).xml', 'ICON (3).XML', 'icon (4).xml', 'readme'],
  );
});
