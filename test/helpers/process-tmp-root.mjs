// Gives the importing test process its own temporary root. Importing this module (first, before any
// module that reads os.tmpdir() at load time) points TMPDIR/TMP/TEMP at a fresh directory, so every
// directory this process makes with os.tmpdir() -- and every child it spawns with an inherited env --
// lands inside it, and the whole tree is removed when the process exits. A test file therefore needs
// no per-directory cleanup, and a file run directly with `node --test <file>` (no runner, no private
// run directory) leaves nothing behind in the machine's temp dir.
// FGOS_KEEP_TEST_FIXTURES=1 keeps the directory for debugging (same switch as fixture-dir.mjs).
// SIGINT/SIGTERM/SIGHUP still clean up (without changing the process's signal semantics); a process killed by SIGKILL cannot, under scripts/run-tests.mjs the run directory covers it.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PRIVATE_ROOT_PREFIX = 'fgos-tp-';

function installProcessTempRoot() {
  let root;
  try {
    root = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), PRIVATE_ROOT_PREFIX)));
  } catch {
    return null; // Unusable temp dir: let the test's own mkdtemp fail with the real error.
  }
  process.env.TMPDIR = root;
  process.env.TMP = root;
  process.env.TEMP = root;
  const removeRoot = () => {
    if (process.env.FGOS_KEEP_TEST_FIXTURES) return;
    try { fs.rmSync(root, { recursive: true, force: true, maxRetries: 3 }); } catch { /* best effort at exit */ }
  };
  process.on('exit', removeRoot);
  // A signal's default action ends the process without running exit handlers, so cleanup has to run
  // first. Adding a listener removes that default action, so the handler restores it: it acts only
  // when no other listener wants the signal (a test or code under test that installs its own handler,
  // or that process.emit()s the signal, keeps full ownership and the process continues), and it then
  // re-raises the signal with the default disposition, so the exit status is still "killed by signal".
  const handlers = new Map();
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    const handler = () => {
      if (process.listenerCount(signal) > 1) return;
      for (const [name, installed] of handlers) process.removeListener(name, installed);
      removeRoot();
      process.kill(process.pid, signal);
    };
    handlers.set(signal, handler);
    process.on(signal, handler);
  }
  return root;
}

/** The directory this process's temp files live in. */
export const PROCESS_TEMP_ROOT = installProcessTempRoot();
