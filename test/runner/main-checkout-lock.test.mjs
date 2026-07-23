import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  acquireMainCheckoutLock,
  releaseMainCheckoutLock,
  LOCK_FILE,
  ACQUIRED,
  HELD,
  AMBIGUOUS,
} from '../../src/runner/main-checkout-lock.mjs';

// Main-checkout activity lock (str65-worktree-isolation-enforcement, D4/D5/D6).
// Every test builds its own disposable git repo (git init in mkdtemp) with
// its own `.fgos/` inside it; nothing here touches THIS repo (forgent
// itself).

function initTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-main-checkout-lock-test-'));
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
  return { repoRoot, dir };
}

/** A pid that is guaranteed dead: a node child that already ran to
 * completion (spawnSync only returns after the child exits). */
function deadPid() {
  const result = spawnSync(process.execPath, ['-e', ''], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  return result.pid;
}

function lockPathFor(dir) {
  return path.join(dir, LOCK_FILE);
}

// --- acquire when free ------------------------------------------------------

test('acquires the lock when no lock file exists (missing lock file is NOT ambiguous)', () => {
  const { dir } = setup();
  const res = acquireMainCheckoutLock(dir, { identity: process.pid });
  assert.equal(res.status, ACQUIRED);
  assert.equal(fs.existsSync(lockPathFor(dir)), true);
  const record = JSON.parse(fs.readFileSync(lockPathFor(dir), 'utf8'));
  assert.equal(record.pid, process.pid);
  assert.equal(typeof record.ts, 'number');
});

// --- exclusivity: held by a live other pid ----------------------------------

test('refuses when held by a live other pid (two racing processes cannot both succeed)', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  // Simulate a genuine live holder: this test process's own pid is
  // guaranteed alive, and is a different pid than the "attempt" below uses.
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: process.pid, ts: Date.now() }));

  const otherPid = process.pid + 1; // never actually probed as the acquirer's own identity
  const res = acquireMainCheckoutLock(dir, { identity: otherPid });

  assert.equal(res.status, HELD);
  assert.equal(res.holderPid, process.pid);
  // the lock file is untouched -- the live holder was never displaced
  const record = JSON.parse(fs.readFileSync(lockPathFor(dir), 'utf8'));
  assert.equal(record.pid, process.pid);
});

// --- stale: dead pid ---------------------------------------------------------

test('reclaims a lock held by a dead pid', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  const dead = deadPid();
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: dead, ts: Date.now() }));

  const res = acquireMainCheckoutLock(dir, { identity: process.pid });

  assert.equal(res.status, ACQUIRED);
  const record = JSON.parse(fs.readFileSync(lockPathFor(dir), 'utf8'));
  assert.equal(record.pid, process.pid);
});

// --- stale: ttlMs expiry while pid is alive ----------------------------------

test('reclaims a lock held by a live pid whose last-touched timestamp exceeds ttlMs', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  const staleTs = Date.now() - 10_000;
  // holder pid is THIS test process -- guaranteed alive -- but its
  // timestamp is old enough to exceed the ttlMs supplied below.
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: process.pid, ts: staleTs }));

  const res = acquireMainCheckoutLock(dir, { identity: process.pid + 1, ttlMs: 1000 });

  assert.equal(res.status, ACQUIRED);
});

test('does NOT reclaim a lock held by a live pid whose timestamp is within ttlMs', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  const freshTs = Date.now() - 500;
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: process.pid, ts: freshTs }));

  const res = acquireMainCheckoutLock(dir, { identity: process.pid + 1, ttlMs: 60_000 });

  assert.equal(res.status, HELD);
  assert.equal(res.holderPid, process.pid);
});

test('falls back to pure PID-liveness when ttlMs is omitted (old timestamp, live pid, still held)', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  const veryOldTs = Date.now() - 10_000_000;
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: process.pid, ts: veryOldTs }));

  const res = acquireMainCheckoutLock(dir, { identity: process.pid + 1 });

  assert.equal(res.status, HELD);
  assert.equal(res.holderPid, process.pid);
});

// --- ambiguous: corrupt/unparseable content ----------------------------------

test('reports AMBIGUOUS for an unparseable (non-JSON) lock file, never free or held', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(lockPathFor(dir), 'not json at all {{{');

  const res = acquireMainCheckoutLock(dir, { identity: process.pid });

  assert.equal(res.status, AMBIGUOUS);
  assert.equal(res.holderPid, undefined);
  // the ambiguous file is left untouched -- never deleted, never treated as free
  assert.equal(fs.readFileSync(lockPathFor(dir), 'utf8'), 'not json at all {{{');
});

