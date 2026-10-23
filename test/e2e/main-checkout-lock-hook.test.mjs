import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { git, mkTempDir, initRepo, installHook, initRepoWithHook, commitAsSession, commitCount, HOOK_TEST_SKIP } from '../helpers/main-checkout-hook-repo.mjs';

// The real pre-commit hook, run by real `git commit` in disposable repos:
// the guards around the main-checkout mutex that do not need a holder
// (a solo commit, where the activity beacon is written, which checkouts the
// fgw/* branch rule applies to). Kernel-lock behavior is in
// main-checkout-borrow-hook.test.mjs.

const skip = HOOK_TEST_SKIP;

function repoWithDetachedWorktree() {
  const mainRoot = initRepo('fgos-hook-detached-main-');
  const worktreeRoot = path.join(mkTempDir('fgos-hook-detached-parent-'), 'worktree');
  git(mainRoot, ['worktree', 'add', '--detach', worktreeRoot]);
  installHook(worktreeRoot);
  return worktreeRoot;
}

function repoWithFgwWorktree(branch) {
  const mainRoot = initRepo('fgos-hook-fgw-main-');
  const worktreeRoot = path.join(mkTempDir('fgos-hook-fgw-parent-'), 'worktree');
  git(mainRoot, ['worktree', 'add', '-b', branch, worktreeRoot]);
  installHook(worktreeRoot);
  return worktreeRoot;
}

test('a commit inside a detached worktree writes the beacon at the worktree\'s own .fgos and takes no lock file there', { skip }, () => {
  const worktreeRoot = repoWithDetachedWorktree();

  const result = commitAsSession(worktreeRoot, { FGOS_SESSION_ID: 'session-worktree' });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(worktreeRoot, '.fgos', 'runtime', 'main-checkout-activity.json')), true);
  assert.equal(fs.existsSync(path.join(worktreeRoot, '.githooks', '.fgos')), false);
});

test('a git commit on the main checkout is refused when it is on a fgw/* branch', { skip }, () => {
  const repoRoot = initRepoWithHook();
  git(repoRoot, ['checkout', '-q', '-b', 'fgw/tsk-example']);
  const before = commitCount(repoRoot);

  const result = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-mistake' });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /commit refused/);
  assert.match(result.stderr, /fgw\/tsk-example/);
  assert.equal(commitCount(repoRoot), before);
});

test('a git commit inside a linked worktree on a fgw/* branch still succeeds', { skip }, () => {
  const worktreeRoot = repoWithFgwWorktree('fgw/tsk-example');

  const result = commitAsSession(worktreeRoot, { FGOS_SESSION_ID: 'session-worktree-fgw' });

  assert.equal(result.status, 0, result.stderr);
});
