import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { initStore, addWork, listWork, readRawEvents, EXIT_CODES } from '../../src/state/store.mjs';
import { acquireRunnerLock, runOnce, EXIT_BUSY, LOCK_FILE } from '../../src/runner/loop.mjs';

// Inter-process exclusivity for the runner: `.fgos/runner.lock`. Every test
// builds its own disposable git repo (git init in mkdtemp) with its own
// `.fgos/` inside it; nothing here touches THIS repo (forgent itself).

const noLog = () => {};

function initTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lock-test-repo-'));
  execFileSync('git', ['init', '-q'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });
  return repoRoot;
}

function setup() {
  const repoRoot = initTempRepo();
  const dir = path.join(repoRoot, '.fgos');
  initStore(dir);
  const worktreeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lock-test-wt-'));
  return { repoRoot, dir, worktreeDir };
}

function seedItem(dir, overrides = {}) {
  addWork(dir, {
    id: 'item-x',
    title: 'Produce the output file',
    kind: 'behavior_change',
    status: 'todo',
    deps: [],
    risk: 'low',
    refs: [],
    verify: 'test -f output.txt',
    ...overrides,
  });
}

/** A pid that is guaranteed dead: a node child that already ran to
 * completion (spawnSync only returns after the child exits). */
function deadPid() {
  const result = spawnSync(process.execPath, ['-e', ''], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  return result.pid;
}

function fgwBranches(repoRoot) {
  const out = execFileSync('git', ['branch', '--list', 'fgw/*'], { cwd: repoRoot, encoding: 'utf8' });
  return out.split('\n').filter(Boolean);
}

// --- exit code contract ----------------------------------------------------

test('EXIT_BUSY collides with no existing exit code (0 ok, 1 unexpected, R4 category map)', () => {
  const taken = new Set([0, 1, ...Object.values(EXIT_CODES)]);
  assert.equal(taken.has(EXIT_BUSY), false);
});

// A held events.lock (distinct from runner.lock above) is a transient,
// documented-as-retryable condition (events.mjs's own EventLogError message:
// "another process is writing; retry the operation") — NOT an uncategorized
// bug. Before EXIT_CODES carried a 'lock-timeout' entry, categoryOf's
// undefined-exitCode fallback made claimAndDispatch/runOnce re-throw it
// exactly like a real crash: the whole drain-run aborted, losing every
// already-dispatched item's structured result (review-unreviewed-260717,
// corroborated by two independent reviewers). This proves the fix: runOnce
// returns its structured result with the distinct exit code instead of
// throwing. Real contention, not a mock — waits out the actual 2s timeout.
test('a held events.lock halts the drain-run gracefully (lock-timeout exit code, no throw)', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  seedItem(dir);
  const eventsLockPath = path.join(dir, 'events.lock');
  fs.writeFileSync(eventsLockPath, String(process.pid)); // this test process: alive for the whole test

  try {
    const result = await runOnce({ repoRoot, dir, worktreeDir, log: noLog });
    assert.equal(result.outcome, 'drained');
    assert.equal(result.exitCode, EXIT_CODES['lock-timeout']);
    assert.equal(result.dispatched.length, 1);
    assert.equal(result.dispatched[0].outcome, 'halted');
    assert.equal(result.dispatched[0].errorClass, 'lock-timeout');
  } finally {
    fs.rmSync(eventsLockPath, { force: true });
  }
});

// --- overlapping runs ------------------------------------------------------

test('second overlapping runOnce exits busy: zero store writes, zero worktree ops, holder lock untouched', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  seedItem(dir);
  // The "first runner" is simulated by its lock: a live pid (this very test
  // process) holding runner.lock — exactly what a concurrent run leaves in
  // place for its whole lifetime.
  const lockPath = path.join(dir, LOCK_FILE);
  fs.writeFileSync(lockPath, String(process.pid), { flag: 'wx' });
  const eventsBefore = readRawEvents(dir).length;

  const result = await runOnce({ repoRoot, config: { timeoutMs: 5000 }, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'busy');
  assert.equal(result.exitCode, EXIT_BUSY);
  assert.equal(result.holderPid, process.pid);
  // zero store writes: no reap, no claim — the seeded item never moved
  assert.equal(readRawEvents(dir).length, eventsBefore);
  assert.equal(listWork(dir).work['item-x'].status, 'todo');
  // zero worktree ops: no fgw branch, no checkout directory
  assert.deepEqual(fgwBranches(repoRoot), []);
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
  // the live holder's lock survives the busy exit, pid intact
  assert.equal(fs.readFileSync(lockPath, 'utf8'), String(process.pid));
});