test('reports AMBIGUOUS for a lock file whose pid field is not a usable number', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: 'not-a-pid', ts: Date.now() }));

  const res = acquireMainCheckoutLock(dir, { identity: process.pid });

  assert.equal(res.status, AMBIGUOUS);
});

test('reports AMBIGUOUS for a lock file with a valid pid but no usable timestamp', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: process.pid, ts: 'not-a-timestamp' }));

  const res = acquireMainCheckoutLock(dir, { identity: process.pid + 1 });

  assert.equal(res.status, AMBIGUOUS);
});

// --- release ------------------------------------------------------------------

test('release removes the lock so a subsequent acquire by another pid succeeds cleanly', () => {
  const { dir } = setup();
  const first = acquireMainCheckoutLock(dir, { identity: process.pid });
  assert.equal(first.status, ACQUIRED);

  first.release();
  assert.equal(fs.existsSync(lockPathFor(dir)), false);

  const second = acquireMainCheckoutLock(dir, { identity: process.pid + 1 });
  assert.equal(second.status, ACQUIRED);
  const record = JSON.parse(fs.readFileSync(lockPathFor(dir), 'utf8'));
  assert.equal(record.pid, process.pid + 1);
});

test('releaseMainCheckoutLock is idempotent when no lock file exists', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  assert.doesNotThrow(() => releaseMainCheckoutLock(dir));
});

// --- string identity (D6): opaque session ids, never liveness-checked -------

test('acquires the lock when free using a string identity', () => {
  const { dir } = setup();
  const res = acquireMainCheckoutLock(dir, { identity: 'session-abc-123' });

  assert.equal(res.status, ACQUIRED);
  const record = JSON.parse(fs.readFileSync(lockPathFor(dir), 'utf8'));
  assert.equal(record.pid, 'session-abc-123');
});

test('a different string identity is held within ttlMs of its last refresh', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  const freshTs = Date.now() - 500;
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: 'session-holder', ts: freshTs }));

  const res = acquireMainCheckoutLock(dir, { identity: 'session-other', ttlMs: 60_000 });

  assert.equal(res.status, HELD);
  assert.equal(res.holderPid, 'session-holder');
});

test('a different string identity is reclaimed once ttlMs has elapsed since its last refresh', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  const staleTs = Date.now() - 10_000;
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: 'session-holder', ts: staleTs }));

  const res = acquireMainCheckoutLock(dir, { identity: 'session-other', ttlMs: 1000 });

  assert.equal(res.status, ACQUIRED);
  const record = JSON.parse(fs.readFileSync(lockPathFor(dir), 'utf8'));
  assert.equal(record.pid, 'session-other');
});

test('checking a different string identity lock with no ttlMs supplied is AMBIGUOUS, never silently free or held', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: 'session-holder', ts: Date.now() }));

  const res = acquireMainCheckoutLock(dir, { identity: 'session-other' });

  assert.equal(res.status, AMBIGUOUS);
  // untouched -- neither reclaimed nor treated as held
  const record = JSON.parse(fs.readFileSync(lockPathFor(dir), 'utf8'));
  assert.equal(record.pid, 'session-holder');
});

// --- self-recognition (D6): same identity always refreshes ------------------

test('self-recognition: the same numeric identity refreshes its own lock regardless of ttlMs or liveness', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  const veryOldTs = Date.now() - 10_000_000;
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: process.pid, ts: veryOldTs }));

  const res = acquireMainCheckoutLock(dir, { identity: process.pid, ttlMs: 1 });

  assert.equal(res.status, ACQUIRED);
  const record = JSON.parse(fs.readFileSync(lockPathFor(dir), 'utf8'));
  assert.equal(record.pid, process.pid);
  assert.ok(record.ts > veryOldTs);
});

test('self-recognition: the same string identity refreshes its own lock regardless of ttlMs', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  const staleTs = Date.now() - 10_000;
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: 'session-abc-123', ts: staleTs }));

  const res = acquireMainCheckoutLock(dir, { identity: 'session-abc-123', ttlMs: 1 });

  assert.equal(res.status, ACQUIRED);
  const record = JSON.parse(fs.readFileSync(lockPathFor(dir), 'utf8'));
  assert.equal(record.pid, 'session-abc-123');
  assert.ok(record.ts > staleTs);
});

test('self-recognition: the same string identity refreshes its own lock with no ttlMs supplied at all', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  const staleTs = Date.now() - 10_000;
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: 'session-abc-123', ts: staleTs }));

  const res = acquireMainCheckoutLock(dir, { identity: 'session-abc-123' });

  assert.equal(res.status, ACQUIRED);
});
