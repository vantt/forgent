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
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isMainModule } from './lib/is-main-module.mjs';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_TEST_ROOT = path.join(REPO_ROOT, 'test');
const TEST_FILE_SUFFIX = '.test.mjs';

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
 * Runs `node --test` against an EXPLICIT, already-resolved file list (P03:
 * the shared seam between the full-suite door and the canary runner).
 * Applies the exact same env/argv construction `runTests()` always has
 * (FGOS_DISABLE_OPPORTUNISTIC_CHECKS, the darwin TMPDIR realpath fix, argv
 * as a literal array -- never a shell string) so a canary run and the full
 * run are byte-for-byte identical in every way except which files are
 * selected. Returns `{ status, files }`, same shape as `runTests()`.
 */
export function runSelectedTests(files, {
  cwd = REPO_ROOT,
  forwardedArgs = [],
  execPath = process.execPath,
  spawn = spawnSync,
  env = process.env,
  stdio = 'inherit',
} = {}) {
  const relFiles = files.map((file) => path.relative(cwd, file));
  const childEnv = { ...env, FGOS_DISABLE_OPPORTUNISTIC_CHECKS: '1' };
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
  const result = spawn(execPath, buildTestArgv(relFiles, forwardedArgs), { cwd, env: childEnv, stdio });
  return { status: result.status ?? 1, files: relFiles };
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
} = {}) {
  const files = discoverTestFiles(root);
  if (files.length === 0) {
    return {
      status: 1,
      files,
      message: `run-tests: discovered 0 test files under "${root}" -- refusing to report a false-green empty run. Check the path or the ".test.mjs" naming convention.`,
    };
  }

  return runSelectedTests(files, { cwd, forwardedArgs, execPath, spawn, env, stdio });
}

if (isMainModule(import.meta.url)) {
  const { status, message } = runTests({ forwardedArgs: process.argv.slice(2) });
  if (message) console.error(message);
  process.exitCode = status;
}
