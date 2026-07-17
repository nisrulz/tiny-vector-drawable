// ---------------------------------------------------------------------------
// Theme toggle: respects a saved choice, else falls back to system preference.
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'tvd-theme';

function applyTheme(theme) {
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (_) {}
  applyTheme(saved);

  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const isLight =
      current === 'light' ||
      (!current && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
    const next = isLight ? 'dark' : 'light';
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {}
  });
}
