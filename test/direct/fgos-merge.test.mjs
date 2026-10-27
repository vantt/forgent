// The merge-cluster use cases (review, sync-root, promote-to-component, merge list/next), called in this process.
// test/cli/fgos-merge.test.mjs keeps what only the CLI adapter decides: flag parsing and forwarding, --trust-dir,
// and the refusal of a directory without .fgos/.
import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { checkRetrospectiveContent } from '../../src/state/cleanup-harness.mjs';
import { addWork, editWork, EXIT_CODES, StoreError } from '../../src/state/store.mjs';
import { reviewUseCase } from '../../src/verbs/merge/review.mjs';
import { syncRootUseCase } from '../../src/verbs/merge/sync-root.mjs';
import { promoteToComponentUseCase } from '../../src/verbs/merge/promote-to-component.mjs';
import { approveUseCase } from '../../src/verbs/merge/approve.mjs';
import { mergeList, mergeNext } from '../../src/verbs/merge/merge.mjs';
import {
  addBareOrigin,
  addOk,
  commitFile,
  commitPending,
  commitPendingBeforeApprove,
  cutMemberBranch,
  eventLines,
  gitAtCwd,
  gitHead,
  initGitCwdFast,
  initGitCwdMainFast,
  makeDriftedRoot,
  makeFlatMember,
  makeLegacyProposedItem,
  makeRunnerProposedItem,
  makeRunnerProposedItemTouching,
  makeRunnerProposedLeafItem,
  moveOk,
  registerFlatMember,
  run,
  stateView,
  tmpCwdFast,
  toProposed,
  writeAuthFailFake,
  writeCreateFake,
  writeMarkerFake,
  writeViewFake,
} from '../cli/helpers/fgos-cli-harness.mjs';

const fgosDir = (cwd) => path.join(cwd, '.fgos');

// What the CLI resolves from its flags when none are given, except a fixed verify timeout in place of the runner config's.
const MERGE_OPTIONS = {
  resolveTimeoutMs: () => 60_000,
  resolveWaitFlags: () => ({ noWait: false, waitMs: undefined }),
  acknowledgeIronLaw: false,
  acknowledgeDrift: false,
  github: false,
};

const review = (cwd, id, options = {}) => reviewUseCase({ dir: fgosDir(cwd), cwd }, { id, github: false, ...options });
const syncRoot = (cwd, id, repoRoot = cwd) => syncRootUseCase({ dir: fgosDir(cwd), repoRoot }, { ...MERGE_OPTIONS, id });
const promote = (cwd, ids, options = {}, repoRoot = cwd) => promoteToComponentUseCase({ dir: fgosDir(cwd), repoRoot }, { ids, ...options });
const approve = (cwd, id) => approveUseCase({ dir: fgosDir(cwd), repoRoot: cwd }, { ...MERGE_OPTIONS, id });
const list = (cwd) => mergeList({ dir: fgosDir(cwd), cwd });
const next = (cwd) => mergeNext(
  { dir: fgosDir(cwd), cwd, repoRoot: cwd },
  { acknowledgeIronLaw: false, approveOptions: MERGE_OPTIONS, syncRootOptions: MERGE_OPTIONS },
);

/** Matches the StoreError the CLI turns into `exitCode`, with a message matching `pattern` when one is given. */
function refusal(exitCode, pattern) {
  return (err) => err instanceof StoreError && EXIT_CODES[err.category] === exitCode && (!pattern || pattern.test(err.message));
}

/** An item written the way `fgos add` writes it without --stage: entry stage discovery, verify `true`. */
function addItem(cwd, id, extra = {}) {
  return addWork(fgosDir(cwd), {
    id,
    title: extra.title ?? id,
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'true',
    description: 'merge fixture description.',
    workflowStep: 'discovery',
    ...extra,
  });
}

/** A root with a child (drift only tracks ids that are some other item's parent), awaiting approval and committed. */
function makeDriftedRootAwaitingApproval(cwd, rootId, extra) {
  makeDriftedRoot(cwd, rootId, extra);
  addItem(cwd, `${rootId}-child`, { title: 'child', parent: rootId });
  assert.equal(moveOk(cwd, rootId, 'awaiting-approval', { skipReturnGuard: "test fixture setup, not exercising return's own guard" }).status, 0);
  commitPendingBeforeApprove(cwd, rootId);
}

function decisionsFor(cwd, id) {
  return eventLines(cwd).map((l) => JSON.parse(l)).filter((e) => e.type === 'decision' && e.payload?.id === id);
}

function linkedWorktree(cwd, branch) {
  const wt = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-direct-merge-wt-')), 'wt');
  gitAtCwd(cwd, ['worktree', 'add', '-q', '-b', branch, wt]);
  return wt;
}

// ---------------------------------------------------------------------------
// review
// ---------------------------------------------------------------------------

test('review on a nonexistent id is refused as validation', async () => {
  await assert.rejects(review(tmpCwdFast(), 'ghost'), refusal(4));
});

test('review on a non-proposed item is refused as precondition', async () => {
  const cwd = tmpCwdFast();
  addOk(cwd, 'not-proposed-review');
  await assert.rejects(review(cwd, 'not-proposed-review'), refusal(2));
});

test('review of a runner-source proposed item returns the branch diff and no warnings', async () => {
  const cwd = initGitCwdMainFast();
  makeRunnerProposedItem(cwd, 'review-runner-item');

  const data = await review(cwd, 'review-runner-item');
  assert.equal(data.mode, 'local');
  assert.equal(data.source, 'runner');
  assert.match(data.diff, /review-runner-item-produced\.txt/);
  assert.deepEqual(data.warnings, []);
});

test('review of a pull-door proposed item returns the headAtTake..headAtReturn diff', async () => {
  const cwd = initGitCwdFast();
  addOk(cwd, 'review-pull-item', { verify: 'test -f proof.txt' });
  run(cwd, ['take', '--id', 'review-pull-item']);
  commitFile(cwd, 'proof.txt');
  run(cwd, ['return', 'review-pull-item']);

  const data = await review(cwd, 'review-pull-item');
  assert.equal(data.source, 'pull');
  assert.match(data.diff, /proof\.txt/);
  assert.deepEqual(data.warnings, []);
});

test('review of a legacy proposed item (no branch, no headAtTake/headAtReturn) degrades honestly to a warning, never a throw', async () => {
  const cwd = tmpCwdFast();
  addOk(cwd, 'review-legacy-item');
  // No claim: no branch and no headAtTake/headAtReturn, straight todo -> awaiting-approval.
  assert.equal(moveOk(cwd, 'review-legacy-item', 'awaiting-approval').status, 0);

  const data = await review(cwd, 'review-legacy-item');
  assert.equal(data.source, 'legacy');
  assert.match(data.warnings.join('\n'), /no live diff source/);
});