test('stale lock (dead pid) is cleaned-and-yielded: first runOnce exits busy having removed it, the next run acquires and proceeds', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  const lockPath = path.join(dir, LOCK_FILE);
  fs.writeFileSync(lockPath, String(deadPid()), { flag: 'wx' });

  const first = await runOnce({ repoRoot, config: { timeoutMs: 5000 }, worktreeDir, log: noLog });
  assert.equal(first.outcome, 'busy');
  assert.equal(first.exitCode, EXIT_BUSY);
  assert.equal(first.reclaimedStale, true);
  // the stale lock is gone, but this call never acquired on the path it deleted
  assert.equal(fs.existsSync(lockPath), false);

  // empty frontier: proceeding past the lock means reaching the idle path
  const second = await runOnce({ repoRoot, config: { timeoutMs: 5000 }, worktreeDir, log: noLog });
  assert.equal(second.outcome, 'idle');
  assert.equal(second.exitCode, 0);
  assert.equal(fs.existsSync(lockPath), false);
});

test('garbage lock content (no live holder can prove ownership) is treated as stale: cleaned, then next run proceeds', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  const lockPath = path.join(dir, LOCK_FILE);
  fs.writeFileSync(lockPath, 'not-a-pid\n', { flag: 'wx' });

  const first = await runOnce({ repoRoot, config: { timeoutMs: 5000 }, worktreeDir, log: noLog });
  assert.equal(first.outcome, 'busy');
  assert.equal(first.reclaimedStale, true);
  assert.equal(fs.existsSync(lockPath), false);

  const second = await runOnce({ repoRoot, config: { timeoutMs: 5000 }, worktreeDir, log: noLog });
  assert.equal(second.outcome, 'idle');
});

test('reclaim never acquires in the deleting call: two racers over a stale lock both yield, a clean wx create wins afterwards', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lock-test-dir-'));
  const lockPath = path.join(dir, LOCK_FILE);
  fs.writeFileSync(lockPath, String(deadPid()), { flag: 'wx' });

  // racer 1 sees the stale lock: cleans it, yields, never holds it
  const first = acquireRunnerLock(dir);
  assert.equal(first.acquired, false);
  assert.equal(first.reclaimedStale, true);
  assert.equal(fs.existsSync(lockPath), false);

  // racer 2 arriving after the clean finds an empty path and acquires via
  // plain wx — the only way any process ever acquires
  const second = acquireRunnerLock(dir);
  assert.equal(second.acquired, true);
  assert.equal(fs.readFileSync(lockPath, 'utf8'), String(process.pid));
  second.release();
});

// --- acquire/release primitive --------------------------------------------

test('acquireRunnerLock: wx create wins once, refuses a live holder, release removes the file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lock-test-dir-'));
  const first = acquireRunnerLock(dir);
  assert.equal(first.acquired, true);
  assert.equal(fs.readFileSync(first.lockPath, 'utf8'), String(process.pid));

  const second = acquireRunnerLock(dir);
  assert.equal(second.acquired, false);
  assert.equal(second.holderPid, process.pid);

  first.release();
  assert.equal(fs.existsSync(first.lockPath), false);
  // released — a new acquire succeeds again
  const third = acquireRunnerLock(dir);
  assert.equal(third.acquired, true);
  third.release();
});

test('release is idempotent when the lock file is already gone', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lock-test-dir-'));
  const lock = acquireRunnerLock(dir);
  fs.unlinkSync(lock.lockPath);
  lock.release(); // must not throw
});
