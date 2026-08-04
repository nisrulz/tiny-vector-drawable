import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TaskQueue } from '../js/scheduler.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('enqueue runs tasks to completion', async () => {
  const q = new TaskQueue(1);
  const out = [];
  await q.enqueue(async () => { await sleep(1); out.push('a'); });
  await q.enqueue(() => { out.push('b'); });
  assert.deepEqual(out, ['a', 'b']);
});

test('respects the concurrency limit', async () => {
  const q = new TaskQueue(2);
  let active = 0;
  let maxActive = 0;
  let finished = 0;

  const tasks = Array.from({ length: 6 }, () =>
    q.enqueue(async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await sleep(5);
      active -= 1;
      finished += 1;
    }),
  );
  await Promise.all(tasks);
  assert.equal(finished, 6);
  assert.equal(maxActive, 2, 'never more than 2 tasks in flight');
});

test('rejects the promise when a task throws', async () => {
  const q = new TaskQueue(1);
  await assert.rejects(q.enqueue(() => Promise.reject(new Error('boom'))), /boom/);
});

test('rejects concurrency values that are not positive integers', () => {
  assert.throws(() => new TaskQueue(0), /positive integer/);
  assert.throws(() => new TaskQueue(-1), /positive integer/);
  assert.throws(() => new TaskQueue(1.5), /positive integer/);
});

test('clear drops queued tasks and leaves running ones alone', async () => {
  const q = new TaskQueue(1);
  let running = 0;
  let started = 0;

  const first = q.enqueue(async () => {
    started += 1;
    running += 1;
    await sleep(20);
    running -= 1;
  });
  const queued = q.enqueue(async () => { started += 1; });
  const alsoQueued = q.enqueue(async () => { started += 1; });

  await sleep(5); // let the first task start
  assert.equal(running, 1);
  const dropped = q.clear();
  assert.equal(dropped, 2);
  await first; // in-flight task still completes
  await queued; // dropped tasks resolve without running
  await alsoQueued;
  await sleep(5);
  assert.equal(started, 1, 'only the in-flight task ran');
});
