import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { driftStatus, unmergedDeliveries } from '../../src/state/drift-status.mjs';

// Every test here creates its own disposable git repo (mirrors
// test/runner/merge.test.mjs's own initRepo) — never this repo's own
// checkout. driftStatus shells real git subprocesses, so this is the only
// honest way to prove its ahead/behind math (plan.md's risk-map proof
// point for this item).

// Both exported functions take the trunk branch name as a REQUIRED option
// (tsk-49i D1) instead of detecting it themselves — initRepo below creates
// every fixture repo on this branch name.
const TRUNK = 'main';

function initRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-drift-test-repo-'));
  execFileSync('git', ['init', '-q', '-b', TRUNK], { cwd: repoRoot });
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
  assert.deepEqual(driftStatus(repoRoot, view, { trunk: TRUNK }), {});
});

test('driftStatus omits a root whose fgw/<id> branch does not exist locally', () => {
  const repoRoot = initRepo();
  const view = { work: { root: item('root'), leaf: item('leaf', { parent: 'root' }) } };
  assert.deepEqual(driftStatus(repoRoot, view, { trunk: TRUNK }), {});
});

test('driftStatus: a root branch level with main reports zero drift, needsSync false', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/root');
  git(repoRoot, ['checkout', '-q', 'main']);
  const view = { work: { root: item('root'), leaf: item('leaf', { parent: 'root' }) } };

  const result = driftStatus(repoRoot, view, { trunk: TRUNK });
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

  const result = driftStatus(repoRoot, view, { trunk: TRUNK });
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

  const result = driftStatus(repoRoot, view, { trunk: TRUNK });
  assert.equal(result.root.aheadOfTarget, 1);
  assert.equal(result.root.needsSync, false);
});

test('driftStatus: main ahead of an untouched root branch reports behindTarget, not aheadOfTarget', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/root');
  git(repoRoot, ['checkout', '-q', 'main']);
  commitFile(repoRoot, 'trunk-moved-on.txt', 'main advanced after the root branch was cut\n');
  const view = { work: { root: item('root'), leaf: item('leaf', { parent: 'root' }) } };

  const result = driftStatus(repoRoot, view, { trunk: TRUNK });
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

  const result = driftStatus(repoRoot, view, { trunk: TRUNK });
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
  assert.deepEqual(driftStatus(repoRoot, view, { trunk: TRUNK }), {});
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
    const result = driftStatus(repoRoot, view, { trunk: TRUNK });
    assert.equal(result.root.aheadOfTarget, 1, `ahead count must stay real for a "${status}" root`);
    assert.equal(result.root.needsSync, false, `needsSync must stay false for a "${status}" root`);
  }
});

test('driftStatus routes to trunk once the parent root has resolved -- reproduces the tsk-4n7 incident shape (tsk-2ec)', () => {
  const repoRoot = initRepo();
  // fgw/parent: the parent root's own branch, already merged and frozen
  // (status: done) -- but the BRANCH ITSELF still exists on disk, since
  // worktrees/branches are never torn down promptly after merge. main
  // then advances further (simulating other work landing after the
  // parent's own merge), so fgw/parent falls far BEHIND main -- exactly
  // the frozen-branch shape.
  checkoutNewBranch(repoRoot, 'fgw/parent');
  commitFile(repoRoot, 'parent-work.txt', 'work that was already merged into main\n');
  git(repoRoot, ['checkout', '-q', 'main']);
  git(repoRoot, ['merge', '-q', '--no-ff', 'fgw/parent']);
  commitFile(repoRoot, 'later-unrelated-work.txt', 'main kept moving after the parent merged\n');

  // fgw/child: a nested root whose parent is the already-resolved item
  // above, branched from fgw/parent's own tip (before main's later
  // commit) -- current with main's REAL state at merge time (9/4-style
  // "nearly current with main directly" per the report), but the OLD
  // (pre-fix) targetBranch computation would compare it against the now-
  // stale fgw/parent instead.
  checkoutNewBranch(repoRoot, 'fgw/child', 'fgw/parent');
  commitFile(repoRoot, 'child-work.txt', 'real leaf work merged into the child root\n');
  git(repoRoot, ['checkout', '-q', 'main']);

  const view = {
    work: {
      parent: item('parent', { status: 'done' }),
      child: item('child', { parent: 'parent' }),
      leaf: item('leaf', { parent: 'child' }),
    },
  };

  const result = driftStatus(repoRoot, view, { trunk: TRUNK });
  assert.equal(result.child.target, 'main', 'target must be trunk once the parent has resolved, never the parent\'s own frozen branch');
  // Real numbers against main: child is ahead by its own one commit, and
  // behind by main's own --no-ff merge commit plus its one later commit --
  // the honest diagnostic signature (behind > 0) that the frozen-branch
  // comparison could never produce.
  assert.equal(result.child.aheadOfTarget, 1);
  assert.equal(result.child.behindTarget, 2);
});

