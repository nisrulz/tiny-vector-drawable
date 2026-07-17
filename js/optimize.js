// ---------------------------------------------------------------------------
// File intake and per-file optimization.
// ---------------------------------------------------------------------------
import { items, formatSelect, currentFormat, isXmlFile, optimizeVectorDrawable } from './state.js';
import { renderItem, updateItemCard, updateToolbar } from './ui.js';
import { toast } from './util.js';

export async function handleFiles(fileList) {
  const files = Array.from(fileList).filter(isXmlFile);
  if (files.length === 0) {
    toast('No .xml vector drawable files found.');
    return;
  }
  for (const file of files) {
    const id = `f${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const original = await file.text();
    const item = { id, name: file.name, original, optimized: null, ok: false, error: null };
    items.push(item);
    renderItem(item);
    // Defer heavy optimization so the UI can paint first.
    setTimeout(() => processItem(item), 0);
  }
  updateToolbar();
}

export async function processItem(item) {
  const card = document.getElementById(item.id);
  const status = card?.querySelector('.card-status');
  if (status) status.textContent = 'Optimizing…';
  try {
    const optimized = await optimizeVectorDrawable(item.original, { pretty: currentFormat() });
    item.optimized = optimized;
    item.ok = true;
  } catch (err) {
    item.error = err && err.message ? err.message : String(err);
    item.ok = false;
  }
  updateItemCard(item);
  updateToolbar();
}

// Re-optimize every item (used when the output format changes).
export function reoptimizeAll() {
  if (items.length === 0) return;
  for (const item of items) {
    item.ok = false;
    item.optimized = null;
    item.error = null;
    updateItemCard(item);
    setTimeout(() => processItem(item), 0);
  }
  updateToolbar();
}
