import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync, spawnSync, spawn } from 'node:child_process';
import {
  acquireMainCheckoutLock,
  releaseMainCheckoutLock,
  releaseMainCheckoutLockIfOwn,
  forceReclaimAmbiguousLock,
  inspectMainCheckoutLock,
  formatLockDurationMs,
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

/** Runs `acquireMainCheckoutLock(dir, opts)` in a genuinely separate child
 * process (`spawn`, not `spawnSync` — the two callers of this helper in a
 * test must overlap in real wall-clock time, not run one after the other).
 * Resolves with the acquire result object. */
function spawnAcquire(moduleUrl, dir, opts) {
  return new Promise((resolve, reject) => {
    const script = [
      `import('${moduleUrl}').then(({ acquireMainCheckoutLock }) => {`,
      `  const res = acquireMainCheckoutLock(${JSON.stringify(dir)}, ${JSON.stringify(opts)});`,
      `  process.stdout.write(JSON.stringify(res));`,
      `  process.exit(0);`,
      `});`,
    ].join('\n');
    const child = spawn(process.execPath, ['-e', script]);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => {
      if (code !== 0) { reject(new Error(`child exited ${code}: ${stderr}`)); return; }
      resolve(JSON.parse(stdout));
    });
    child.on('error', reject);
  });
}

// --- formatLockDurationMs (tsk-5z2) -----------------------------------------

test('formatLockDurationMs renders seconds-only under a minute', () => {
  assert.equal(formatLockDurationMs(45_000), '45s');
  assert.equal(formatLockDurationMs(0), '0s');
});

test('formatLockDurationMs renders minutes and seconds at or above a minute', () => {
  assert.equal(formatLockDurationMs(135_000), '2m15s');
  assert.equal(formatLockDurationMs(60_000), '1m0s');
});

test('formatLockDurationMs never fabricates a duration for non-numeric or negative input', () => {
  assert.equal(formatLockDurationMs(null), 'unknown');
  assert.equal(formatLockDurationMs(undefined), 'unknown');
  assert.equal(formatLockDurationMs(-1), 'unknown');
  assert.equal(formatLockDurationMs(NaN), 'unknown');
});

// --- inspectMainCheckoutLock: read-only status (tsk-5z2, D1) ---------------

test('inspectMainCheckoutLock reports "free" for a missing lock file, and never creates one', () => {
  const { dir } = setup();
  const res = inspectMainCheckoutLock(dir);
  assert.equal(res.outcome, 'free');
  assert.equal(fs.existsSync(lockPathFor(dir)), false);
});

test('inspectMainCheckoutLock reports "live" for a live holder within ttlMs, without mutating the file', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  const freshTs = Date.now() - 500;
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: process.pid, ts: freshTs }));

  const res = inspectMainCheckoutLock(dir, { ttlMs: 60_000 });

  assert.equal(res.outcome, 'live');
  assert.equal(res.holderPid, process.pid);
  assert.ok(res.lockAgeMs >= 500);
  assert.ok(res.remainingTtlMs > 0 && res.remainingTtlMs <= 60_000);
  // read-only: the file is untouched
  const record = JSON.parse(fs.readFileSync(lockPathFor(dir), 'utf8'));
  assert.equal(record.ts, freshTs);
});

test('inspectMainCheckoutLock reports "stale" for a dead-pid holder, without reclaiming it', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  const dead = deadPid();
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: dead, ts: Date.now() }));

  const res = inspectMainCheckoutLock(dir, { ttlMs: 60_000 });

  assert.equal(res.outcome, 'stale');
  assert.equal(res.holderPid, dead);
  // read-only: the "stale" lock file is left in place, unlike acquire's reclaim
  assert.equal(fs.existsSync(lockPathFor(dir)), true);
});

test('inspectMainCheckoutLock reports "ambiguous" for unparseable content, with no age fabricated', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(lockPathFor(dir), 'not json at all {{{');

  const res = inspectMainCheckoutLock(dir);

  assert.equal(res.outcome, 'ambiguous');
  assert.equal(res.lockAgeMs, undefined);
});

test('inspectMainCheckoutLock reports "ambiguous" with a known age for a string identity with no ttlMs supplied', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: 'session-holder', ts: Date.now() }));

  const res = inspectMainCheckoutLock(dir);

  assert.equal(res.outcome, 'ambiguous');
  assert.ok(res.lockAgeMs >= 0 && res.lockAgeMs < 5000);
});

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
  // tsk-5z2: age/remaining-TTL now ride along on HELD so a caller doesn't
  // have to hand-compute them from the raw file.
  assert.ok(res.lockAgeMs >= 500 && res.lockAgeMs < 60_000, `lockAgeMs ${res.lockAgeMs} should be ~500ms`);
  assert.ok(res.remainingTtlMs > 0 && res.remainingTtlMs <= 60_000, `remainingTtlMs ${res.remainingTtlMs} should be close to but under 60000`);
});

