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
        FGOS_SESSION_ID: undefined,
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
    const result = commitAsSession(worktreeRoot, { FGOS_SESSION_ID: 'session-in-worktree' });
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
