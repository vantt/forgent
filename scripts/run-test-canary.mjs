#!/usr/bin/env node
// run-test-canary.mjs -- P03 canary-first local runner. Additive to
// `npm test`: runs an explicit, validated subset first; a red canary
// returns immediately without ever touching the full suite; a green
// canary invokes the unchanged full-suite door exactly once. Canary green
// is NEVER completion proof by itself -- only the full-suite result that
// follows it is authoritative (ITR-D05).
//
// Input modes (no-arguments is a validation error, never an implicit full
// run -- a portable-looking wrapper that silently selected nothing would
// be worse than doing nothing at all):
//   node scripts/run-test-canary.mjs test/a.test.mjs test/b.test.mjs
//   node scripts/run-test-canary.mjs --from-file <path>   (one path per
//     line, blank lines and `#`-comment lines ignored -- the integration
//     point a future P04 selector writes its output through)
//   any flag-shaped token (starts with "-") is a forwarded runner arg
//     (e.g. a reporter) applied ONLY to the canary sub-run, never to the
//     full-suite invocation that follows, and never treated as a file.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { REPO_ROOT, DEFAULT_TEST_ROOT, runSelectedTests, runTests } from './run-tests.mjs';

/**
 * Splits raw CLI argv into positional canary-file candidates, forwarded
 * runner flags, and an optional `--from-file <path>` value. A flag-shaped
 * token can never become a file candidate, and a file candidate can never
 * be reinterpreted as a flag -- the split is purely positional/shape-based,
 * done once, up front.
 */
export function parseCanaryArgs(rawArgs) {
  const files = [];
  const forwardedArgs = [];
  let fromFile = null;
  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
    if (arg === '--from-file') {
      fromFile = rawArgs[i + 1] ?? null;
      i += 1;
      continue;
    }
    if (arg.startsWith('-')) {
      forwardedArgs.push(arg);
      continue;
    }
    files.push(arg);
  }
  return { files, forwardedArgs, fromFile };
}

/**
 * Reads a `--from-file` canary list: one path per line, blank lines and
 * `#`-prefixed comment lines ignored. Returns `[]` (never throws) when the
 * file itself does not exist -- the caller's empty-set refusal covers that
 * case with one consistent message rather than a raw ENOENT.
 */
export function readCanaryFileList(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
}

/**
 * Resolves and validates raw canary path strings against `testRoot`:
 * each must exist, be a file (not a directory), end in `.test.mjs` (the
 * same suffix `discoverTestFiles` requires), and resolve (following
 * symlinks) to a real path contained within `testRoot`'s own real path --
 * never merely path-prefix-contained, which a sibling directory sharing a
 * name prefix could defeat. Duplicates (including two different argv
 * strings that resolve to the same real file) collapse to one entry.
 * Returns `{ valid, invalid }`; `valid` is sorted for a deterministic run
 * order. Never guesses past a validation failure -- one bad path invalidates
 * the whole set rather than silently running a smaller one (fail-safe).
 */
export function resolveCanaryFiles(rawPaths, { testRoot = DEFAULT_TEST_ROOT, cwd = REPO_ROOT } = {}) {
  let realRoot;
  try {
    realRoot = fs.realpathSync(testRoot);
  } catch {
    return { valid: [], invalid: rawPaths.map((p) => ({ raw: p, reason: 'test root does not exist' })) };
  }

  const invalid = [];
  const validReal = new Set();

  for (const raw of rawPaths) {
    if (!raw.endsWith('.test.mjs')) {
      invalid.push({ raw, reason: 'does not end in .test.mjs' });
      continue;
    }
    const absolute = path.isAbsolute(raw) ? raw : path.resolve(cwd, raw);
    let stat;
    try {
      stat = fs.statSync(absolute);
    } catch {
      invalid.push({ raw, reason: 'missing' });
      continue;
    }
    if (!stat.isFile()) {
      invalid.push({ raw, reason: 'not a file' });
      continue;
    }
    let real;
    try {
      real = fs.realpathSync(absolute);
    } catch {
      invalid.push({ raw, reason: 'missing' });
      continue;
    }
    const contained = real === realRoot || real.startsWith(realRoot + path.sep);
    if (!contained) {
      invalid.push({ raw, reason: 'outside test root (symlink-escape or explicit ../)' });
      continue;
    }
    validReal.add(real);
  }

  return { valid: Array.from(validReal).sort(), invalid };
}

