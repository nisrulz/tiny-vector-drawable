// ---------------------------------------------------------------------------
// Lazy wrapper around the avocado optimizer bundle.
// The bundle (~49 KB minified) is loaded with a dynamic import so it never
// blocks initial paint: the first optimization happens only after the user
// drops a file, by which time the UI is already interactive.
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
