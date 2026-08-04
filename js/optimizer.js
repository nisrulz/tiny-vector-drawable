// ---------------------------------------------------------------------------
// Lazy wrapper around the avocado optimizer bundle. This module is used inside
// the optimizer Worker, so parsing and path processing never block the UI.
// ---------------------------------------------------------------------------
let optimizerPromise = null;

export async function optimizeVectorDrawable(xml, options) {
  if (!optimizerPromise) {
    optimizerPromise = import('../lib/avocado.bundle.js').then(
      (mod) => mod.optimizeVectorDrawable,
    );
  }
  const optimize = await optimizerPromise;
  return optimize(xml, options);
}
