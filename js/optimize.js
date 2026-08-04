// ---------------------------------------------------------------------------
// File intake and per-file optimization, driven through a bounded task queue.
// ---------------------------------------------------------------------------
import { items, isPrettyFormat } from './state.js';
import { Item } from './model.js';
import { TaskQueue } from './scheduler.js';
import { optimizeVectorDrawable } from './optimizer.js';
import { renderItem, updateToolbar } from './ui.js';
import { isXmlFile, toast, uid } from './util.js';

// Low concurrency keeps the main thread responsive: the optimizer is
// synchronous CPU work inside each task, so 2 at a time is plenty.
const queue = new TaskQueue(2);

export async function handleFiles(fileList) {
  const files = Array.from(fileList).filter(isXmlFile);
  if (files.length === 0) {
    toast('No .xml vector drawable files found.');
    return;
  }
  for (const file of files) {
    const original = await file.text();
    const item = new Item({ id: uid(), name: file.name, original });
    items.push(item);
    renderItem(item);
    queue.enqueue(() => processItem(item));
  }
  updateToolbar();
}

// Optimize one item. The result is applied only if the item hasn't been
// reset/re-queued meanwhile (e.g. the output format changed), which prevents
// a stale write from an earlier run racing a newer one.
async function processItem(item) {
  const token = item.token;
  item.markOptimizing();
  renderItem(item);
  try {
    const optimized = await optimizeVectorDrawable(item.original, {
      pretty: isPrettyFormat(),
    });
    if (item.token !== token) return;
    item.succeed(optimized);
  } catch (err) {
    if (item.token !== token) return;
    item.fail(err && err.message ? err.message : String(err));
  }
  // The item may have been cleared while it was optimizing — don't re-render it.
  if (!items.includes(item)) return;
  renderItem(item);
  updateToolbar();
}

// Re-optimize every item (used when the output format changes).
export function reoptimizeAll() {
  if (items.length === 0) return;
  for (const item of items) {
    item.reset();
    renderItem(item);
    queue.enqueue(() => processItem(item));
  }
  updateToolbar();
}

// Drop queued (not yet started) optimizations.
export function resetAll() {
  queue.clear();
}
