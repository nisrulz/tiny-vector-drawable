// Vendored, locally-modified copy of avocado (see vendor/avocado + documentation/third-party-licenses.md).
import { Avocado, plugins } from '../vendor/avocado/src/lib/avocado.js';

// Batch plugins the same way avocado does internally (consecutive same-type
// plugins run in a single pass), so the Avocado constructor gets Plugin[][].
function batchPlugins(pluginsObj) {
  const ps = Object.keys(pluginsObj).map((k) => pluginsObj[k]);
  return ps
    .map((item) => [item])
    .reduce((arr, item) => {
      const last = arr[arr.length - 1];
      if (last && item[0].type === last[0].type) {
        last.push(item[0]);
      } else {
        arr.push(item);
      }
      return arr;
    }, []);
}

const batchedPlugins = batchPlugins(plugins);

// Optimize a VectorDrawable / AnimatedVectorDrawable XML string.
// Pass { pretty: false } for a single-line, whitespace-free output.
export function optimizeVectorDrawable(xml, options = {}) {
  const inst =
    options.pretty === false
      ? new Avocado({ plugins: batchedPlugins, multipass: true, pretty: false })
      : new Avocado({ plugins: batchedPlugins });
  return inst.optimize(xml);
}

export { Avocado, plugins };
