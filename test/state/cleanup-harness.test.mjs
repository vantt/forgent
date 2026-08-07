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
