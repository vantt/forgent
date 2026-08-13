import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { acquireMainCheckoutLock, releaseMainCheckoutLock } from '../../src/runner/main-checkout-lock.mjs';

// tsk-sir -- reproduces the bug this item was filed against: a real linked
// worktree's `git commit` gets refused by the SAME main-checkout.lock a
// live session holds, even though the worktree writes to its own separate
// index/branch and never touches the main checkout at all.
//
// Deliberately does NOT reuse this directory's sibling
// main-checkout-lock-hook.test.mjs's own worktree fixture
// (initTempRepoWithFgwWorktree): that helper configures core.hooksPath
// separately per-root (relative to whichever cwd it's invoked with), so
// main and its worktree each end up with their OWN copy of the hook file
// and their OWN separate lock -- never actually sharing one, which is not
// how a real fgOS checkout is configured (`fgos setup` wires
// core.hooksPath exactly once, and `fgos pick`'s worktree creation never
// touches it again -- see src/runner/worktree.mjs). This fixture instead
// wires hooksPath ONCE, on the main root, as an ABSOLUTE path -- mirroring
// what this real repo's own checkout was actually observed to have
// (tsk-sir CONTEXT.md D7) -- so the worktree inherits the exact same
// shared config and both root and worktree commits resolve to the SAME
// physical hook file and the SAME main-checkout.lock, faithfully
// reproducing the real hazard.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REAL_HOOK = path.resolve(__dirname, '../../.githooks/pre-commit');
const REAL_LOCK_MODULE = path.resolve(__dirname, '../../src/runner/main-checkout-lock.mjs');
const REAL_IDENTITY_MODULE = path.resolve(__dirname, '../../src/runner/session-identity.mjs');

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/** Builds a main checkout + a linked worktree that share ONE hook file via
 * an absolute core.hooksPath (see file header for why this, not the
 * sibling test's per-root fixture). Returns { mainRoot, worktreeRoot }. */
function initSharedAbsoluteHooksPathFixture() {
  const mainRoot = mkTempDir('fgos-tsk-sir-repro-main-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: mainRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: mainRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: mainRoot });
  fs.writeFileSync(path.join(mainRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: mainRoot });
  execFileSync('git', ['commit', '-q', '-m', 'root commit'], { cwd: mainRoot });

  const hooksDir = path.join(mainRoot, '.githooks');
  const runnerDir = path.join(mainRoot, 'src', 'runner');
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.mkdirSync(runnerDir, { recursive: true });
  fs.copyFileSync(REAL_HOOK, path.join(hooksDir, 'pre-commit'));
  fs.copyFileSync(REAL_LOCK_MODULE, path.join(runnerDir, 'main-checkout-lock.mjs'));
  fs.copyFileSync(REAL_IDENTITY_MODULE, path.join(runnerDir, 'session-identity.mjs'));
  fs.chmodSync(path.join(hooksDir, 'pre-commit'), 0o755);
  // Absolute, not relative -- this is the load-bearing difference from
  // installGitHooks's own '.githooks' write (see file header).
  execFileSync('git', ['config', 'core.hooksPath', hooksDir], { cwd: mainRoot });

  const worktreeParent = mkTempDir('fgos-tsk-sir-repro-worktree-parent-');
  const worktreeRoot = path.join(worktreeParent, 'worktree');
  execFileSync('git', ['worktree', 'add', '-b', 'fgw/tsk-sir-repro', worktreeRoot], { cwd: mainRoot });

  return { mainRoot, worktreeRoot };
}

function commitAsSession(repoRoot, envOverlay) {
  const fileName = `change-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
  fs.writeFileSync(path.join(repoRoot, fileName), `change\n`);
  execFileSync('git', ['add', fileName], { cwd: repoRoot });
  return spawnSync(
    'git',
    ['commit', '-q', '-m', `change`],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        BEE_SESSION_ID: undefined,
        CLAUDE_CODE_SESSION_ID: undefined,
        ...envOverlay,
      },
    },
  );
}

// --- reproduces the bug (fails today, before any fix) ------------------
//
// A live session (identity 'other-live-session') holds the main-checkout
// lock -- exactly the real-world case this item was filed against (another
// session actively working). A commit in the LINKED WORKTREE, which never
// touches the main checkout's own index/branch, should succeed regardless.
// Today it does not: it is refused by the same lock, because the hook has
// no worktree-vs-main distinction on its lock-acquire guard (tsk-sir D2).

test('tsk-sir: a worktree commit is wrongly refused while another session holds the main-checkout lock', () => {
  const { mainRoot, worktreeRoot } = initSharedAbsoluteHooksPathFixture();
  const fgosDir = path.join(mainRoot, '.fgos');

  const lockResult = acquireMainCheckoutLock(fgosDir, { identity: 'other-live-session', ttlMs: 60_000 });
  assert.equal(lockResult.status, 'acquired', 'setup: the lock must actually be held for this repro to be meaningful');

  try {
    const result = commitAsSession(worktreeRoot, { BEE_SESSION_ID: 'session-in-worktree' });
    assert.equal(
      result.status,
      0,
      `a worktree commit must not be blocked by another session's main-checkout lock ` +
      `(tsk-sir) -- got refused: ${result.stderr}`,
    );
  } finally {
    releaseMainCheckoutLock(fgosDir);
  }
});

