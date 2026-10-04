#!/usr/bin/env node
// run-tests.mjs -- portable full-suite door (TFC-D02/TFC-D04). Replaces the
// old `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`
// npm script: that string relied on the invoking SHELL to leave the glob
// unexpanded (a single-quoted arg) and on Node's OWN CLI glob support to
// then expand it -- Ubuntu/macOS's Node 20 CI lane never resolves that
// pattern to any file at all (glob support for `--test` file arguments
// landed in a later Node), and Windows's default `cmd.exe` npm shell
// rejects the leading `VAR=value` POSIX env-assignment syntax outright.
// Both failures happen before a single test ever runs.
//
// This script discovers every `*.test.mjs` file under `test/` itself with
// `fs.readdirSync` (Node >=18, no glob dependency), passes the resulting
// paths to `node --test` as literal argv elements (never a shell string,
// so spaces/quotes/backslashes in a path can never be misinterpreted), and
// sets `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` directly on the spawned
// child's own env object (never a shell prefix), so the exact same
// invocation works unchanged on every OS's default shell.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn as spawnAsync, spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isMainModule } from './lib/is-main-module.mjs';
import { acquireFullSuiteQueue, QUEUE_HELD_ENV } from './lib/full-suite-queue.mjs';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_TEST_ROOT = path.join(REPO_ROOT, 'test');
const TEST_FILE_SUFFIX = '.test.mjs';

/**
 * Ensures FGOS_HOST_BIN is available and points to a runnable host binary.
 * If FGOS_HOST_BIN is already set and runnable, returns it without building.
 * Otherwise, builds fgos with cargo (debug incremental) using checkout's CARGO_TARGET_DIR.
 */
export function ensureHostBin(env = process.env, cwd = REPO_ROOT) {
  if (env.FGOS_HOST_BIN) {
    try {
      if (fs.existsSync(env.FGOS_HOST_BIN)) {
        execFileSync(env.FGOS_HOST_BIN, ['version'], { stdio: 'ignore' });
        return env.FGOS_HOST_BIN;
      }
    } catch {}
  }

  try {
    execFileSync('cargo', ['--version'], { stdio: 'ignore' });
  } catch {
    throw new Error('cargo is required to build fgos host binary for testing, but was not found on PATH');
  }

  const targetDir = env.CARGO_TARGET_DIR || path.join(cwd, 'target');
  const binName = process.platform === 'win32' ? 'fgos.exe' : 'fgos';
  const binPath = path.join(targetDir, 'debug', binName);

  execFileSync('cargo', ['build', '-p', 'fgos'], {
    cwd,
    env: { ...env, CARGO_TARGET_DIR: targetDir },
    stdio: 'inherit',
  });

  return binPath;
}

/**
 * Recursively lists every file under `root` whose name ends with
 * `.test.mjs`, sorted and de-duplicated for a deterministic run order.
 * Never follows a symlinked directory (avoids traversal cycles and
 * escaping `test/` into an unrelated tree, e.g. a `node_modules` symlink
 * planted for worktree dependency sharing) -- a symlinked FILE ending in
 * `.test.mjs` is still discovered, since `fs.readdirSync`'s own stat
 * resolves it like any other file entry.
 */
export function discoverTestFiles(root = DEFAULT_TEST_ROOT) {
  const found = new Set();

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.isSymbolicLink()) continue;
        walk(full);
      } else if (entry.name.endsWith(TEST_FILE_SUFFIX)) {
        found.add(full);
      }
    }
  }

  walk(root);
  return Array.from(found).sort();
}

/**
 * Builds the exact argv `node --test` should receive: any caller-forwarded
 * runner arguments (reporters, name patterns, concurrency, ...) followed by
 * the FULL discovered file list -- never the other way around, and never a
 * caller-supplied file list in place of it (R5: the default `npm test`
 * door must never let a caller narrow the full-suite selection).
 */
export function buildTestArgv(files, forwardedArgs = []) {
  return ['--test', ...forwardedArgs, ...files];
}