test('falls back to pure PID-liveness when ttlMs is omitted (old timestamp, live pid, still held)', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  const veryOldTs = Date.now() - 10_000_000;
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: process.pid, ts: veryOldTs }));

  const res = acquireMainCheckoutLock(dir, { identity: process.pid + 1 });

  assert.equal(res.status, HELD);
  assert.equal(res.holderPid, process.pid);
  // tsk-5z2: age is still knowable without a ttlMs; remaining-TTL is not --
  // no staleness window was supplied, so it must be null, never fabricated.
  assert.ok(res.lockAgeMs >= 10_000_000, `lockAgeMs ${res.lockAgeMs} should reflect the ~10,000,000ms-old timestamp`);
  assert.equal(res.remainingTtlMs, null);
});

// --- ambiguous: corrupt/unparseable content ----------------------------------

test('reports AMBIGUOUS for an unparseable (non-JSON) lock file, never free or held', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(lockPathFor(dir), 'not json at all {{{');

  const res = acquireMainCheckoutLock(dir, { identity: process.pid });

  assert.equal(res.status, AMBIGUOUS);
  assert.equal(res.holderPid, undefined);
  // tsk-5z2: unparseable content means no record to read a timestamp from --
  // lockAgeMs must be absent, never a fabricated number.
  assert.equal(res.lockAgeMs, undefined);
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

// --- releaseMainCheckoutLockIfOwn (tsk-45z D2): identity-checked release ----

test('releaseMainCheckoutLockIfOwn releases a lock recorded under the caller\'s own identity', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: 'session-abc-123', ts: Date.now() }));

  const res = releaseMainCheckoutLockIfOwn(dir, 'session-abc-123');

  assert.equal(res.status, 'released');
  assert.equal(fs.existsSync(lockPathFor(dir)), false);
});

test('releaseMainCheckoutLockIfOwn leaves a DIFFERENT identity\'s live lock untouched (never a blind unlink)', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: 'session-other-live', ts: Date.now() }));

  const res = releaseMainCheckoutLockIfOwn(dir, 'session-abc-123');

  assert.equal(res.status, 'not-owner');
  assert.equal(res.holderPid, 'session-other-live');
  assert.equal(fs.existsSync(lockPathFor(dir)), true);
  const record = JSON.parse(fs.readFileSync(lockPathFor(dir), 'utf8'));
  assert.equal(record.pid, 'session-other-live');
});

test('releaseMainCheckoutLockIfOwn is a no-op when no lock file exists', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });

  const res = releaseMainCheckoutLockIfOwn(dir, 'session-abc-123');

  assert.equal(res.status, 'no-lock');
});

test('releaseMainCheckoutLockIfOwn leaves an unparseable (AMBIGUOUS) lock file untouched', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(lockPathFor(dir), 'not json at all {{{');

  const res = releaseMainCheckoutLockIfOwn(dir, 'session-abc-123');

  assert.equal(res.status, 'ambiguous');
  assert.equal(fs.readFileSync(lockPathFor(dir), 'utf8'), 'not json at all {{{');
});

test('releaseMainCheckoutLockIfOwn works for a numeric (pid) identity too, not just strings', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: process.pid, ts: Date.now() }));

  const res = releaseMainCheckoutLockIfOwn(dir, process.pid);

  assert.equal(res.status, 'released');
  assert.equal(fs.existsSync(lockPathFor(dir)), false);
});

// --- crash-safety: exit/SIGINT/SIGTERM release the lock automatically ------

test('acquire does NOT register exit/SIGINT/SIGTERM listeners by default (releaseOnExit omitted) — required for .githooks/pre-commit\'s intentional lingering-lock design', () => {
  // .githooks/pre-commit acquires/refreshes this lock on every commit and
  // NEVER releases it itself (TTL is the only intended clearing mechanism —
  // a session may commit several times in a row, and the lock must survive
  // each hook process's own normal exit(0) in between). If acquire attached
  // exit listeners by default, the hook's own process.exit(0) would fire
  // them and delete the lock it just successfully wrote, reopening the
  // exact STR65 race this lock exists to prevent — this is the regression
  // this test guards against.
  const { dir } = setup();
  const before = {
    exit: process.listenerCount('exit'),
    SIGINT: process.listenerCount('SIGINT'),
    SIGTERM: process.listenerCount('SIGTERM'),
  };

  const res = acquireMainCheckoutLock(dir, { identity: process.pid });
  assert.equal(res.status, ACQUIRED);
  assert.equal(process.listenerCount('exit'), before.exit);
  assert.equal(process.listenerCount('SIGINT'), before.SIGINT);
  assert.equal(process.listenerCount('SIGTERM'), before.SIGTERM);

  res.release();
});

