import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  checkMergeStillResolves,
  checkRetrospectiveContent,
  checkCleanupTTLElapsed,
  assessCleanupReadiness,
  resolveTtlDaysForItem,
  blockedItemsNowResolvable,
} from '../../src/state/cleanup-harness.mjs';

// Every test here creates its own disposable git repo (mirrors
// merge.test.mjs's own initRepo) — never this repo's own checkout.
function initRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cleanup-harness-test-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd: repoRoot });
  return repoRoot;
}

function headSha(repoRoot) {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
}

function commitFile(repoRoot, name) {
  fs.writeFileSync(path.join(repoRoot, name), 'content\n');
  execFileSync('git', ['add', name], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', `add ${name}`], { cwd: repoRoot });
  return headSha(repoRoot);
}

// --- checkMergeStillResolves -----------------------------------------

test('checkMergeStillResolves: ok when the recorded commit is still an ancestor of HEAD', () => {
  const repoRoot = initRepo();
  const sha = commitFile(repoRoot, 'merged.txt');
  commitFile(repoRoot, 'later.txt');
  const result = checkMergeStillResolves(repoRoot, { branchHeadAtReturn: sha });
  assert.equal(result.ok, true);
  assert.match(result.detail, new RegExp(sha));
});

test('checkMergeStillResolves: not ok when the recorded commit is no longer reachable (force-pushed away)', () => {
  const repoRoot = initRepo();
  const sha = commitFile(repoRoot, 'to-be-erased.txt');
  // Simulate a force-push/history-rewrite that drops the commit: hard
  // reset main back to before it, as if the branch had been rewritten.
  execFileSync('git', ['reset', '--hard', 'HEAD~1'], { cwd: repoRoot });
  const result = checkMergeStillResolves(repoRoot, { branchHeadAtReturn: sha });
  assert.equal(result.ok, false);
  assert.match(result.detail, /no longer reachable/);
});

test('checkMergeStillResolves: prefers branchHeadAtReturn, then headAtReturn, then the *AtTake pair', () => {
  const repoRoot = initRepo();
  const sha = commitFile(repoRoot, 'preferred.txt');
  const result = checkMergeStillResolves(repoRoot, {
    branchHeadAtReturn: sha,
    headAtReturn: 'not-a-real-sha',
    headAtTake: 'also-not-real',
  });
  assert.equal(result.ok, true, 'must use branchHeadAtReturn, not the other fields');
});

test('checkMergeStillResolves: ok (nothing to check) when no commit field is recorded at all', () => {
  const repoRoot = initRepo();
  const result = checkMergeStillResolves(repoRoot, {});
  assert.equal(result.ok, true);
  assert.match(result.detail, /nothing to check/);
});

// tsk-1p9 (D7): root-aware ref resolution — a leaf's branch is merged into
// its ROOT's branch, never directly into `main`/HEAD, so checking against
// literal HEAD (the old, pre-tsk-1p9 behavior) falsely reports a healthy
// merge as unreachable. This is the exact bug tsk-1p9 exists to close.
test('checkMergeStillResolves: a leaf merged into its (still-unmerged-to-main) root branch resolves ok:true against the root ref', () => {
  const repoRoot = initRepo();
  execFileSync('git', ['checkout', '-qb', 'fgw/leaf-root'], { cwd: repoRoot });
  commitFile(repoRoot, 'root.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/leaf-child'], { cwd: repoRoot });
  const leafSha = commitFile(repoRoot, 'leaf.txt');
  execFileSync('git', ['checkout', '-q', 'fgw/leaf-root'], { cwd: repoRoot });
  execFileSync('git', ['merge', '--no-ff', '-q', '-m', 'merge leaf', 'fgw/leaf-child'], { cwd: repoRoot });
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: repoRoot });

  const view = { work: { 'leaf-child': { parent: 'leaf-root' }, 'leaf-root': {} } };

  const rootAware = checkMergeStillResolves(repoRoot, { branchHeadAtReturn: leafSha }, { view, id: 'leaf-child' });
  assert.equal(rootAware.ok, true, 'checking against the root ref must find the leaf genuinely merged');
  assert.match(rootAware.detail, /fgw\/leaf-root/);

  // Proves the regression this item closes: checking against literal HEAD
  // (main, never touched by the leaf's own merge) falsely fails.
  const headOnly = checkMergeStillResolves(repoRoot, { branchHeadAtReturn: leafSha });
  assert.equal(headOnly.ok, false, 'checking against HEAD alone must NOT see the leaf as merged — main never received it');
});

// tsk-577: startupReap's zero-ahead prune (loop.mjs) can delete a root's
// own `fgw/<rootId>` branch while a leaf child is still sitting in
// `cleanup`, still needing that ref for its own check -- confirmed root
// cause of a real 14-item false-positive block. Reproduces the exact
// scenario: root merged into main for real (never squashed -- that is what
// makes the branch eligible for zero-ahead prune in the first place), root
// branch then deleted, leaf's own recorded sha must still resolve via the
// HEAD fallback.
test('checkMergeStillResolves: a leaf resolves ok:true via HEAD fallback when its root branch was already pruned (tsk-577)', () => {
  const repoRoot = initRepo();
  execFileSync('git', ['checkout', '-qb', 'fgw/root-x'], { cwd: repoRoot });
  commitFile(repoRoot, 'root.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/leaf-y'], { cwd: repoRoot });
  const leafSha = commitFile(repoRoot, 'leaf.txt');
  execFileSync('git', ['checkout', '-q', 'fgw/root-x'], { cwd: repoRoot });
  execFileSync('git', ['merge', '--no-ff', '-q', '-m', 'merge leaf', 'fgw/leaf-y'], { cwd: repoRoot });
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: repoRoot });
  // Root merges into main for real (preserves ancestry) -- the only way a
  // branch ever reaches aheadCount === 0 and becomes prune-eligible.
  execFileSync('git', ['merge', '--no-ff', '-q', '-m', 'merge root', 'fgw/root-x'], { cwd: repoRoot });
  // Simulate startupReap's zero-ahead prune deleting the now-fully-merged
  // root branch while the leaf is still sitting in cleanup.
  execFileSync('git', ['branch', '-D', 'fgw/root-x'], { cwd: repoRoot });

  const view = { work: { 'leaf-y': { parent: 'root-x' }, 'root-x': {} } };
  const result = checkMergeStillResolves(repoRoot, { branchHeadAtReturn: leafSha }, { view, id: 'leaf-y' });
  assert.equal(result.ok, true, 'a pruned-but-safe root branch must fall back to HEAD, not fail closed');
  assert.match(result.detail, /no longer exists \(pruned\)/);
  assert.match(result.detail, /fell back to HEAD/);
});