/**
 * The env every spawned `node --test` run gets, whoever spawns it (the full
 * suite, the canary, the selector's related run, mutation and coverage runs):
 * - FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1;
 * - no inherited NODE_TEST_CONTEXT: an enclosing `node --test` sets it, and a
 *   nested run that inherits it reports to a parent that is not listening
 *   and exits 0 without running a single test;
 * - on darwin, TMPDIR/TMP/TEMP resolved through realpath (/var -> /private/var).
 */
export function buildTestEnv(env = process.env) {
  const { NODE_TEST_CONTEXT: _enclosingRunner, ...rest } = env;
  const childEnv = { ...rest, FGOS_DISABLE_OPPORTUNISTIC_CHECKS: '1' };
  if (process.platform === 'darwin') {
    const tempRoot = env.TMPDIR || os.tmpdir();
    try {
      const realTempRoot = fs.realpathSync(tempRoot);
      childEnv.TMPDIR = realTempRoot;
      childEnv.TMP = realTempRoot;
      childEnv.TEMP = realTempRoot;
    } catch {
      // If the runner's temp root disappears, let Node's normal temp logic fail naturally.
    }
  }
  try {
    const hostBin = ensureHostBin(childEnv, REPO_ROOT);
    if (hostBin) {
      childEnv.FGOS_HOST_BIN = hostBin;
    }
  } catch (err) {
    // If cargo is missing or build fails, let tests that require host fail with clear diagnostic
    console.error(`run-tests: warning: failed to ensure host binary: ${err.message}`);
  }
  return childEnv;
}

/**
 * Runs `node --test` against an EXPLICIT, already-resolved file list (P03:
 * the shared seam between the full-suite door and the canary runner).
 * Applies the exact same env/argv construction `runTests()` always has
 * (FGOS_DISABLE_OPPORTUNISTIC_CHECKS, the darwin TMPDIR realpath fix, argv
 * as a literal array -- never a shell string) so a canary run and the full
 * run are byte-for-byte identical in every way except which files are
 * selected. Returns `{ status, files }`, same shape as `runTests()`.
 */
export const KEEP_TMP_ENV = 'FGOS_TEST_KEEP_TMP';
export const FILE_TIMEOUT_ENV = 'FGOS_TEST_FILE_TIMEOUT_MS';
export const DEFAULT_FILE_TIMEOUT_MS = 10 * 60 * 1000;
// Explicit per-file limits (repo-relative posix path -> ms) for a test that is
// legitimately slower than the default. Empty on purpose: add an entry only
// with the measured duration that justifies it, never to hide a hang.
export const FILE_TIMEOUT_OVERRIDES_MS = {};
const WATCHDOG_PATH = fileURLToPath(new URL('./lib/test-file-watchdog.mjs', import.meta.url));
const DEFAULT_WATCHDOG_POLL_MS = 5000;

/**
 * Starts the per-file time limit supervisor (see lib/test-file-watchdog.mjs)
 * as a sibling process -- the caller blocks in spawnSync, so it cannot watch
 * itself. Returns `{ stop() -> [{file, elapsedMs, limitMs}] }`; `stop()` ends
 * the supervisor and reports every file it killed for running too long.
 */