// --- tsk-1d7: stale-worktree-index guard -----------------------------
//
// Reproduces the real hazard tsk-2u5/tsk-1d7 were filed against (commit
// 2cb6519e): an external process force-moves the worktree's own `fgw/*`
// branch ref (mirroring `approve`'s leaf->root merge -- a detached
// ephemeral worktree, then `git branch -f`) without ever touching this
// worktree's own files/index. A subsequent commit from the stale worktree
// must now be REFUSED by the new guard, never silently allowed through.

function forceMoveBranchForward(mainRoot, branch) {
  const mergeDir = mkTempDir('fgos-tsk-1d7-force-move-');
  execFileSync('git', ['worktree', 'add', '--detach', mergeDir, branch], { cwd: mainRoot });
  const fileName = `external-${Date.now()}.txt`;
  fs.writeFileSync(path.join(mergeDir, fileName), 'external change\n');
  execFileSync('git', ['add', fileName], { cwd: mergeDir });
  execFileSync('git', ['commit', '-q', '-m', 'external change landed via force-move'], { cwd: mergeDir });
  const newTip = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: mergeDir, encoding: 'utf8' }).trim();
  execFileSync('git', ['branch', '-f', branch, newTip], { cwd: mainRoot });
  execFileSync('git', ['worktree', 'remove', '--force', mergeDir], { cwd: mainRoot });
  return newTip;
}

test('tsk-1d7: a commit from a worktree whose branch was force-moved forward (ancestor, but behind) is refused, naming fgos resync-worktree', () => {
  const { mainRoot, worktreeRoot } = initSharedAbsoluteHooksPathFixture();

  // Establish a real lastSynced inside the worktree (its own HEAD reflog
  // gains an entry) before the external force-move happens.
  const first = commitAsSession(worktreeRoot, {});
  assert.equal(first.status, 0, `setup: first worktree commit must succeed -- got: ${first.stderr}`);

  forceMoveBranchForward(mainRoot, 'fgw/tsk-sir-repro');

  const result = commitAsSession(worktreeRoot, {});
  assert.notEqual(result.status, 0, 'a commit against a stale index must be refused, never silently allowed through');
  assert.match(result.stderr, /commit refused/);
  assert.match(result.stderr, /fgos resync-worktree/, 'the refusal must name the real repair command');
});

test('tsk-1d7: a worktree whose branch tip has NOT moved since last sync still commits normally (no-op, no false positive)', () => {
  const { mainRoot, worktreeRoot } = initSharedAbsoluteHooksPathFixture();

  const first = commitAsSession(worktreeRoot, {});
  assert.equal(first.status, 0, `setup: first worktree commit must succeed -- got: ${first.stderr}`);

  // No external force-move here -- a second, ordinary commit from the same
  // worktree, still in sync with its own branch, must be unaffected.
  const second = commitAsSession(worktreeRoot, {});
  assert.equal(second.status, 0, `an in-sync worktree's ordinary next commit must not be refused -- got: ${second.stderr}`);
});

test('tsk-1d7: a commit from a worktree whose branch was rewritten backward (not an ancestor) is refused as diverged', () => {
  const { mainRoot, worktreeRoot } = initSharedAbsoluteHooksPathFixture();

  const first = commitAsSession(worktreeRoot, {});
  assert.equal(first.status, 0, `setup: first worktree commit must succeed -- got: ${first.stderr}`);

  // Rewrite the branch back to BEFORE the worktree's own lastSynced commit
  // -- lastSynced is now a descendant, not an ancestor, of the new tip.
  const rootCommit = execFileSync('git', ['rev-list', '--max-parents=0', 'HEAD'], { cwd: mainRoot, encoding: 'utf8' }).trim();
  execFileSync('git', ['branch', '-f', 'fgw/tsk-sir-repro', rootCommit], { cwd: mainRoot });

  const result = commitAsSession(worktreeRoot, {});
  assert.notEqual(result.status, 0, 'a commit against a diverged (rewritten) branch must be refused');
  assert.match(result.stderr, /commit refused/);
  assert.match(result.stderr, /not an ancestor/);
});
