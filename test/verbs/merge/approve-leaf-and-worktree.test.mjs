// The cases of approve for a leaf merged into its root, and for where approve may run from (a session worktree, an
// ad-hoc worktree, the main checkout), called in this process through approveUseCase. The other cases are in
// approve.test.mjs.
import '../../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { addWork } from '../../../src/state/store.mjs';
import {
  addAdHocWorktree,
  commitPending,
  commitPendingBeforeApprove,
  createSession,
  endSession,
  gitAtCwd,
  gitHead,
  initGitCwdMainFast,
  initSessionSafeCwd,
  makeRunnerProposedItem,
  makeRunnerProposedLeafItem,
  makeSessionSafeRunnerItem,
  removeAdHocWorktree,
  stateView,
} from '../../cli/helpers/fgos-cli-harness.mjs';
import {
  approve,
  approveFaultRecord,
  branchesUnder,
  fgosDir,
  moveFixture,
  moveRootToResolved,
  proposePull,
  refusal,
} from './approve-fixtures.mjs';

// ---------------------------------------------------------------------------
// leaf merged into its root
// ---------------------------------------------------------------------------

test('approve of a leaf item with a clean merge onto a root that never moved lands the work on fgw/<root> (not main) via an ephemeral worktree with no catchup, leaf -> delivered, both branches survive', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedLeafItem(cwd, 'approve-leaf-root', 'approve-leaf-child', { verify: 'test -f approve-leaf-child-produced.txt' });
  commitPendingBeforeApprove(cwd, 'approve-leaf-child');

  const headBefore = gitHead(cwd);
  const data = await approve(cwd, 'approve-leaf-child');
  assert.equal(data.branch, 'fgw/approve-leaf-child');
  assert.equal(data.target, 'fgw/approve-leaf-root');
  assert.equal(data.to, 'delivered');
  assert.equal('cleanupWarnings' in data, false, 'approve performs no branch/worktree cleanup itself');

  assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged by a leaf approve');
  assert.equal(fs.existsSync(path.join(cwd, 'approve-leaf-child-produced.txt')), false, 'the leaf\'s produced file must not land on the main checkout');
  const view = stateView(cwd);
  assert.equal(view.work['approve-leaf-child'].status, 'delivered');
  const branches = branchesUnder(cwd);
  assert.match(branches, /fgw\/approve-leaf-child\b/, 'the leaf\'s own branch survives approve — the cleanup verb deletes it later');
  assert.match(branches, /fgw\/approve-leaf-root\b/, 'the root\'s integration branch survives');
  assert.match(gitAtCwd(cwd, ['show', 'fgw/approve-leaf-root:approve-leaf-child-produced.txt']), /ok/);
  assert.doesNotMatch(gitAtCwd(cwd, ['log', '--oneline', 'fgw/approve-leaf-child']), /catch-up:/, 'a root that never moved gets no catchup commit');
  // mergedSha is the root branch's own tip, resolved by name from the main checkout, never the ephemeral worktree's HEAD.
  assert.equal(view.work['approve-leaf-child'].mergedInto, 'fgw/approve-leaf-root');
  assert.equal(view.work['approve-leaf-child'].mergedSha, gitAtCwd(cwd, ['rev-parse', 'fgw/approve-leaf-root']).trim());

  const record = approveFaultRecord(cwd, 'approve-leaf-child');
  assert.equal(record.phase, 'leaf-into-root merge');
  assert.equal(record.mergedSha, view.work['approve-leaf-child'].mergedSha);
  assert.equal(record.mergedInto, 'fgw/approve-leaf-root');
});

test('approve of a leaf item is unaffected by a dirty main checkout, even one on the leaf\'s own declared footprint path: its merge never touches the main checkout', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedLeafItem(cwd, 'kv3-leaf-root', 'kv3-leaf-dirty', { verify: 'test -f kv3-leaf-dirty-produced.txt', footprint: 'footprint-guarded.txt' });
  commitPendingBeforeApprove(cwd, 'kv3-leaf-dirty');
  // The same shape that refuses for a root merging into main.
  fs.writeFileSync(path.join(cwd, 'footprint-guarded.txt'), 'unrelated to the ephemeral merge\n');

  const headBefore = gitHead(cwd);
  const data = await approve(cwd, 'kv3-leaf-dirty');
  assert.equal(data.to, 'delivered');
  assert.equal(data.target, 'fgw/kv3-leaf-root');
  assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged');
  assert.equal(fs.readFileSync(path.join(cwd, 'footprint-guarded.txt'), 'utf8'), 'unrelated to the ephemeral merge\n', 'the dirty file survives untouched');
});

