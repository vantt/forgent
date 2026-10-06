import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HELPER = fileURLToPath(new URL('./fixture-dir.mjs', import.meta.url));

// The helper removes directories when the process that made them ends, so each case runs a child
// that makes one, prints its path, and exits.
function runChild(env = {}) {
  const script = `import { makeFixtureDir } from ${JSON.stringify(HELPER)};
const dir = makeFixtureDir('fgos-fixture-helper-test-');
await import('node:fs').then((fs) => fs.writeFileSync(dir + '/marker', 'x'));
console.log(dir);`;
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8',
    env: { ...process.env, FGOS_KEEP_TEST_FIXTURES: '', ...env },
  });
  assert.equal(run.status, 0, run.stderr);
  return run.stdout.trim();
}

test('a fixture directory is removed when the process that made it ends', () => {
  const dir = runChild();
  assert.match(dir, /fgos-fixture-helper-test-/);
  assert.equal(fs.existsSync(dir), false);
});

test('FGOS_KEEP_TEST_FIXTURES keeps the directory for debugging', (t) => {
  const dir = runChild({ FGOS_KEEP_TEST_FIXTURES: '1' });
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  assert.equal(fs.existsSync(dir), true);
});