test('checkMergeStillResolves: still ok:false when the root branch is missing AND the content genuinely never reached HEAD (tsk-577 regression guard)', () => {
  const repoRoot = initRepo();
  execFileSync('git', ['checkout', '-qb', 'fgw/root-z'], { cwd: repoRoot });
  const rootSha = commitFile(repoRoot, 'root-only.txt');
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: repoRoot });
  // Root branch deleted WITHOUT ever merging into main -- content never
  // landed. The fallback must still fail closed here, never mask a real loss.
  execFileSync('git', ['branch', '-D', 'fgw/root-z'], { cwd: repoRoot });

  const view = { work: { 'leaf-w': { parent: 'root-z' }, 'root-z': {} } };
  const result = checkMergeStillResolves(repoRoot, { branchHeadAtReturn: rootSha }, { view, id: 'leaf-w' });
  assert.equal(result.ok, false, 'the fallback must not paper over content that never actually reached HEAD');
  assert.match(result.detail, /not an ancestor of HEAD either/);
});

// tsk-3ft: ancestry alone cannot tell a genuine force-push loss apart from
// a branch manually reset to unrelated divergent history -- confirmed via
// tsk-47e's real fgw/tsk-47e reflog. The ref/branch still exists here
// (unlike tsk-577's pruned-ref case above); this only adds a diagnostic
// hint pointing at `git reflog show`, never a different ok verdict.
test('checkMergeStillResolves: ok:false detail hints at "git reflog show" when the ref exists but the sha is not its ancestor (tsk-3ft)', () => {
  const repoRoot = initRepo();
  const sha = commitFile(repoRoot, 'to-be-erased.txt');
  execFileSync('git', ['reset', '--hard', 'HEAD~1'], { cwd: repoRoot });
  const result = checkMergeStillResolves(repoRoot, { branchHeadAtReturn: sha });
  assert.equal(result.ok, false);
  assert.match(result.detail, /no longer reachable/);
  assert.match(result.detail, /git reflog show HEAD/);
});

// tsk-psb: a decomposed item's own branchHeadAtReturn is structurally never
// an ancestor of the resolved root ref -- its children's branches merge
// directly into that ref instead, bypassing the decomposed item's own
// branch entirely. Reproduces the reported bug shape: parent-d branches
// off root-g, does its own work, then gets decomposed (its own branch
// abandoned, never merged); child-a and child-b branch off parent-d but
// merge DIRECTLY into root-g, the way a real decompose's children do.
test('checkMergeStillResolves: a decomposed parent resolves ok:true via its children, even though its own sha is never an ancestor (tsk-psb)', () => {
  const repoRoot = initRepo();
  execFileSync('git', ['checkout', '-qb', 'fgw/root-g'], { cwd: repoRoot });
  commitFile(repoRoot, 'root.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/parent-d'], { cwd: repoRoot });
  const parentSha = commitFile(repoRoot, 'parent-work.txt');
  // Real topology (worktree.mjs D3 "leaf fork-from-tip-of-parent"): a
  // decomposed item's children fork from the RESOLVED ROOT's branch tip,
  // never from the decomposed item's own abandoned branch -- so
  // parent-d's own commit never becomes an ancestor of either child.
  execFileSync('git', ['checkout', '-qb', 'fgw/child-a', 'fgw/root-g'], { cwd: repoRoot });
  const childASha = commitFile(repoRoot, 'child-a.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/child-b', 'fgw/root-g'], { cwd: repoRoot });
  const childBSha = commitFile(repoRoot, 'child-b.txt');
  execFileSync('git', ['checkout', '-q', 'fgw/root-g'], { cwd: repoRoot });
  execFileSync('git', ['merge', '--no-ff', '-q', '-m', 'merge child-a', 'fgw/child-a'], { cwd: repoRoot });
  execFileSync('git', ['merge', '--no-ff', '-q', '-m', 'merge child-b', 'fgw/child-b'], { cwd: repoRoot });
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: repoRoot });

  // Proves the fixture actually captures the reported bug shape: parent-d's
  // own sha is genuinely NOT an ancestor of fgw/root-g (its branch was
  // never merged there -- only its children's branches were).
  assert.throws(() => execFileSync('git', ['merge-base', '--is-ancestor', parentSha, 'fgw/root-g'], { cwd: repoRoot }));

  const view = {
    work: {
      'root-g': {},
      'parent-d': { parent: 'root-g', branchHeadAtReturn: parentSha },
      'child-a': { parent: 'parent-d', branchHeadAtReturn: childASha },
      'child-b': { parent: 'parent-d', branchHeadAtReturn: childBSha },
    },
  };
  const result = checkMergeStillResolves(repoRoot, view.work['parent-d'], { view, id: 'parent-d' });
  assert.equal(result.ok, true, "a decomposed parent's own check must defer to its children, never its own abandoned sha");
  assert.match(result.detail, /decomposed parent/);
  assert.match(result.detail, /child-a/);
  assert.match(result.detail, /child-b/);
});

