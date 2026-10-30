// The cases of approve for root and verify-only items, called in this process through approveUseCase: the refusals,
// the merge of a runner item into main, the evidence gates, milestone close-out and the verify-only paths. Leaf merges
// and where approve may run from are in approve-leaf-and-worktree.test.mjs. test/cli/fgos-approve.test.mjs keeps what
// only bin/fgos.mjs decides: flag parsing and forwarding, --trust-dir, the envelope and the exit code. The
// trunk-boundary Iron Law gate (a root refuses, a leaf proceeds, --acknowledge-iron-law records its decision) is owned
// by test/cli/fgos-iron-law-gate.test.mjs.
import '../../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { addWork, editWork } from '../../../src/state/store.mjs';
import { isStatusWriteFault } from '../../../src/verbs/merge/approve.mjs';
import { holdStateInChild } from '../../helpers/hold-state-in-child.mjs';
import {
  addOk,
  commitPending,
  commitPendingBeforeApprove,
  eventLines,
  gitAtCwd,
  gitHead,
  initGitCwdFast,
  initGitCwdMainFast,
  makeDriftedRoot,
  makeLegacyProposedItem,
  makeMilestone,
  makeRunnerProposedItem,
  makeRunnerProposedItemTouching,
  makeRunnerProposedLeafItem,
  stateView,
  tmpCwdFast,
  writeMarkerFake,
} from '../../cli/helpers/fgos-cli-harness.mjs';
import {
  approve,
  approveFaultRecord,
  branchesUnder,
  fgosDir,
  moveFixture,
  moveRootToResolved,
  proposeConflictingRunnerItem,
  proposeLeafForkedFromRoot,
  proposeLegacy,
  proposePull,
  proposeWithConcurrentMove,
  refusal,
  stageOtherItemsMerge,
} from './approve-fixtures.mjs';

// ---------------------------------------------------------------------------
// refusals before anything runs
// ---------------------------------------------------------------------------

test('approve on a nonexistent id is refused as validation', async () => {
  const cwd = tmpCwdFast();
  await assert.rejects(approve(cwd, 'ghost'), refusal(4, /not found/));
});

test('approve twice: the second approve on an item already delivered is refused as precondition', async () => {
  const cwd = tmpCwdFast();
  proposeLegacy(cwd, 'approve-twice-item', { verify: 'true' });
  assert.equal((await approve(cwd, 'approve-twice-item')).to, 'delivered');

  await assert.rejects(approve(cwd, 'approve-twice-item'), refusal(2, /not "awaiting-approval"/));
});

test('approve --github is refused for every item, before any gh call, and the item stays awaiting approval', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'gh-runner');
  makeLegacyProposedItem(cwd, 'gh-legacy');
  const marker = path.join(cwd, 'gh-was-called');
  const ghCommand = writeMarkerFake(cwd, marker);

  for (const id of ['gh-runner', 'gh-legacy']) {
    await assert.rejects(approve(cwd, id, { github: true, prNumber: '42', ghCommand }), refusal(4, /approve --github is explicitly forbidden/));
    assert.equal(stateView(cwd).work[id].status, 'awaiting-approval');
  }
  assert.ok(!fs.existsSync(marker), 'no gh call is attempted');
});

test('the Iron Law and resolved-root guards run ahead of --github: their own refusal, not the --github one', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItemTouching(cwd, 'gh-iron-refuse-item', 'src/runner/probe.mjs', { verify: 'test -f src/runner/probe.mjs' });
  await makeRunnerProposedLeafItem(cwd, 'gh-resolved-root', 'gh-resolved-root-leaf', { verify: 'true' });
  moveRootToResolved(cwd, 'gh-resolved-root', 'delivered');
  const github = { github: true, prNumber: '13' };

  await assert.rejects(approve(cwd, 'gh-iron-refuse-item', github), refusal(4, /Iron Law/, /src\/runner\/probe\.mjs/));
  await assert.rejects(approve(cwd, 'gh-resolved-root-leaf', github), refusal(4, /gh-resolved-root/, /fgos sync-root/));
  assert.equal(stateView(cwd).work['gh-iron-refuse-item'].status, 'awaiting-approval');
  assert.equal(stateView(cwd).work['gh-resolved-root-leaf'].status, 'awaiting-approval');
});

// ---------------------------------------------------------------------------
// runner item merged into main
// ---------------------------------------------------------------------------

