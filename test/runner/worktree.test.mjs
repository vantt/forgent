import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createWorktree, removeWorktree, listLeftovers, branchNameFor, WorktreeError } from '../../src/runner/worktree.mjs';

// Every test here creates its own disposable git repo (git init in a
// mkdtemp dir) — no test ever creates a worktree or branch in THIS repo
// (forgent itself). `opts.worktreeDir` always points at a mkdtemp
// directory too, so no worktree checkout lands under the main repo either.

function initTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-worktree-test-repo-'));
  execFileSync('git', ['init', '-q'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });
  return repoRoot;
}

function mkWorktreeDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-worktree-test-dir-'));
}

function commitOnWorktree(worktreePath, filename, contents) {
  fs.writeFileSync(path.join(worktreePath, filename), contents);
  execFileSync('git', ['add', filename], { cwd: worktreePath });
  execFileSync('git', ['commit', '-q', '-m', `worker: ${filename}`], { cwd: worktreePath });
}

test('branchNameFor is deterministic per id', () => {
  assert.equal(branchNameFor('phase-2-routing-7'), 'fgw/phase-2-routing-7');
});

test('createWorktree makes a fresh branch fgw/<id> from HEAD when none exists', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-a', { worktreeDir });

  assert.equal(wt.branch, 'fgw/item-a');
  assert.equal(wt.reused, false);
  assert.ok(fs.existsSync(path.join(wt.path, 'seed.txt')));
});

test('a worker commit on the worktree branch survives after removeWorktree, and removeWorktree runs safely from repoRoot', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-b', { worktreeDir });

  commitOnWorktree(wt.path, 'worker-output.txt', 'produced by worker\n');

  // removeWorktree must be callable while the process cwd is repoRoot (never
  // inside the worktree being removed) and must not throw.
  removeWorktree(repoRoot, wt.path);

  assert.equal(fs.existsSync(wt.path), false);
  const log = execFileSync('git', ['log', '--oneline', 'fgw/item-b'], { cwd: repoRoot, encoding: 'utf8' });
  assert.match(log, /worker: worker-output\.txt/);
});

test('createWorktree retried for the same id reuses the existing branch into a fresh directory (no self-collision)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();

  const first = createWorktree(repoRoot, 'item-c', { worktreeDir });
  commitOnWorktree(first.path, 'attempt-1.txt', 'first attempt\n');
  removeWorktree(repoRoot, first.path);

  const second = createWorktree(repoRoot, 'item-c', { worktreeDir });

  assert.equal(second.branch, 'fgw/item-c');
  assert.equal(second.reused, true);
  assert.notEqual(second.path, first.path);
  // the retry sees the first attempt's commit, since it reused the branch
  assert.ok(fs.existsSync(path.join(second.path, 'attempt-1.txt')));

  removeWorktree(repoRoot, second.path);
});

test('createWorktree throws worktree-fail when the branch is already checked out elsewhere and cannot be reused', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const first = createWorktree(repoRoot, 'item-d', { worktreeDir });

  assert.throws(
    () => createWorktree(repoRoot, 'item-d', { worktreeDir }),
    (err) => {
      assert.ok(err instanceof WorktreeError);
      assert.equal(err.errorClass, 'worktree-fail');
      return true;
    },
  );

  removeWorktree(repoRoot, first.path);
});

test('listLeftovers reports aheadCount 0 for a branch with no commits beyond base (orphan)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-orphan', { worktreeDir });
  removeWorktree(repoRoot, wt.path);

  const leftovers = listLeftovers(repoRoot);
  const entry = leftovers.find((l) => l.branch === 'fgw/item-orphan');
  assert.ok(entry, 'expected fgw/item-orphan in listLeftovers output');
  assert.equal(entry.aheadCount, 0);
});

test('listLeftovers reports a positive aheadCount for a branch carrying a real proposal', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-proposal', { worktreeDir });
  commitOnWorktree(wt.path, 'proposal.txt', 'a real change\n');
  removeWorktree(repoRoot, wt.path);

  const leftovers = listLeftovers(repoRoot);
  const entry = leftovers.find((l) => l.branch === 'fgw/item-proposal');
  assert.ok(entry, 'expected fgw/item-proposal in listLeftovers output');
  assert.equal(entry.aheadCount, 1);
});

test('listLeftovers returns an empty array when no fgw/ branches exist', () => {
  const repoRoot = initTempRepo();
  assert.deepEqual(listLeftovers(repoRoot), []);
});

test('removeWorktree throws worktree-fail for a path that is not an actual worktree', () => {
  const repoRoot = initTempRepo();
  assert.throws(
    () => removeWorktree(repoRoot, path.join(os.tmpdir(), 'never-existed-worktree-xyz')),
    (err) => {
      assert.ok(err instanceof WorktreeError);
      assert.equal(err.errorClass, 'worktree-fail');
      return true;
    },
  );
});