// --- unmergedDeliveries (tsk-1l9) ---------------------------------------
//
// The leaf-inclusive sibling of driftStatus above. Same disposable-repo
// harness: this function shells `git merge-base --is-ancestor`, so only a
// real repo proves it.

function mergeBranch(repoRoot, branch, into) {
  git(repoRoot, ['checkout', '-q', into]);
  git(repoRoot, ['merge', '-q', '--no-ff', '-m', `merge ${branch}`, branch]);
}

test('unmergedDeliveries ignores items that are not handed over yet', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/a');
  commitFile(repoRoot, 'a.txt', 'a');
  const view = {
    work: {
      a: item('a', { status: 'doing' }),
      b: item('b', { status: 'awaiting-approval' }),
    },
  };
  assert.deepEqual(unmergedDeliveries(repoRoot, view, { trunk: TRUNK }), {});
});

test('unmergedDeliveries ignores wontfix — an abandoned branch is meant to sit outside trunk', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/a');
  commitFile(repoRoot, 'a.txt', 'a');
  const view = { work: { a: item('a', { status: 'wontfix' }) } };
  assert.deepEqual(unmergedDeliveries(repoRoot, view, { trunk: TRUNK }), {});
});

test('unmergedDeliveries omits a delivered item with no local branch — a cleaned-up branch is not an alarm', () => {
  const repoRoot = initRepo();
  const view = { work: { a: item('a', { status: 'delivered' }) } };
  assert.deepEqual(unmergedDeliveries(repoRoot, view, { trunk: TRUNK }), {});
});

test('unmergedDeliveries omits a delivered item whose branch really did reach trunk', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/a');
  commitFile(repoRoot, 'a.txt', 'a');
  mergeBranch(repoRoot, 'fgw/a', 'main');
  const view = { work: { a: item('a', { status: 'delivered' }) } };
  assert.deepEqual(unmergedDeliveries(repoRoot, view, { trunk: TRUNK }), {});
});

test('unmergedDeliveries reports a delivered item whose branch merged nowhere — the tsk-64h/tsk-2t5 case', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/a');
  commitFile(repoRoot, 'a.txt', 'a');
  const view = { work: { a: item('a', { status: 'delivered' }) } };
  assert.deepEqual(unmergedDeliveries(repoRoot, view, { trunk: TRUNK }), {
    a: { branch: 'fgw/a', status: 'delivered', landedOn: null, unmatched: 1 },
  });
});

test('unmergedDeliveries reports every handed-over status, not just delivered', () => {
  const repoRoot = initRepo();
  for (const id of ['r', 'c', 'd']) {
    checkoutNewBranch(repoRoot, `fgw/${id}`);
    commitFile(repoRoot, `${id}.txt`, id);
  }
  const view = {
    work: {
      r: item('r', { status: 'retrospective' }),
      c: item('c', { status: 'cleanup' }),
      d: item('d', { status: 'done' }),
    },
  };
  assert.deepEqual(Object.keys(unmergedDeliveries(repoRoot, view, { trunk: TRUNK })).sort(), ['c', 'd', 'r']);
});

test('unmergedDeliveries names the parent branch when a leaf landed there and the root has not synced', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/root');
  commitFile(repoRoot, 'root.txt', 'root');
  checkoutNewBranch(repoRoot, 'fgw/leaf', 'fgw/root');
  commitFile(repoRoot, 'leaf.txt', 'leaf');
  mergeBranch(repoRoot, 'fgw/leaf', 'fgw/root');

  const view = {
    work: {
      root: item('root', { status: 'doing' }),
      leaf: item('leaf', { status: 'delivered', parent: 'root' }),
    },
  };
  // The leaf merged correctly; only the root is behind. Re-merging the leaf
  // would be the wrong fix, so the report has to say where it landed.
  assert.deepEqual(unmergedDeliveries(repoRoot, view, { trunk: TRUNK }), {
    leaf: { branch: 'fgw/leaf', status: 'delivered', landedOn: 'fgw/root', unmatched: 2 },
  });
});

test('unmergedDeliveries reports landedOn null for a leaf that never reached its own parent branch either', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/root');
  commitFile(repoRoot, 'root.txt', 'root');
  checkoutNewBranch(repoRoot, 'fgw/leaf', 'fgw/root');
  commitFile(repoRoot, 'leaf.txt', 'leaf');

  const view = {
    work: {
      root: item('root', { status: 'doing' }),
      leaf: item('leaf', { status: 'delivered', parent: 'root' }),
    },
  };
  assert.equal(unmergedDeliveries(repoRoot, view, { trunk: TRUNK }).leaf.landedOn, null);
});

