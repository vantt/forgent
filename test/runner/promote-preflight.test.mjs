import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { preflightRetarget } from '../../src/runner/promote-preflight.mjs';

// Every test here creates its own disposable git repo (git init in a
// mkdtemp dir) — no test ever creates a worktree or branch in THIS repo
// (forgent itself), same discipline as worktree.test.mjs.

function initTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-preflight-test-repo-'));
  execFileSync('git', ['init', '-q'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  fs.writeFileSync(path.join(repoRoot, 'other.txt'), 'other\n');
  execFileSync('git', ['add', 'seed.txt', 'other.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });
  return repoRoot;
}

function branchFrom(repoRoot, branch, from = 'HEAD') {
  execFileSync('git', ['branch', branch, from], { cwd: repoRoot });
}

function commitOnBranch(repoRoot, branch, filename, contents) {
  const tmpWorktree = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-preflight-test-wt-'));
  execFileSync('git', ['worktree', 'add', tmpWorktree, branch], { cwd: repoRoot });
  fs.writeFileSync(path.join(tmpWorktree, filename), contents);
  execFileSync('git', ['add', filename], { cwd: tmpWorktree });
  execFileSync('git', ['commit', '-q', '-m', `edit ${filename}`], { cwd: tmpWorktree });
  execFileSync('git', ['worktree', 'remove', '--force', tmpWorktree], { cwd: repoRoot });
}

test('preflightRetarget: safe when both branches exist, neither active, no conflict', () => {
  const repoRoot = initTempRepo();
  branchFrom(repoRoot, 'fgw/member-a');
  branchFrom(repoRoot, 'fgw/root-x');
  commitOnBranch(repoRoot, 'fgw/member-a', 'member-a.txt', 'member a work\n');

  const result = preflightRetarget(repoRoot, 'member-a', 'root-x');
  assert.deepEqual(result, { safe: true });
});

test('preflightRetarget: unsafe with reason missing-branch when member branch does not exist', () => {
  const repoRoot = initTempRepo();
  branchFrom(repoRoot, 'fgw/root-x');

  const result = preflightRetarget(repoRoot, 'ghost-member', 'root-x');
  assert.equal(result.safe, false);
  assert.equal(result.reason, 'missing-branch');
  assert.match(result.detail, /fgw\/ghost-member/);
});

test('preflightRetarget: unsafe with reason missing-branch when target branch does not exist', () => {
  const repoRoot = initTempRepo();
  branchFrom(repoRoot, 'fgw/member-a');

  const result = preflightRetarget(repoRoot, 'member-a', 'ghost-root');
  assert.equal(result.safe, false);
  assert.equal(result.reason, 'missing-branch');
  assert.match(result.detail, /fgw\/ghost-root/);
});

test('preflightRetarget: unsafe with reason active-checkout when member branch has a dirty live checkout', () => {
  const repoRoot = initTempRepo();
  branchFrom(repoRoot, 'fgw/member-a');
  branchFrom(repoRoot, 'fgw/root-x');

  const liveWorktree = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-preflight-test-live-'));
  execFileSync('git', ['worktree', 'add', liveWorktree, 'fgw/member-a'], { cwd: repoRoot });
  fs.writeFileSync(path.join(liveWorktree, 'uncommitted.txt'), 'in progress\n');

  try {
    const result = preflightRetarget(repoRoot, 'member-a', 'root-x');
    assert.equal(result.safe, false);
    assert.equal(result.reason, 'active-checkout');
    assert.match(result.detail, /uncommitted changes/);
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', liveWorktree], { cwd: repoRoot });
  }
});

test('preflightRetarget: safe when member branch has a live but clean checkout (not "active" per D3)', () => {
  const repoRoot = initTempRepo();
  branchFrom(repoRoot, 'fgw/member-a');
  branchFrom(repoRoot, 'fgw/root-x');

  const cleanWorktree = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-preflight-test-clean-'));
  execFileSync('git', ['worktree', 'add', cleanWorktree, 'fgw/member-a'], { cwd: repoRoot });

  try {
    const result = preflightRetarget(repoRoot, 'member-a', 'root-x');
    assert.deepEqual(result, { safe: true });
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', cleanWorktree], { cwd: repoRoot });
  }
});

test('preflightRetarget: unsafe with reason merge-conflict when both branches edit the same lines', () => {
  const repoRoot = initTempRepo();
  branchFrom(repoRoot, 'fgw/member-a');
  branchFrom(repoRoot, 'fgw/root-x');
  commitOnBranch(repoRoot, 'fgw/member-a', 'seed.txt', 'member-a version\n');
  commitOnBranch(repoRoot, 'fgw/root-x', 'seed.txt', 'root-x version\n');

  const result = preflightRetarget(repoRoot, 'member-a', 'root-x');
  assert.equal(result.safe, false);
  assert.equal(result.reason, 'merge-conflict');
  assert.match(result.detail, /<<<<<<</);
});

test('preflightRetarget: never mutates repo state (no new commits, branches, or worktrees left behind)', () => {
  const repoRoot = initTempRepo();
  branchFrom(repoRoot, 'fgw/member-a');
  branchFrom(repoRoot, 'fgw/root-x');
  commitOnBranch(repoRoot, 'fgw/member-a', 'seed.txt', 'member-a version\n');
  commitOnBranch(repoRoot, 'fgw/root-x', 'seed.txt', 'root-x version\n');

  const beforeBranches = execFileSync('git', ['branch', '--list'], { cwd: repoRoot, encoding: 'utf8' });
  const beforeWorktrees = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  const beforeStatus = execFileSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });

  preflightRetarget(repoRoot, 'member-a', 'root-x');

  assert.equal(execFileSync('git', ['branch', '--list'], { cwd: repoRoot, encoding: 'utf8' }), beforeBranches);
  assert.equal(execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' }), beforeWorktrees);
  assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' }), beforeStatus);
});
