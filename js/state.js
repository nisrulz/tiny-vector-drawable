// ---------------------------------------------------------------------------
// Shared application state and DOM references.
// ---------------------------------------------------------------------------
export const items = []; // Item[] — see model.js

export const resultsEl = document.getElementById('results');
export const toolbarEl = document.getElementById('toolbar');
export const summaryEl = document.getElementById('summary');
export const downloadAllBtn = document.getElementById('downloadAll');
export const clearAllBtn = document.getElementById('clearAll');
export const dropzone = document.getElementById('dropzone');
export const fileInput = document.getElementById('fileInput');
export const formatSelect = document.getElementById('formatSelect');

// True when "Pretty (readable)" is selected; false for minified output.
export function isPrettyFormat() {
  const checked = formatSelect && formatSelect.querySelector('input[name="format"]:checked');
  return checked ? checked.value !== 'min' : true;
}
