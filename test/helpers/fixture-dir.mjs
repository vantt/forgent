// Fixture directories for tests that run confined workers. bwrap mounts a private tmpfs over /tmp,
// so a fixture a worker must reach lives under /var/tmp instead, where nothing cleans it up. Every
// directory made here is removed when the test file's process ends, whatever the test did, so a full
// suite leaves nothing behind. Set FGOS_KEEP_TEST_FIXTURES=1 to keep them for debugging.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const FIXTURE_ROOT = fs.existsSync('/var/tmp') ? '/var/tmp' : os.tmpdir();

const created = new Set();
let exitHookInstalled = false;

function removeCreated() {
  if (process.env.FGOS_KEEP_TEST_FIXTURES) return;
  for (const dir of created) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort at exit */ }
  }
}

/** Like `fs.mkdtempSync(path.join(FIXTURE_ROOT, prefix))`, removed automatically at process exit. */
export function makeFixtureDir(prefix) {
  const dir = fs.mkdtempSync(path.join(FIXTURE_ROOT, prefix));
  created.add(dir);
  if (!exitHookInstalled) {
    exitHookInstalled = true;
    process.on('exit', removeCreated);
  }
  return dir;
}