test('unmergedDeliveries omits a branch whose commits all have a patch-equivalent on trunk', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/a');
  commitFile(repoRoot, 'a.txt', 'a');
  const branchTip = git(repoRoot, ['rev-parse', 'HEAD']).trim();

  // The same content reaches trunk by a different route — a cherry-pick, the
  // shape a re-applied or rewritten branch leaves behind. The ref is stale;
  // nothing is missing, so this must not be reported as lost work.
  git(repoRoot, ['checkout', '-q', 'main']);
  git(repoRoot, ['cherry-pick', branchTip]);

  const view = { work: { a: item('a', { status: 'delivered' }) } };
  assert.deepEqual(unmergedDeliveries(repoRoot, view, { trunk: TRUNK }), {});
});

test('unmergedDeliveries counts only the commits with no patch-equivalent on trunk', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/a');
  commitFile(repoRoot, 'shared.txt', 'shared');
  const shared = git(repoRoot, ['rev-parse', 'HEAD']).trim();
  commitFile(repoRoot, 'only-here.txt', 'only-here');

  git(repoRoot, ['checkout', '-q', 'main']);
  git(repoRoot, ['cherry-pick', shared]);

  const view = { work: { a: item('a', { status: 'delivered' }) } };
  // Two commits ahead, but one already landed — only the other is missing.
  assert.equal(unmergedDeliveries(repoRoot, view, { trunk: TRUNK }).a.unmatched, 1);
});

test('unmergedDeliveries omits a branch whose tree is identical to its fork point', () => {
  const repoRoot = initRepo();
  // A branch that only ever merged trunk back into itself: many commits
  // "ahead" by count, zero content of its own. Merge commits carry no
  // patch-id, so a patch-id count alone would call these unmatched forever.
  checkoutNewBranch(repoRoot, 'fgw/a');
  git(repoRoot, ['checkout', '-q', 'main']);
  commitFile(repoRoot, 'trunk.txt', 'trunk');
  git(repoRoot, ['checkout', '-q', 'fgw/a']);
  git(repoRoot, ['merge', '-q', '--no-ff', '-m', 'merge main into fgw/a', 'main']);

  const view = { work: { a: item('a', { status: 'delivered' }) } };
  assert.deepEqual(unmergedDeliveries(repoRoot, view, { trunk: TRUNK }), {});
});

test('unmergedDeliveries does not count merge commits as unmatched work', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/side');
  commitFile(repoRoot, 'side.txt', 'side');
  checkoutNewBranch(repoRoot, 'fgw/a');
  commitFile(repoRoot, 'own.txt', 'own');
  git(repoRoot, ['merge', '-q', '--no-ff', '-m', 'merge fgw/side into fgw/a', 'fgw/side']);

  const view = { work: { a: item('a', { status: 'delivered' }) } };
  // Three commits ahead (own + side + the merge); only the two real patches
  // count, never the merge commit itself.
  assert.equal(unmergedDeliveries(repoRoot, view, { trunk: TRUNK }).a.unmatched, 2);
});

test('driftStatus reports carriesContent false for a root that only merged its target back in', () => {
  const repoRoot = initRepo();
  // The fgw/tsk-4n7 / fgw/tsk-19y shape: commits ahead by count, nothing of
  // its own by content. `needsSync` still fires (unchanged, `fgos merge next`
  // reads it); only the reporting signal separates the two.
  checkoutNewBranch(repoRoot, 'fgw/root');
  git(repoRoot, ['checkout', '-q', 'main']);
  commitFile(repoRoot, 'trunk.txt', 'trunk');
  git(repoRoot, ['checkout', '-q', 'fgw/root']);
  git(repoRoot, ['merge', '-q', '--no-ff', '-m', 'merge main into fgw/root', 'main']);

  const view = { work: { root: item('root'), leaf: item('leaf', { parent: 'root' }) } };
  const result = driftStatus(repoRoot, view, { trunk: TRUNK });
  assert.equal(result.root.carriesContent, false);
  assert.ok(result.root.aheadOfTarget > 0, 'still counts as ahead by commits');
  assert.equal(result.root.needsSync, true, 'needsSync is deliberately unchanged');
});

test('driftStatus reports carriesContent true for a root with real work of its own', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/root');
  commitFile(repoRoot, 'own.txt', 'own');

  const view = { work: { root: item('root'), leaf: item('leaf', { parent: 'root' }) } };
  assert.equal(driftStatus(repoRoot, view, { trunk: TRUNK }).root.carriesContent, true);
});