function startFileWatchdog({ files, env, fileTimeoutMs, pollMs, tempDir, log }) {
  if (process.platform === 'win32') {
    log('run-tests: warning: per-file time limit needs `ps`; not available on win32, running without it');
    return { stop: () => [] };
  }
  const limits = {};
  for (const file of files) {
    // Keyed exactly as passed to `node --test`: each file's runner process
    // carries that same string as its last argv element.
    limits[file] = FILE_TIMEOUT_OVERRIDES_MS[file.split(path.sep).join('/')] ?? fileTimeoutMs;
  }
  const limitsFile = path.join(tempDir, 'file-limits.json');
  const outFile = path.join(tempDir, 'file-timeouts.jsonl');
  fs.writeFileSync(limitsFile, JSON.stringify(limits));
  fs.writeFileSync(outFile, '');
  const child = spawnAsync(
    process.execPath,
    [WATCHDOG_PATH, `--parent=${process.pid}`, `--poll-ms=${pollMs}`, `--limits=${limitsFile}`, `--out=${outFile}`],
    { env, stdio: ['ignore', 'ignore', 'inherit'] },
  );
  child.on('error', (err) => log(`run-tests: warning: per-file time limit not running: ${err.message}`));
  return {
    stop() {
      child.kill('SIGTERM');
      return fs.readFileSync(outFile, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
    },
  };
}
export const SENSITIVE_FGOS_FILES = new Set(['secrets.local.env', 'secrets.env']);

/**
 * Recursively snapshots the repository's `.fgos` store before/after test runs.
 * Excludes sensitive secret files.
 * Captures relative paths, file sizes, and mtimeMs.
 */
export function snapshotFgos(repoRoot) {
  const fgosDir = path.join(repoRoot, '.fgos');
  const map = new Map();
  if (!fs.existsSync(fgosDir)) return map;

  function walk(currentDir) {
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SENSITIVE_FGOS_FILES.has(entry.name)) continue;
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.relative(fgosDir, fullPath);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() || entry.isSymbolicLink()) {
        try {
          const stat = fs.statSync(fullPath);
          map.set(relPath, { mtimeMs: stat.mtimeMs, size: stat.size });
        } catch {
          // File deleted while walking; safe to ignore
        }
      }
    }
  }

  walk(fgosDir);
  return map;
}

/**
 * Compares two `.fgos` snapshots and reports any added, modified, or deleted files.
 */
export function diffFgosSnapshots(before, after, allowedMutations = new Set()) {
  const added = [];
  const modified = [];
  const deleted = [];

  for (const [relPath, info] of after) {
    if (allowedMutations.has(relPath)) continue;
    if (!before.has(relPath)) {
      added.push(relPath);
    } else {
      const prev = before.get(relPath);
      if (prev.mtimeMs !== info.mtimeMs || prev.size !== info.size) {
        modified.push(relPath);
      }
    }
  }

  for (const [relPath] of before) {
    if (allowedMutations.has(relPath)) continue;
    if (!after.has(relPath)) {
      deleted.push(relPath);
    }
  }

  added.sort();
  modified.sort();
  deleted.sort();

  return {
    added,
    modified,
    deleted,
    leaked: added.length > 0 || modified.length > 0 || deleted.length > 0,
  };
}