test('approve of a leaf whose root has moved since: catches up inline, lands, and its inline verify is the only verify that runs', async () => {
  const cwd = initGitCwdMainFast();
  // One line per verify run, so "ran exactly once" is a real count.
  const verifyLog = path.join(cwd, 'verify-runs.log');
  await makeRunnerProposedLeafItem(cwd, 'auto-catchup-root', 'auto-catchup-leaf', { verify: `echo run >> ${JSON.stringify(verifyLog)} && test -f auto-catchup-leaf-produced.txt` });
  commitPendingBeforeApprove(cwd, 'auto-catchup-leaf');
  // The root advances after the leaf's branch was cut: a sibling leaf landed first, without overlap.
  gitAtCwd(cwd, ['checkout', 'fgw/auto-catchup-root']);
  fs.writeFileSync(path.join(cwd, 'sibling-produced.txt'), 'sibling ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'sibling leaf merged into root first']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const headBefore = gitHead(cwd);
  const data = await approve(cwd, 'auto-catchup-leaf');
  assert.equal(data.to, 'delivered');
  assert.equal(data.target, 'fgw/auto-catchup-root');

  assert.equal(gitHead(cwd), headBefore, 'main must never be touched by a leaf approve');
  const verifyRunCount = fs.readFileSync(verifyLog, 'utf8').trim().split('\n').filter(Boolean).length;
  assert.equal(verifyRunCount, 1, `verify must run exactly once for the whole approve, ran ${verifyRunCount} times`);
  // Both the sibling's content and the leaf's are on the root: the catchup combined them.
  assert.match(gitAtCwd(cwd, ['show', 'fgw/auto-catchup-root:sibling-produced.txt']), /sibling ok/);
  assert.match(gitAtCwd(cwd, ['show', 'fgw/auto-catchup-root:auto-catchup-leaf-produced.txt']), /ok/);
  assert.match(gitAtCwd(cwd, ['log', '--oneline', 'fgw/auto-catchup-leaf']), /catch-up: merge fgw\/auto-catchup-root into fgw\/auto-catchup-leaf/);
});

test('approve of a leaf whose root branch was never created (a root only ever driven live) creates it from main instead of failing the ancestor check', async () => {
  const cwd = initGitCwdMainFast();
  const rootId = 'no-early-branch-root';
  const leafId = 'no-early-branch-leaf';
  addWork(fgosDir(cwd), { id: rootId, title: `Title ${rootId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  commitPending(cwd, `state: add ${rootId}`);
  // Deliberately no fgw/<rootId> branch: a root only ever driven live never gets one early.
  addWork(fgosDir(cwd), { id: leafId, title: `Title ${leafId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: `test -f ${leafId}-produced.txt`, parent: rootId });
  commitPending(cwd, `state: add ${leafId}`);
  gitAtCwd(cwd, ['checkout', '-b', `fgw/${leafId}`, 'main']);
  fs.writeFileSync(path.join(cwd, `${leafId}-produced.txt`), 'ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', `worker output for ${leafId}`]);
  gitAtCwd(cwd, ['checkout', 'main']);
  moveFixture(cwd, leafId, 'awaiting-approval');
  commitPendingBeforeApprove(cwd, leafId);
  assert.doesNotMatch(branchesUnder(cwd), new RegExp(`fgw/${rootId}\\b`), 'fgw/<rootId> must not exist yet');

  const data = await approve(cwd, leafId);
  assert.equal(data.to, 'delivered');
  assert.equal(data.target, `fgw/${rootId}`);
  assert.match(branchesUnder(cwd), new RegExp(`fgw/${rootId}\\b`), 'the fallback created fgw/<rootId>');
  assert.match(gitAtCwd(cwd, ['show', `fgw/${rootId}:${leafId}-produced.txt`]), /ok/);
});

test('approve of a leaf whose inline catchup hits a real conflict parks blocked (reason merge-conflict) and leaves the root untouched', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedLeafItem(cwd, 'catchup-conflict-root', 'catchup-conflict-leaf', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'catchup-conflict-leaf');
  // The root advances with the same file the leaf's own commit writes, different content.
  gitAtCwd(cwd, ['checkout', 'fgw/catchup-conflict-root']);
  fs.writeFileSync(path.join(cwd, 'catchup-conflict-leaf-produced.txt'), 'root-side content, different from leaf\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'root touches the same file the leaf does']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const rootTipBefore = gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-conflict-root']).trim();
  const data = await approve(cwd, 'catchup-conflict-leaf');
  assert.equal(data.to, 'blocked');
  assert.equal(data.reason, 'merge-conflict');
  assert.equal(data.target, 'fgw/catchup-conflict-root');
  assert.equal(gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-conflict-root']).trim(), rootTipBefore, 'the root is untouched by a failed inline catchup');
  assert.equal(stateView(cwd).work['catchup-conflict-leaf'].status, 'blocked');
});