test('approve of a runner item (happy path): merges fgw/<id> into main, verifies, awaiting-approval -> delivered with role human, records the merge, and the branch survives for the cleanup verb', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'approve-runner-item', { verify: 'test -f approve-runner-item-produced.txt' });
  commitPendingBeforeApprove(cwd, 'approve-runner-item');

  const data = await approve(cwd, 'approve-runner-item');
  assert.equal(data.to, 'delivered');
  assert.equal('cleanupWarnings' in data, false, 'approve performs no branch/worktree cleanup itself');

  const view = stateView(cwd);
  assert.equal(view.work['approve-runner-item'].status, 'delivered');
  // The 'close' settlement fires at cleanup -> done, not when approve reaches delivered.
  assert.equal(view.settlements?.['approve-runner-item'], undefined);
  assert.ok(fs.existsSync(path.join(cwd, 'approve-runner-item-produced.txt')), 'the merged file must be present on main');
  // The merge evidence is main's own post-merge commit, readable straight off the delivered event.
  assert.equal(view.work['approve-runner-item'].mergedInto, 'main');
  assert.equal(view.work['approve-runner-item'].mergedSha, gitAtCwd(cwd, ['rev-parse', 'main']).trim());
  assert.match(branchesUnder(cwd), /fgw\/approve-runner-item/, 'the merged branch survives approve — the cleanup verb deletes it later');

  const record = approveFaultRecord(cwd, 'approve-runner-item');
  assert.equal(record.phase, 'root-into-main merge');
  assert.equal(record.mergedSha, view.work['approve-runner-item'].mergedSha);
  assert.equal(record.mergedInto, 'main');
});

test('approve of a runner item succeeds after an unrelated event is appended: events never dirty the checkout', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'approve-fgos-only-dirty', { verify: 'test -f approve-fgos-only-dirty-produced.txt' });
  commitPendingBeforeApprove(cwd, 'approve-fgos-only-dirty');

  // An unrelated add appends an event to the Event Store, which lives outside the working tree.
  assert.equal(addOk(cwd, 'approve-fgos-only-dirty-noise').status, 0);
  assert.equal(gitAtCwd(cwd, ['status', '--porcelain']).trim(), '', 'an appended event leaves the checkout clean');

  assert.equal((await approve(cwd, 'approve-fgos-only-dirty')).to, 'delivered');
});

test('approve of a runner item succeeds when a dirty file on main is unrelated to the item: the gate covers the item\'s own files, not the whole tree', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'approve-unrelated-dirty', { verify: 'test -f approve-unrelated-dirty-produced.txt' });
  commitPendingBeforeApprove(cwd, 'approve-unrelated-dirty');
  // Another session's uncommitted work on a path the item's own diff never touches.
  fs.writeFileSync(path.join(cwd, 'scratch.txt'), 'unrelated uncommitted work\n');

  assert.equal((await approve(cwd, 'approve-unrelated-dirty')).to, 'delivered');
  assert.equal(fs.readFileSync(path.join(cwd, 'scratch.txt'), 'utf8'), 'unrelated uncommitted work\n', 'the unrelated dirty file is left untouched, still uncommitted');
});

test('approve of a runner item refuses when a path of its own diff is dirty again on main: validation, item stays awaiting approval', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'approve-real-conflict', { verify: 'test -f approve-real-conflict-produced.txt' });
  commitPendingBeforeApprove(cwd, 'approve-real-conflict');
  fs.writeFileSync(path.join(cwd, 'approve-real-conflict-produced.txt'), 'clobbered by another writer\n');

  await assert.rejects(approve(cwd, 'approve-real-conflict'), refusal(4, /not clean/));
  assert.equal(stateView(cwd).work['approve-real-conflict'].status, 'awaiting-approval');
});

test('approve of a runner item refuses on an uncommitted path it only declares in its footprint, never committed to the branch', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'approve-footprint-dirty', { verify: 'test -f approve-footprint-dirty-produced.txt', footprint: 'footprint-guarded.txt' });
  commitPendingBeforeApprove(cwd, 'approve-footprint-dirty');
  // Absent from the committed diff, only declared: a footprint path still blocks, closing the "forgot to add it" gap.
  fs.writeFileSync(path.join(cwd, 'footprint-guarded.txt'), 'forgot to commit this\n');

  await assert.rejects(approve(cwd, 'approve-footprint-dirty'), refusal(4, /not clean/));
  assert.equal(stateView(cwd).work['approve-footprint-dirty'].status, 'awaiting-approval');
});

