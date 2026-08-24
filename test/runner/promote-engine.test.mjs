import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { resolveIntegrationBranch, retargetMember } from '../../src/runner/promote-engine.mjs';
import { branchNameFor } from '../../src/runner/worktree.mjs';

// Every test here creates its own disposable git repo (mirrors
// merge.test.mjs's own initRepo) — never this repo's own checkout. Trunk is
// pinned to "main" via `git init -b main`, matching merge.mjs's own
// detectTrunk assumption.

function initRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-promote-engine-test-repo-'));
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

function makeBranchWithCommit(repoRoot, branch, filename, content) {
  git(repoRoot, ['checkout', '-b', branch]);
  fs.writeFileSync(path.join(repoRoot, filename), content);
  git(repoRoot, ['add', filename]);
  git(repoRoot, ['commit', '-q', '-m', `on ${branch}`]);
  git(repoRoot, ['checkout', 'main']);
}

function makeItem(id, overrides = {}) {
  return { id, verify: 'true', ...overrides };
}

// --- resolveIntegrationBranch ------------------------------------------

test('resolveIntegrationBranch creates a fresh ref from trunk when rootId has no branch yet (D1 new-item path)', () => {
  const repoRoot = initRepo();
  const result = resolveIntegrationBranch(repoRoot, 'new-root');
  assert.deepEqual(result, { branch: 'fgw/new-root', created: true });
  assert.equal(git(repoRoot, ['rev-parse', 'fgw/new-root']).trim(), git(repoRoot, ['rev-parse', 'main']).trim());
  assert.equal(git(repoRoot, ['worktree', 'list', '--porcelain']).includes('fgw/new-root'), false);
});

test('resolveIntegrationBranch reuses an existing branch untouched (D1 reuse-member path)', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/existing-member', 'member.txt', 'member work\n');
  const tipBefore = git(repoRoot, ['rev-parse', 'fgw/existing-member']).trim();

  const result = resolveIntegrationBranch(repoRoot, 'existing-member');
  assert.deepEqual(result, { branch: 'fgw/existing-member', created: false });
  assert.equal(git(repoRoot, ['rev-parse', 'fgw/existing-member']).trim(), tipBefore);
});

// --- retargetMember ------------------------------------------------------

test('retargetMember merges a clean member branch into the integration branch, reports outcome merged', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/member-a', 'member-a.txt', 'member a work\n');
  resolveIntegrationBranch(repoRoot, 'root-x');

  const result = await retargetMember(repoRoot, makeItem('member-a'), 'root-x');
  assert.deepEqual(result, { id: 'member-a', outcome: 'merged' });

  const rootFiles = git(repoRoot, ['ls-tree', '-r', '--name-only', 'fgw/root-x']);
  assert.match(rootFiles, /member-a\.txt/);
});

test('retargetMember bails without touching git when preflight reports unsafe (merge conflict)', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/member-a', 'seed.txt', 'member a version\n');
  makeBranchWithCommit(repoRoot, 'fgw/root-x', 'seed.txt', 'root x version\n');
  const rootTipBefore = git(repoRoot, ['rev-parse', 'fgw/root-x']).trim();

  const result = await retargetMember(repoRoot, makeItem('member-a'), 'root-x');
  assert.equal(result.id, 'member-a');
  assert.equal(result.outcome, 'bailed');
  assert.equal(result.reason, 'merge-conflict');
  assert.equal(git(repoRoot, ['rev-parse', 'fgw/root-x']).trim(), rootTipBefore, 'integration branch tip must be untouched on bail');
  assert.equal(git(repoRoot, ['status', '--porcelain']).trim(), '', 'repo working tree must stay clean on bail');
});

test('retargetMember bails when the member branch has an active dirty checkout elsewhere (D3.ii)', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/member-a', 'member-a.txt', 'member a work\n');
  resolveIntegrationBranch(repoRoot, 'root-x');

  const liveWorktree = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-promote-engine-test-live-'));
  git(repoRoot, ['worktree', 'add', liveWorktree, 'fgw/member-a']);
  fs.writeFileSync(path.join(liveWorktree, 'uncommitted.txt'), 'in progress\n');

  try {
    const result = await retargetMember(repoRoot, makeItem('member-a'), 'root-x');
    assert.equal(result.outcome, 'bailed');
    assert.equal(result.reason, 'active-checkout');
  } finally {
    git(repoRoot, ['worktree', 'remove', '--force', liveWorktree]);
  }
});

test('retargetMember reports outcome skipped when memberItem.id equals rootId, never attempts a self-merge', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/root-x', 'root.txt', 'root work\n');

  const result = await retargetMember(repoRoot, makeItem('root-x'), 'root-x');
  assert.deepEqual(result, { id: 'root-x', outcome: 'skipped', reason: 'is-root' });
});

test('retargetMember bails with reason missing-branch when the integration branch was never resolved (preflight catches it)', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/member-a', 'member-a.txt', 'member a work\n');

  const result = await retargetMember(repoRoot, makeItem('member-a'), 'never-resolved-root');
  assert.equal(result.outcome, 'bailed');
  assert.equal(result.reason, 'missing-branch');
  assert.match(result.detail, /fgw\/never-resolved-root/);
});

test('retargetMember refuses to run from a linked worktree, mirroring sync-root\'s own discipline', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/member-a', 'member-a.txt', 'member a work\n');
  resolveIntegrationBranch(repoRoot, 'root-x');

  const linkedWorktree = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-promote-engine-test-linked-'));
  git(repoRoot, ['worktree', 'add', linkedWorktree, '-b', 'scratch-branch']);

  try {
    await assert.rejects(
      () => retargetMember(linkedWorktree, makeItem('member-a'), 'root-x'),
      /refusing to run from ".*" — this must run from the main checkout/,
    );
  } finally {
    git(repoRoot, ['worktree', 'remove', '--force', linkedWorktree]);
  }
});

test('retargetMember retries on lock-held and succeeds once the lock clears (withLockRetry wrap)', async () => {
  const repoRoot = initRepo();
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  makeBranchWithCommit(repoRoot, 'fgw/member-a', 'member-a.txt', 'member a work\n');
  resolveIntegrationBranch(repoRoot, 'root-x');

  const lockPath = path.join(fgosDir, 'main-checkout.lock');
  fs.writeFileSync(lockPath, JSON.stringify({ pid: 'other-session', ts: Date.now() }));

  setTimeout(() => {
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
    }
  }, 200);

  const result = await retargetMember(repoRoot, makeItem('member-a'), 'root-x');
  assert.deepEqual(result, { id: 'member-a', outcome: 'merged' });
});