test('approve of a leaf whose own root is delivered or wontfix refuses as validation, naming the root and sync-root, before any merge; the leaf stays awaiting approval', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedLeafItem(cwd, 'resolved-root', 'resolved-root-leaf', { verify: 'true' });
  moveRootToResolved(cwd, 'resolved-root', 'delivered');
  await makeRunnerProposedLeafItem(cwd, 'wontfix-root', 'wontfix-root-leaf', { verify: 'true' });
  moveRootToResolved(cwd, 'wontfix-root', 'wontfix');

  const headBefore = gitHead(cwd);
  await assert.rejects(approve(cwd, 'resolved-root-leaf'), refusal(4, /resolved-root/, /delivered/, /fgos sync-root/));
  await assert.rejects(approve(cwd, 'wontfix-root-leaf'), refusal(4, /wontfix-root/));
  assert.equal(gitHead(cwd), headBefore, 'a refused approve attempts no merge');
  assert.equal(stateView(cwd).work['resolved-root-leaf'].status, 'awaiting-approval');
  assert.equal(stateView(cwd).work['wontfix-root-leaf'].status, 'awaiting-approval');
});

test('approve of a leaf whose own root is delivered succeeds with acknowledgeDrift and merges onto fgw/<root>', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedLeafItem(cwd, 'resolved-root-ack', 'resolved-root-ack-leaf', { verify: 'true' });
  moveRootToResolved(cwd, 'resolved-root-ack', 'delivered');

  const data = await approve(cwd, 'resolved-root-ack-leaf', { acknowledgeDrift: true });
  assert.equal(data.target, 'fgw/resolved-root-ack');
  assert.equal(stateView(cwd).work['resolved-root-ack-leaf'].status, 'delivered');
});

// ---------------------------------------------------------------------------
// where approve may run from
// ---------------------------------------------------------------------------

test('approve refuses from inside a registered session worktree, naming the session and how to proceed, before any merge or goal check (runner and pull source)', async () => {
  const cwd = initSessionSafeCwd();
  await makeSessionSafeRunnerItem(cwd, 'approve-nested-runner', { verify: 'test -f approve-nested-runner-produced.txt' });
  // proof.txt exists at HEAD, so an unguarded pull-source approve would pass its goal check and close the item.
  proposePull(cwd, 'approve-nested-pull');
  const headBefore = gitHead(cwd);

  const session = createSession(cwd, { sessionId: 'sess-nested' });
  try {
    for (const id of ['approve-nested-runner', 'approve-nested-pull']) {
      await assert.rejects(approve(cwd, id, {}, session.worktreePath), refusal(4, /sess-nested/, /session end/));
      assert.equal(stateView(cwd).work[id].status, 'awaiting-approval');
    }
    // The registry guard runs ahead of --github too, and its session-naming message wins.
    await assert.rejects(approve(cwd, 'approve-nested-runner', { github: true, prNumber: '9' }, session.worktreePath), refusal(4, /sess-nested/, /session end/));
    assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged — no merge landed');
  } finally {
    endSession(cwd, session.sessionId, { force: true });
  }
});

test('approve from the main checkout still closes runner and pull items while a session is registered', async () => {
  const cwd = initSessionSafeCwd();
  await makeSessionSafeRunnerItem(cwd, 'approve-main-runner', { verify: 'test -f approve-main-runner-produced.txt' });
  proposePull(cwd, 'approve-main-pull');

  const session = createSession(cwd, { sessionId: 'sess-active' });
  try {
    assert.equal((await approve(cwd, 'approve-main-runner')).to, 'delivered');
    assert.equal((await approve(cwd, 'approve-main-pull')).to, 'delivered');
  } finally {
    endSession(cwd, session.sessionId, { force: true });
  }
});

test('approve refuses from an ad-hoc worktree never created through "fgos session start", before any merge or goal check (runner and pull source, and ahead of --github)', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'approve-adhoc-runner', { verify: 'test -f approve-adhoc-runner-produced.txt' });
  proposePull(cwd, 'approve-adhoc-pull');
  commitPending(cwd, 'state: return');
  const headBefore = gitHead(cwd);

  const worktreePath = addAdHocWorktree(cwd, 'adhoc-branch');
  try {
    for (const id of ['approve-adhoc-runner', 'approve-adhoc-pull']) {
      await assert.rejects(approve(cwd, id, {}, worktreePath), refusal(4));
      assert.equal(stateView(cwd).work[id].status, 'awaiting-approval', 'no merge, no false "delivered"');
    }
    // The structural worktree-identity message, not the --github refusal.
    await assert.rejects(approve(cwd, 'approve-adhoc-runner', { github: true, prNumber: '9' }, worktreePath), refusal(4, /main working tree/));
    assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged — nothing landed on main');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});
