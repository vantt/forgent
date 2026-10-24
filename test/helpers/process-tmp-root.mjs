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
const SEAL_CHILD_WAIT_MS = 20000;

// A CLI Work command hands its seal to a short detached `fgos events seal` child and exits, so a test that drove one
// can end before the child does. Before the root is removed this process waits, through the process door (identity,
// never a bare pid), for the seal children of its own root to finish. Test code only: the product has no such wait.
let processDoor = null;
import('../../src/runner/dispatch/process-identity.mjs').then((door) => { processDoor = door; }, () => {});

// Directories outside the private root that a test made and drove CLI Work commands in (fixture-dir.mjs): a seal child
// naming one of them must also end before this process's root, which holds the child's state root, goes away.
const watchedRoots = new Set();
/** Also wait, at exit, for the seal children that name `dir`. */
export function watchSealChildrenOf(dir) { watchedRoots.add(dir); }

function sealChildrenOf(root) {
  const views = processDoor.scan({});
  if (views === 'unsupported') return [];
  return views.filter((view) => {
    const args = Array.isArray(view.cmdline) ? view.cmdline.join(' ') : String(view.cmdline ?? '');
    return view.pid !== process.pid && args.includes(root + path.sep) && / events seal /.test(` ${args} `);
  });
}

function waitForSealChildren(root) {
  if (!processDoor) return;
  const deadline = Date.now() + SEAL_CHILD_WAIT_MS;
  const pendingSealChildren = () => [root, ...watchedRoots].flatMap((dir) => sealChildrenOf(dir));
  try {
    for (let running = pendingSealChildren(); running.length && Date.now() < deadline; running = pendingSealChildren()) {
      const alive = running.filter((view) => view.tuple !== null && processDoor.judge(view.tuple) !== 'dead');
      if (!alive.length) return;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  } catch { /* no door in this process: nothing to wait on */ }
}

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
    waitForSealChildren(root);
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
  isolateHome(root);
  return root;
}

// Gives the process an empty home inside its temp root. Config is read from `<home>/.fgos` (the facade's
// default global directory is `os.homedir()/.fgos`), so a test that does not choose its own home must not see
// the real machine's global config, which differs from one machine to the next. HOME is a real OS input, so
// code under test and every child it spawns read the same empty home. A test that means "the real machine"
// or builds its own home (withHome, an explicit globalDir) overrides this. Git keeps the real global
// identity through GIT_CONFIG_GLOBAL so a commit in a fixture repository still has an author, and the Rust
// toolchain keeps its real install through CARGO_HOME and RUSTUP_HOME.
function isolateHome(root) {
  const realGitConfig = path.join(os.homedir(), '.gitconfig');
  const home = path.join(root, 'home');
  try {
    fs.mkdirSync(home);
  } catch {
    return; // Leave HOME alone: the test's own filesystem calls will fail with the real error.
  }
  if (!process.env.GIT_CONFIG_GLOBAL && fs.existsSync(realGitConfig)) process.env.GIT_CONFIG_GLOBAL = realGitConfig;
  // The Rust toolchain keeps its install under the real home; tests that build or run cargo still need it.
  for (const [name, dir] of [['CARGO_HOME', '.cargo'], ['RUSTUP_HOME', '.rustup']]) {
    const real = path.join(os.homedir(), dir);
    if (!process.env[name] && fs.existsSync(real)) process.env[name] = real;
  }
  // The default state root (`<home>/.local/state/fgos`) must already be a private directory: the git door
  // refuses a group-writable one, and under a group-writable umask a missing one is created that way.
  const stateRoot = path.join(home, '.local', 'state', 'fgos');
  fs.mkdirSync(stateRoot, { recursive: true, mode: 0o700 });
  for (let dir = stateRoot; dir !== home; dir = path.dirname(dir)) fs.chmodSync(dir, 0o700);
  process.env.HOME = home;
  process.env.USERPROFILE = home;
}

/** The directory this process's temp files live in. */
export const PROCESS_TEMP_ROOT = installProcessTempRoot();
