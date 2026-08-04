// ---------------------------------------------------------------------------
// Rendering of results as compact single-line table rows (no XML preview).
// All user content is rendered via textContent (no innerHTML).
// ---------------------------------------------------------------------------
import { items, resultsEl, toolbarEl, summaryEl, downloadAllBtn } from './state.js';
import { STATUS } from './model.js';
import { byteLength, formatPct, el, toast, safeFilename, triggerDownload } from './util.js';
import { makeZip } from './zip.js';

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

// Build a fresh <tr> from the item's current state.
function buildRow(item) {
  const rowClass =
    item.status === STATUS.DONE
      ? 'row-ok'
      : item.status === STATUS.ERROR
        ? 'row-err'
        : 'row-pending';

  const downloadBtn = el('button', {
    class: 'btn btn-ghost btn-sm',
    type: 'button',
    text: 'Download',
    disabled: item.status !== STATUS.DONE,
    onclick: () => downloadOne(item),
  });

  switch (item.status) {
    case STATUS.DONE: {
      const origBytes = byteLength(item.original);
      const optBytes = byteLength(item.optimized);
      const saved = origBytes === 0 ? 0 : (100 * (origBytes - optBytes)) / origBytes;
      const cls = saved > 0 ? 'badge-good' : saved < 0 ? 'badge-bad' : 'badge-warn';
      return el('tr', { id: item.id, class: rowClass }, [
        el('td', { class: 'cell-name', text: item.name }),
        el('td', { class: 'cell-saved' }, [
          el('span', { class: `badge ${cls}`, text: formatPct(saved) }),
        ]),
        el('td', { class: 'cell-size', text: `${origBytes} → ${optBytes} bytes` }),
        el('td', { class: 'col-act' }, [downloadBtn]),
      ]);
    }
    case STATUS.ERROR:
      return el('tr', { id: item.id, class: rowClass }, [
        el('td', { class: 'cell-name', text: item.name }),
        el('td', { class: 'cell-saved' }, [
          el('span', { class: 'badge badge-bad', text: 'Error' }),
        ]),
        el('td', { class: 'cell-size', text: item.error || 'Could not optimize' }),
        el('td', { class: 'col-act' }, [downloadBtn]),
      ]);
    default: {
      const label = item.status === STATUS.OPTIMIZING ? 'Optimizing…' : 'Queued';
      return el('tr', { id: item.id, class: rowClass }, [
        el('td', { class: 'cell-name', text: item.name }),
        el('td', { class: 'cell-saved' }, [
          el('span', { class: 'badge badge-warn', text: label }),
        ]),
        el('td', { class: 'cell-size', text: '…' }),
        el('td', { class: 'col-act' }, [downloadBtn]),
      ]);
    }
  }
}

// Render (or re-render in place) one item's row.
export function renderItem(item) {
  ensureTables();
  const row = buildRow(item);
  const existing = document.getElementById(item.id);
  if (existing) existing.replaceWith(row);
  else optBody().appendChild(row);

  // Errored rows live in the "Other drawables" table.
  const target = item.status === STATUS.ERROR ? otherBody() : optBody();
  if (row.parentNode !== target) target.appendChild(row);
  syncOtherTable();
}

// Show the "Other drawables" table only when it has rows.
function syncOtherTable() {
  const t = otherBody().closest('.results-table');
  t.hidden = otherBody().children.length === 0;
}

export function downloadOne(item) {
  if (item.status !== STATUS.DONE) {
    toast('Nothing to download for this file.');
    return;
  }
  const blob = new Blob([item.optimized], { type: 'application/xml' });
  triggerDownload(blob, item.name);
}

export function updateToolbar() {
  const done = items.filter((i) => !i.isPending());
  const successful = items.filter((i) => i.status === STATUS.DONE);
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
  const successful = items.filter((i) => i.status === STATUS.DONE);
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
