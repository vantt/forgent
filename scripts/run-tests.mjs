#!/usr/bin/env node
// run-tests.mjs -- portable full-suite door (TFC-D02/TFC-D04). Replaces the
// old `node --test 'test/**/*.test.mjs'` npm script: that string relied on
// the invoking SHELL to leave the glob unexpanded (a single-quoted arg) and
// on Node's OWN CLI glob support to then expand it -- Ubuntu/macOS's Node 20
// CI lane never resolves that pattern to any file at all (glob support for
// `--test` file arguments landed in a later Node). That failure happens
// before a single test ever runs.
//
// This script discovers every `*.test.mjs` file under `test/` itself with
// `fs.readdirSync` (Node >=18, no glob dependency), passes the resulting
// paths to `node --test` as literal argv elements (never a shell string,
// so spaces/quotes/backslashes in a path can never be misinterpreted), so the
// exact same invocation works unchanged on every OS's default shell.

import fs from 'node:fs';
import { REPO_ROOT, ensureGitAddon, ensureHostBin, gitAddonDirectory } from './lib/git-addon-stage.mjs';
import os from 'node:os';
import path from 'node:path';
import { spawn as spawnAsync, spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isMainModule } from './lib/is-main-module.mjs';
import { acquireFullSuiteQueue, QUEUE_HELD_ENV } from './lib/full-suite-queue.mjs';
import { configEntries, repositoryDirs } from './lib/git-dir-layout.mjs';

export { REPO_ROOT };
export const DEFAULT_TEST_ROOT = path.join(REPO_ROOT, 'test');
/**
 * Builds the release-profile artifacts the release-tree tests stage from (`fgos`, `fgctl` and the
 * native addon under `releaseOutputDir()`), as CI does before `npm test`. Incremental: a no-op when
 * they are current. Runs inside the full-suite queue, so worktrees sharing a cargo target never
 * rebuild under one another's run.
 */
export function ensureReleaseArtifacts(env = process.env, cwd = REPO_ROOT) {
  const targetDir = path.resolve(cwd, env.CARGO_TARGET_DIR || 'target');
  execFileSync('cargo', ['build', '--locked', '--release', '-p', 'fgos', '-p', 'fgctl', '-p', 'fgos-node-addon'], {
    cwd,
    env: { ...env, CARGO_TARGET_DIR: targetDir },
    stdio: 'inherit',
  });
}

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
export const GIT_CONFIG_GUARD_PATH = path.join(REPO_ROOT, 'scripts', 'lib', 'test-git-config-guard.mjs');

export const GIT_SPAWN_SPY_PATH = path.join(REPO_ROOT, 'test', 'helpers', 'git-spawn-spy.mjs');
export const GIT_SPAWN_SPY_LOG_ENV = 'FGOS_GIT_SPAWN_SPY_LOG';

export function buildTestArgv(files, forwardedArgs = []) {
  // The guard is preloaded into every test file's process: a `git config` write that would land in
  // this checkout's own repository is refused there, before it can rewrite the owner's identity.
  // The spy records every `git` or hook spawn product code (src, bin, scripts) starts (one-door gate).
  return ['--test', `--import=${pathToFileURL(GIT_CONFIG_GUARD_PATH).href}`, `--import=${pathToFileURL(GIT_SPAWN_SPY_PATH).href}`, ...forwardedArgs, ...files];
}

/** The product Git/hook spawns the spy recorded during a run, one entry per distinct site. */
export function readGitSpawnLog(file) {
  let text = '';
  try { text = fs.readFileSync(file, 'utf8'); } catch { return []; }
  const sites = new Map();
  for (const line of text.split('\n').filter(Boolean)) {
    const entry = JSON.parse(line);
    const key = `${entry.class ?? ''} ${entry.frame} ${entry.target} ${entry.file} ${entry.args?.[0] ?? ''}`;
    if (!sites.has(key)) sites.set(key, { ...entry, count: 0 });
    sites.get(key).count += 1;
  }
  return [...sites.values()];
}

