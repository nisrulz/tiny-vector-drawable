// ---------------------------------------------------------------------------
// App entry point: wires state, file intake, UI, theme, and credits together.
// ---------------------------------------------------------------------------
import { items, dropzone, fileInput, formatSelect, downloadAllBtn, clearAllBtn } from './js/state.js';
import { handleFiles, reoptimizeAll } from './js/optimize.js';
import { updateToolbar, downloadAll, clearAll } from './js/ui.js';
import { initTheme } from './js/theme.js';
import { initCredits } from './js/credits.js';

// --- File intake events -----------------------------------------------------
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});
fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
  fileInput.value = '';
});

['dragenter', 'dragover'].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  })
);
['dragleave', 'drop'].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    if (ev === 'dragleave' && dropzone.contains(e.relatedTarget)) return;
    dropzone.classList.remove('dragover');
  })
);
dropzone.addEventListener('drop', (e) => {
  if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
});

// Paste from clipboard (e.g. copied file).
window.addEventListener('paste', async (e) => {
  const itemsClip = e.clipboardData && e.clipboardData.files;
  if (itemsClip && itemsClip.length) handleFiles(itemsClip);
});

downloadAllBtn.addEventListener('click', downloadAll);
clearAllBtn.addEventListener('click', clearAll);

// Re-optimize all items when the output format changes.
formatSelect.addEventListener('change', reoptimizeAll);

// --- UI chrome --------------------------------------------------------------
initTheme();
initCredits();
updateToolbar();

// Register service worker for offline / installable PWA.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