test('checkMergeStillResolves: a decomposed parent is ok:false when one of its children genuinely never resolved (tsk-psb regression guard)', () => {
  const repoRoot = initRepo();
  execFileSync('git', ['checkout', '-qb', 'fgw/root-h'], { cwd: repoRoot });
  commitFile(repoRoot, 'root.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/parent-e'], { cwd: repoRoot });
  const parentSha = commitFile(repoRoot, 'parent-work.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/child-c', 'fgw/root-h'], { cwd: repoRoot });
  const childCSha = commitFile(repoRoot, 'child-c.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/child-d', 'fgw/root-h'], { cwd: repoRoot });
  const childDSha = commitFile(repoRoot, 'child-d.txt');
  execFileSync('git', ['checkout', '-q', 'fgw/root-h'], { cwd: repoRoot });
  execFileSync('git', ['merge', '--no-ff', '-q', '-m', 'merge child-c', 'fgw/child-c'], { cwd: repoRoot });
  // child-d is deliberately NOT merged anywhere -- a genuine loss, must
  // still be caught even though its sibling child-c is fine.
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: repoRoot });

  const view = {
    work: {
      'root-h': {},
      'parent-e': { parent: 'root-h', branchHeadAtReturn: parentSha },
      'child-c': { parent: 'parent-e', branchHeadAtReturn: childCSha },
      'child-d': { parent: 'parent-e', branchHeadAtReturn: childDSha },
    },
  };
  const result = checkMergeStillResolves(repoRoot, view.work['parent-e'], { view, id: 'parent-e' });
  assert.equal(result.ok, false, 'one genuinely unresolved child must still fail the parent check');
  assert.match(result.detail, /child-d/, 'the failing detail must name the specific failing child, not a generic message');
});

// tsk-4bh (Finding 5): the EXACT failure scenario the report describes --
// same topology as the test above (one child never merged), but this time
// the never-merged child was legitimately REJECTED to wontfix, not lost.
// Before this fix, checkMergeStillResolves could never tell the two cases
// apart -- both looked identical (a child whose recorded sha isn't an
// ancestor) and both failed the parent permanently. A canceled child has
// no content to lose; it must be skipped, not treated as a loss.
test('tsk-4bh: checkMergeStillResolves skips a wontfix (legacy status) child entirely -- ok:true even though its own sha was never merged anywhere', () => {
  const repoRoot = initRepo();
  execFileSync('git', ['checkout', '-qb', 'fgw/root-wf1'], { cwd: repoRoot });
  commitFile(repoRoot, 'root.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/parent-wf1'], { cwd: repoRoot });
  const parentSha = commitFile(repoRoot, 'parent-work.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/child-merged', 'fgw/root-wf1'], { cwd: repoRoot });
  const childMergedSha = commitFile(repoRoot, 'child-merged.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/child-wontfix', 'fgw/root-wf1'], { cwd: repoRoot });
  const childWontfixSha = commitFile(repoRoot, 'child-wontfix.txt');
  execFileSync('git', ['checkout', '-q', 'fgw/root-wf1'], { cwd: repoRoot });
  execFileSync('git', ['merge', '--no-ff', '-q', '-m', 'merge child-merged', 'fgw/child-merged'], { cwd: repoRoot });
  // child-wontfix's branch is deliberately NEVER merged anywhere -- it was
  // rejected, not lost. This is the legacy status-string shape (no
  // statusCategory field at all, matching pre-tsk-38t-2 data).
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: repoRoot });

  const view = {
    work: {
      'root-wf1': {},
      'parent-wf1': { parent: 'root-wf1', branchHeadAtReturn: parentSha },
      'child-merged': { parent: 'parent-wf1', branchHeadAtReturn: childMergedSha },
      'child-wontfix': { parent: 'parent-wf1', branchHeadAtReturn: childWontfixSha, status: 'wontfix' },
    },
  };
  const result = checkMergeStillResolves(repoRoot, view.work['parent-wf1'], { view, id: 'parent-wf1' });
  assert.equal(result.ok, true, 'a wontfix child must never permanently block the parent — it had nothing to merge');
  assert.match(result.detail, /child-merged/, 'the real, merged child is still checked and named');
  assert.doesNotMatch(result.detail, /child-wontfix/, 'the wontfix child is skipped entirely, never even named as passing');
});

test('tsk-4bh: checkMergeStillResolves skips a canceled (statusCategory) child entirely -- ok:true even though its own sha was never merged anywhere', () => {
  const repoRoot = initRepo();
  execFileSync('git', ['checkout', '-qb', 'fgw/root-wf2'], { cwd: repoRoot });
  commitFile(repoRoot, 'root.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/parent-wf2'], { cwd: repoRoot });
  const parentSha = commitFile(repoRoot, 'parent-work.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/child-merged2', 'fgw/root-wf2'], { cwd: repoRoot });
  const childMergedSha = commitFile(repoRoot, 'child-merged2.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/child-canceled', 'fgw/root-wf2'], { cwd: repoRoot });
  const childCanceledSha = commitFile(repoRoot, 'child-canceled.txt');
  execFileSync('git', ['checkout', '-q', 'fgw/root-wf2'], { cwd: repoRoot });
  execFileSync('git', ['merge', '--no-ff', '-q', '-m', 'merge child-merged2', 'fgw/child-merged2'], { cwd: repoRoot });
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: repoRoot });

  const view = {
    work: {
      'root-wf2': {},
      'parent-wf2': { parent: 'root-wf2', branchHeadAtReturn: parentSha },
      'child-merged2': { parent: 'parent-wf2', branchHeadAtReturn: childMergedSha },
      // Modern shape: statusCategory present, wins over any literal status
      // string (same precedence isResolvedStatus/isCanceledStatus already
      // document).
      'child-canceled': { parent: 'parent-wf2', branchHeadAtReturn: childCanceledSha, status: 'todo', statusCategory: 'canceled' },
    },
  };
  const result = checkMergeStillResolves(repoRoot, view.work['parent-wf2'], { view, id: 'parent-wf2' });
  assert.equal(result.ok, true, 'a canceled child must never permanently block the parent — it had nothing to merge');
  assert.match(result.detail, /child-merged2/);
  assert.doesNotMatch(result.detail, /child-canceled/);
});