test('acquire with releaseOnExit:true registers exit/SIGINT/SIGTERM listeners, and release() removes them again (no leak across cycles)', () => {
  const { dir } = setup();
  const before = {
    exit: process.listenerCount('exit'),
    SIGINT: process.listenerCount('SIGINT'),
    SIGTERM: process.listenerCount('SIGTERM'),
  };

  const first = acquireMainCheckoutLock(dir, { identity: process.pid, releaseOnExit: true });
  assert.equal(first.status, ACQUIRED);
  assert.equal(process.listenerCount('exit'), before.exit + 1);
  assert.equal(process.listenerCount('SIGINT'), before.SIGINT + 1);
  assert.equal(process.listenerCount('SIGTERM'), before.SIGTERM + 1);

  first.release();
  assert.equal(process.listenerCount('exit'), before.exit);
  assert.equal(process.listenerCount('SIGINT'), before.SIGINT);
  assert.equal(process.listenerCount('SIGTERM'), before.SIGTERM);

  // A second acquire/release cycle must not accumulate listeners either.
  const second = acquireMainCheckoutLock(dir, { identity: process.pid + 1, releaseOnExit: true });
  assert.equal(second.status, ACQUIRED);
  second.release();
  assert.equal(process.listenerCount('exit'), before.exit);
  assert.equal(process.listenerCount('SIGINT'), before.SIGINT);
  assert.equal(process.listenerCount('SIGTERM'), before.SIGTERM);
});

test('a held lock acquired with releaseOnExit:true is released automatically when the holding process is killed with SIGINT (crash-safety net)', () => {
  const { dir } = setup();
  const moduleUrl = pathToFileURL(path.resolve('src/runner/main-checkout-lock.mjs')).href;
  const script = [
    `import('${moduleUrl}').then(({ acquireMainCheckoutLock }) => {`,
    `  const res = acquireMainCheckoutLock(${JSON.stringify(dir)}, { identity: process.pid, releaseOnExit: true });`,
    `  if (res.status !== 'acquired') { process.exit(2); }`,
    `  process.kill(process.pid, 'SIGINT');`,
    `  setTimeout(() => process.exit(3), 2000);`, // never reached if the SIGINT handler's process.exit(1) fires as expected
    `});`,
  ].join('\n');

  const child = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8' });

  assert.equal(child.status, 1, `child should exit(1) from the SIGINT handler after releasing the lock; stderr: ${child.stderr}`);
  assert.equal(fs.existsSync(lockPathFor(dir)), false, 'the lock file must be gone once the SIGINT handler released it');
});

test('a held lock acquired WITHOUT releaseOnExit survives the holding process exiting normally (the .githooks/pre-commit contract)', () => {
  const { dir } = setup();
  const moduleUrl = pathToFileURL(path.resolve('src/runner/main-checkout-lock.mjs')).href;
  const script = [
    `import('${moduleUrl}').then(({ acquireMainCheckoutLock }) => {`,
    `  const res = acquireMainCheckoutLock(${JSON.stringify(dir)}, { identity: process.pid });`,
    `  process.exit(res.status === 'acquired' ? 0 : 2);`,
    `});`,
  ].join('\n');

  const child = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8' });

  assert.equal(child.status, 0, `child should exit(0) after a plain acquire; stderr: ${child.stderr}`);
  assert.equal(fs.existsSync(lockPathFor(dir)), true, 'the lock must survive the acquiring process exiting normally when releaseOnExit was not requested');
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
  // tsk-5z2: the record itself parsed fine (only held-ness is undecidable
  // without a ttlMs), so age is real and known even though this is AMBIGUOUS.
  assert.ok(res.lockAgeMs >= 0 && res.lockAgeMs < 5000, `lockAgeMs ${res.lockAgeMs} should be small (record.ts was just now)`);
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

// --- forceReclaimAmbiguousLock (tsk-3h4) -------------------------------------

test('forceReclaimAmbiguousLock: already-clear when no lock file exists', () => {
  const { dir } = setup();
  const res = forceReclaimAmbiguousLock(dir);
  assert.equal(res.status, 'already-clear');
});

test('forceReclaimAmbiguousLock: reclaims a lock file that is still unparseable on the second read', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(lockPathFor(dir), 'not json at all {{{');

  const res = forceReclaimAmbiguousLock(dir);

  assert.equal(res.status, 'reclaimed');
  assert.equal(fs.existsSync(lockPathFor(dir)), false);
});

test('forceReclaimAmbiguousLock: never unlinks a lock that now parses (a legitimate holder wrote a fresh valid record since the caller\'s own read)', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  // A live holder race-wins between the caller's own AMBIGUOUS read and this
  // call: by the time forceReclaimAmbiguousLock reads the file itself, it is
  // already a valid record again.
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: process.pid, ts: Date.now() }));

  const res = forceReclaimAmbiguousLock(dir);

  assert.equal(res.status, 'no-longer-ambiguous');
  assert.equal(fs.existsSync(lockPathFor(dir)), true);
});

