import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { claimWork } from '../../src/runner/claim-port.mjs';
import { acquireMainCheckoutLock, releaseMainCheckoutLock, ACQUIRED, HELD, DEFAULT_TTL_MS, LOCK_FILE } from '../../src/runner/main-checkout-lock.mjs';
import { beaconPath } from '../../src/runner/main-checkout-activity.mjs';
import { initStore, addWork } from '../../src/state/store.mjs';

// The pre-commit hook leaves a commit-activity beacon in its own file and no
// longer writes .fgos/main-checkout.lock, so a commit on main never blocks a
// claim or a land; the checkpoint that runs under a merge slot holds the
// main-checkout mutex itself, so it never races a land. Every test builds a
// disposable git repo with copies of the real hook and its modules; nothing
// here touches this repository's own checkout or .fgos/.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '../../src');
const HOOK_FILES = [
  ['../.githooks/pre-commit', '.githooks/pre-commit'],
  ['runner/main-checkout-lock.mjs', 'src/runner/main-checkout-lock.mjs'],
  ['runner/main-checkout-activity.mjs', 'src/runner/main-checkout-activity.mjs'],
  ['runner/dispatch/process-identity.mjs', 'src/runner/dispatch/process-identity.mjs'],
  ['runner/dispatch/run-timeout.mjs', 'src/runner/dispatch/run-timeout.mjs'],
  ['util/session-identity.mjs', 'src/util/session-identity.mjs'],
  ['util/host-bin-path.mjs', 'src/util/host-bin-path.mjs'],
];
const MERGE_MODULE_URL = pathToFileURL(path.join(SRC, 'runner/merge.mjs')).href;
const FGOS_BIN = path.resolve(__dirname, '../../bin/fgos.mjs');

function git(cwd, args, env) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', ...(env ? { env } : {}) });
}

function initRepo({ withFgosHook = true } = {}) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-activity-beacon-e2e-'));
  git(repoRoot, ['init', '-q', '-b', 'main']);
  git(repoRoot, ['config', 'user.email', 'test@example.com']);
  git(repoRoot, ['config', 'user.name', 'Test']);
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  git(repoRoot, ['add', 'seed.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'root commit']);
  if (withFgosHook) {
    for (const [from, to] of HOOK_FILES) {
      const target = path.join(repoRoot, to);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.resolve(SRC, from), target);
    }
    fs.chmodSync(path.join(repoRoot, '.githooks/pre-commit'), 0o755);
    git(repoRoot, ['config', 'core.hooksPath', '.githooks']);
  }
  return repoRoot;
}