// Multi-level: child-mid was ITSELF decomposed further (has its own child,
// grandchild-1). Proves the children-recursion composes with itself across
// more than one decompose level, and that child-mid's own bogus sha (also
// never merged, same shape as parent-e above) is correctly ignored in
// favor of recursing into ITS OWN children.
test('checkMergeStillResolves: a multi-level decompose tree (child itself decomposed further) resolves correctly through recursion (tsk-psb)', () => {
  const repoRoot = initRepo();
  execFileSync('git', ['checkout', '-qb', 'fgw/root-i'], { cwd: repoRoot });
  commitFile(repoRoot, 'root.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/parent-f'], { cwd: repoRoot });
  const parentSha = commitFile(repoRoot, 'parent-work.txt');
  // Same real topology as the tests above: EVERY leaf, regardless of how
  // many decompose levels sit above it, forks from the single resolved
  // root's branch tip (worktree.mjs D3) -- never from an intermediate
  // decomposed item's own branch. child-mid is itself decomposed further,
  // so its own commit (childMidSha) is exactly as abandoned as parent-f's.
  execFileSync('git', ['checkout', '-qb', 'fgw/child-leaf', 'fgw/root-i'], { cwd: repoRoot });
  const childLeafSha = commitFile(repoRoot, 'child-leaf.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/child-mid', 'fgw/root-i'], { cwd: repoRoot });
  const childMidSha = commitFile(repoRoot, 'child-mid-work.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/grandchild-1', 'fgw/root-i'], { cwd: repoRoot });
  const grandchildSha = commitFile(repoRoot, 'grandchild.txt');
  execFileSync('git', ['checkout', '-q', 'fgw/root-i'], { cwd: repoRoot });
  execFileSync('git', ['merge', '--no-ff', '-q', '-m', 'merge child-leaf', 'fgw/child-leaf'], { cwd: repoRoot });
  execFileSync('git', ['merge', '--no-ff', '-q', '-m', 'merge grandchild-1', 'fgw/grandchild-1'], { cwd: repoRoot });
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: repoRoot });

  const view = {
    work: {
      'root-i': {},
      'parent-f': { parent: 'root-i', branchHeadAtReturn: parentSha },
      'child-leaf': { parent: 'parent-f', branchHeadAtReturn: childLeafSha },
      'child-mid': { parent: 'parent-f', branchHeadAtReturn: childMidSha },
      'grandchild-1': { parent: 'child-mid', branchHeadAtReturn: grandchildSha },
    },
  };
  const result = checkMergeStillResolves(repoRoot, view.work['parent-f'], { view, id: 'parent-f' });
  assert.equal(result.ok, true, 'a multi-level decompose tree must resolve through recursive children checks');
  assert.match(result.detail, /child-leaf/);
  assert.match(result.detail, /child-mid/);
});

// tsk-5j0: the gap the tests above never covered -- calling
// checkMergeStillResolves with `id` set to the ROOT itself (not a non-root
// decomposed node) while that root has children. Before this fix, the
// function returned checkChildrenResolve's result directly and never
// checked the root's own branch against anything.
test('checkMergeStillResolves: a decomposed ROOT is ok:false when its own branch never merged into main, even though all its children resolve (tsk-5j0)', () => {
  const repoRoot = initRepo();
  execFileSync('git', ['checkout', '-qb', 'fgw/root-j'], { cwd: repoRoot });
  commitFile(repoRoot, 'root.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/child-e', 'fgw/root-j'], { cwd: repoRoot });
  const childESha = commitFile(repoRoot, 'child-e.txt');
  execFileSync('git', ['checkout', '-q', 'fgw/root-j'], { cwd: repoRoot });
  execFileSync('git', ['merge', '--no-ff', '-q', '-m', 'merge child-e', 'fgw/child-e'], { cwd: repoRoot });
  // Deliberately never merge fgw/root-j into main -- the exact gap tsk-5j0
  // reports (confirmed live on tsk-4b2): a root with children whose own
  // branch never merged, silently reported ok because only the children
  // check ever ran.
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: repoRoot });

  const view = {
    work: {
      'root-j': {},
      'child-e': { parent: 'root-j', branchHeadAtReturn: childESha },
    },
  };
  const result = checkMergeStillResolves(repoRoot, view.work['root-j'], { view, id: 'root-j' });
  assert.equal(result.ok, false, "a root's own unmerged branch must fail the check even when every child resolves");
  assert.match(result.detail, /fgw\/root-j/);
  assert.match(result.detail, /never merged into HEAD/);
});

test('checkMergeStillResolves: a decomposed ROOT is ok:true when its own branch merged into main AND all its children resolve (tsk-5j0)', () => {
  const repoRoot = initRepo();
  execFileSync('git', ['checkout', '-qb', 'fgw/root-k'], { cwd: repoRoot });
  commitFile(repoRoot, 'root.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/child-f', 'fgw/root-k'], { cwd: repoRoot });
  const childFSha = commitFile(repoRoot, 'child-f.txt');
  execFileSync('git', ['checkout', '-q', 'fgw/root-k'], { cwd: repoRoot });
  execFileSync('git', ['merge', '--no-ff', '-q', '-m', 'merge child-f', 'fgw/child-f'], { cwd: repoRoot });
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: repoRoot });
  execFileSync('git', ['merge', '--no-ff', '-q', '-m', 'merge root-k into main', 'fgw/root-k'], { cwd: repoRoot });

  const view = {
    work: {
      'root-k': {},
      'child-f': { parent: 'root-k', branchHeadAtReturn: childFSha },
    },
  };
  const result = checkMergeStillResolves(repoRoot, view.work['root-k'], { view, id: 'root-k' });
  assert.equal(result.ok, true, "a root whose own branch merged into main, with every child resolving, must pass");
  assert.match(result.detail, /child-f/);
  assert.match(result.detail, /fgw\/root-k/);
});

test("checkMergeStillResolves: a decomposed ROOT still ok:false when a child fails, even though the root's own branch did merge into main (tsk-5j0 regression guard)", () => {
  const repoRoot = initRepo();
  execFileSync('git', ['checkout', '-qb', 'fgw/root-l'], { cwd: repoRoot });
  commitFile(repoRoot, 'root.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/child-g', 'fgw/root-l'], { cwd: repoRoot });
  const childGSha = commitFile(repoRoot, 'child-g.txt');
  execFileSync('git', ['checkout', '-qb', 'fgw/child-h', 'fgw/root-l'], { cwd: repoRoot });
  const childHSha = commitFile(repoRoot, 'child-h.txt');
  execFileSync('git', ['checkout', '-q', 'fgw/root-l'], { cwd: repoRoot });
  execFileSync('git', ['merge', '--no-ff', '-q', '-m', 'merge child-g', 'fgw/child-g'], { cwd: repoRoot });
  // child-h deliberately NOT merged anywhere -- the root's own branch check
  // must never mask an already-caught children failure.
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: repoRoot });
  execFileSync('git', ['merge', '--no-ff', '-q', '-m', 'merge root-l into main', 'fgw/root-l'], { cwd: repoRoot });

  const view = {
    work: {
      'root-l': {},
      'child-g': { parent: 'root-l', branchHeadAtReturn: childGSha },
      'child-h': { parent: 'root-l', branchHeadAtReturn: childHSha },
    },
  };
  const result = checkMergeStillResolves(repoRoot, view.work['root-l'], { view, id: 'root-l' });
  assert.equal(result.ok, false, 'a genuinely unresolved child must still fail the check; the root-branch check must never mask it');
  assert.match(result.detail, /child-h/);
});