test('review of a leaf proposed item diffs against its resolved root branch (fgw/<root>), not main', async () => {
  const cwd = initGitCwdMainFast();
  makeRunnerProposedLeafItem(cwd, 'review-leaf-root', 'review-leaf-child', { rootDivergesFromMain: true });

  const data = await review(cwd, 'review-leaf-child');
  assert.equal(data.source, 'runner');
  assert.match(data.diff, /review-leaf-child-produced\.txt/);
  assert.doesNotMatch(data.diff, /root-only\.txt/, 'diff against fgw/<root> must not include the root branch\'s own divergence from main');
});

test('review of a root proposed item still diffs against main', async () => {
  const cwd = initGitCwdMainFast();
  makeRunnerProposedItem(cwd, 'review-root-regression-item');

  const data = await review(cwd, 'review-root-regression-item');
  assert.equal(data.source, 'runner');
  assert.match(data.diff, /review-root-regression-item-produced\.txt/);
});

test('review --github on a legacy (non-runner) item is a validation error, no state change, and no gh call is attempted', async () => {
  const cwd = initGitCwdMainFast();
  makeLegacyProposedItem(cwd, 'gh-review-legacy');
  const marker = path.join(cwd, 'gh-was-called');
  const ghCommand = writeMarkerFake(cwd, marker);

  await assert.rejects(review(cwd, 'gh-review-legacy', { github: true, ghCommand }), refusal(4, /runner-sourced item/));
  assert.equal(stateView(cwd).work['gh-review-legacy'].status, 'awaiting-approval');
  assert.ok(!fs.existsSync(marker), 'the source gate must reject before any gh CLI call');
});

test('review --github on a runner item pushes the branch and opens a PR through the gh command, reports the PR number, and never mutates FSM state', async () => {
  const cwd = initGitCwdMainFast();
  makeRunnerProposedItem(cwd, 'gh-review-ok');
  addBareOrigin(cwd);
  const ghLog = path.join(cwd, 'gh-invocations.log');
  const ghCommand = writeCreateFake(cwd, ghLog, 314);

  const ghData = await review(cwd, 'gh-review-ok', { github: true, ghCommand });
  assert.equal(ghData.outcome, 'created');
  assert.equal(ghData.prNumber, 314);
  assert.equal(ghData.head, 'fgw/gh-review-ok');
  assert.equal(ghData.base, 'main');

  // Crossed the real process boundary: the fake logged its argv.
  assert.match(fs.readFileSync(ghLog, 'utf8'), /pr create .*-H fgw\/gh-review-ok -B main/);
  // The branch really got pushed to origin.
  assert.match(execFileSync('git', ['ls-remote', '--heads', 'origin', 'fgw/gh-review-ok'], { cwd, encoding: 'utf8' }), /fgw\/gh-review-ok/);
  // review stays read-only on FSM state.
  assert.equal(stateView(cwd).work['gh-review-ok'].status, 'awaiting-approval');
});

test('review --github reports a gh failure as a result with no state mutation (read-only contract holds on the blocked path)', async () => {
  const cwd = initGitCwdMainFast();
  makeRunnerProposedItem(cwd, 'gh-review-blocked');
  addBareOrigin(cwd);

  const ghData = await review(cwd, 'gh-review-blocked', { github: true, ghCommand: writeAuthFailFake(cwd) });
  assert.equal(ghData.outcome, 'failed');
  assert.equal(ghData.reason, 'auth-failure');
  assert.equal(stateView(cwd).work['gh-review-blocked'].status, 'awaiting-approval', 'review never transitions state, even on a gh failure');
  assert.equal(stateView(cwd).frictions?.['gh-review-blocked'], undefined, 'review never records friction');
});

// --- `review --github --pr <n>` read-only status check ---
//
// Detection-only: reports an existing PR's live GitHub status and never mutates
// FSM state or friction under any outcome (a GitHub-side close is not itself an
// approval or reject action — only local `fgos reject` moves the item).
// Classification branches solely on `closed` + `mergedAt`, never the `state`
// string. Every gh is the same subprocess-injected fake; no real gh binary, no network call.
// The still-open case is the CLI's wiring proof in test/cli/fgos-merge.test.mjs.

test('review --github --pr on a legacy (non-runner) item is the same runner-sourced validation error as without --pr, and no gh call is attempted', async () => {
  const cwd = initGitCwdMainFast();
  makeLegacyProposedItem(cwd, 'gh-status-legacy');
  const marker = path.join(cwd, 'gh-was-called');
  const ghCommand = writeMarkerFake(cwd, marker);

  await assert.rejects(review(cwd, 'gh-status-legacy', { github: true, prNumber: '9', ghCommand }), refusal(4, /runner-sourced item/));
  assert.equal(stateView(cwd).work['gh-status-legacy'].status, 'awaiting-approval');
  assert.ok(!fs.existsSync(marker), 'the source gate must reject before any gh CLI call, --pr present or not');
});

test('review --github --pr on a merged PR (closed:true, mergedAt set) reports it merged, informational only, with no local state or friction change', async () => {
  const cwd = initGitCwdMainFast();
  makeRunnerProposedItem(cwd, 'gh-status-merged');
  const ghCommand = writeViewFake(cwd, 'gh-view-merged.cjs', path.join(cwd, 'gh-view.log'),
    { state: 'MERGED', mergeable: 'MERGEABLE', mergeStateStatus: 'CLEAN', mergedAt: '2026-07-17T10:00:00Z', closed: true, closedAt: '2026-07-17T10:00:00Z' });

  const mergedStatusData = await review(cwd, 'gh-status-merged', { github: true, prNumber: '42', ghCommand });
  assert.equal(mergedStatusData.prNumber, '42');
  assert.equal(mergedStatusData.outcome, 'merged');
  assert.equal(mergedStatusData.mergedAt, '2026-07-17T10:00:00Z');
  const view = stateView(cwd);
  // A GitHub-side merge is never reconciled into FSM state here.
  assert.equal(view.work['gh-status-merged'].status, 'awaiting-approval');
  assert.equal(view.frictions?.['gh-status-merged'], undefined);
});

