import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { claimWork, ClaimError } from '../../src/runner/claim-port.mjs';
import { LOCK_FILE, DEFAULT_TTL_MS } from '../../src/runner/main-checkout-lock.mjs';
import { initStore, addWork, moveWork } from '../../src/state/store.mjs';

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
      // tsk-6c2: a caller-side retry wrapper needs remainingTtlMs to bound
      // its wait budget without parsing it back out of the message string.
      assert.equal(typeof err.remainingTtlMs, 'number');
      assert.equal(err.holderPid, 'some-writer-session-id');
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
      // tsk-6c2: a retry wrapper checking `err.code === 'lock-held'` must
      // never mistake this for a retryable state.
      assert.equal(err.remainingTtlMs, undefined);
      return true;
    },
  );
});

// tsk-2zv: a claim-lock §3b release (decompose.mjs's releaseClaimOnExecuting)
// is the SAME execution round split by a mechanical stage edge — commits
// made before the release (CONTEXT.md, plan.md, or code) must still count
// as real progress once the item is reclaimed for `executing`.
test('claimWork on a claim-lock §3b-marked release preserves the ORIGINAL branchHeadAtTake on reclaim, instead of recomputing to the tip that already includes the pre-release commit (tsk-2zv)', () => {
  const { repoRoot, dir } = setup();

  const firstClaim = claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot });
  assert.equal(firstClaim.source, 'branch');
  const originalBranchHeadAtTake = firstClaim.branchHeadAtTake;

  // Real work committed ON THE CLAIMED WORKTREE before the release fires —
  // mirrors tsk-424's own repro (CONTEXT.md/plan.md committed during
  // clarify/decompose). The branch is already checked out there by
  // createWorktree, so commit inside it rather than in repoRoot's own
  // checkout (which never touches this branch).
  const worktreePath = firstClaim.worktree.path;
  fs.writeFileSync(path.join(worktreePath, 'context.txt'), 'decisions locked\n');
  execFileSync('git', ['add', '-A'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-q', '-m', 'docs: lock decisions'], { cwd: worktreePath });

  moveWork(dir, { id: 'item-a', to: 'todo', expectedStatus: 'doing', releaseTrigger: 'claim-lock-3b' });

  const reclaim = claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot });

  assert.equal(
    reclaim.branchHeadAtTake,
    originalBranchHeadAtTake,
    'reclaim must preserve the ORIGINAL branchHeadAtTake so return still sees the pre-release commit as real progress',
  );
});

// tsk-2zv D2/D3: a reject (`awaiting-approval -> todo`) lands an item in the exact
// same status+branch-existence shape as a §3b release, but never carries
// the marker — it MUST still recompute fresh, the deliberate anti-cheat
// gate that forces new work before a retaken item can `return` again.
test('claimWork on an UNMARKED todo-with-branch reclaim (e.g. reject) still recomputes branchHeadAtTake fresh, never preserving a stale value (tsk-2zv D3)', () => {
  const { repoRoot, dir } = setup();

  const firstClaim = claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot });
  const originalBranchHeadAtTake = firstClaim.branchHeadAtTake;

  const worktreePath = firstClaim.worktree.path;
  fs.writeFileSync(path.join(worktreePath, 'attempt.txt'), 'rejected attempt\n');
  execFileSync('git', ['add', '-A'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-q', '-m', 'attempt later rejected'], { cwd: worktreePath });
  const tipAfterAttempt = execFileSync('git', ['rev-parse', 'fgw/item-a'], { cwd: repoRoot, encoding: 'utf8' }).trim();

  // No releaseTrigger here — an unmarked doing -> todo move, standing in
  // for reject's own awaiting-approval -> todo (same shape: status todo, branch
  // alive, no marker).
  moveWork(dir, { id: 'item-a', to: 'todo', expectedStatus: 'doing' });

  const reclaim = claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot });

  assert.notEqual(reclaim.branchHeadAtTake, originalBranchHeadAtTake, 'must NOT preserve the stale pre-attempt marker');
  assert.equal(reclaim.branchHeadAtTake, tipAfterAttempt, 'must recompute fresh to the live tip, demanding new work before a future return');
});