// --- checkRetrospectiveContent -----------------------------------------
// tsk-558: reads outcome.docType/docPath (D8's own named fields) instead
// of outcome.actual/predicted (claim-lifecycle artifacts, unrelated to
// whether retrospective itself ran), and confirms the docPath file
// actually exists on disk before passing.

test('checkRetrospectiveContent: not ok when no outcome or decision record exists for the item', () => {
  const repoRoot = initRepo();
  const result = checkRetrospectiveContent({}, 'no-content-item', repoRoot);
  assert.equal(result.ok, false);
  assert.match(result.detail, /no outcome docType\/docPath or decision record/);
});

test('checkRetrospectiveContent: NOT ok when the item has a claim-lifecycle predicted/actual outcome but no real doc (tsk-558 false-pass regression)', () => {
  const repoRoot = initRepo();
  const view = { outcomes: { 'predicted-no-doc': { predicted: { tier: 'standard' } }, }, };
  const result = checkRetrospectiveContent(view, 'predicted-no-doc', repoRoot);
  assert.equal(result.ok, false, 'predicted/actual alone must never satisfy D8 — that was the false-pass bug');
});

test('checkRetrospectiveContent: ok when docType/docPath are recorded AND the file actually exists on disk, with no predicted/actual at all (tsk-558 false-fail regression)', () => {
  const repoRoot = initRepo();
  fs.mkdirSync(path.join(repoRoot, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'docs', 'how-to', 'real-doc.md'), '# real doc\n');
  const view = { outcomes: { 'has-real-doc': { docType: 'how-to', docPath: 'docs/how-to/real-doc.md' } } };
  const result = checkRetrospectiveContent(view, 'has-real-doc', repoRoot);
  assert.equal(result.ok, true, 'a real doc must pass even with no predicted/actual field — that was the false-fail bug');
});

// An engine-written record is the same class of evidence as the
// predicted/actual outcome above: written by machinery as a side effect of
// the lifecycle, never by anyone reflecting on the work. `fgos report` (the
// driver's closing report) is one, and `fgos-coding-driving` writes one at
// EVERY stop — so counting engine records left this gate permanently green
// for every item that had ever been driven, before retrospective ran at all.
test('checkRetrospectiveContent: NOT ok when the only decision is an engine record such as a driver report', () => {
  const repoRoot = initRepo();
  const view = {
    decisionsById: {
      'driver-report-only': [
        { text: 'reached ceiling at status awaiting-approval', source: 'driver-report', kind: 'engine' },
      ],
    },
  };
  const result = checkRetrospectiveContent(view, 'driver-report-only', repoRoot);
  assert.equal(result.ok, false, 'engine bookkeeping is not evidence that a retrospective ran');
});

test('checkRetrospectiveContent: ok when a real (non-engine) decision sits alongside engine records', () => {
  const repoRoot = initRepo();
  const view = {
    decisionsById: {
      'real-decision': [
        { text: 'returned, awaiting-approval', source: 'driver-report', kind: 'engine' },
        { text: 'chose the pull door over a second write path', source: 'session', kind: 'design' },
      ],
    },
  };
  const result = checkRetrospectiveContent(view, 'real-decision', repoRoot);
  assert.equal(result.ok, true, 'a genuine decision still satisfies the gate, engine noise alongside it or not');
});

test('checkRetrospectiveContent: NOT ok when docPath is recorded but the file does not exist on disk (the orphaned-doc incident)', () => {
  const repoRoot = initRepo();
  const view = { outcomes: { 'orphaned-doc': { docType: 'how-to', docPath: 'docs/how-to/never-written.md' } } };
  const result = checkRetrospectiveContent(view, 'orphaned-doc', repoRoot);
  assert.equal(result.ok, false, 'a recorded path with no real file must never pass — the exact orphaning failure this item closes');
  assert.match(result.detail, /does not exist on disk/);
});

test('checkRetrospectiveContent: ok when at least one decision record exists, even with no outcome at all', () => {
  const repoRoot = initRepo();
  const view = { decisionsById: { 'has-decision': [{ text: 'x', rationale: 'y' }] } };
  const result = checkRetrospectiveContent(view, 'has-decision', repoRoot);
  assert.equal(result.ok, true);
});

test('checkRetrospectiveContent: not ok when decisionsById exists for the id but is an empty array', () => {
  const repoRoot = initRepo();
  const view = { decisionsById: { 'empty-decisions': [] } };
  const result = checkRetrospectiveContent(view, 'empty-decisions', repoRoot);
  assert.equal(result.ok, false);
});

// --- checkCleanupTTLElapsed ---------------------------------------------

test('checkCleanupTTLElapsed: not ok when the item never entered cleanup at all', () => {
  const result = checkCleanupTTLElapsed([], 'never-entered', { ttlDays: 7 });
  assert.equal(result.ok, false);
  assert.match(result.detail, /never actually entered cleanup/);
});

test('checkCleanupTTLElapsed: not ok when TTL has not yet elapsed', () => {
  const now = Date.now();
  const enteredAt = new Date(now - 2 * 86400000).toISOString(); // 2 days ago
  const rawEvents = [{ type: 'work.move', payload: { id: 'x', to: 'cleanup' }, ts: enteredAt }];
  const result = checkCleanupTTLElapsed(rawEvents, 'x', { ttlDays: 7, now });
  assert.equal(result.ok, false);
  assert.match(result.detail, /not ready yet/);
});

test('checkCleanupTTLElapsed: ok when TTL has fully elapsed', () => {
  const now = Date.now();
  const enteredAt = new Date(now - 8 * 86400000).toISOString(); // 8 days ago
  const rawEvents = [{ type: 'work.move', payload: { id: 'x', to: 'cleanup' }, ts: enteredAt }];
  const result = checkCleanupTTLElapsed(rawEvents, 'x', { ttlDays: 7, now });
  assert.equal(result.ok, true);
});