test('review --github --pr on a closed-without-merge PR names the PR, points to fgos reject, mutates nothing, and resolves in exactly one gh invocation with mergeable UNKNOWN — proving pollTimeoutMs:0', async () => {
  const cwd = initGitCwdMainFast();
  makeRunnerProposedItem(cwd, 'gh-status-closed');
  const ghLog = path.join(cwd, 'gh-view.log');
  // mergeable:"UNKNOWN" is the honest test: were pollTimeoutMs the default 10s,
  // viewGitHubPRStatus would re-invoke this fake on a poll loop while mergeable
  // stays UNKNOWN. Exactly one logged invocation proves the pollTimeoutMs:0
  // override collapsed the loop to a single read.
  const ghCommand = writeViewFake(cwd, 'gh-view-closed.cjs', ghLog,
    { state: 'CLOSED', mergeable: 'UNKNOWN', mergeStateStatus: 'UNKNOWN', mergedAt: null, closed: true, closedAt: '2026-07-17T09:00:00Z' });

  const closedData = await review(cwd, 'gh-status-closed', { github: true, prNumber: '77', ghCommand });
  assert.equal(closedData.prNumber, '77');
  assert.equal(closedData.outcome, 'closed-unmerged');

  const invocations = fs.readFileSync(ghLog, 'utf8').trim().split('\n').filter(Boolean);
  assert.equal(invocations.length, 1, `expected exactly one gh invocation under pollTimeoutMs:0, got ${invocations.length}`);

  const view = stateView(cwd);
  assert.equal(view.work['gh-status-closed'].status, 'awaiting-approval', 'a GitHub-side close is not a reject — no FSM mutation');
  assert.equal(view.frictions?.['gh-status-closed'], undefined, 'the status check never records friction');
});

test('review --github --pr reports a gh status-check failure as a result with no state mutation or friction', async () => {
  const cwd = initGitCwdMainFast();
  makeRunnerProposedItem(cwd, 'gh-status-failed');

  const failedData = await review(cwd, 'gh-status-failed', { github: true, prNumber: '5', ghCommand: writeAuthFailFake(cwd) });
  assert.equal(failedData.outcome, 'check-failed');
  assert.equal(failedData.reason, 'auth-failure');
  const view = stateView(cwd);
  assert.equal(view.work['gh-status-failed'].status, 'awaiting-approval');
  assert.equal(view.frictions?.['gh-status-failed'], undefined);
});

// ---------------------------------------------------------------------------
// sync-root
// ---------------------------------------------------------------------------

test('sync-root on a nonexistent id is refused as validation', async () => {
  await assert.rejects(syncRoot(initGitCwdMainFast(), 'sync-root-ghost'), refusal(4));
});

test('sync-root on a root with no fgw/<id> branch is refused as validation', async () => {
  const cwd = initGitCwdMainFast();
  addOk(cwd, 'sync-root-no-branch', { verify: 'true' });
  await assert.rejects(syncRoot(cwd, 'sync-root-no-branch'), refusal(4, /does not exist/));
});

test('sync-root happy path: merges fgw/<root> into main, root item status/stage UNCHANGED, fgw/<root> survives (not deleted)', async () => {
  const cwd = initGitCwdMainFast();
  makeDriftedRoot(cwd, 'sync-root-happy', { verify: `test -f sync-root-happy-produced.txt` });
  commitPendingBeforeApprove(cwd, 'sync-root-happy');

  const data = await syncRoot(cwd, 'sync-root-happy');
  assert.equal(data.outcome, 'synced');
  assert.equal(data.target, 'main');
  assert.equal(data.branch, 'fgw/sync-root-happy');

  assert.ok(fs.existsSync(path.join(cwd, 'sync-root-happy-produced.txt')), 'the synced content must land on main');
  assert.equal(stateView(cwd).work['sync-root-happy'].status, 'doing', 'sync-root must never change the root item\'s own status');

  const branches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.match(branches, /fgw\/sync-root-happy\b/, 'sync-root must NOT delete the root branch — it stays open for further leaf merges');
});

// A branch sync is machinery, not reflection. The record still exists and
// still shows in `fgos show` (which filters decisions by id, never by kind)
// -- but it must not read as someone having thought about the work, because
// that is the one thing standing between an item and `done`. Asserted end to
// end, on the decision the real verb actually wrote, because the gate itself
// was never the defective half.
test('sync-root records exactly one decision on the root item, tagged as engine bookkeeping so it cannot satisfy the retrospective gate', async () => {
  const cwd = initGitCwdMainFast();
  makeDriftedRoot(cwd, 'sync-root-decision', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'sync-root-decision');

  assert.equal((await syncRoot(cwd, 'sync-root-decision')).outcome, 'synced');

  const decisionEvents = decisionsFor(cwd, 'sync-root-decision');
  assert.equal(decisionEvents.length, 1, 'sync-root must append exactly one real decision record');
  assert.match(decisionEvents[0].payload.text, /sync-root-decision|fgw\/sync-root-decision/);
  assert.equal(decisionEvents[0].payload.kind, 'engine', 'a mechanical branch sync is engine bookkeeping, not a design decision');

  const gate = checkRetrospectiveContent(stateView(cwd), 'sync-root-decision', cwd);
  assert.equal(gate.ok, false, 'a synced root with no retrospective document must not pass the cleanup gate on its sync record alone');
});

