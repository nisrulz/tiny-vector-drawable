// ---------------------------------------------------------------------------
// File intake and per-file optimization, with CPU work isolated in a Worker.
// ---------------------------------------------------------------------------
import { items, isPrettyFormat } from './state.js';
import { Item } from './model.js';
import { renderItem, updateToolbar } from './ui.js';
import { validateFileBatch } from './file-validation.js';
import { toast, uid } from './util.js';

const worker = new Worker(new URL('./optimizer-worker.js', import.meta.url), {
  type: 'module',
});

worker.addEventListener('message', ({ data }) => {
  const item = items.find((candidate) => candidate.id === data.id);
  if (!item || item.token !== data.token) return;

  if (data.type === 'started') item.markOptimizing();
  else if (data.type === 'done') item.succeed(data.optimized);
  else if (data.type === 'error') item.fail(data.error);
  else return;

  renderItem(item);
  updateToolbar();
});

export async function handleFiles(fileList) {
  let files;
  try {
    files = validateFileBatch(fileList, {
      count: items.length,
      bytes: items.reduce((total, item) => total + item.sourceBytes, 0),
    });
  } catch (error) {
    toast(error.message);
    return;
  }

  for (const file of files) {
    let original;
    try {
      original = await file.text();
    } catch {
      toast(`Could not read ${file.name}.`);
      continue;
    }
    const item = new Item({
      id: uid(),
      name: file.name,
      original,
      sourceBytes: file.size,
    });
    items.push(item);
    renderItem(item);
    enqueue(item);
    updateToolbar();
  }
}

function enqueue(item) {
  worker.postMessage({
    type: 'optimize',
    id: item.id,
    token: item.token,
    xml: item.original,
    pretty: isPrettyFormat(),
  });
}

// Re-optimize every item (used when the output format changes).
export function reoptimizeAll() {
  if (items.length === 0) return;
  worker.postMessage({ type: 'clear' });
  for (const item of items) {
    item.reset();
    renderItem(item);
    enqueue(item);
  }
  updateToolbar();
}

// Drop queued (not yet started) optimizations.
export function resetAll() {
  worker.postMessage({ type: 'clear' });
}