// The staged release manifest the in-process door needs (`target/debug/fgos` alone has none). Staged once per
// process, and not at all when the caller's env already names this checkout's staged manifest, as the host
// binary is reused when FGOS_HOST_BIN already runs.
let stagedDoor = null;
function stageDoorManifest(childEnv) {
  const manifest = path.join(gitAddonDirectory(REPO_ROOT), 'manifest.json');
  if (childEnv.FGOS_ACTIVE_MANIFEST_PATH !== manifest || !fs.existsSync(manifest)) {
    stagedDoor ??= (() => { const staged = { ...childEnv }; ensureGitAddon(staged, REPO_ROOT); return staged; })();
    Object.assign(childEnv, { FGOS_HOST_BIN: stagedDoor.FGOS_HOST_BIN, FGOS_ACTIVE_RELEASE_PATH: stagedDoor.FGOS_ACTIVE_RELEASE_PATH, FGOS_ACTIVE_MANIFEST_PATH: stagedDoor.FGOS_ACTIVE_MANIFEST_PATH });
  }
}

/**
 * The env every spawned `node --test` run gets, whoever spawns it (the full
 * suite, the canary, the selector's related run, mutation and coverage runs):
 * - no inherited NODE_TEST_CONTEXT: an enclosing `node --test` sets it, and a
 *   nested run that inherits it reports to a parent that is not listening
 *   and exits 0 without running a single test;
 * - no inherited FGOS_STATE_ROOT: the host pins it into every payload it
 *   runs, and a suite started under fgOS would otherwise send every fixture
 *   that sets only FGOS_STATE_HOME to the real machine state root;
 * - FGOS_CLAUDE_COMMAND naming a binary that does not exist, unless the
 *   caller names one: doctor and setup in a fixture would otherwise run the
 *   real `claude` CLI, reach the network and change the real user's plugin
 *   registrations; a test that probes the claude rows sets its own;
 * - on darwin, TMPDIR/TMP/TEMP resolved through realpath (/var -> /private/var).
 */