test('checkCleanupTTLElapsed: anchors to the SPECIFIC retrospective->cleanup event, never a later unrelated event for the same id', () => {
  const now = Date.now();
  const enteredAt = new Date(now - 8 * 86400000).toISOString(); // 8 days ago -- TTL-elapsed
  const laterUnrelated = new Date(now - 1 * 86400000).toISOString(); // a decision logged 1 day ago
  const rawEvents = [
    { type: 'work.move', payload: { id: 'x', to: 'cleanup' }, ts: enteredAt },
    { type: 'decision', payload: { id: 'x', text: 'unrelated note' }, ts: laterUnrelated },
  ];
  const result = checkCleanupTTLElapsed(rawEvents, 'x', { ttlDays: 7, now });
  assert.equal(result.ok, true, 'an unrelated later event must never reset the TTL clock');
});

test('checkCleanupTTLElapsed: uses the LATEST cleanup entry if an item somehow re-entered cleanup more than once', () => {
  const now = Date.now();
  const firstEntry = new Date(now - 20 * 86400000).toISOString();
  const secondEntry = new Date(now - 1 * 86400000).toISOString(); // most recent, TTL not elapsed
  const rawEvents = [
    { type: 'work.move', payload: { id: 'x', to: 'cleanup' }, ts: firstEntry },
    { type: 'work.move', payload: { id: 'x', to: 'blocked' }, ts: new Date(now - 15 * 86400000).toISOString() },
    { type: 'work.move', payload: { id: 'x', to: 'delivered' }, ts: new Date(now - 10 * 86400000).toISOString() },
    { type: 'work.move', payload: { id: 'x', to: 'cleanup' }, ts: secondEntry },
  ];
  const result = checkCleanupTTLElapsed(rawEvents, 'x', { ttlDays: 7, now });
  assert.equal(result.ok, false, 'must use the LATEST cleanup entry, not the first');
});

// --- resolveTtlDaysForItem (tsk-59x D1) ----------------------------------

test('resolveTtlDaysForItem: a root item (no parent) resolves to ttlDays, never leafTtlDays', () => {
  const view = { work: { 'root-item': {} } };
  const result = resolveTtlDaysForItem(view, 'root-item', { ttlDays: 7, leafTtlDays: 0 });
  assert.equal(result, 7);
});

test('resolveTtlDaysForItem: a leaf item (parent present in view) resolves to leafTtlDays', () => {
  const view = { work: { 'root-item': {}, 'leaf-item': { parent: 'root-item' } } };
  const result = resolveTtlDaysForItem(view, 'leaf-item', { ttlDays: 7, leafTtlDays: 0 });
  assert.equal(result, 0);
});

test('resolveTtlDaysForItem: a dangling-parent item (parent id not in view.work) resolves as a root, matching resolveRoot/checkMergeStillResolves precedent', () => {
  const view = { work: { 'orphaned-item': { parent: 'missing-parent' } } };
  const result = resolveTtlDaysForItem(view, 'orphaned-item', { ttlDays: 7, leafTtlDays: 0 });
  assert.equal(result, 7);
});

test('resolveTtlDaysForItem: leafTtlDays omitted entirely falls back to ttlDays for both a root AND a leaf -- byte-identical to before tsk-59x', () => {
  const view = { work: { 'root-item': {}, 'leaf-item': { parent: 'root-item' } } };
  assert.equal(resolveTtlDaysForItem(view, 'root-item', { ttlDays: 7 }), 7);
  assert.equal(resolveTtlDaysForItem(view, 'leaf-item', { ttlDays: 7 }), 7);
});

// --- assessCleanupReadiness (combined) -----------------------------------
//
// tsk-4jf: TTL (D7, a park precondition) and the two D8 gate checks are
// kept in separate arrays (`notReadyYet` vs `failed`) rather than one flat
// `reasons` list — covering all 4 combinations of {TTL elapsed/not} x
// {D8 checks pass/fail}.

test('assessCleanupReadiness: TTL elapsed + D8 checks pass -> ready:true, both arrays empty', () => {
  const repoRoot = initRepo();
  const sha = commitFile(repoRoot, 'ok.txt');
  const now = Date.now();
  const rawEvents = [{ type: 'work.move', payload: { id: 'good-item', to: 'cleanup' }, ts: new Date(now - 8 * 86400000).toISOString() }];
  const view = {
    work: { 'good-item': { branchHeadAtReturn: sha } },
    decisionsById: { 'good-item': [{ text: 'x', rationale: 'y' }] },
  };
  const result = assessCleanupReadiness({ view, rawEvents, id: 'good-item', repoRoot, worktreeBacked: true, ttlDays: 7, now });
  assert.equal(result.ready, true);
  assert.deepEqual(result.notReadyYet, []);
  assert.deepEqual(result.failed, []);
});

test('assessCleanupReadiness: TTL elapsed + D8 checks fail -> ready:false, failure lands in `failed`, not `notReadyYet`', () => {
  const repoRoot = initRepo();
  const sha = commitFile(repoRoot, 'ok.txt');
  const now = Date.now();
  const rawEvents = [{ type: 'work.move', payload: { id: 'no-content-item', to: 'cleanup' }, ts: new Date(now - 8 * 86400000).toISOString() }];
  const view = {
    work: { 'no-content-item': { branchHeadAtReturn: sha } },
    outcomes: {}, // no retrospective content -> content check fails
  };
  const result = assessCleanupReadiness({ view, rawEvents, id: 'no-content-item', repoRoot, worktreeBacked: true, ttlDays: 7, now });
  assert.equal(result.ready, false);
  assert.deepEqual(result.notReadyYet, []);
  assert.equal(result.failed.length, 1);
  assert.match(result.failed[0], /no outcome docType\/docPath or decision record/);
});

