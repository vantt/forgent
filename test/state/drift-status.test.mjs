import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { driftStatus } from '../../src/state/drift-status.mjs';

// Every test here creates its own disposable git repo (mirrors
// test/runner/merge.test.mjs's own initRepo) — never this repo's own
// checkout. driftStatus shells real git subprocesses, so this is the only
// honest way to prove its ahead/behind math (plan.md's risk-map proof
// point for this item).

function initRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-drift-test-repo-'));
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

function checkoutNewBranch(repoRoot, branch, from = 'main') {
  git(repoRoot, ['checkout', '-q', from]);
  git(repoRoot, ['checkout', '-q', '-b', branch]);
}

function commitFile(repoRoot, filename, content) {
  fs.writeFileSync(path.join(repoRoot, filename), content);
  git(repoRoot, ['add', filename]);
  git(repoRoot, ['commit', '-q', '-m', `add ${filename}`]);
}

function item(id, overrides = {}) {
  return { id, status: 'doing', ...overrides };
}

test('driftStatus returns empty object for a view with no roots (no item has a parent)', () => {
  const repoRoot = initRepo();
  const view = { work: { a: item('a'), b: item('b') } };
  assert.deepEqual(driftStatus(repoRoot, view), {});
});

test('driftStatus omits a root whose fgw/<id> branch does not exist locally', () => {
  const repoRoot = initRepo();
  const view = { work: { root: item('root'), leaf: item('leaf', { parent: 'root' }) } };
  assert.deepEqual(driftStatus(repoRoot, view), {});
});

test('driftStatus: a root branch level with main reports zero drift, needsSync false', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/root');
  git(repoRoot, ['checkout', '-q', 'main']);
  const view = { work: { root: item('root'), leaf: item('leaf', { parent: 'root' }) } };

  const result = driftStatus(repoRoot, view);
  assert.equal(result.root.branch, 'fgw/root');
  assert.equal(result.root.target, 'main');
  assert.equal(result.root.aheadOfTarget, 0);
  assert.equal(result.root.behindTarget, 0);
  assert.equal(result.root.needsSync, false);
  assert.equal(result.root.lastSyncedTip, git(repoRoot, ['rev-parse', 'main']).trim());
});

test('driftStatus: a root branch ahead of main is flagged needsSync (reproduces the tsk-3bn incident shape)', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/root');
  commitFile(repoRoot, 'child-work.txt', 'from a leaf merged into fgw/root\n');
  commitFile(repoRoot, 'more-child-work.txt', 'a second leaf merged in later\n');
  git(repoRoot, ['checkout', '-q', 'main']);
  const view = { work: { root: item('root'), leaf: item('leaf', { parent: 'root' }) } };

  const result = driftStatus(repoRoot, view);
  assert.equal(result.root.aheadOfTarget, 2);
  assert.equal(result.root.behindTarget, 0);
  assert.equal(result.root.needsSync, true);
});

test('driftStatus: a resolved (delivered) root ahead of main is NOT flagged needsSync', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/root');
  commitFile(repoRoot, 'child-work.txt', 'content\n');
  git(repoRoot, ['checkout', '-q', 'main']);
  const view = { work: { root: item('root', { status: 'delivered' }), leaf: item('leaf', { parent: 'root' }) } };

  const result = driftStatus(repoRoot, view);
  assert.equal(result.root.aheadOfTarget, 1);
  assert.equal(result.root.needsSync, false);
});

test('driftStatus: main ahead of an untouched root branch reports behindTarget, not aheadOfTarget', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/root');
  git(repoRoot, ['checkout', '-q', 'main']);
  commitFile(repoRoot, 'trunk-moved-on.txt', 'main advanced after the root branch was cut\n');
  const view = { work: { root: item('root'), leaf: item('leaf', { parent: 'root' }) } };

  const result = driftStatus(repoRoot, view);
  assert.equal(result.root.aheadOfTarget, 0);
  assert.equal(result.root.behindTarget, 1);
  assert.equal(result.root.needsSync, false);
});

test('driftStatus: a nested root targets fgw/<parentId>, not main', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/grandroot');
  checkoutNewBranch(repoRoot, 'fgw/root', 'fgw/grandroot');
  commitFile(repoRoot, 'nested-child-work.txt', 'content\n');
  git(repoRoot, ['checkout', '-q', 'main']);
  const view = {
    work: {
      grandroot: item('grandroot'),
      root: item('root', { parent: 'grandroot' }),
      leaf: item('leaf', { parent: 'root' }),
    },
  };

  const result = driftStatus(repoRoot, view);
  assert.equal(result.root.target, 'fgw/grandroot');
  assert.equal(result.root.aheadOfTarget, 1);
  assert.equal(result.root.needsSync, true);
  // grandroot has no children merged into it beyond root's own branch
  // point, and root's own branch is not itself a child of grandroot in
  // the work graph (only "leaf" is root's child) — grandroot IS a root
  // too (root.parent === grandroot), so it's reported, at zero drift.
  assert.equal(result.grandroot.target, 'main');
  assert.equal(result.grandroot.aheadOfTarget, 0);
});

test('driftStatus omits a nested root whose target parent branch does not exist', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/root');
  git(repoRoot, ['checkout', '-q', 'main']);
  const view = {
    work: {
      root: item('root', { parent: 'ghost-parent' }),
      leaf: item('leaf', { parent: 'root' }),
    },
  };
  assert.deepEqual(driftStatus(repoRoot, view), {});
});

// tsk-4qu: the invariant checkRootDrift's stranded-work report is built on.
// driftStatus deliberately suppresses `needsSync` for a resolved root (so
// `fgos merge next`, which auto-runs a real sync-root on the blockedOnSync
// bucket, never touches an item that is already closed out) — but it still
// MEASURES the honest ahead count for that root, because findRootIds includes
// any id that is some item's parent regardless of status. Surfacing the
// stranded case is therefore a filter change in the consumer, not new
// measurement here. If someone later "simplifies" driftStatus to skip
// resolved roots entirely, this test fails and that consumer silently loses
// its only data source.
test('driftStatus still measures aheadOfTarget for a RESOLVED root, while keeping needsSync false', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/root');
  commitFile(repoRoot, 'leaf-work.txt', 'work merged into the root branch after the root closed out\n');
  git(repoRoot, ['checkout', '-q', 'main']);

  for (const status of ['delivered', 'retrospective', 'cleanup', 'done']) {
    const view = {
      work: {
        root: item('root', { status }),
        leaf: item('leaf', { parent: 'root', status }),
      },
    };
    const result = driftStatus(repoRoot, view);
    assert.equal(result.root.aheadOfTarget, 1, `ahead count must stay real for a "${status}" root`);
    assert.equal(result.root.needsSync, false, `needsSync must stay false for a "${status}" root`);
  }
});