export function buildTestEnv(env = process.env) {
  const { NODE_TEST_CONTEXT: _enclosingRunner, FGOS_STATE_ROOT: _pinnedStateRoot, ...rest } = env;
  const childEnv = { ...rest };
  childEnv.FGOS_CLAUDE_COMMAND ||= '/nonexistent/fgos-test-claude-binary';
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
    stageDoorManifest(childEnv);
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
 * (the test env, the darwin TMPDIR realpath fix, argv
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
/**
 * The identity keys (user.*, author.*, committer.*) the checkout's repository config holds, as
 * `scope: key=value` lines. A fixture that configures an identity in the wrong repository changes
 * exactly this, and every later commit of the checkout's owner then carries the fixture's name.
 * Covers the shared config and a linked worktree's own config.worktree; the machine-wide config is
 * not this checkout's. Empty when `cwd` is not a repository.
 */
export const GIT_IDENTITY_KEYS = '^(user|author|committer)\\.';
export function snapshotGitIdentity(cwd) {
  const dirs = repositoryDirs(cwd);
  if (!dirs) return [];
  const pattern = new RegExp(GIT_IDENTITY_KEYS);
  const shared = path.join(dirs.commonDir, 'config');
  const lines = configEntries(shared, pattern).map((line) => `local: ${line}`);
  // Without extensions.worktreeConfig, a checkout's config.worktree is not read at all.
  if (configEntries(shared, /^extensions\.worktreeconfig$/).at(-1)?.split(' ')[1] === 'true') {
    lines.push(...configEntries(path.join(dirs.gitDir, 'config.worktree'), pattern).map((line) => `worktree: ${line}`));
  }
  return lines.sort();
}

/**
 * Linked-checkout registrations of the repository at `cwd` whose checkout lies under one of `roots`
 * (the run's own temp dirs): each outlives its deleted checkout and makes every later worktree add of
 * that repository refuse until it is pruned. Read from the registration files, like the identity check.
 */
export function worktreeRegistrationsUnder(cwd, roots) {
  const dirs = repositoryDirs(cwd);
  const realRoots = roots.filter(Boolean).map((root) => { try { return fs.realpathSync(root); } catch { return path.resolve(root); } });
  if (!dirs || realRoots.length === 0) return [];
  const base = path.join(dirs.commonDir, 'worktrees');
  let names;
  try { names = fs.readdirSync(base); } catch { return []; }
  const found = [];
  for (const name of names.sort()) {
    let gitdir;
    try { gitdir = fs.readFileSync(path.join(base, name, 'gitdir'), 'utf8').trim(); } catch { continue; }
    const checkout = path.dirname(gitdir);
    if (realRoots.some((root) => checkout === root || checkout.startsWith(root + path.sep))) found.push({ name, checkout });
  }
  return found;
}

/** What changed between two `snapshotGitIdentity` results: `{ added, removed, changed }`. */
export function diffGitIdentity(before, after) {
  const asMap = (lines) => new Map(lines.map((line) => {
    const space = line.indexOf(' ', line.indexOf(': ') + 2);
    return [space < 0 ? line : line.slice(0, space), line];
  }));
  const b = asMap(before);
  const a = asMap(after);
  const added = [];
  const removed = [];
  const changed = [];
  for (const [key, line] of a) {
    if (!b.has(key)) added.push(line);
    else if (b.get(key) !== line) changed.push(`${b.get(key)} -> ${line}`);
  }
  for (const [key, line] of b) if (!a.has(key)) removed.push(line);
  return { added, removed, changed, leaked: added.length + removed.length + changed.length > 0 };
}

/**
 * The `fgos-*` entries still present directly under a run's temp root, grouped by name prefix
 * (the random mkdtemp suffix cut off): `{ prefix: count }`. Every test process removes its own
 * temp tree at exit, so anything left here came from a file that skipped that, a killed file, or
 * a child that outlived it.
 */
export function leftoverTempPrefixes(root, readdir = fs.readdirSync) {
  const counts = {};
  let names = [];
  try { names = readdir(root); } catch { return counts; }
  for (const name of names) {
    if (!name.startsWith('fgos-')) continue;
    const prefix = name.replace(/[A-Za-z0-9_]{6}$/, '');
    counts[prefix] = (counts[prefix] || 0) + 1;
  }
  return counts;
}

export const SENSITIVE_FGOS_FILES = new Set(['secrets.local.env', 'secrets.env']);

// Derived files that any read of the live store may rewrite: the state view is a cache folded
// from the event log. A test that reads the store therefore refreshes it without leaking
// anything; test-written state still shows up as added or changed event, observe and work
// files, which stay guarded.
export const DERIVED_FGOS_FILES = new Set([
  path.join('cache', 'state.json'),
]);

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
  allowedFgosMutations = DERIVED_FGOS_FILES,
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

  // Fixtures that confined workers must reach live outside /tmp. A per-run root removed here also
  // covers a test file the watchdog killed, which never runs its own exit cleanup.
  let fixtureRoot = null;
  if (fs.existsSync('/var/tmp') && env[KEEP_TMP_ENV] !== '1') {
    try {
      fixtureRoot = fs.mkdtempSync('/var/tmp/fgos-test-fixtures-');
      childEnv.FGOS_TEST_FIXTURE_ROOT = fixtureRoot;
    } catch {
      fixtureRoot = null;
    }
  }

  const fgosBefore = snapshotFgos(cwd);
  const identityBefore = snapshotGitIdentity(cwd);

  let result;
  let timedOut = [];
  const tempLeftovers = {};
  let strayWorktrees = [];
  const supervisor = watchdog && runTemp
    ? startFileWatchdog({ files: relFiles, env: childEnv, fileTimeoutMs, pollMs: watchdogPollMs, tempDir: runTemp, log })
    : null;
  const spawnLog = path.join(runTemp ?? fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-test-spy-')), 'git-spawn-spy.jsonl');
  childEnv[GIT_SPAWN_SPY_LOG_ENV] = spawnLog;
  let gitSpawns = [];
  try {
    const started = Date.now();
    const spawnResult = spawn(execPath, buildTestArgv(relFiles, forwardedArgs), { cwd, env: childEnv, stdio });
    result = { status: spawnResult.status ?? 1, files: relFiles, runTemp, wallSeconds: (Date.now() - started) / 1000 };
    gitSpawns = readGitSpawnLog(spawnLog);
  } finally {
    if (supervisor) timedOut = supervisor.stop();
    for (const root of [runTemp, fixtureRoot]) {
      if (!root) continue;
      for (const [prefix, count] of Object.entries(leftoverTempPrefixes(root))) tempLeftovers[prefix] = (tempLeftovers[prefix] || 0) + count;
    }
    strayWorktrees = worktreeRegistrationsUnder(cwd, [runTemp, fixtureRoot]);
    if (fixtureRoot) {
      try {
        fs.rmSync(fixtureRoot, { recursive: true, force: true, maxRetries: 3 });
      } catch {
        // Best effort: leftover fixtures must not fail a finished run.
      }
    }
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

  result.tempLeftovers = tempLeftovers;
  if (Object.keys(tempLeftovers).length) {
    log('run-tests: ERROR: test suite left temporary directories behind (name prefix: count):');
    for (const [prefix, count] of Object.entries(tempLeftovers).sort()) log(`  ${prefix}*: ${count}`);
    log('  A test file must import test/helpers/process-tmp-root.mjs first; a killed file leaves its own tree.');
    result.status = result.status !== 0 ? result.status : 1;
  }

  result.strayWorktrees = strayWorktrees;
  if (strayWorktrees.length) {
    log('run-tests: ERROR: test suite left linked-checkout registrations in this repository whose checkouts were in its temp dir:');
    for (const { name, checkout } of strayWorktrees) log(`  ${name}: ${checkout}`);
    log('  Every later worktree add here refuses until they go: run `git worktree prune` in this checkout. A test that registers a checkout in the real repository must remove it.');
    result.status = result.status !== 0 ? result.status : 1;
  }

  // A standalone skill's own spawns are a named class (Git spec §12): counted, not a failure.
  const standaloneSpawns = gitSpawns.filter((s) => s.class === 'standalone-skill-script');
  gitSpawns = gitSpawns.filter((s) => !s.class);
  result.gitSpawns = gitSpawns;
  result.standaloneSkillSpawns = standaloneSpawns;
  if (standaloneSpawns.length) log(`run-tests: ${standaloneSpawns.length} standalone-skill-script Git spawn site(s), outside the product one door: ${[...new Set(standaloneSpawns.map((s) => s.skill))].join(', ')}`);
  if (gitSpawns.length) {
    log('run-tests: ERROR: product code started git or a hook outside the fgos-git driver (Git spec §12, one door):');
    for (const s of gitSpawns) log(`  ${s.frame}: ${s.target} ${s.file} ${(s.args ?? []).join(' ')} (${s.count}x)`);
    log('  Route the call through a typed Git port (src/git/*); a sandbox repository goes through scripts/lib/sandbox-git.mjs.');
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

  const identityDiff = diffGitIdentity(identityBefore, snapshotGitIdentity(cwd));
  result.gitIdentityDiff = identityDiff;
  if (identityDiff.leaked) {
    log('run-tests: ERROR: test suite changed the git identity held by this checkout\'s own repository config:');
    for (const line of identityDiff.added) log(`  + ${line}`);
    for (const line of identityDiff.removed) log(`  - ${line}`);
    for (const line of identityDiff.changed) log(`  * ${line}`);
    log('  A fixture ran `git config user.*` outside its own temporary repository; restore the keys above with `git config --local`.');
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
  allowedFgosMutations = DERIVED_FGOS_FILES,
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

/**
 * The CLI door's queue. The full-suite queue is a kernel lock taken through the
 * in-process door of the native addon, and this process runs from a checkout,
 * whose door loads only through the one staged manifest: so the checkout's addon
 * and host are staged (one cargo build per run, here, never per selected file)
 * and exported on this process's env before the lock is asked for. Staging
 * outside the queue is safe: it builds into this run's own CARGO_TARGET_DIR (cargo
 * serializes a shared one) and publishes into this checkout's own staging directory
 * by atomic rename, so a run queued in another worktree never executes bytes
 * replaced under it. What stays inside the queue is the heavy work: the release
 * artifacts and the suite itself.
 */
export function queueAfterStaging(options, {
  stage = () => ensureGitAddon(process.env, REPO_ROOT),
  queue = acquireFullSuiteQueue,
  artifacts = () => ensureReleaseArtifacts(process.env, REPO_ROOT),
} = {}) {
  stage();
  const release = queue(options);
  try {
    artifacts();
    return release;
  } catch (err) {
    release();
    throw err;
  }
}

if (isMainModule(import.meta.url)) {
  const { status, message, files, wallSeconds } = runTests({
    forwardedArgs: process.argv.slice(2),
    queue: (options) => queueAfterStaging(options),
  });
  if (message) console.error(message);
  let reportStatus = 0;
  if (files.length > 0) {
    const { suiteReport } = await import('./test-proof-inventory.mjs');
    const report = suiteReport({ files, wallSeconds });
    for (const line of report.lines) console.error(line);
    reportStatus = report.status;
  }
  process.exitCode = status || reportStatus;
}