test('forceReclaimAmbiguousLock: reclaims a lock file with a valid pid but an unusable timestamp (AMBIGUOUS per acquireMainCheckoutLock)', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: process.pid, ts: 'not-a-timestamp' }));
  assert.equal(acquireMainCheckoutLock(dir, { identity: process.pid + 1 }).status, AMBIGUOUS);

  const res = forceReclaimAmbiguousLock(dir);

  assert.equal(res.status, 'reclaimed');
  assert.equal(fs.existsSync(lockPathFor(dir)), false);
});

// --- atomic write (tsk-2tm): closes the torn-read window on create/refresh -
//
// tryAcquireOnce used to create a fresh lock in two separate syscalls
// (fs.openSync(path, 'wx') then a later fs.writeSync), and refreshed a
// self-recognized lock via truncate-in-place fs.writeFileSync — both leaving
// a real window where a concurrent reader could observe an empty/partial
// file and fail-close to AMBIGUOUS even though no writer was genuinely
// contending (production incident: /fgOS:pick tsk-3lx, 2026-08-03). The fix
// publishes fully-written content via link(2)/rename(2), which are atomic
// on POSIX — these tests prove the resulting properties, not just that the
// code "should work".

test('acquire (fresh create) and acquire (self-recognition refresh) never leave a dangling temp file behind', () => {
  const { dir } = setup();

  const created = acquireMainCheckoutLock(dir, { identity: process.pid });
  assert.equal(created.status, ACQUIRED);
  let entries = fs.readdirSync(dir);
  assert.deepEqual(entries.filter((name) => name.includes('.tmp-')), []);
  assert.ok(entries.includes(LOCK_FILE));

  // Same identity as above -> hits the self-recognition refresh branch,
  // not the fresh-create branch.
  const refreshed = acquireMainCheckoutLock(dir, { identity: process.pid });
  assert.equal(refreshed.status, ACQUIRED);
  entries = fs.readdirSync(dir);
  assert.deepEqual(entries.filter((name) => name.includes('.tmp-')), []);
  assert.ok(entries.includes(LOCK_FILE));
});

test('two processes racing to create a genuinely NEW lock always produce exactly one ACQUIRED and one HELD, never AMBIGUOUS from a torn read (tsk-2tm)', async () => {
  const moduleUrl = pathToFileURL(path.resolve('src/runner/main-checkout-lock.mjs')).href;

  // link(2)'s atomicity is an OS guarantee, not a timing coincidence, so
  // this must hold every round against a fresh lock dir, not just "usually".
  for (let round = 0; round < 10; round += 1) {
    const { dir } = setup();
    const [a, b] = await Promise.all([
      spawnAcquire(moduleUrl, dir, { identity: `racer-a-${round}`, ttlMs: 60_000 }),
      spawnAcquire(moduleUrl, dir, { identity: `racer-b-${round}`, ttlMs: 60_000 }),
    ]);

    const statuses = [a.status, b.status].sort();
    assert.deepEqual(
      statuses,
      [ACQUIRED, HELD].sort(),
      `round ${round}: expected exactly one ACQUIRED and one HELD, got ${JSON.stringify([a, b])}`,
    );
  }
});

test('self-recognition refresh is atomic: a reader between two refreshes always sees a fully-formed, parseable record, never a truncated one (tsk-2tm)', () => {
  const { dir } = setup();
  fs.mkdirSync(dir, { recursive: true });

  const first = acquireMainCheckoutLock(dir, { identity: 'refresher' });
  assert.equal(first.status, ACQUIRED);

  for (let i = 0; i < 200; i += 1) {
    const refreshed = acquireMainCheckoutLock(dir, { identity: 'refresher' });
    assert.equal(refreshed.status, ACQUIRED);
    // Every refresh publishes via write-temp-then-rename: the file at
    // lockPath is never observable in a truncated state, so a read
    // immediately after must always parse.
    const raw = fs.readFileSync(lockPathFor(dir), 'utf8');
    const record = JSON.parse(raw);
    assert.equal(record.pid, 'refresher');
    assert.equal(typeof record.ts, 'number');
  }
});
