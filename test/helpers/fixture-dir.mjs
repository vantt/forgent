// Fixture directories for tests that run confined workers. bwrap mounts a private tmpfs over /tmp,
// so a fixture a worker must reach lives under /var/tmp instead, where nothing cleans it up. Every
// directory made here is removed when the test file's process exits; a process killed by a signal
// is covered by the runner's per-run root (FGOS_TEST_FIXTURE_ROOT), so a full suite leaves nothing behind. Set FGOS_KEEP_TEST_FIXTURES=1 to keep them for debugging.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { watchSealChildrenOf } from './process-tmp-root.mjs';

// The test runner points this at a per-run directory it removes itself, which also covers a file it
// had to kill with a signal; run alone, fixtures go straight under /var/tmp and clean up at exit.
function resolveFixtureRoot() {
  if (process.env.FGOS_TEST_FIXTURE_ROOT) return process.env.FGOS_TEST_FIXTURE_ROOT;
  try {
    fs.accessSync('/var/tmp', fs.constants.W_OK);
    return '/var/tmp';
  } catch {
    return os.tmpdir();
  }
}
export const FIXTURE_ROOT = resolveFixtureRoot();
if (!process.env.FGOS_TEST_FIXTURE_ROOT) {
  process.env.FGOS_TEST_FIXTURE_ROOT = FIXTURE_ROOT;
}

const created = new Set();
let exitHookInstalled = false;

function removeCreated() {
  if (process.env.FGOS_KEEP_TEST_FIXTURES) return;
  for (const dir of created) {
    try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch { /* best effort at exit */ }
  }
}

/** Like `fs.mkdtempSync(path.join(FIXTURE_ROOT, prefix))`, removed automatically at process exit. */
export function makeFixtureDir(prefix) {
  const dir = fs.mkdtempSync(path.join(FIXTURE_ROOT, prefix));
  created.add(dir);
  watchSealChildrenOf(dir);
  if (!exitHookInstalled) {
    exitHookInstalled = true;
    process.on('exit', removeCreated);
  }
  return dir;
}
