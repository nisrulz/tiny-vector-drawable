const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'lib');
const outFile = path.join(outDir, 'avocado.bundle.js');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// A tiny shim for Node's `os` module used by avocado's js2xml (only `os.EOL`).
const osShim = `
export const EOL = '\\n';
export default { EOL: '\\n' };
`;

async function main() {
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'entry.js')],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2018'],
    outfile: outFile,
    minify: true,
    sourcemap: false,
    legalComments: 'none',
    // Resolve the vendored avocado TypeScript sources (entry imports .js → .ts).
    resolveExtensions: ['.ts', '.js', '.json'],
    // Replace `os` with our shim.
    plugins: [
      {
        name: 'os-shim',
        setup(build) {
          build.onResolve({ filter: /^os$/ }, () => ({
            path: 'os-shim',
            namespace: 'os-shim',
          }));
          build.onLoad({ filter: /.*/, namespace: 'os-shim' }, () => ({
            contents: osShim,
            loader: 'js',
          }));
        },
      },
    ],
  });
  const size = fs.statSync(outFile).size;
  console.log(`Built ${outFile} (${(size / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