test('sync-root nested: a root with a parent merges into fgw/<parentId>, not main; main stays untouched; the child root\'s status stays unchanged', async () => {
  const cwd = initGitCwdMainFast();
  // grandroot (target for the nested sync) is itself a plain root with a
  // real branch but no drift of its own.
  addWork(fgosDir(cwd), { id: 'sync-root-grandparent', title: 'Title grandparent', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  commitPending(cwd, 'state: add grandparent');

  // fgw/<grandparent> must be cut AFTER the child's own state events (add +
  // claim, inside makeDriftedRoot) already landed on main — cutting it
  // earlier leaves fgw/child's later commits carrying a legitimate .fgos/
  // diff relative to fgw/grandparent, which mergeRunnerItem's guard
  // correctly refuses as fgos-write-rejected.
  makeDriftedRoot(cwd, 'sync-root-nested-child', { parent: 'sync-root-grandparent', verify: `test -f sync-root-nested-child-produced.txt` });
  gitAtCwd(cwd, ['branch', 'fgw/sync-root-grandparent', 'main']);
  commitPendingBeforeApprove(cwd, 'sync-root-nested-child');

  const headBefore = gitHead(cwd);
  const data = await syncRoot(cwd, 'sync-root-nested-child');
  assert.equal(data.target, 'fgw/sync-root-grandparent');

  assert.equal(gitHead(cwd), headBefore, 'main must be byte-for-byte unchanged by a nested sync-root');
  assert.equal(
    fs.existsSync(path.join(cwd, 'sync-root-nested-child-produced.txt')),
    false,
    'the nested child\'s content must not land on the human\'s own main checkout',
  );
  assert.match(gitAtCwd(cwd, ['show', 'fgw/sync-root-grandparent:sync-root-nested-child-produced.txt']), /ok/);
  assert.equal(stateView(cwd).work['sync-root-nested-child'].status, 'doing');
});

test('sync-root aborts cleanly on a genuine conflict: main left byte-for-byte unchanged, root status untouched', async () => {
  const cwd = initGitCwdMainFast();
  makeDriftedRoot(cwd, 'sync-root-conflict', { verify: 'true' });
  // A conflicting change on main AFTER the root branch forked, on the exact
  // same path the root's own commit touches.
  fs.writeFileSync(path.join(cwd, 'sync-root-conflict-produced.txt'), 'conflicting main content\n');
  gitAtCwd(cwd, ['add', 'sync-root-conflict-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'unrelated main edit that collides']);
  commitPendingBeforeApprove(cwd, 'sync-root-conflict');

  const headBefore = gitHead(cwd);
  const data = await syncRoot(cwd, 'sync-root-conflict');
  assert.equal(data.outcome, 'blocked');
  assert.equal(data.reason, 'merge-conflict');

  assert.equal(gitHead(cwd), headBefore, 'main must be byte-for-byte unchanged after an aborted sync-root');
  assert.equal(stateView(cwd).work['sync-root-conflict'].status, 'doing', 'a blocked sync-root must never touch the root item\'s status');
});

test('sync-root on a no-parent root refuses when the shared main checkout carries an uncommitted change on a path the root itself touches; no merge lands', async () => {
  const cwd = initGitCwdMainFast();
  makeDriftedRoot(cwd, 'sync-root-dirty', { verify: 'true' });
  // sync-root-dirty-produced.txt IS in this root's own fgw/sync-root-dirty
  // diff — re-dirtying that SAME path on main, uncommitted, is the
  // own-file-set conflict this gate exists to catch (an UNRELATED dirty path
  // is tolerated by isMainTreeClean's ownFileSet scoping, so the negative
  // case here must be a same-path one).
  fs.writeFileSync(path.join(cwd, 'sync-root-dirty-produced.txt'), 'clobbered by another writer\n'); // never git add/commit

  const headBefore = gitHead(cwd);
  await assert.rejects(syncRoot(cwd, 'sync-root-dirty'), refusal(4, /is not clean/));

  assert.equal(gitHead(cwd), headBefore, 'main must be byte-for-byte unchanged when sync-root refuses on a dirty tree');
  assert.equal(fs.readFileSync(path.join(cwd, 'sync-root-dirty-produced.txt'), 'utf8'), 'clobbered by another writer\n', 'the uncommitted local change must survive untouched');
  assert.equal(stateView(cwd).work['sync-root-dirty'].status, 'doing', 'a refused sync-root must never touch the root item\'s status');
});

test('sync-root refuses a linked worktree as its repo root (it must land on the real main checkout)', async () => {
  const cwd = initGitCwdMainFast();
  makeDriftedRoot(cwd, 'sync-root-worktree-guard', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'sync-root-worktree-guard');
  const wt = linkedWorktree(cwd, 'sync-root-side-branch');

  try {
    await assert.rejects(syncRoot(cwd, 'sync-root-worktree-guard', wt), refusal(4, /main checkout/));
  } finally {
    gitAtCwd(cwd, ['worktree', 'remove', '--force', wt]);
  }
});

// The Iron Law refusal (before any git mutation) and the verify-fail blocked
// outcome, adapted to sync-root's own makeDriftedRoot helper and outcome
// shape -- unlike approve, sync-root never changes the root item's own status.

test('sync-root of a root whose diff touches a self-modifying-capable module REFUSES without acknowledging the Iron Law: root status untouched, no merge', async () => {
  const cwd = initGitCwdMainFast();
  addWork(fgosDir(cwd), { id: 'sync-root-iron-refuse', title: 'Title sync-root-iron-refuse', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'test -f src/runner/probe.mjs' });
  commitPending(cwd, 'state: add sync-root-iron-refuse');
  // `take` writes no durable move, but claimWork still durably appends a
  // predicted work.outcome -- flush it before branching.
  run(cwd, ['take', '--id', 'sync-root-iron-refuse']);
  commitPending(cwd, 'state: claim sync-root-iron-refuse');

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/sync-root-iron-refuse']);
  fs.mkdirSync(path.join(cwd, 'src/runner'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'src/runner/probe.mjs'), 'export const produced = true;\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'worker output for sync-root-iron-refuse']);
  gitAtCwd(cwd, ['checkout', 'main']);
  commitPendingBeforeApprove(cwd, 'sync-root-iron-refuse');

  const headBefore = gitHead(cwd);
  await assert.rejects(syncRoot(cwd, 'sync-root-iron-refuse'), (err) => {
    assert.ok(refusal(4)(err), `expected a validation refusal: ${err}`);
    assert.match(err.message, /Iron Law/);
    assert.match(err.message, /src\/runner\/probe\.mjs/, 'the refusal must name the exact module that tripped required:true');
    assert.match(err.message, /--acknowledge-iron-law/);
    return true;
  });

  assert.equal(gitHead(cwd), headBefore, 'a refused sync-root attempts no merge -- HEAD is unchanged');
  assert.equal(stateView(cwd).work['sync-root-iron-refuse'].status, 'doing', 'sync-root must never change the root item\'s own status, including on Iron Law refusal');
  const survivingBranches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/']);
  assert.match(survivingBranches, /fgw\/sync-root-iron-refuse/, 'the branch survives an Iron Law refusal -- nothing was merged or cleaned up');
});

test('sync-root of a root whose staged merge fails its own verify: outcome blocked reason verify-fail, root status untouched', async () => {
  const cwd = initGitCwdMainFast();
  makeDriftedRoot(cwd, 'sync-root-verify-fail', { verify: 'test -f file-never-produced.txt' });
  commitPendingBeforeApprove(cwd, 'sync-root-verify-fail');

  const headBefore = gitHead(cwd);
  const data = await syncRoot(cwd, 'sync-root-verify-fail');
  assert.equal(data.outcome, 'blocked');
  assert.equal(data.reason, 'verify-fail');

  assert.equal(gitHead(cwd), headBefore, 'main must be byte-for-byte unchanged after an aborted sync-root');
  assert.equal(fs.existsSync(path.join(cwd, 'sync-root-verify-fail-produced.txt')), false, 'a staged-then-aborted merge must not leave its file behind');
  assert.equal(stateView(cwd).work['sync-root-verify-fail'].status, 'doing', 'sync-root must never change the root item\'s own status, including on a verify-fail block');
});

test('sync-root never reports outcome "synced" when landRunnerItem returns an outcome it does not explicitly handle', async () => {
  const cwd = initGitCwdMainFast();
  makeDriftedRoot(cwd, 'sync-root-blocked-other', { verify: 'true' });

  // Another item's in-progress/abandoned merge already staged on the main
  // checkout -- a real, unrelated branch, staged but never committed or
  // aborted, which makes landRunnerItem return 'merge-blocked-other-item'.
  gitAtCwd(cwd, ['checkout', '-b', 'fgw/sync-root-other-blocker']);
  fs.writeFileSync(path.join(cwd, 'sync-root-other-blocker-produced.txt'), 'other\n');
  gitAtCwd(cwd, ['add', 'sync-root-other-blocker-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'worker output for sync-root-other-blocker']);
  gitAtCwd(cwd, ['checkout', 'main']);
  gitAtCwd(cwd, ['merge', '--no-commit', '--no-ff', 'fgw/sync-root-other-blocker']);

  const headBefore = gitHead(cwd);
  const data = await syncRoot(cwd, 'sync-root-blocked-other');
  assert.notEqual(data.outcome, 'synced', 'must never report success for an outcome it does not recognize');
  assert.equal(data.outcome, 'blocked');
  assert.equal(data.reason, 'merge-blocked-other-item');

  assert.equal(gitHead(cwd), headBefore, 'main must be unchanged');
  assert.doesNotThrow(
    () => gitAtCwd(cwd, ['rev-parse', '--verify', 'MERGE_HEAD']),
    'the other item\'s MERGE_HEAD must survive untouched',
  );
  assert.equal(fs.existsSync(path.join(cwd, 'sync-root-blocked-other-produced.txt')), false, 'the drifted root\'s own content must NOT have landed on main');
  assert.equal(stateView(cwd).work['sync-root-blocked-other'].status, 'doing', 'a blocked sync-root must never touch the root item\'s status');
  const mergedDecisions = decisionsFor(cwd, 'sync-root-blocked-other').filter((e) => /merged/.test(e.payload?.text ?? ''));
  assert.equal(mergedDecisions.length, 0, 'must never record a "merged" decision for a merge that never actually completed');
});

test('sync-root outcome guard catches a publication Land refuses over an untracked collision and records unhandled-outcome friction', async () => {
  const cwd = initGitCwdMainFast();
  makeDriftedRoot(cwd, 'sync-root-merge-failed', { verify: 'true' });

  // `git merge --no-commit --no-ff` can fail WITHOUT ever creating
  // MERGE_HEAD when an untracked file at the target checkout collides with a
  // DIRECTORY path the incoming branch needs to create. The collision path
  // must be the directory itself, never the leaf file the branch's own diff
  // introduces -- an untracked file at that leaf path would instead trip the
  // earlier dirty-tree refusal (isMainTreeClean's ownFileSet only ever
  // contains leaf paths), so this reaches landRunnerItem itself.
  gitAtCwd(cwd, ['checkout', 'fgw/sync-root-merge-failed']);
  fs.mkdirSync(path.join(cwd, 'sync-root-merge-failed-dir'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'sync-root-merge-failed-dir', 'leaf.txt'), 'from-branch\n');
  gitAtCwd(cwd, ['add', 'sync-root-merge-failed-dir/leaf.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'branch adds a nested leaf file']);
  gitAtCwd(cwd, ['checkout', 'main']);

  // A stray untracked file already sitting at the exact directory path the
  // branch needs to create. Land never writes over it: its publication gate
  // refuses before the ref moves, an outcome sync-root does not handle by
  // name, never 'conflict'.
  fs.writeFileSync(path.join(cwd, 'sync-root-merge-failed-dir'), 'stray-untracked\n');

  const headBefore = gitHead(cwd);
  const data = await syncRoot(cwd, 'sync-root-merge-failed');
  assert.notEqual(data.outcome, 'synced', 'must never report success for an outcome it does not recognize');
  assert.equal(data.outcome, 'blocked');
  assert.equal(data.reason, 'main-checkout-dirty-mid-merge');

  assert.equal(gitHead(cwd), headBefore, 'main must be unchanged');
  assert.throws(
    () => gitAtCwd(cwd, ['rev-parse', '--verify', 'MERGE_HEAD']),
    'MERGE_HEAD must never have existed -- this was never a real conflict, git refused before staging anything',
  );
  assert.equal(fs.existsSync(path.join(cwd, 'sync-root-merge-failed-produced.txt')), false, 'the drifted root\'s own top-level content must NOT have landed on main');
  assert.equal(fs.readFileSync(path.join(cwd, 'sync-root-merge-failed-dir'), 'utf8'), 'stray-untracked\n', 'the stray untracked file must survive untouched');
  assert.equal(stateView(cwd).work['sync-root-merge-failed'].status, 'doing', 'a blocked sync-root must never touch the root item\'s status');

  const frictions = stateView(cwd).frictions?.['sync-root-merge-failed'] ?? [];
  const unhandledFriction = frictions.find((f) => f.errorClass === 'sync-root-unhandled-outcome');
  assert.ok(unhandledFriction, 'frictions must contain an entry with errorClass === "sync-root-unhandled-outcome"');
  assert.match(unhandledFriction.detail, /unrecognized outcome "main-checkout-dirty-mid-merge"/, 'friction detail names the outcome it refused to report as success');

  const mergedDecisions = decisionsFor(cwd, 'sync-root-merge-failed').filter((e) => /merged/.test(e.payload?.text ?? ''));
  assert.equal(mergedDecisions.length, 0, 'must never record a "merged" decision for a merge that never actually completed');
});

// ---------------------------------------------------------------------------
// promote-to-component
// ---------------------------------------------------------------------------

test('promote-to-component on a nonexistent member id is refused as validation', async () => {
  const cwd = initGitCwdMainFast();
  makeFlatMember(cwd, 'ptc-real-a');
  await assert.rejects(promote(cwd, ['ptc-real-a', 'ptc-ghost'], { rootTitle: 'Component ghost' }), refusal(4, /ptc-ghost.*not found/));
});

test('promote-to-component refuses a member that already has a parent', async () => {
  const cwd = initGitCwdMainFast();
  makeFlatMember(cwd, 'ptc-sibling');
  makeFlatMember(cwd, 'ptc-already-parented', { deps: ['ptc-sibling'] });
  editWork(fgosDir(cwd), { id: 'ptc-already-parented', patch: { parent: 'some-other-root' } });
  commitPending(cwd, 'state: pre-parent ptc-already-parented');

  await assert.rejects(promote(cwd, ['ptc-already-parented', 'ptc-sibling'], { rootTitle: 'Component reject' }), refusal(4, /already has parent/));
});

test('promote-to-component refuses ids that are not connected via deps/mergeAfter', async () => {
  const cwd = initGitCwdMainFast();
  makeFlatMember(cwd, 'ptc-disconnected-a');
  makeFlatMember(cwd, 'ptc-disconnected-b');
  await assert.rejects(promote(cwd, ['ptc-disconnected-a', 'ptc-disconnected-b'], { rootTitle: 'Component disconnected' }), refusal(4, /not all connected/));
});

test('promote-to-component with a new root: creates a fresh root, merges both members into it, sets parent only after real success, records one engine decision', async () => {
  const cwd = initGitCwdMainFast();
  registerFlatMember(cwd, 'ptc-new-root-a');
  registerFlatMember(cwd, 'ptc-new-root-b', { deps: ['ptc-new-root-a'] });
  commitPending(cwd, 'state: setup ptc-new-root members');
  cutMemberBranch(cwd, 'ptc-new-root-a');
  cutMemberBranch(cwd, 'ptc-new-root-b');

  const data = await promote(cwd, ['ptc-new-root-a', 'ptc-new-root-b'], { rootTitle: 'Component new root' });
  assert.equal(data.rootCreated, true);
  assert.equal(data.results.find((r) => r.id === 'ptc-new-root-a').outcome, 'merged');
  assert.equal(data.results.find((r) => r.id === 'ptc-new-root-b').outcome, 'merged');

  const view = stateView(cwd);
  assert.equal(view.work['ptc-new-root-a'].parent, data.rootId);
  assert.equal(view.work['ptc-new-root-b'].parent, data.rootId);
  assert.equal(view.work[data.rootId].status, 'todo', 'a freshly created root is not claimed by this action');

  const rootFiles = gitAtCwd(cwd, ['ls-tree', '-r', '--name-only', `fgw/${data.rootId}`]);
  assert.match(rootFiles, /ptc-new-root-a-produced\.txt/);
  assert.match(rootFiles, /ptc-new-root-b-produced\.txt/);

  const decisionEvents = decisionsFor(cwd, data.rootId);
  assert.equal(decisionEvents.length, 1, 'promote-to-component must append exactly one real decision record');
  assert.match(decisionEvents[0].payload.text, /ptc-new-root-a/);
  assert.match(decisionEvents[0].payload.text, /ptc-new-root-b/);
  // Converging siblings into a component is machinery, so its record must
  // not read as reflection at the retrospective gate.
  assert.equal(decisionEvents[0].payload.kind, 'engine', 'a mechanical component promotion is engine bookkeeping, not a design decision');
  const gate = checkRetrospectiveContent(stateView(cwd), data.rootId, cwd);
  assert.equal(gate.ok, false, 'a promoted root with no retrospective document must not pass the cleanup gate on its promotion record alone');
});

test('promote-to-component reusing a member as root: the root itself is skipped, not merged', async () => {
  const cwd = initGitCwdMainFast();
  // Connectivity edge direction matters here: buildUnifiedAdjacency adds
  // parent -> child for a `parent` edge and id -> target for both `deps` and
  // `mergeAfter` — the SAME direction. Promoting ptc-reuse-root to root sets
  // ptc-reuse-other.parent = 'ptc-reuse-root' (edge root -> other); an edge
  // ptc-reuse-other -> ptc-reuse-root would close a real cycle (see the
  // merged-parent-rejected test below). Declaring the edge on the ROOT side
  // matches the parent edge's own direction, so no cycle.
  registerFlatMember(cwd, 'ptc-reuse-other');
  registerFlatMember(cwd, 'ptc-reuse-root', { mergeAfter: ['ptc-reuse-other'] });
  commitPending(cwd, 'state: setup ptc-reuse members');
  cutMemberBranch(cwd, 'ptc-reuse-root');
  cutMemberBranch(cwd, 'ptc-reuse-other');

  const data = await promote(cwd, ['ptc-reuse-root', 'ptc-reuse-other'], { rootId: 'ptc-reuse-root' });
  assert.equal(data.rootCreated, false);
  assert.equal(data.rootId, 'ptc-reuse-root');
  assert.equal(data.results.find((r) => r.id === 'ptc-reuse-root').outcome, 'skipped');
  assert.equal(data.results.find((r) => r.id === 'ptc-reuse-other').outcome, 'merged');

  const view = stateView(cwd);
  assert.equal(view.work['ptc-reuse-other'].parent, 'ptc-reuse-root');
  assert.equal(view.work['ptc-reuse-root'].parent, undefined, 'root never sets its own parent to itself');
  assert.match(gitAtCwd(cwd, ['ls-tree', '-r', '--name-only', 'fgw/ptc-reuse-root']), /ptc-reuse-other-produced\.txt/);
});

test('promote-to-component reports merged-parent-rejected (never crashes) when the real git merge succeeds but setting parent would close a deps+parent cycle', async () => {
  const cwd = initGitCwdMainFast();
  registerFlatMember(cwd, 'ptc-cycle-root');
  // deps (not mergeAfter) deliberately: ptc-cycle-other depends on the very
  // item this test promotes to root, so setting ptc-cycle-other.parent =
  // 'ptc-cycle-root' afterward closes a real deps+parent cycle.
  registerFlatMember(cwd, 'ptc-cycle-other', { deps: ['ptc-cycle-root'] });
  commitPending(cwd, 'state: setup ptc-cycle members');
  cutMemberBranch(cwd, 'ptc-cycle-root');
  cutMemberBranch(cwd, 'ptc-cycle-other');

  const data = await promote(cwd, ['ptc-cycle-root', 'ptc-cycle-other'], { rootId: 'ptc-cycle-root' });
  const otherResult = data.results.find((r) => r.id === 'ptc-cycle-other');
  assert.equal(otherResult.outcome, 'merged-parent-rejected');
  assert.match(otherResult.reason, /graph cycle/);

  // The real git merge landed regardless of the state-layer rejection —
  // this outcome exists precisely because git succeeded where state didn't.
  assert.match(gitAtCwd(cwd, ['ls-tree', '-r', '--name-only', 'fgw/ptc-cycle-root']), /ptc-cycle-other-produced\.txt/);
  assert.equal(stateView(cwd).work['ptc-cycle-other'].parent, undefined, 'a rejected parent-set never silently applies anyway');

  const decisionEvents = decisionsFor(cwd, data.rootId);
  assert.equal(decisionEvents.length, 1, 'a per-member rejection still gets exactly one real decision record');
  assert.match(decisionEvents[0].payload.text, /ptc-cycle-other/);
});

test('promote-to-component bails a conflicting member without setting its parent, still processes and merges the rest', async () => {
  const cwd = initGitCwdMainFast();
  const dir = fgosDir(cwd);
  addWork(dir, { id: 'ptc-conflict-b', title: 'Title conflict b', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  addWork(dir, { id: 'ptc-conflict-a', title: 'Title conflict a', kind: 'task', status: 'todo', deps: ['ptc-conflict-b'], risk: 'light', refs: [], verify: 'true' });
  commitPending(cwd, 'state: add ptc-conflict members');
  // `take` writes no durable move, but claimWork still durably appends a
  // predicted work.outcome -- flush both before branching.
  run(cwd, ['take', '--id', 'ptc-conflict-a']);
  run(cwd, ['take', '--id', 'ptc-conflict-b']);
  commitPending(cwd, 'state: claim ptc-conflict members');

  // The root is created from main's current tip, so ptc-conflict-a edits
  // seed.txt on a branch cut before main edits the same file.
  gitAtCwd(cwd, ['checkout', '-b', 'fgw/ptc-conflict-a']);
  fs.writeFileSync(path.join(cwd, 'seed.txt'), 'edited by ptc-conflict-a\n');
  gitAtCwd(cwd, ['add', 'seed.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'ptc-conflict-a edits seed.txt']);
  gitAtCwd(cwd, ['checkout', 'main']);
  fs.writeFileSync(path.join(cwd, 'seed.txt'), 'edited by main after branch cut\n');
  gitAtCwd(cwd, ['add', 'seed.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'main also edits seed.txt']);

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/ptc-conflict-b']);
  fs.writeFileSync(path.join(cwd, 'ptc-conflict-b-produced.txt'), 'ok\n');
  gitAtCwd(cwd, ['add', 'ptc-conflict-b-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'work for ptc-conflict-b']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const data = await promote(cwd, ['ptc-conflict-a', 'ptc-conflict-b'], { rootTitle: 'Component conflict' });
  const aResult = data.results.find((r) => r.id === 'ptc-conflict-a');
  const bResult = data.results.find((r) => r.id === 'ptc-conflict-b');
  assert.equal(aResult.outcome, 'bailed');
  assert.equal(aResult.reason, 'merge-conflict');
  assert.equal(bResult.outcome, 'merged');

  const view = stateView(cwd);
  assert.equal(view.work['ptc-conflict-a'].parent, undefined, 'a bailed member never gets parent set');
  assert.equal(view.work['ptc-conflict-b'].parent, data.rootId);
});

test('promote-to-component refuses a linked worktree as its repo root (it must land on the real main checkout)', async () => {
  const cwd = initGitCwdMainFast();
  makeFlatMember(cwd, 'ptc-worktree-guard-a');
  makeFlatMember(cwd, 'ptc-worktree-guard-b', { deps: ['ptc-worktree-guard-a'] });
  const wt = linkedWorktree(cwd, 'ptc-worktree-guard-side-branch');

  try {
    await assert.rejects(
      promote(cwd, ['ptc-worktree-guard-a', 'ptc-worktree-guard-b'], { rootTitle: 'Component worktree guard' }, wt),
      refusal(4, /main checkout/),
    );
  } finally {
    gitAtCwd(cwd, ['worktree', 'remove', '--force', wt]);
  }
});

// ---------------------------------------------------------------------------
// merge list
// ---------------------------------------------------------------------------

const EMPTY_LIST = { ready: [], waiting: [], conflicts: [], mergeSets: [], blockedOnSync: [], strandedByResolvedRoot: [], mergeTier: {}, supersededOut: [], stepByItem: {}, tree: [] };

test('merge list on an empty store: empty ready/waiting/conflicts, no event appended', () => {
  const cwd = tmpCwdFast();
  const before = eventLines(cwd).length;
  assert.deepEqual(list(cwd), EMPTY_LIST);
  assert.equal(eventLines(cwd).length, before, 'merge list must not append any event');
});

test('merge list: a proposed item whose dep is already done is ready', async () => {
  const cwd = tmpCwdFast();
  // verify `true`: the bare sandbox has no package.json, so a default
  // 'npm test' verify would park the dep 'blocked' instead of delivering it.
  addItem(cwd, 'dep', { title: 'Dep' });
  // No real claim needed (no branch) -- straight todo -> awaiting-approval.
  assert.equal(moveOk(cwd, 'dep', 'awaiting-approval').status, 0);
  const approveResult = await approve(cwd, 'dep');
  assert.equal(approveResult.to, 'delivered', `expected dep to reach delivered, got: ${JSON.stringify(approveResult)}`);
  // merge list reads RESOLVED_STATUSES = {done, wontfix}: walk the rest of the chain.
  for (const to of ['retrospective', 'cleanup', 'done']) assert.equal(moveOk(cwd, 'dep', to).status, 0);
  addItem(cwd, 'leaf', { title: 'Leaf', deps: ['dep'] });
  toProposed(cwd, 'leaf');

  // Both items keep their entry stage: every move above only touches `status`.
  assert.deepEqual(list(cwd), {
    ...EMPTY_LIST,
    ready: ['leaf'],
    mergeTier: { leaf: 'root-to-main' },
    stepByItem: { dep: 'discovery', leaf: 'discovery' },
    tree: [{ id: 'leaf', title: 'Leaf', status: 'ready', children: [] }],
  });
});

test('merge list: a proposed item whose dep is NOT done waits, never ready', () => {
  const cwd = tmpCwdFast();
  assert.equal(addOk(cwd, 'dep').status, 0); // stays todo, at addOk's executing stage
  addItem(cwd, 'leaf', { title: 'Leaf', deps: ['dep'] });
  toProposed(cwd, 'leaf');

  assert.deepEqual(list(cwd), {
    ...EMPTY_LIST,
    waiting: ['leaf'],
    mergeTier: { leaf: 'root-to-main' },
    stepByItem: { dep: 'executing', leaf: 'discovery' },
    tree: [{ id: 'leaf', title: 'Leaf', status: 'waiting', children: [] }],
  });
});

test('merge list: two dep-clear proposed items sharing a footprint are excluded from ready and listed as conflicts', () => {
  const cwd = tmpCwdFast();
  addItem(cwd, 'a', { footprint: ['src/x.mjs'] });
  addItem(cwd, 'b', { footprint: ['src/x.mjs'] });
  toProposed(cwd, 'a');
  toProposed(cwd, 'b');
  const data = list(cwd);
  assert.deepEqual(data.ready, []);
  assert.deepEqual(data.conflicts, [{ a: 'a', b: 'b', shared: ['src/x.mjs'], suggestions: ['sequence', 'hoist', 're-slice'] }]);
});

// ---------------------------------------------------------------------------
// merge next
// ---------------------------------------------------------------------------

test('merge next with nothing ready and no blockedOnSync candidate reports nothing ready, attempts no merge, and carries no syncRoot key', async () => {
  const data = await next(tmpCwdFast());
  assert.deepEqual(data, { picked: null, reason: 'nothing ready to merge' });
});

test('merge next merges the single ready item through approve, and the item reaches delivered', async () => {
  const cwd = tmpCwdFast();
  addItem(cwd, 'solo', { title: 'Solo' });
  assert.equal(moveOk(cwd, 'solo', 'awaiting-approval').status, 0);

  const data = await next(cwd);
  assert.equal(data.picked, 'solo');
  assert.equal(data.approve.to, 'delivered', `expected the picked item to reach delivered: ${JSON.stringify(data)}`);
  assert.equal(stateView(cwd).work.solo.status, 'delivered');
});

test('merge next picks the higher-ranked (mvp goalTier) item first when two are ready', async () => {
  const cwd = tmpCwdFast();
  addItem(cwd, 'plain');
  addItem(cwd, 'important', { goalTier: 'mvp' });
  for (const id of ['plain', 'important']) assert.equal(moveOk(cwd, id, 'awaiting-approval').status, 0);

  assert.equal((await next(cwd)).picked, 'important', 'the mvp-goalTier item outranks the plain one per rankImpact');
});

// The picker SKIPS a provably Iron-Law-required candidate instead of
// returning it as "picked" and merging nothing -- classifyIronLaw is pure,
// so this is decided before any merge is attempted. A SOLE ready item that
// trips the Iron Law is never attempted ("every ready item is blocked"), and
// when a second, non-blocked ready item also exists, THAT one gets picked.

test('merge next on a SOLE ready item that trips the Iron Law: skips it without attempting a merge, never auto-acknowledges', async () => {
  const cwd = initGitCwdMainFast();
  makeRunnerProposedItemTouching(cwd, 'iron-next-item', 'src/runner/probe.mjs', { verify: 'test -f src/runner/probe.mjs' });

  const headBefore = gitHead(cwd);
  const data = await next(cwd);
  assert.equal(data.picked, null, 'the Iron-Law-required item must never be reported as picked -- it was never attempted');
  assert.equal(data.reason, 'every ready item is blocked');
  assert.deepEqual(data.skipped, [{ id: 'iron-next-item', reason: 'iron-law' }]);
  assert.ok(!('blocked' in data), 'blocked is for a real attempted-and-failed merge -- this candidate was never attempted');

  assert.equal(stateView(cwd).work['iron-next-item'].status, 'awaiting-approval', 'a skipped pick leaves the item exactly where it was');
  assert.equal(gitHead(cwd), headBefore, 'a skipped pick attempts no merge -- HEAD is unchanged');
  assert.match(gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/']), /fgw\/iron-next-item/, 'the branch survives -- nothing was merged or cleaned up');
});

test('merge next with one Iron-Law-required ready item AND one ordinary ready item: skips the first, picks and merges the other', async () => {
  const cwd = initGitCwdMainFast();
  makeRunnerProposedItemTouching(cwd, 'iron-next-item', 'src/runner/probe.mjs', { verify: 'test -f src/runner/probe.mjs' });
  makeRunnerProposedItem(cwd, 'ordinary-next-item', { verify: 'true' });

  const data = await next(cwd);
  assert.equal(data.picked, 'ordinary-next-item', 'the non-blocked ready item must be picked, not the Iron-Law one, regardless of rank order');
  assert.equal(data.approve.to, 'delivered');
  assert.deepEqual(data.skipped, [{ id: 'iron-next-item', reason: 'iron-law' }]);

  assert.equal(stateView(cwd).work['ordinary-next-item'].status, 'delivered');
  assert.equal(stateView(cwd).work['iron-next-item'].status, 'awaiting-approval', 'the skipped item is untouched -- still there for a human to acknowledge, next call');
});

// Before giving up, merge next tries the single top-ranked blockedOnSync root
// through sync-root. `picked` is the resolved root id on every real attempt,
// never null: `picked: null` is merge-loop's frontier-empty signal, which
// would silently swallow a real conflict as if nothing were wrong.

test('merge next auto-syncs a blockedOnSync root before giving up: drift clears, the now-ready item merges to delivered', async () => {
  const cwd = initGitCwdMainFast();
  makeDriftedRootAwaitingApproval(cwd, 'auto-sync-happy', { verify: 'test -f auto-sync-happy-produced.txt' });

  const data = await next(cwd);
  assert.equal(data.syncRoot.id, 'auto-sync-happy');
  assert.equal(data.syncRoot.outcome, 'synced');
  assert.equal(data.picked, 'auto-sync-happy', `expected the synced root to be picked next: ${JSON.stringify(data)}`);
  assert.equal(data.approve.to, 'delivered', `expected the synced+ready item to reach delivered: ${JSON.stringify(data)}`);
  assert.ok(fs.existsSync(path.join(cwd, 'auto-sync-happy-produced.txt')), 'sync-root\'s merge must land on main before approve re-verifies');
  assert.equal(stateView(cwd).work['auto-sync-happy'].status, 'delivered');
});

test('merge next on a blockedOnSync root whose sync-root attempt hits a genuine conflict: picked is the root id, blocked, main untouched', async () => {
  const cwd = initGitCwdMainFast();
  makeDriftedRoot(cwd, 'auto-sync-conflict', { verify: 'true' });
  // An unrelated main commit on the exact path the root's own commit touches.
  fs.writeFileSync(path.join(cwd, 'auto-sync-conflict-produced.txt'), 'conflicting main content\n');
  gitAtCwd(cwd, ['add', 'auto-sync-conflict-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'unrelated main edit that collides']);
  addItem(cwd, 'auto-sync-conflict-child', { title: 'child', parent: 'auto-sync-conflict' });
  assert.equal(moveOk(cwd, 'auto-sync-conflict', 'awaiting-approval', { skipReturnGuard: "test fixture setup, not exercising return's own guard" }).status, 0);
  commitPendingBeforeApprove(cwd, 'auto-sync-conflict');

  const headBefore = gitHead(cwd);
  const data = await next(cwd);
  assert.equal(data.picked, 'auto-sync-conflict');
  assert.equal(data.blocked, 'merge-conflict');
  assert.equal(data.syncRoot.outcome, 'blocked');
  assert.equal(data.syncRoot.reason, 'merge-conflict');

  assert.equal(gitHead(cwd), headBefore, 'main must be byte-for-byte unchanged after an aborted auto-sync');
  assert.equal(stateView(cwd).work['auto-sync-conflict'].status, 'awaiting-approval', 'a blocked sync must never touch the root item\'s own status');
});

test('merge next on a blockedOnSync root whose sync-root attempt hits a dirty main checkout: picked is the root id, blocked: dirty-tree, main untouched', async () => {
  const cwd = initGitCwdMainFast();
  makeDriftedRootAwaitingApproval(cwd, 'auto-sync-dirty', { verify: 'true' });
  // auto-sync-dirty-produced.txt IS in this root's own branch diff —
  // re-dirtying that SAME path on main, uncommitted, after the state commits
  // is the own-file-set conflict the gate catches on the unattended path.
  fs.writeFileSync(path.join(cwd, 'auto-sync-dirty-produced.txt'), 'clobbered by another writer\n'); // never git add/commit

  const headBefore = gitHead(cwd);
  const data = await next(cwd);
  assert.equal(data.picked, 'auto-sync-dirty');
  assert.equal(data.blocked, 'dirty-tree');
  assert.match(data.message, /is not clean/);
  assert.equal(data.syncRoot.id, 'auto-sync-dirty');

  assert.equal(gitHead(cwd), headBefore, 'main must be byte-for-byte unchanged after a refused auto-sync');
  assert.equal(fs.readFileSync(path.join(cwd, 'auto-sync-dirty-produced.txt'), 'utf8'), 'clobbered by another writer\n', 'the uncommitted local change must survive untouched');
  assert.equal(stateView(cwd).work['auto-sync-dirty'].status, 'awaiting-approval', 'a blocked sync must never touch the root item\'s own status');
});
