// ---------------------------------------------------------------------------
// Shared application state and DOM references.
// ---------------------------------------------------------------------------
import { optimizeVectorDrawable } from '../lib/avocado.bundle.js';

export const items = []; // { id, name, original, optimized, ok, error }

export const resultsEl = document.getElementById('results');
export const toolbarEl = document.getElementById('toolbar');
export const summaryEl = document.getElementById('summary');
export const downloadAllBtn = document.getElementById('downloadAll');
export const clearAllBtn = document.getElementById('clearAll');
export const dropzone = document.getElementById('dropzone');
export const fileInput = document.getElementById('fileInput');
export const formatSelect = document.getElementById('formatSelect');

export function currentFormat() {
  const checked = formatSelect && formatSelect.querySelector('input[name="format"]:checked');
  return checked && checked.value === 'min' ? false : true;
}

export function isXmlFile(file) {
  return (
    file.name.toLowerCase().endsWith('.xml') ||
    file.type === 'application/xml' ||
    file.type === 'text/xml'
  );
}

export { optimizeVectorDrawable };