test('approve of a runner item that conflicts: aborts the merge, awaiting-approval -> blocked (reason merge-conflict), main left byte-for-byte unchanged', async () => {
  const cwd = initGitCwdMainFast();
  proposeConflictingRunnerItem(cwd, 'approve-conflict-item');

  const headBefore = gitHead(cwd);
  const data = await approve(cwd, 'approve-conflict-item');
  assert.equal(data.to, 'blocked');
  assert.equal(data.reason, 'merge-conflict');

  assert.equal(gitHead(cwd), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(fs.readFileSync(path.join(cwd, 'shared.txt'), 'utf8'), 'main-change\n', 'main content must be unchanged');
  const view = stateView(cwd);
  assert.equal(view.work['approve-conflict-item'].status, 'blocked');
  assert.equal(view.frictions['approve-conflict-item'][0].errorClass, 'merge-conflict');
});

test('approve of a root item that had children, whose merge into main conflicts, parks with reason integration-drift and a main@<sha> friction detail', async () => {
  const cwd = initGitCwdMainFast();
  proposeConflictingRunnerItem(cwd, 'drift-root-item', { withChild: true });

  const headBefore = gitHead(cwd);
  assert.equal((await approve(cwd, 'drift-root-item')).reason, 'integration-drift');

  assert.equal(gitHead(cwd), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(fs.readFileSync(path.join(cwd, 'shared.txt'), 'utf8'), 'main-change\n', 'main content must be unchanged');
  const view = stateView(cwd);
  assert.equal(view.work['drift-root-item'].status, 'blocked');
  assert.equal(view.frictions['drift-root-item'][0].errorClass, 'merge-conflict');
  assert.match(view.frictions['drift-root-item'][0].detail, new RegExp(`main@${headBefore}`), 'friction detail must record the main@<sha> ref');
});

test('approve of a runner item whose staged merge fails its own verify: aborts, awaiting-approval -> blocked (reason verify-fail-post-merge), main left unchanged', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'approve-verify-fail-item', { verify: 'test -f file-never-produced.txt' });

  const headBefore = gitHead(cwd);
  const data = await approve(cwd, 'approve-verify-fail-item');
  assert.equal(data.to, 'blocked');
  assert.equal(data.reason, 'verify-fail-post-merge');

  assert.equal(gitHead(cwd), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(fs.existsSync(path.join(cwd, 'approve-verify-fail-item-produced.txt')), false, 'a staged-then-aborted merge must not leave its file behind');
  const view = stateView(cwd);
  assert.equal(view.work['approve-verify-fail-item'].status, 'blocked');
  assert.equal(view.frictions['approve-verify-fail-item'][0].errorClass, 'verify-miss');
});

test('approve of a runner item is blocked (reason merge-blocked-other-item), not misclassified as a conflict, when main already holds an unrelated item\'s MERGE_HEAD, and that merge state is left untouched', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'approve-blocked-item');
  stageOtherItemsMerge(cwd, 'other-blocker-item');

  const headBefore = gitHead(cwd);
  const data = await approve(cwd, 'approve-blocked-item');
  assert.equal(data.to, 'blocked');
  assert.equal(data.reason, 'merge-blocked-other-item');

  assert.equal(gitHead(cwd), headBefore, 'HEAD must be unchanged');
  assert.doesNotThrow(() => gitAtCwd(cwd, ['rev-parse', '--verify', 'MERGE_HEAD']), 'the other item\'s MERGE_HEAD must survive untouched');
  assert.match(gitAtCwd(cwd, ['diff', '--name-only', '--cached']), /other-blocker-item-produced\.txt/);
  assert.equal(fs.existsSync(path.join(cwd, 'approve-blocked-item-produced.txt')), false, 'the approved item\'s own merge is never attempted');
  const view = stateView(cwd);
  assert.equal(view.work['approve-blocked-item'].status, 'blocked');
  assert.equal(view.frictions['approve-blocked-item'][0].errorClass, 'merge-blocked-other-item');
});

