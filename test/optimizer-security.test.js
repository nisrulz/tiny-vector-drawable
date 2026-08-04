import { test } from 'node:test';
import assert from 'node:assert/strict';
import { optimizeVectorDrawable } from '../lib/avocado.bundle.js';

const open = '<vector xmlns:android="http://schemas.android.com/apk/res/android">';

test('optimizer rejects non-vector XML and text content', async () => {
  await assert.rejects(optimizeVectorDrawable('<foo><bar/></foo>'), /VectorDrawable root/);
  await assert.rejects(
    optimizeVectorDrawable(`${open}not vector content</vector>`),
    /Text content is not supported/,
  );
});

test('optimizer rejects doctypes and custom entities', async () => {
  const xml = `<!DOCTYPE vector [<!ENTITY x "lol">]>${open}&x;</vector>`;
  await assert.rejects(optimizeVectorDrawable(xml), /DOCTYPE is not allowed/);
});

test('optimizer rejects malformed path command parameters', async () => {
  const xml = `${open}<path android:pathData="M0 0 L1"/></vector>`;
  await assert.rejects(optimizeVectorDrawable(xml), /Invalid android:pathData/);

  for (const pathData of ['M0 0 L', 'M0 0 L1e999 2', 'M0 0 A1 1 0 2 0 3 3']) {
    await assert.rejects(
      optimizeVectorDrawable(`${open}<path android:pathData="${pathData}"/></vector>`),
      /Invalid android:pathData/,
    );
  }
});

test('optimizer rejects CDATA and returns Error objects', async () => {
  await assert.rejects(
    optimizeVectorDrawable(`${open}<![CDATA[not vector content]]></vector>`),
    (error) => error instanceof Error && /CDATA is not supported/.test(error.message),
  );
});

test('optimizer rejects excessive XML nesting', async () => {
  const groups = '<group>'.repeat(256);
  const closes = '</group>'.repeat(256);
  await assert.rejects(
    optimizeVectorDrawable(`${open}${groups}${closes}</vector>`),
    /nesting exceeds the limit/,
  );
});

test('optimizer rejects excessive XML element counts', async () => {
  const groups = '<group/>'.repeat(100000);
  await assert.rejects(
    optimizeVectorDrawable(`${open}${groups}</vector>`),
    /element count exceeds the limit/,
  );
});