export function runSelectedTests(files, {
  cwd = REPO_ROOT,
  forwardedArgs = [],
  execPath = process.execPath,
  spawn = spawnSync,
  env = process.env,
  stdio = 'inherit',
  log = (msg) => console.error(msg),
  allowedFgosMutations = new Set(),
  fileTimeoutMs = Number(env[FILE_TIMEOUT_ENV]) || DEFAULT_FILE_TIMEOUT_MS,
  watchdogPollMs = DEFAULT_WATCHDOG_POLL_MS,
  // Only a real spawnSync has child processes to supervise.
  watchdog = spawn === spawnSync,
} = {}) {
  const relFiles = files.map((file) => path.relative(cwd, file));
  const childEnv = buildTestEnv(env);
  let runTemp = null;
  try {
    runTemp = fs.mkdtempSync(path.join(childEnv.TMPDIR || os.tmpdir(), 'fgos-test-run-'));
    childEnv.TMPDIR = runTemp;
    childEnv.TMP = runTemp;
    childEnv.TEMP = runTemp;
  } catch {
    // If the temp root is unusable, let Node's normal temp logic fail naturally.
    runTemp = null;
  }

  const fgosBefore = snapshotFgos(cwd);

  let result;
  let timedOut = [];
  const supervisor = watchdog && runTemp
    ? startFileWatchdog({ files: relFiles, env: childEnv, fileTimeoutMs, pollMs: watchdogPollMs, tempDir: runTemp, log })
    : null;
  try {
    const spawnResult = spawn(execPath, buildTestArgv(relFiles, forwardedArgs), { cwd, env: childEnv, stdio });
    result = { status: spawnResult.status ?? 1, files: relFiles, runTemp };
  } finally {
    if (supervisor) timedOut = supervisor.stop();
    if (runTemp) {
      if (env[KEEP_TMP_ENV] === '1') {
        log(`run-tests: kept this run's temp dir (${KEEP_TMP_ENV}=1): ${runTemp}`);
      } else {
        try {
          fs.rmSync(runTemp, { recursive: true, force: true, maxRetries: 3 });
        } catch {
          // A file still held open (Windows) must not turn a finished run into a failure.
        }
      }
    }
  }

  result.timedOut = timedOut;
  if (timedOut.length) {
    log('run-tests: ERROR: test file(s) exceeded the per-file time limit and were killed (process tree):');
    for (const { file, elapsedMs, limitMs } of timedOut) {
      log(`  ${file}: timed out after ${Math.round(elapsedMs / 1000)}s (limit ${Math.round(limitMs / 1000)}s)`);
    }
    result.status = result.status !== 0 ? result.status : 1;
  }

  const fgosAfter = snapshotFgos(cwd);
  const fgosDiff = diffFgosSnapshots(fgosBefore, fgosAfter, allowedFgosMutations);
  result.fgosDiff = fgosDiff;

  if (fgosDiff.leaked) {
    log('run-tests: ERROR: test suite leaked unexpected files or modifications into .fgos store:');
    if (fgosDiff.added.length) {
      log(`  Added (${fgosDiff.added.length}):`);
      for (const f of fgosDiff.added) log(`    + .fgos/${f}`);
    }
    if (fgosDiff.modified.length) {
      log(`  Modified (${fgosDiff.modified.length}):`);
      for (const f of fgosDiff.modified) log(`    * .fgos/${f}`);
    }
    if (fgosDiff.deleted.length) {
      log(`  Deleted (${fgosDiff.deleted.length}):`);
      for (const f of fgosDiff.deleted) log(`    - .fgos/${f}`);
    }
    result.status = result.status !== 0 ? result.status : 1;
  }

  return result;
}

/**
 * Runs the full suite. Returns `{ status, files }` without touching
 * `process.exitCode` itself, so callers (the CLI entrypoint below, or a
 * test) can decide what to do with the result. Refuses (status 1, no
 * spawn) when zero files are discovered -- a portable-looking wrapper that
 * silently selected nothing would be worse than the shell-quoting bug it
 * replaces.
 */
export function runTests({
  root = DEFAULT_TEST_ROOT,
  forwardedArgs = [],
  execPath = process.execPath,
  spawn = spawnSync,
  env = process.env,
  cwd = REPO_ROOT,
  stdio = 'inherit',
  queue = null,
  allowedFgosMutations = new Set(),
  ...limitOptions
} = {}) {
  const files = discoverTestFiles(root);
  if (files.length === 0) {
    return {
      status: 1,
      files,
      message: `run-tests: discovered 0 test files under "${root}" -- refusing to report a false-green empty run. Check the path or the ".test.mjs" naming convention.`,
    };
  }

  // `queue` (the CLI door passes acquireFullSuiteQueue): taken only once
  // there is real work to run, and marked on the child's env so a test that
  // spawns this door itself never waits on its own parent's lock.
  if (!queue) return runSelectedTests(files, { cwd, forwardedArgs, execPath, spawn, env, stdio, allowedFgosMutations, ...limitOptions });
  const release = queue({ env });
  try {
    return runSelectedTests(files, { cwd, forwardedArgs, execPath, spawn, env: { ...env, [QUEUE_HELD_ENV]: '1' }, stdio, allowedFgosMutations, ...limitOptions });
  } finally {
    release();
  }
}

if (isMainModule(import.meta.url)) {
  const { status, message } = runTests({ forwardedArgs: process.argv.slice(2), queue: acquireFullSuiteQueue });
  if (message) console.error(message);
  process.exitCode = status;
}
