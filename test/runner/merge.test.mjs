import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  classifySource,
  reviewDiff,
  mergeRunnerItem,
  cleanupMergedBranch,
  isWorkingTreeClean,
} from '../../src/runner/merge.mjs';

// Every test here creates its own disposable git repo (mirrors
// worktree.test.mjs's own initTempRepo) — never this repo's own checkout.
// The trunk is pinned to "main" via `git init -b main`: merge.mjs's runner
// diff (main...fgw/<id>) and merge (`git merge ... fgw/<id>` while on main)
// both assume that literal trunk name, per plan.md's locked Approach.

function initRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-merge-test-repo-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd: repoRoot });
  return repoRoot;
}

function git(repoRoot, args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
}

function headOf(repoRoot) {
  return git(repoRoot, ['rev-parse', 'HEAD']).trim();
}

function makeBranchWithCommit(repoRoot, branch, filename, content) {
  git(repoRoot, ['checkout', '-b', branch]);
  fs.writeFileSync(path.join(repoRoot, filename), content);
  git(repoRoot, ['add', filename]);
  git(repoRoot, ['commit', '-q', '-m', `on ${branch}`]);
  git(repoRoot, ['checkout', 'main']);
}

function makeItem(overrides = {}) {
  return { id: 'demo-item', verify: 'true', ...overrides };
}

// --- classifySource ---------------------------------------------------

test('classifySource returns "runner" when a live fgw/<id> branch exists', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  assert.equal(classifySource(repoRoot, makeItem()), 'runner');
});

test('classifySource returns "pull" when no branch exists but headAtTake/headAtReturn are both present', () => {
  const repoRoot = initRepo();
  const head = headOf(repoRoot);
  assert.equal(classifySource(repoRoot, makeItem({ headAtTake: head, headAtReturn: head })), 'pull');
});

test('classifySource returns "legacy" when neither a branch nor headAtTake/headAtReturn exist', () => {
  const repoRoot = initRepo();
  assert.equal(classifySource(repoRoot, makeItem()), 'legacy');
});

test('classifySource prefers "runner" even when headAtTake/headAtReturn are also present (branch existence wins)', () => {
  const repoRoot = initRepo();
  const head = headOf(repoRoot);
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  assert.equal(classifySource(repoRoot, makeItem({ headAtTake: head, headAtReturn: head })), 'runner');
});

// --- reviewDiff ---------------------------------------------------------

test('reviewDiff for a runner item diffs main...fgw/<id> and carries no warnings', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  const result = reviewDiff(repoRoot, makeItem());
  assert.equal(result.source, 'runner');
  assert.match(result.diff, /produced\.txt/);
  assert.deepEqual(result.warnings, []);
});

test('reviewDiff for a pull item diffs headAtTake..headAtReturn with no warning for a single-commit range', () => {
  const repoRoot = initRepo();
  const headAtTake = headOf(repoRoot);
  fs.writeFileSync(path.join(repoRoot, 'proof.txt'), 'proof\n');
  git(repoRoot, ['add', 'proof.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'return commit']);
  const headAtReturn = headOf(repoRoot);

  const result = reviewDiff(repoRoot, makeItem({ headAtTake, headAtReturn }));
  assert.equal(result.source, 'pull');
  assert.match(result.diff, /proof\.txt/);
  assert.deepEqual(result.warnings, []);
});

test('reviewDiff for a pull item warns when the range contains more than one commit (possible interleaved session)', () => {
  const repoRoot = initRepo();
  const headAtTake = headOf(repoRoot);
  fs.writeFileSync(path.join(repoRoot, 'other.txt'), 'other\n');
  git(repoRoot, ['add', 'other.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'interleaved commit from another session']);
  fs.writeFileSync(path.join(repoRoot, 'proof.txt'), 'proof\n');
  git(repoRoot, ['add', 'proof.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'return commit']);
  const headAtReturn = headOf(repoRoot);

  const result = reviewDiff(repoRoot, makeItem({ headAtTake, headAtReturn }));
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /2 commits/);
});

test('reviewDiff for a legacy item (no branch, no head markers) returns a null diff and a non-throwing warning', () => {
  const repoRoot = initRepo();
  const result = reviewDiff(repoRoot, makeItem());
  assert.equal(result.source, 'legacy');
  assert.equal(result.diff, null);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /no live diff source/);
});

// --- mergeRunnerItem (spike-proven mechanics: --no-commit --no-ff, verify
// on the staged tree BEFORE commit, --abort on any red path) --------------

test('mergeRunnerItem merges cleanly, verify passes, and commits — outcome "merged"', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  const result = mergeRunnerItem(repoRoot, makeItem({ verify: 'test -f produced.txt' }));
  assert.equal(result.outcome, 'merged');
  assert.ok(fs.existsSync(path.join(repoRoot, 'produced.txt')));
  assert.equal(isWorkingTreeClean(repoRoot), true);
});

test('mergeRunnerItem aborts cleanly on a real conflict — main left byte-for-byte unchanged, outcome "conflict"', () => {
  const repoRoot = initRepo();
  fs.writeFileSync(path.join(repoRoot, 'shared.txt'), 'base\n');
  git(repoRoot, ['add', 'shared.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'seed shared.txt']);

  git(repoRoot, ['checkout', '-b', 'fgw/demo-item']);
  fs.writeFileSync(path.join(repoRoot, 'shared.txt'), 'branch-change\n');
  git(repoRoot, ['add', 'shared.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'branch changes shared.txt']);
  git(repoRoot, ['checkout', 'main']);
  fs.writeFileSync(path.join(repoRoot, 'shared.txt'), 'main-change\n');
  git(repoRoot, ['add', 'shared.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'main changes shared.txt']);

  const headBefore = headOf(repoRoot);
  const result = mergeRunnerItem(repoRoot, makeItem());
  assert.equal(result.outcome, 'conflict');
  assert.equal(headOf(repoRoot), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(isWorkingTreeClean(repoRoot), true, 'tree must be clean after merge --abort');
  assert.equal(fs.readFileSync(path.join(repoRoot, 'shared.txt'), 'utf8'), 'main-change\n');
});

test('mergeRunnerItem aborts cleanly when the staged merge fails its own verify — main left unchanged, outcome "verify-fail"', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  const headBefore = headOf(repoRoot);
  const result = mergeRunnerItem(repoRoot, makeItem({ verify: 'test -f required-file-never-produced.txt' }));
  assert.equal(result.outcome, 'verify-fail');
  assert.equal(headOf(repoRoot), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(isWorkingTreeClean(repoRoot), true, 'tree must be clean after merge --abort');
  assert.equal(fs.existsSync(path.join(repoRoot, 'produced.txt')), false, 'a staged-then-aborted merge must not leave its file behind');
});

// --- cleanupMergedBranch -------------------------------------------------

test('cleanupMergedBranch deletes the now-fully-merged branch and never throws', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  mergeRunnerItem(repoRoot, makeItem({ verify: 'test -f produced.txt' }));

  const result = cleanupMergedBranch(repoRoot, 'fgw/demo-item');
  assert.deepEqual(result.warnings, []);
  const branches = git(repoRoot, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.doesNotMatch(branches, /fgw\/demo-item/);
});

test('cleanupMergedBranch never throws even if the branch is already gone (idempotent, reports a warning instead)', () => {
  const repoRoot = initRepo();
  const result = cleanupMergedBranch(repoRoot, 'fgw/never-existed');
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /branch delete failed/);
});