function seedStore(repoRoot) {
  const dir = path.join(repoRoot, '.fgos');
  initStore(dir);
  addWork(dir, { id: 'item-a', title: 'Item A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  return dir;
}

// scripts/run-tests.mjs sets FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 for the
// whole suite. The checkpoint is exactly what some tests below exercise, so
// they clear it explicitly: in the env of every process they spawn, and
// in-process around the claim that runs the checkpoint.
function sessionEnv(overlay = {}) {
  const env = { ...process.env, ...overlay };
  for (const name of ['FGOS_SESSION_ID', 'CLAUDE_CODE_SESSION_ID', 'FGOS_MAIN_LOCK_HOLDER_PID', 'FGOS_DISABLE_OPPORTUNISTIC_CHECKS']) {
    if (!(name in overlay)) delete env[name];
  }
  return env;
}

function withOpportunisticChecksEnabled(fn) {
  const saved = process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS;
  delete process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS;
  try {
    return fn();
  } finally {
    if (saved !== undefined) process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS = saved;
  }
}

let counter = 0;
function commitAsSession(repoRoot, overlay) {
  counter += 1;
  const name = `change-${counter}.txt`;
  fs.writeFileSync(path.join(repoRoot, name), `change ${counter}\n`);
  git(repoRoot, ['add', name]);
  return spawnSync('git', ['commit', '-q', '-m', `change ${counter}`], { cwd: repoRoot, encoding: 'utf8', env: sessionEnv(overlay) });
}

function log(repoRoot) {
  return git(repoRoot, ['log', '--format=%s']);
}

function readBeaconFile(repoRoot) {
  return JSON.parse(fs.readFileSync(beaconPath(path.join(repoRoot, '.fgos')), 'utf8'));
}

/** Makes the next opportunistic checkpoint due at once (fallback interval 0). */
function makeCheckpointDue(dir) {
  fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify({ checkpoint: { fallbackIntervalSec: 0 } }));
}

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/** Waits until `file` exists; fails at once, with the child's stderr, if the
 * child exits first (the checkpoint never reached its commit). */
async function waitForFileWhileChildRuns(file, exited, timeoutMs = 60_000) {
  let result = null;
  exited.then((r) => { result = r; });
  const deadline = Date.now() + timeoutMs;
  while (!fs.existsSync(file)) {
    if (result) throw new Error(`the child exited (${result.code}) before reaching ${file}: ${result.stderr}`);
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${file}`);
    await sleep(25);
  }
}

/** Runs withMergeTargetSlot(repoRoot, 'main', noop) in a separate process; resolves with its exit. */
function runSlotCheckpointChild(repoRoot, env = {}) {
  const script = `import(${JSON.stringify(MERGE_MODULE_URL)}).then(async ({ withMergeTargetSlot }) => {
    await withMergeTargetSlot(${JSON.stringify(repoRoot)}, 'main', async () => {});
  }).then(() => process.exit(0), (err) => { process.stderr.write(String(err && err.stack || err)); process.exit(1); });`;
  const child = spawn(process.execPath, ['--input-type=module', '-e', script], { env: sessionEnv(env), stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const exited = new Promise((resolve) => child.on('close', (code) => resolve({ code, stderr })));
  return { child, exited };
}

test('a commit on main followed at once by a claim succeeds: the hook leaves no main-checkout.lock behind', () => {
  const repoRoot = initRepo();
  const dir = seedStore(repoRoot);

  const commit = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-a' });
  assert.equal(commit.status, 0, commit.stderr);
  assert.equal(fs.existsSync(path.join(dir, LOCK_FILE)), false, 'the hook must not write the main-checkout mutex');
  assert.equal(readBeaconFile(repoRoot).writer.id, 'session-a');

  const claim = claimWork(dir, { id: 'item-a', actor: 'session', isolate: false, repoRoot });
  assert.equal(claim.to, 'doing');
});

test('the same writer commits again inside its window; another writer is refused; a refused commit writes no beacon', () => {
  const repoRoot = initRepo();
  const window = { FGOS_MAIN_CHECKOUT_LOCK_TTL_MS: String(15 * 60 * 1000) };

  assert.equal(commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-a', ...window }).status, 0);
  const first = readBeaconFile(repoRoot);
  const again = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-a', ...window });
  assert.equal(again.status, 0, again.stderr);

  const before = log(repoRoot);
  const rival = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-b', ...window });
  assert.notEqual(rival.status, 0);
  assert.match(rival.stderr, /commit refused: another session committed in this checkout/);
  assert.equal(log(repoRoot), before);
  const after = readBeaconFile(repoRoot);
  assert.equal(after.writer.id, 'session-a', 'the refused writer must not overwrite the beacon');
  assert.ok(after.writtenAt >= first.writtenAt);
});

test('a commit refused by an earlier guard (a staged .fgos deletion) never writes the beacon', () => {
  const repoRoot = initRepo();
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'tracked.json'), '{}\n');
  git(repoRoot, ['add', '.fgos/tracked.json']);
  assert.equal(spawnSync('git', ['commit', '-q', '-m', 'track'], { cwd: repoRoot, env: sessionEnv({ FGOS_SESSION_ID: 'session-a' }) }).status, 0);
  fs.rmSync(beaconPath(path.join(repoRoot, '.fgos')));

  git(repoRoot, ['rm', '-q', '.fgos/tracked.json']);
  const refused = spawnSync('git', ['commit', '-q', '-m', 'delete'], { cwd: repoRoot, encoding: 'utf8', env: sessionEnv({ FGOS_SESSION_ID: 'session-b' }) });
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /stages a deletion under "\.fgos\/"/);
  assert.equal(fs.existsSync(beaconPath(path.join(repoRoot, '.fgos'))), false);
});

test('an fgOS commit under the mutex it holds neither checks nor writes the beacon', () => {
  const repoRoot = initRepo();
  const dir = path.join(repoRoot, '.fgos');
  const window = { FGOS_MAIN_CHECKOUT_LOCK_TTL_MS: String(15 * 60 * 1000) };
  assert.equal(commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-a', ...window }).status, 0);
  const beaconBefore = fs.readFileSync(beaconPath(dir), 'utf8');

  const lock = acquireMainCheckoutLock(dir, { identity: process.pid, ttlMs: DEFAULT_TTL_MS });
  assert.equal(lock.status, ACQUIRED);
  try {
    const grant = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-b', FGOS_MAIN_LOCK_HOLDER_PID: String(process.pid) });
    assert.equal(grant.status, 0, grant.stderr);
  } finally {
    lock.release();
  }
  assert.equal(fs.readFileSync(beaconPath(dir), 'utf8'), beaconBefore);
});

test('a commit is refused while a live fgOS writer holds main-checkout.lock, without waiting', () => {
  const repoRoot = initRepo();
  const dir = path.join(repoRoot, '.fgos');
  const lock = acquireMainCheckoutLock(dir, { identity: process.pid, ttlMs: DEFAULT_TTL_MS });
  try {
    const result = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-a' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /fgOS is writing the main checkout right now/);
  } finally {
    lock.release();
  }
});

test('a main-checkout.lock record from a newer lock protocol refuses the commit with an upgrade message and is left in place', () => {
  const repoRoot = initRepo();
  const dir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(dir, { recursive: true });
  const record = JSON.stringify({ v: 2, kind: 'mutex', acquiredAt: Date.now() - 10 * 60 * 1000 });
  fs.writeFileSync(path.join(dir, LOCK_FILE), record);

  const result = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-a' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /newer fgOS lock protocol/);
  assert.equal(fs.readFileSync(path.join(dir, LOCK_FILE), 'utf8'), record);
});

test('a protocol marker naming another protocol, with no lock file, refuses the commit and reads as held in lock-status; unlock never clears a lock under it', () => {
  const repoRoot = initRepo();
  const dir = path.join(repoRoot, '.fgos');
  const markerDir = path.join(dir, 'runtime', 'locks', 'main-checkout');
  fs.mkdirSync(markerDir, { recursive: true });
  fs.writeFileSync(path.join(markerDir, 'protocol.json'), JSON.stringify({ writer: 2 }));

  const before = log(repoRoot);
  const commit = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-a' });
  assert.notEqual(commit.status, 0);
  assert.match(commit.stderr, /newer fgOS lock protocol/);
  assert.equal(log(repoRoot), before);

  const status = spawnSync(process.execPath, [FGOS_BIN, 'lock-status', '--dir', repoRoot], { cwd: repoRoot, encoding: 'utf8', env: sessionEnv() });
  assert.equal(status.status, 0, status.stderr);
  const data = JSON.parse(status.stdout).data;
  assert.equal(data.outcome, 'live');
  assert.equal(data.reason, 'unsupported-protocol');

  fs.writeFileSync(path.join(dir, LOCK_FILE), 'corrupt {{{');
  const unlock = spawnSync(process.execPath, [FGOS_BIN, 'unlock', '--dir', repoRoot], { cwd: repoRoot, encoding: 'utf8', env: sessionEnv() });
  assert.notEqual(unlock.status, 0, 'unlock must refuse, never report cleared');
  assert.doesNotMatch(unlock.stdout, /"cleared":\s*true/);
  assert.equal(fs.readFileSync(path.join(dir, LOCK_FILE), 'utf8'), 'corrupt {{{');
});

test('a claim right after another session commits still runs its checkpoint: the checkpoint commit is fgOS\'s own, not blocked by the beacon', () => {
  const repoRoot = initRepo();
  const dir = seedStore(repoRoot);
  makeCheckpointDue(dir);
  const window = { FGOS_MAIN_CHECKOUT_LOCK_TTL_MS: String(15 * 60 * 1000) };
  assert.equal(commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-other', ...window }).status, 0);

  const claim = withOpportunisticChecksEnabled(() => claimWork(dir, { id: 'item-a', actor: 'session', isolate: false, repoRoot }));
  assert.equal(claim.to, 'doing');
  assert.match(log(repoRoot), /chore\(\.fgos\): fallback events checkpoint/);
  assert.equal(git(repoRoot, ['diff', '--cached', '--name-only']).trim(), '', 'nothing may be left staged');
  assert.equal(readBeaconFile(repoRoot).writer.id, 'session-other', 'the checkpoint commit must not touch the beacon');
});

// The checkpoint that runs under a merge slot used to hold only the slot.
// Template: the red-team probe "W1-readonly" -- the checkpoint's git commit
// is paused inside a (project) pre-commit hook while a land tries to take
// the main-checkout mutex.
function installPausingHook(repoRoot, signalDir) {
  const hooks = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-activity-beacon-hooks-'));
  const hook = path.join(hooks, 'pre-commit');
  fs.writeFileSync(hook, `#!/bin/sh\ntouch "${signalDir}/paused"\nwhile [ ! -f "${signalDir}/resume" ]; do sleep 0.05; done\nexit 0\n`);
  fs.chmodSync(hook, 0o755);
  git(repoRoot, ['config', 'core.hooksPath', hooks]);
}

test('a checkpoint under a merge slot holds main-checkout.lock across its whole commit, so a land cannot take it mid-commit', async () => {
  const repoRoot = initRepo({ withFgosHook: false });
  const dir = seedStore(repoRoot);
  makeCheckpointDue(dir);
  const signalDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-activity-beacon-signal-'));
  installPausingHook(repoRoot, signalDir);

  const { child, exited } = runSlotCheckpointChild(repoRoot);
  try {
    await waitForFileWhileChildRuns(path.join(signalDir, 'paused'), exited);
    const land = acquireMainCheckoutLock(dir, { identity: process.pid, ttlMs: DEFAULT_TTL_MS });
    assert.equal(land.status, HELD, 'a land must not acquire the main checkout while the checkpoint commit runs');
    assert.equal(land.holderPid, child.pid);
  } finally {
    fs.writeFileSync(path.join(signalDir, 'resume'), '');
  }
  const { code, stderr } = await exited;
  assert.equal(code, 0, stderr);
  assert.match(log(repoRoot), /chore\(\.fgos\): fallback events checkpoint/);
  assert.equal(fs.existsSync(path.join(dir, LOCK_FILE)), false, 'the checkpoint releases the mutex right after its transaction');
});

test('a checkpoint under a merge slot is skipped while a land holds main-checkout.lock, leaving nothing staged', async () => {
  const repoRoot = initRepo({ withFgosHook: false });
  const dir = seedStore(repoRoot);
  makeCheckpointDue(dir);

  const land = acquireMainCheckoutLock(dir, { identity: process.pid, ttlMs: DEFAULT_TTL_MS });
  assert.equal(land.status, ACQUIRED);
  try {
    const { exited } = runSlotCheckpointChild(repoRoot);
    const { code, stderr } = await exited;
    assert.equal(code, 0, stderr);
    assert.doesNotMatch(log(repoRoot), /fallback events checkpoint/);
    assert.equal(git(repoRoot, ['diff', '--cached', '--name-only']).trim(), '');
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, LOCK_FILE), 'utf8')).pid, process.pid, 'the land\'s hold is untouched');
  } finally {
    releaseMainCheckoutLock(dir);
  }
});