test('approve of a root item never taken, whose merge into main hits an unrelated item\'s MERGE_HEAD, parks with reason merge-blocked-other-item', async () => {
  const cwd = initGitCwdMainFast();
  assert.equal(addOk(cwd, 'approve-blocked-root-item').status, 0);
  commitPending(cwd, 'state: add approve-blocked-root-item');
  gitAtCwd(cwd, ['checkout', '-b', 'fgw/approve-blocked-root-item']);
  fs.writeFileSync(path.join(cwd, 'approve-blocked-root-item-produced.txt'), 'ok\n');
  gitAtCwd(cwd, ['add', 'approve-blocked-root-item-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'worker output for approve-blocked-root-item']);
  gitAtCwd(cwd, ['checkout', 'main']);
  moveFixture(cwd, 'approve-blocked-root-item', 'awaiting-approval');
  commitPending(cwd, 'state: propose approve-blocked-root-item');
  stageOtherItemsMerge(cwd, 'other-blocker-root-item');

  const headBefore = gitHead(cwd);
  assert.equal((await approve(cwd, 'approve-blocked-root-item')).reason, 'merge-blocked-other-item');

  assert.equal(gitHead(cwd), headBefore, 'HEAD must be unchanged');
  assert.doesNotThrow(() => gitAtCwd(cwd, ['rev-parse', '--verify', 'MERGE_HEAD']));
  const view = stateView(cwd);
  assert.equal(view.work['approve-blocked-root-item'].status, 'blocked');
  assert.equal(view.frictions['approve-blocked-root-item'][0].errorClass, 'merge-blocked-other-item');
});

// ---------------------------------------------------------------------------
// evidence gates, checked before any merge
// ---------------------------------------------------------------------------

test('approve on a proposed item with a missing-evidence acceptance clause is refused the same way as move --to done: precondition, item stays awaiting approval, no event written', async () => {
  const cwd = tmpCwdFast();
  assert.equal(addOk(cwd, 'approve-cos-missing', { verify: 'true' }).status, 0);
  editWork(fgosDir(cwd), { id: 'approve-cos-missing', patch: { acceptance: [{ text: 'ship it' }] } });
  moveFixture(cwd, 'approve-cos-missing', 'awaiting-approval');

  const before = eventLines(cwd).length;
  await assert.rejects(approve(cwd, 'approve-cos-missing'), refusal(2, /ship it/));
  assert.equal(stateView(cwd).work['approve-cos-missing'].status, 'awaiting-approval');
  assert.equal(eventLines(cwd).length, before);
});

test('approve on a runner item with a missing-evidence acceptance clause is refused before the real git merge: precondition, main HEAD unchanged', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'runner-cos-missing');
  editWork(fgosDir(cwd), { id: 'runner-cos-missing', patch: { acceptance: [{ text: 'ship it' }] } });
  commitPendingBeforeApprove(cwd, 'runner-cos-missing');

  const mainHeadBefore = gitAtCwd(cwd, ['rev-parse', 'main']).trim();
  await assert.rejects(approve(cwd, 'runner-cos-missing'), refusal(2, /ship it/));
  assert.equal(gitAtCwd(cwd, ['rev-parse', 'main']).trim(), mainHeadBefore, 'main HEAD must be completely unchanged by a refused approve');
  assert.equal(stateView(cwd).work['runner-cos-missing'].status, 'awaiting-approval');
});

test('approve on a risk:heavy runner item with no plan.md on its branch is refused before the real git merge: precondition, main HEAD unchanged', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'runner-heavy-no-plan', { risk: 'heavy' });

  const mainHeadBefore = gitAtCwd(cwd, ['rev-parse', 'main']).trim();
  await assert.rejects(approve(cwd, 'runner-heavy-no-plan'), refusal(2, /no plan\.md found on branch "fgw\/runner-heavy-no-plan"/));
  assert.equal(gitAtCwd(cwd, ['rev-parse', 'main']).trim(), mainHeadBefore, 'main HEAD must be completely unchanged by a refused approve');
  assert.equal(stateView(cwd).work['runner-heavy-no-plan'].status, 'awaiting-approval');
});

test('approve on a risk:heavy runner item that carries a plan.md on its branch succeeds normally', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'runner-heavy-with-plan', { risk: 'heavy', verify: 'test -f runner-heavy-with-plan-produced.txt' });
  // The plan as a follow-up commit on the item's branch, the way a session commits plan.md during planning.
  gitAtCwd(cwd, ['checkout', 'fgw/runner-heavy-with-plan']);
  fs.mkdirSync(path.join(cwd, 'docs', 'history', 'runner-heavy-with-plan'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'history', 'runner-heavy-with-plan', 'plan.md'), '# plan\n');
  gitAtCwd(cwd, ['add', 'docs']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'plan']);
  gitAtCwd(cwd, ['checkout', 'main']);

  assert.equal((await approve(cwd, 'runner-heavy-with-plan')).to, 'delivered');
});

