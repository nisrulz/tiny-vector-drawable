import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load the bundled ESM module via dynamic import.
async function loadBundle() {
  const mod = await import('../lib/avocado.bundle.js');
  return mod.optimizeVectorDrawable;
}

// Input samples paired with their committed expected outputs.
// avocado is no longer a runtime/dev dependency, so we assert against
// known-good fixtures in test/fixtures instead of the live CLI.
function readSample(name) {
  return readFileSync(join(__dirname, 'samples', `${name}.xml`), 'utf8');
}
function readExpected(name) {
  return readFileSync(join(__dirname, 'fixtures', `${name}.expected.xml`), 'utf8').replace(/\n$/, '');
}

const sampleNames = ['simple-vector', 'animated-vector'];

// Regression test for avocado issue #55: merging sibling paths into a single
// android:pathData longer than ~3000 chars crashes Android apps. The vendored
// copy must NOT merge when the combined path would exceed that limit.
// Two sibling <path> elements with identical non-path attributes and long
// pathData would normally be merged by mergePaths; the guard keeps them apart.
function longPathSample() {
  // Non-repeating coordinates so convertPathData cannot collapse them; each
  // pathData stays long. Two such sibling paths would merge into one >3000-char
  // path without the guard.
  const coords = [];
  for (let i = 0; i < 400; i++) {
    coords.push(`L${i} ${i + 1}`);
  }
  const seg = 'M0 0 ' + coords.join(' ') + ' Z'; // ~3200 chars
  const open =
    '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">';
  return `${open}<path android:fillColor="#000000" android:pathData="${seg}"/><path android:fillColor="#000000" android:pathData="${seg}"/></vector>`;
}

async function main() {
  const optimize = await loadBundle();
  let failures = 0;

  for (const name of sampleNames) {
    const xml = readSample(name);
    const expected = readExpected(name);
    const out = await optimize(xml, { pretty: false });
    const match = out === expected;
    console.log(`\n=== ${name} ===`);
    console.log(`match: ${match}`);
    if (!match) {
      failures++;
      writeFileSync(join(__dirname, `${name}.actual.xml`), out);
      writeFileSync(join(__dirname, `${name}.expected-debug.xml`), expected);
      console.log(`diff written to test/${name}.actual.xml`);
    }
  }

  // Long-path guard regression.
  {
    const xml = longPathSample();
    const out = await optimize(xml, { pretty: false });
    const pathDatas = [...out.matchAll(/android:pathData="([^"]*)"/g)].map((m) => m[1]);
    const pathCount = pathDatas.length;
    const maxLen = pathCount ? Math.max(...pathDatas.map((d) => d.length)) : 0;
    // Before the guard, the two sibling paths would be merged into ONE path
    // whose pathData length exceeds 3000 chars. Assert we keep >= 2 paths and
    // none exceeds the safe limit.
    const guardOk = pathCount >= 2 && maxLen <= 3000;
    console.log(`\n=== long-path-guard ===`);
    console.log(`path count: ${pathCount} (must be >= 2)`);
    console.log(`max single pathData length: ${maxLen} (must be <= 3000)`);
    if (!guardOk) {
      failures++;
      writeFileSync(join(__dirname, 'long-path.actual.xml'), out);
      console.log('guard failed; written to test/long-path.actual.xml');
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} test(s) failed.`);
    process.exit(1);
  }
  console.log('\nAll samples match expected output.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
