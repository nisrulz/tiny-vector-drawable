// ---------------------------------------------------------------------------
// Small DOM + formatting helpers.
// All user-controlled content is written via textContent / setAttribute,
// never innerHTML, so the app is safe from injection.
// ---------------------------------------------------------------------------
export function byteLength(str) {
  return new TextEncoder().encode(str).length;
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(2)} KB`;
}

export function formatPct(saved) {
  if (saved > 0) return `${saved.toFixed(1)}% smaller`;
  if (saved < 0) return `${Math.abs(saved).toFixed(1)}% larger`;
  return 'no change';
}

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v !== null && v !== undefined) {
      node.setAttribute(k, v);
    }
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

let toastTimer = null;
export function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = el('div', { class: 'toast' });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

export function safeFilename(name) {
  // Strip path separators and control chars; keep only a safe basename.
  const base = String(name).replace(/^.*[\\/]/, '').replace(/[\x00-\x1f\x7f]/g, '');
  return base || 'download.xml';
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: safeFilename(filename) });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