test('approve of a leaf forked after a sibling already merged a gated-module change into the root does not trip the Iron Law on the ancestor\'s file: the leaf\'s own diff is against its root', async () => {
  const cwd = initGitCwdMainFast();
  proposeLeafForkedFromRoot(cwd, 'iron-leaf-root', 'iron-leaf-child', 'docs/leaf-note.txt', {
    beforeFork: () => {
      gitAtCwd(cwd, ['checkout', 'fgw/iron-leaf-root']);
      fs.mkdirSync(path.join(cwd, 'src/runner'), { recursive: true });
      fs.writeFileSync(path.join(cwd, 'src/runner/sibling-produced.mjs'), 'export const sibling = true;\n');
      gitAtCwd(cwd, ['add', '-A']);
      gitAtCwd(cwd, ['commit', '-q', '-m', 'sibling child merged into root']);
      gitAtCwd(cwd, ['checkout', 'main']);
    },
  });

  const data = await approve(cwd, 'iron-leaf-child');
  assert.equal(data.to, 'delivered');
  assert.doesNotMatch(JSON.stringify(data), /Iron Law/);
});

// ---------------------------------------------------------------------------
// milestone close-out
// ---------------------------------------------------------------------------

test('approve of a milestone refuses as validation when a targeted item\'s root has unsynced drift, naming the item, its root and sync-root; no merge, milestone stays awaiting approval', async () => {
  const cwd = initGitCwdMainFast();
  await makeDriftedRoot(cwd, 'closeout-root', { verify: 'true' });
  addWork(fgosDir(cwd), { id: 'closeout-child', title: 'child', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', parent: 'closeout-root' });
  commitPending(cwd, 'state: add closeout-child');
  makeMilestone(cwd, 'closeout-milestone', ['closeout-child']);

  const headBefore = gitHead(cwd);
  await assert.rejects(approve(cwd, 'closeout-milestone'), refusal(4, /unsynced drift/, /closeout-child/, /closeout-root/, /fgos sync-root/));
  assert.equal(gitHead(cwd), headBefore, 'a blocked close-out attempts no merge');
  assert.equal(stateView(cwd).work['closeout-milestone'].status, 'awaiting-approval');

  assert.equal((await approve(cwd, 'closeout-milestone', { acknowledgeDrift: true })).to, 'delivered', 'acknowledgeDrift lets the same close-out through');
});

test('approve of a milestone with no drift on any target delivers normally', async () => {
  const cwd = initGitCwdMainFast();
  // A root with a real branch at main's own tip: zero drift.
  addWork(fgosDir(cwd), { id: 'closeout-clean-root', title: 'root', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  commitPending(cwd, 'state: add closeout-clean-root');
  gitAtCwd(cwd, ['branch', 'fgw/closeout-clean-root', 'main']);
  addWork(fgosDir(cwd), { id: 'closeout-clean-child', title: 'child', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', parent: 'closeout-clean-root' });
  commitPending(cwd, 'state: add closeout-clean-child');
  makeMilestone(cwd, 'closeout-clean-milestone', ['closeout-clean-child']);

  assert.equal((await approve(cwd, 'closeout-clean-milestone')).to, 'delivered');
});

// ---------------------------------------------------------------------------
// pull-door and legacy items: verify on the main checkout, no merge
// ---------------------------------------------------------------------------

test('approve of a pull-door item (code already on main): re-verifies and closes awaiting-approval -> delivered', async () => {
  const cwd = initGitCwdFast();
  proposePull(cwd, 'approve-pull-item');
  commitPendingBeforeApprove(cwd, 'approve-pull-item');

  assert.equal((await approve(cwd, 'approve-pull-item')).to, 'delivered');
  const view = stateView(cwd);
  assert.equal(view.work['approve-pull-item'].status, 'delivered');
  // No 'close' settlement yet: that fires at cleanup -> done.
  assert.equal(view.settlements?.['approve-pull-item'], undefined);
});

test('approve of a legacy item with a passing verify delivers it and reports the event seq', async () => {
  const cwd = tmpCwdFast();
  proposeLegacy(cwd, 'approve-legacy-ok-item', { verify: 'true' });

  const data = await approve(cwd, 'approve-legacy-ok-item');
  assert.equal(data.to, 'delivered');
  assert.equal(data.deliveryUnrecorded, undefined);
  assert.equal(typeof data.seq, 'number');
  assert.equal(stateView(cwd).work['approve-legacy-ok-item'].status, 'delivered');
});

test('approve of a legacy item with a failing verify parks it blocked (reason verify-fail) with role system on the park event', async () => {
  const cwd = tmpCwdFast();
  proposeLegacy(cwd, 'approve-legacy-fail-item', { verify: 'false' });

  const data = await approve(cwd, 'approve-legacy-fail-item');
  assert.equal(data.to, 'blocked');
  assert.equal(data.reason, 'verify-fail');
  assert.equal(stateView(cwd).work['approve-legacy-fail-item'].status, 'blocked');
  const moveEvent = eventLines(cwd).map((line) => JSON.parse(line)).find((e) => e.type === 'work.move' && e.payload.to === 'blocked');
  assert.ok(moveEvent, 'expected a work.move event to blocked');
  assert.equal(moveEvent.payload.role, 'system');
});

test('approve reports a structured blocked result when the item is moved concurrently during its verify, carrying the store\'s fresh status', async () => {
  for (const [id, to] of [['cas-blocked-item', 'blocked'], ['cas-todo-item', 'todo']]) {
    const cwd = tmpCwdFast();
    proposeWithConcurrentMove(cwd, id, to);

    const data = await approve(cwd, id);
    assert.equal(data.outcome, 'blocked');
    assert.equal(data.reason, 'state-changed-concurrently');
    assert.equal(data.expected, 'awaiting-approval');
    assert.equal(data.actual, to);
  }
});

test('approve (verify-only): a status write that times out on the held state mutex is caught, recorded and reported on stderr, never crashing or promoting the item', async () => {
  const cwd = tmpCwdFast();
  proposeLegacy(cwd, 'approve-lock-timeout', { verify: 'true' });

  const before = eventLines(cwd).length;
  const holder = await holdStateInChild(fgosDir(cwd));
  const stderr = [];
  const write = process.stderr.write;
  process.stderr.write = (chunk, ...rest) => (stderr.push(String(chunk)), true);
  let data;
  try {
    data = await approve(cwd, 'approve-lock-timeout');
  } finally {
    process.stderr.write = write;
    holder.child.kill('SIGKILL');
    await holder.exited;
  }

  assert.equal(data.mode, 'verify-only');
  assert.equal(data.to, 'awaiting-approval');
  assert.equal(data.deliveryUnrecorded, true);
  assert.match(data.error, /timed out/);
  assert.match(stderr.join(''), /status write failed/);
  assert.match(stderr.join(''), /diagnostic recorded/);
  // The status write never happened: no new event, the item stays where it was.
  assert.equal(stateView(cwd).work['approve-lock-timeout'].status, 'awaiting-approval');
  assert.equal(eventLines(cwd).length, before);
  const record = JSON.parse(fs.readFileSync(data.diagnosticLog, 'utf8').trim().split('\n').at(-1));
  assert.equal(record.id, 'approve-lock-timeout');
  assert.equal(record.phase, 'pull-door verify-only');
  assert.match(record.detail, /timed out/);
});

test('a status write the gate could not make is a recorded fault, and a store refusal is not', () => {
  const lockTimeout = Object.assign(new Error('timed out acquiring state'), { code: 'hot-lock-timeout' });
  const lostRace = Object.assign(new Error('catch-up busy'), { code: 'event-store-catch-up-busy' });
  const diskFull = Object.assign(new Error('no space'), { code: 'ENOSPC' });
  for (const err of [lockTimeout, lostRace, diskFull]) assert.equal(isStatusWriteFault(err), true, err.code);
  // A precondition refusal and an unknown failure keep propagating: swallowing them would accept an item the store refused.
  const storeRefusal = Object.assign(new Error('not awaiting-approval'), { code: 'precondition', category: 'precondition' });
  assert.equal(isStatusWriteFault(storeRefusal), false);
  assert.equal(isStatusWriteFault(new TypeError('bug')), false);
  assert.equal(isStatusWriteFault(null), false);
});
