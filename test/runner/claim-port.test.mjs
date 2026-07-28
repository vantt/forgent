import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { claimWork, ClaimError } from '../../src/runner/claim-port.mjs';
import { LOCK_FILE, DEFAULT_TTL_MS } from '../../src/runner/main-checkout-lock.mjs';
import { initStore, addWork } from '../../src/state/store.mjs';

// claim-port.mjs's claimWork shares main-checkout.lock with .githooks/
// pre-commit (tsk-3w8) — the hook writes a STRING-identity record per commit
// and never releases it (TTL-based auto-expiry is the design). Every test
// here builds its own disposable git repo + .fgos store; nothing touches
// THIS repo's own checkout.

function initTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-claim-port-test-'));
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
  addWork(dir, { id: 'item-a', title: 'Item A', kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'true' });
  return { repoRoot, dir };
}

/** Mirrors the exact shape .githooks/pre-commit writes: a STRING writer
 * identity (never a numeric pid), timestamped `ageMs` in the past. */
function writeHookStyleLock(dir, ageMs) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, LOCK_FILE), JSON.stringify({ pid: 'some-writer-session-id', ts: Date.now() - ageMs }));
}

test('claimWork reclaims a stale hook-written (string-identity) lock past DEFAULT_TTL_MS, instead of failing lock-ambiguous forever', () => {
  const { repoRoot, dir } = setup();
  writeHookStyleLock(dir, DEFAULT_TTL_MS + 1000);

  const claim = claimWork(dir, { id: 'item-a', actor: 'session', isolate: false, repoRoot });

  assert.equal(claim.id, 'item-a');
  assert.equal(claim.to, 'doing');
});

test('claimWork throws a categorized ClaimError (not an uncategorized crash) when a fresh hook-written lock is still within DEFAULT_TTL_MS', () => {
  const { repoRoot, dir } = setup();
  writeHookStyleLock(dir, 1000);

  assert.throws(
    () => claimWork(dir, { id: 'item-a', actor: 'session', isolate: false, repoRoot }),
    (err) => {
      assert.ok(err instanceof ClaimError);
      assert.equal(err.code, 'lock-held');
      assert.equal(err.category, 'lock-timeout', 'must be categorized so the runner halts gracefully instead of crashing the whole drain-run');
      return true;
    },
  );
});

test('claimWork throws a categorized ClaimError (unreadable/corrupt lock content, not a hook-shaped string-identity record) — genuinely ambiguous, fails closed', () => {
  const { repoRoot, dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, LOCK_FILE), 'not valid json');

  assert.throws(
    () => claimWork(dir, { id: 'item-a', actor: 'session', isolate: false, repoRoot }),
    (err) => {
      assert.ok(err instanceof ClaimError);
      assert.equal(err.code, 'lock-ambiguous');
      assert.equal(err.category, 'lock-timeout');
      return true;
    },
  );
});
