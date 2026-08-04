import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crc32, makeZip } from '../js/zip.js';

const enc = new TextEncoder();
const dec = new TextDecoder();

async function readZipBytes(files) {
  const blob = makeZip(files);
  return new Uint8Array(await blob.arrayBuffer());
}

// Walk the local headers, central directory, and end-of-central-directory
// record, returning enough structure to assert every field the writer sets.
function parseZip(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const locals = [];
  let offset = 0;
  while (dv.getUint32(offset, true) === 0x04034b50) {
    const nameLen = dv.getUint16(offset + 26, true);
    const extraLen = dv.getUint16(offset + 28, true);
    const crc = dv.getUint32(offset + 14, true);
    const size = dv.getUint32(offset + 18, true);
    const name = dec.decode(bytes.subarray(offset + 30, offset + 30 + nameLen));
    const data = bytes.subarray(offset + 30 + nameLen + extraLen, offset + 30 + nameLen + extraLen + size);
    locals.push({ name, crc, size, data });
    offset += 30 + nameLen + extraLen + size;
  }

  const centralStart = offset;
  const central = [];
  while (dv.getUint32(offset, true) === 0x02014b50) {
    const nameLen = dv.getUint16(offset + 28, true);
    const extraLen = dv.getUint16(offset + 30, true);
    const commentLen = dv.getUint16(offset + 32, true);
    const crc = dv.getUint32(offset + 16, true);
    const size = dv.getUint32(offset + 20, true);
    const localOffset = dv.getUint32(offset + 42, true);
    const name = dec.decode(bytes.subarray(offset + 46, offset + 46 + nameLen));
    central.push({ name, crc, size, localOffset });
    offset += 46 + nameLen + extraLen + commentLen;
  }
  const centralSize = offset - centralStart;

  const eocdOffset = offset;
  assert.equal(dv.getUint32(eocdOffset, true), 0x06054b50, 'EOCD signature');
  const entryCount = dv.getUint16(eocdOffset + 10, true);
  const eocdCentralSize = dv.getUint32(eocdOffset + 12, true);
  const centralOffset = dv.getUint32(eocdOffset + 16, true);

  return { locals, central, entryCount, centralSize, centralOffset, eocdOffset };
}

test('crc32 matches known vectors', () => {
  assert.equal(crc32(new Uint8Array()), 0);
  assert.equal(crc32(enc.encode('abc')), 0x352441c2);
  assert.equal(crc32(enc.encode('123456789')), 0xcbf43926);
  assert.equal(crc32(enc.encode('The quick brown fox jumps over the lazy dog')), 0x414fa339);
});

test('makeZip produces a valid store-only zip', async () => {
  const files = [
    { name: 'a.xml', data: enc.encode('<vector/>') },
    { name: 'sub/b.xml', data: 'hello' }, // string input is encoded
    { name: 'icône.xml', data: enc.encode('x') }, // non-ASCII, UTF-8 flagged
  ];
  const bytes = await readZipBytes(files);
  const zip = parseZip(bytes);

  assert.equal(zip.entryCount, files.length);
  assert.equal(zip.centralOffset, zip.eocdOffset - zip.centralSize);
  assert.equal(bytes.length, zip.eocdOffset + 22, 'EOCD is the final 22 bytes');

  let expectedLocalOffset = 0;
  files.forEach((file, i) => {
    const data = file.data instanceof Uint8Array ? file.data : enc.encode(file.data);
    const local = zip.locals[i];
    const entry = zip.central[i];

    assert.equal(local.name, file.name);
    assert.equal(entry.name, file.name);
    assert.equal(local.crc, crc32(data), `crc32 matches for ${file.name}`);
    assert.equal(entry.crc, local.crc);
    assert.equal(local.size, data.length);
    assert.equal(entry.size, data.length);
    assert.deepEqual([...local.data], [...data], `stored bytes match for ${file.name}`);

    // Central directory points back at the right local header.
    assert.equal(entry.localOffset, expectedLocalOffset);
    expectedLocalOffset += 30 + enc.encode(file.name).length + data.length;
  });
});

test('makeZip round-trips through the parse for a single empty file', async () => {
  const bytes = await readZipBytes([{ name: 'empty.xml', data: enc.encode('') }]);
  const zip = parseZip(bytes);
  assert.equal(zip.entryCount, 1);
  assert.equal(zip.locals[0].size, 0);
  assert.equal(zip.locals[0].crc, 0);
});

test('makeZip rejects classic ZIP limit overflows', () => {
  assert.throws(() => makeZip({ length: 0x10000 }), /65,535 entries/);
  assert.throws(
    () => makeZip([{ name: 'a'.repeat(0x10000), data: '' }]),
    /filename is too long/,
  );
});