/**
 * Orchestrates one canary-first run. Never touches `process.exitCode`
 * itself (same convention as `runTests`/`runSelectedTests`) so the CLI
 * entrypoint and tests both decide what to do with the result.
 */
export function runCanary({
  rawArgs = [],
  testRoot = DEFAULT_TEST_ROOT,
  cwd = REPO_ROOT,
  execPath = process.execPath,
  spawn = spawnSync,
  env = process.env,
  stdio = 'inherit',
  now = () => Date.now(),
} = {}) {
  const { files: positionalFiles, forwardedArgs, fromFile } = parseCanaryArgs(rawArgs);
  const fromFileList = fromFile ? readCanaryFileList(fromFile) : [];
  const combinedRaw = [...positionalFiles, ...fromFileList];

  if (combinedRaw.length === 0) {
    return {
      status: 1,
      phase: 'validation',
      canaryFiles: [],
      invalid: [],
      fullSuiteRan: false,
      message: 'run-test-canary: no canary files given -- pass explicit paths or --from-file <path>. Refusing an implicit full run.',
    };
  }

  const { valid, invalid } = resolveCanaryFiles(combinedRaw, { testRoot, cwd });
  if (invalid.length > 0) {
    return {
      status: 1,
      phase: 'validation',
      canaryFiles: [],
      invalid,
      fullSuiteRan: false,
      message: `run-test-canary: refusing -- ${invalid.length} invalid canary path(s): ${invalid.map((i) => `${i.raw} (${i.reason})`).join(', ')}`,
    };
  }
  if (valid.length === 0) {
    return {
      status: 1,
      phase: 'validation',
      canaryFiles: [],
      invalid: [],
      fullSuiteRan: false,
      message: 'run-test-canary: no valid canary files after de-duplication -- refusing an implicit full run.',
    };
  }

  const canaryStart = now();
  const canaryResult = runSelectedTests(valid, { cwd, forwardedArgs, execPath, spawn, env, stdio });
  const canaryElapsedMs = now() - canaryStart;

  if (canaryResult.status !== 0) {
    return {
      status: canaryResult.status,
      phase: 'canary',
      canaryFiles: canaryResult.files,
      invalid: [],
      fullSuiteRan: false,
      canaryElapsedMs,
      message: `run-test-canary: canary red (${canaryResult.files.length} file(s), exit ${canaryResult.status}) -- full suite NOT run. A green canary alone is never completion proof; a red canary needs no further proof it stops here.`,
    };
  }

  const fullStart = now();
  const fullResult = runTests({ root: testRoot, execPath, spawn, env, cwd, stdio });
  const fullElapsedMs = now() - fullStart;

  return {
    status: fullResult.status,
    phase: 'full',
    canaryFiles: canaryResult.files,
    invalid: [],
    fullSuiteRan: true,
    canaryElapsedMs,
    fullElapsedMs,
    fullFileCount: fullResult.files.length,
    message: fullResult.message ?? `run-test-canary: canary green (${canaryResult.files.length} file(s)) -- full suite ran once (${fullResult.files.length} files, exit ${fullResult.status}). Canary files are intentionally re-run inside the full suite; this is expected duplication, not a bug. The canary result above is NOT completion proof by itself -- this full-suite result is.`,
  };
}

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  const result = runCanary({ rawArgs: process.argv.slice(2) });
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.status;
}
