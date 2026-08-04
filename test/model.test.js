import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Item, STATUS } from '../js/model.js';

function makeItem() {
  return new Item({ id: 'abc', name: 'icon.xml', original: '<vector/>' });
}

test('new Item starts queued with no result', () => {
  const item = makeItem();
  assert.equal(item.status, STATUS.QUEUED);
  assert.equal(item.optimized, null);
  assert.equal(item.error, null);
  assert.equal(item.isPending(), true);
  assert.equal(item.token, 0);
});

test('markOptimizing transitions to optimizing', () => {
  const item = makeItem();
  item.markOptimizing();
  assert.equal(item.status, STATUS.OPTIMIZING);
  assert.equal(item.isPending(), true);
});

test('succeed stores output and clears error', () => {
  const item = makeItem();
  item.markOptimizing();
  item.succeed('<optimized/>');
  assert.equal(item.status, STATUS.DONE);
  assert.equal(item.optimized, '<optimized/>');
  assert.equal(item.error, null);
  assert.equal(item.isPending(), false);
});

test('fail records the message and clears output', () => {
  const item = makeItem();
  item.markOptimizing();
  item.fail('boom');
  assert.equal(item.status, STATUS.ERROR);
  assert.equal(item.error, 'boom');
  assert.equal(item.optimized, null);
  assert.equal(item.isPending(), false);
});

test('reset clears state and bumps the token (invalidates stale runs)', () => {
  const item = makeItem();
  item.succeed('<optimized/>');
  assert.equal(item.token, 0);
  item.reset();
  assert.equal(item.status, STATUS.QUEUED);
  assert.equal(item.optimized, null);
  assert.equal(item.error, null);
  assert.equal(item.token, 1);
  item.reset();
  assert.equal(item.token, 2);
});