test('assessCleanupReadiness: TTL not elapsed + D8 checks pass -> ready:false, but ONLY notReadyYet is non-empty', () => {
  const repoRoot = initRepo();
  const sha = commitFile(repoRoot, 'ok.txt');
  const now = Date.now();
  const rawEvents = [{ type: 'work.move', payload: { id: 'fresh-item', to: 'cleanup' }, ts: new Date(now - 2 * 86400000).toISOString() }];
  const view = {
    work: { 'fresh-item': { branchHeadAtReturn: sha } },
    decisionsById: { 'fresh-item': [{ text: 'x', rationale: 'y' }] },
  };
  const result = assessCleanupReadiness({ view, rawEvents, id: 'fresh-item', repoRoot, worktreeBacked: true, ttlDays: 7, now });
  assert.equal(result.ready, false);
  assert.equal(result.notReadyYet.length, 1);
  assert.match(result.notReadyYet[0], /not ready yet/);
  assert.deepEqual(result.failed, [], 'TTL-not-elapsed alone must never land in `failed`');
});

test('assessCleanupReadiness: TTL not elapsed + D8 checks fail -> ready:false, BOTH arrays non-empty', () => {
  const repoRoot = initRepo();
  const now = Date.now();
  const rawEvents = []; // never entered cleanup -> TTL check fails (notReadyYet)
  const view = { work: { 'bad-item': {} }, outcomes: {} }; // no content -> content check fails
  const result = assessCleanupReadiness({ view, rawEvents, id: 'bad-item', repoRoot, worktreeBacked: true, ttlDays: 7, now });
  assert.equal(result.ready, false);
  assert.equal(result.notReadyYet.length, 1, 'TTL failure must be listed in notReadyYet');
  assert.equal(result.failed.length, 1, 'content failure must be listed in failed');
});

test('assessCleanupReadiness: a leaf item at 1 day in cleanup is TTL-ready under leafTtlDays:0, while a root item at the same age under the same call is not', () => {
  const repoRoot = initRepo();
  const rootSha = commitFile(repoRoot, 'root.txt');
  const leafSha = commitFile(repoRoot, 'leaf.txt');
  const now = Date.now();
  const enteredAt = new Date(now - 1 * 86400000).toISOString(); // 1 day ago -- under root's 7d TTL, over leaf's 0d TTL
  const view = {
    work: {
      'root-item': { branchHeadAtReturn: rootSha },
      'leaf-item': { parent: 'root-item', branchHeadAtReturn: leafSha },
    },
    decisionsById: {
      'root-item': [{ text: 'x', rationale: 'y' }],
      'leaf-item': [{ text: 'x', rationale: 'y' }],
    },
  };
  const rawEventsFor = (id) => [{ type: 'work.move', payload: { id, to: 'cleanup' }, ts: enteredAt }];

  const rootResult = assessCleanupReadiness({
    view, rawEvents: rawEventsFor('root-item'), id: 'root-item', repoRoot, worktreeBacked: true, ttlDays: 7, leafTtlDays: 0, now,
  });
  assert.equal(rootResult.ready, false, 'root item must still wait out the full 7-day TTL');
  assert.equal(rootResult.notReadyYet.length, 1);

  const leafResult = assessCleanupReadiness({
    view, rawEvents: rawEventsFor('leaf-item'), id: 'leaf-item', repoRoot, worktreeBacked: true, ttlDays: 7, leafTtlDays: 0, now,
  });
  assert.equal(leafResult.ready, true, 'leaf item must be TTL-ready immediately under leafTtlDays:0');
  assert.deepEqual(leafResult.notReadyYet, []);
});

test('assessCleanupReadiness: skips the merge-resolves check entirely when worktreeBacked is false (synthetic domain, D5)', () => {
  const now = Date.now();
  const rawEvents = [{ type: 'work.move', payload: { id: 'synth-item', to: 'cleanup' }, ts: new Date(now - 8 * 86400000).toISOString() }];
  const view = {
    work: { 'synth-item': { branchHeadAtReturn: 'not-a-real-sha-would-fail-if-checked' } },
    decisionsById: { 'synth-item': [{ text: 'x', rationale: 'y' }] },
  };
  // No repoRoot passed at all -- if the merge check ran, it would throw on a missing cwd.
  const result = assessCleanupReadiness({ view, rawEvents, id: 'synth-item', repoRoot: undefined, worktreeBacked: false, ttlDays: 7, now });
  assert.equal(result.ready, true, 'must not attempt the merge-resolves check for a non-worktree-backed domain');
});

// --- blockedItemsNowResolvable (tsk-597z) ------------------------------

test('blockedItemsNowResolvable: empty view reports all-empty, no error', () => {
  const result = blockedItemsNowResolvable({ view: { work: {} }, repoRoot: '/does-not-matter' });
  assert.deepEqual(result, { resolvable: [], stillBlocked: [], notApplicable: [] });
});

test('blockedItemsNowResolvable: a blocked item whose recorded commit is NOW an ancestor of HEAD is reported resolvable', () => {
  const repoRoot = initRepo();
  const sha = commitFile(repoRoot, 'now-merged.txt');
  const view = { work: { 'tsk-a': { status: 'blocked', branchHeadAtReturn: sha } } };
  const result = blockedItemsNowResolvable({ view, repoRoot });
  assert.deepEqual(result.stillBlocked, []);
  assert.deepEqual(result.notApplicable, []);
  assert.equal(result.resolvable.length, 1);
  assert.equal(result.resolvable[0].id, 'tsk-a');
});

test('blockedItemsNowResolvable: a blocked item whose recorded commit is still unreachable is reported stillBlocked, not resolvable', () => {
  const repoRoot = initRepo();
  const sha = commitFile(repoRoot, 'erased.txt');
  execFileSync('git', ['reset', '--hard', 'HEAD~1'], { cwd: repoRoot });
  const view = { work: { 'tsk-b': { status: 'blocked', branchHeadAtReturn: sha } } };
  const result = blockedItemsNowResolvable({ view, repoRoot });
  assert.deepEqual(result.resolvable, []);
  assert.deepEqual(result.notApplicable, []);
  assert.equal(result.stillBlocked.length, 1);
  assert.equal(result.stillBlocked[0].id, 'tsk-b');
});

test('blockedItemsNowResolvable: a blocked item with no recorded commit at all is notApplicable, never reported resolvable', () => {
  const repoRoot = initRepo();
  const view = { work: { 'tsk-c': { status: 'blocked' } } };
  const result = blockedItemsNowResolvable({ view, repoRoot });
  assert.deepEqual(result.resolvable, []);
  assert.deepEqual(result.stillBlocked, []);
  assert.equal(result.notApplicable.length, 1);
  assert.equal(result.notApplicable[0].id, 'tsk-c');
  assert.equal(result.notApplicable[0].reason, 'no-recorded-commit');
});

