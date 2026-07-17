// ---------------------------------------------------------------------------
// Rendering of results as compact single-line table rows (no XML preview).
// All user content is rendered via textContent (no innerHTML).
// ---------------------------------------------------------------------------
import {
  items,
  resultsEl,
  toolbarEl,
  summaryEl,
  downloadAllBtn,
} from './state.js';
import { byteLength, formatBytes, formatPct, el, toast, safeFilename, triggerDownload } from './util.js';
import { makeZip } from './zip.js';
import { processItem } from './optimize.js';

// Lazily build the two tables (optimized + other) inside #results.
function ensureTables() {
  if (resultsEl.querySelector('.results-table')) return;
  resultsEl.textContent = '';

  const optTable = el('table', { class: 'results-table' }, [
    el('thead', {}, [
      el('tr', {}, [
        el('th', { text: 'File' }),
        el('th', { text: 'Saved' }),
        el('th', { text: 'Size' }),
        el('th', { class: 'col-act', text: '' }),
      ]),
    ]),
    el('tbody', { id: 'optBody', class: 'opt-body' }),
  ]);

  const otherTable = el('table', { class: 'results-table other-table', hidden: true }, [
    el('thead', {}, [
      el('tr', {}, [
        el('th', { text: 'Other drawables' }),
        el('th', { text: 'Status' }),
        el('th', { class: 'col-act', text: '' }),
      ]),
    ]),
    el('tbody', { id: 'otherBody', class: 'other-body' }),
  ]);

  resultsEl.appendChild(optTable);
  resultsEl.appendChild(otherTable);
}

function optBody() {
  return document.getElementById('optBody');
}
function otherBody() {
  return document.getElementById('otherBody');
}

export function renderItem(item) {
  ensureTables();
  const row = el('tr', { id: item.id, class: 'row-pending' }, [
    el('td', { class: 'cell-name', text: item.name }),
    el('td', { class: 'cell-saved' }, [el('span', { class: 'badge badge-warn', text: 'Queued' })]),
    el('td', { class: 'cell-size', text: '…' }),
    el('td', { class: 'col-act' }, [
      el('button', {
        class: 'btn btn-ghost btn-sm',
        type: 'button',
        text: 'Download',
        disabled: true,
        onclick: () => downloadOne(item),
      }),
    ]),
  ]);
  optBody().appendChild(row);
}

export function updateItemCard(item) {
  const row = document.getElementById(item.id);
  if (!row) return;
  const savedCell = row.querySelector('.cell-saved');
  const sizeCell = row.querySelector('.cell-size');
  const dlBtn = row.querySelector('button');

  // Re-queued (e.g. output format changed) — show pending state.
  if (item.ok === false && !item.error) {
    row.className = 'row-pending';
    savedCell.textContent = '';
    savedCell.appendChild(el('span', { class: 'badge badge-warn', text: 'Optimizing…' }));
    sizeCell.textContent = '…';
    dlBtn.disabled = true;
    optBody().appendChild(row);
    return;
  }

  if (item.ok) {
    const origBytes = byteLength(item.original);
    const optBytes = byteLength(item.optimized);
    const saved = origBytes === 0 ? 0 : (100 * (origBytes - optBytes)) / origBytes;
    const cls = saved > 0 ? 'badge-good' : saved < 0 ? 'badge-bad' : 'badge-warn';
    row.className = 'row-ok';
    savedCell.textContent = '';
    savedCell.appendChild(el('span', { class: `badge ${cls}`, text: formatPct(saved) }));
    sizeCell.textContent = `${origBytes} → ${optBytes} bytes`;
    dlBtn.disabled = false;
    optBody().appendChild(row);
  } else {
    // Move the errored file into the "Other drawables" table.
    row.className = 'row-err';
    savedCell.textContent = '';
    savedCell.appendChild(el('span', { class: 'badge badge-bad', text: 'Error' }));
    sizeCell.textContent = item.error || 'Could not optimize';
    dlBtn.disabled = true;
    otherBody().appendChild(row);
  }
  syncOtherTable();
}

// Show the "Other drawables" table only when it has rows.
function syncOtherTable() {
  const t = otherBody().closest('.results-table');
  t.hidden = otherBody().children.length === 0;
}

export function downloadOne(item) {
  if (!item.ok) {
    toast('Nothing to download for this file.');
    return;
  }
  const blob = new Blob([item.optimized], { type: 'application/xml' });
  triggerDownload(blob, item.name);
}

export function updateToolbar() {
  const done = items.filter((i) => i.ok || i.error);
  const successful = items.filter((i) => i.ok);
  if (items.length === 0) {
    toolbarEl.hidden = true;
    return;
  }
  toolbarEl.hidden = false;
  const pending = items.length - done.length;
  summaryEl.textContent = pending > 0
    ? `${done.length}/${items.length} processed…`
    : `${items.length} file(s) · ${successful.length} optimized`;
  downloadAllBtn.disabled = successful.length === 0;
}

export function downloadAll() {
  const successful = items.filter((i) => i.ok);
  if (successful.length === 0) {
    toast('No optimized files to download.');
    return;
  }
  const files = successful.map((i) => ({ name: safeFilename(i.name), data: i.optimized }));
  const blob = makeZip(files);
  triggerDownload(blob, 'optimized-vectors.zip');
}

export function clearAll() {
  items.length = 0;
  resultsEl.textContent = '';
  toolbarEl.hidden = true;
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';
}