test('blockedItemsNowResolvable: a blocked item in a non-worktree-backed domain is notApplicable and never re-checked', () => {
  const view = {
    work: {
      // A real-looking sha here would make checkMergeStillResolves throw
      // against a bogus repoRoot if it were ever actually called -- this
      // item must be skipped before that happens.
      'tsk-d': { status: 'blocked', domain: 'synthetic', branchHeadAtReturn: 'deadbeef' },
    },
  };
  const result = blockedItemsNowResolvable({ view, repoRoot: '/does-not-matter' });
  assert.deepEqual(result.resolvable, []);
  assert.deepEqual(result.stillBlocked, []);
  assert.equal(result.notApplicable.length, 1);
  assert.equal(result.notApplicable[0].id, 'tsk-d');
  assert.equal(result.notApplicable[0].reason, 'domain-not-worktree-backed');
});

test('blockedItemsNowResolvable: only status:blocked items are ever considered', () => {
  const repoRoot = initRepo();
  const sha = commitFile(repoRoot, 'irrelevant.txt');
  const view = {
    work: {
      'tsk-e': { status: 'doing', branchHeadAtReturn: sha },
      'tsk-f': { status: 'todo' },
      'tsk-g': { status: 'awaiting-approval', branchHeadAtReturn: sha },
    },
  };
  const result = blockedItemsNowResolvable({ view, repoRoot });
  assert.deepEqual(result, { resolvable: [], stillBlocked: [], notApplicable: [] });
});

// tsk-2jz: Fallback checks for blind spot 1 (clean rebase-rehash) and blind spot 2 (rescue-merge bypassing parent)

test('checkMergeStillResolves: rescue-merge case (blind spot 2) resolves ok:true via main-ancestry fallback', () => {
  const repoRoot = initRepo();
  execFileSync('git', ['checkout', '-qb', 'fgw/rescue-parent'], { cwd: repoRoot });
  commitFile(repoRoot, 'parent.txt');
  execFileSync('git', ['checkout', '-qb', 'rescue-child', 'fgw/rescue-parent'], { cwd: repoRoot });
  const childSha = commitFile(repoRoot, 'child-rescue-work.txt');

  // Rescue merge lands child branch straight onto main, bypassing fgw/rescue-parent
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: repoRoot });
  execFileSync('git', ['merge', '--no-ff', '-q', '-m', 'rescue child merge', 'rescue-child'], { cwd: repoRoot });

  // childSha is an ancestor of main (HEAD), but NOT of fgw/rescue-parent
  assert.throws(() => execFileSync('git', ['merge-base', '--is-ancestor', childSha, 'fgw/rescue-parent'], { cwd: repoRoot }));

  const view = { work: { 'rescue-child': { parent: 'rescue-parent' }, 'rescue-parent': {} } };
  const result = checkMergeStillResolves(repoRoot, { branchHeadAtReturn: childSha }, { view, id: 'rescue-child' });

  assert.equal(result.ok, true, 'main-ancestry fallback must resolve child whose rescue merge landed on main');
  assert.match(result.detail, /main-ancestry fallback/);
});

test('checkMergeStillResolves: clean synthetic rebase-rehash case (blind spot 1) resolves ok:true via content-equivalence fallback', () => {
  const repoRoot = initRepo();
  execFileSync('git', ['checkout', '-qb', 'fgw/rebase-parent'], { cwd: repoRoot });
  commitFile(repoRoot, 'parent.txt');
  execFileSync('git', ['checkout', '-qb', 'rebase-child', 'fgw/rebase-parent'], { cwd: repoRoot });
  const origChildSha = commitFile(repoRoot, 'child-rebase-work.txt');

  // Advance fgw/rebase-parent with a new commit so cherry-picking creates a new sha on a different parent commit
  execFileSync('git', ['checkout', '-q', 'fgw/rebase-parent'], { cwd: repoRoot });
  commitFile(repoRoot, 'parent-ahead.txt');
  execFileSync('git', ['cherry-pick', origChildSha], { cwd: repoRoot });

  // Add another change to main so repo moves on
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: repoRoot });
  commitFile(repoRoot, 'another-change.txt');

  // origChildSha is NOT a direct ancestor of fgw/rebase-parent or HEAD (cherry-pick created a twin commit under a new sha)
  assert.throws(() => execFileSync('git', ['merge-base', '--is-ancestor', origChildSha, 'fgw/rebase-parent'], { cwd: repoRoot }));
  assert.throws(() => execFileSync('git', ['merge-base', '--is-ancestor', origChildSha, 'HEAD'], { cwd: repoRoot }));

  const view = { work: { 'rebase-child': { parent: 'rebase-parent' }, 'rebase-parent': {} } };
  const result = checkMergeStillResolves(repoRoot, { branchHeadAtReturn: origChildSha }, { view, id: 'rebase-child' });

  assert.equal(result.ok, true, 'content-equivalence fallback must resolve clean rebase-rehash with matching patch-id');
  assert.match(result.detail, /content-equivalence fallback/);
});

test('checkMergeStillResolves: negative case — sha NOT an ancestor of main and NO patch-id twin stays ok:false (no data-loss masking)', () => {
  const repoRoot = initRepo();
  execFileSync('git', ['checkout', '-qb', 'fgw/negative-parent'], { cwd: repoRoot });
  commitFile(repoRoot, 'parent.txt');
  execFileSync('git', ['checkout', '-qb', 'negative-child', 'fgw/negative-parent'], { cwd: repoRoot });
  const lostSha = commitFile(repoRoot, 'lost-content.txt');

  // Abandon negative-child branch without merging or cherry-picking its content
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: repoRoot });
  commitFile(repoRoot, 'unrelated.txt');

  const view = { work: { 'negative-child': { parent: 'negative-parent' }, 'negative-parent': {} } };
  const result = checkMergeStillResolves(repoRoot, { branchHeadAtReturn: lostSha }, { view, id: 'negative-child' });

  assert.equal(result.ok, false, 'genuinely lost commit must stay ok:false and not be masked');
  assert.match(result.detail, /no longer reachable/);
});

