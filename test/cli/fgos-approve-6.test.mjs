// fgos-approve.test.mjs -- phần "approve" của bộ test CLI, tách nguyên văn
// từ test/cli/fgos.test.mjs (tsk-3um). Nội dung test không đổi, chỉ chỗ ở đổi.
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import { holdLockInChild } from '../helpers/hold-lock-in-child.mjs';
import { holdStateInChild } from '../helpers/hold-state-in-child.mjs';
import {
  ADD_BAD_FLAG_CASES,
  EDIT_BAD_FLAG_CASES,
  EDIT_PRIORITY_MATRIX_BAD_FLAG_CASES,
  FGOS,
  MOVE_BAD_FLAG_CASES,
  REAL_REPO_ROOT,
  SUBMIT_BAD_FLAG_CASES,
  StoreError,
  addAdHocWorktree,
  addBareOrigin,
  addDiscovery,
  addGoalItem,
  addOk,
  addOutcome,
  addWork,
  advanceThroughDiscoveryToPlanning,
  assert,
  coexistPath,
  commitFile,
  commitInWorktree,
  commitPending,
  commitPendingBeforeApprove,
  createSession,
  cutMemberBranch,
  docsIndexManifestPath,
  editWork,
  endSession,
  envelopeData,
  eventLines,
  execFileSync,
  fileURLToPath,
  fs,
  gitAtCwd,
  gitHead,
  initGitCwd,
  initGitCwdInSubdir,
  initGitCwdMain,
  initGitCwdWithWorktree,
  initHeadlessGitCwd,
  initSessionSafeCwd,
  linkFgosBinInto,
  logPath,
  makeAlreadyCaughtUpItem,
  makeBlockedBranchItem,
  makeBlockedLeafItem,
  makeBlockedRunnerItem,
  makeDriftedRoot,
  makeFlatMember,
  makeLegacyProposedItem,
  makeMilestone,
  makeRunnerProposedItem,
  makeRunnerProposedItemTouching,
  makeRunnerProposedLeafItem,
  makeSessionSafeRunnerItem,
  mkLocalDependency,
  moveStep,
  moveWork,
  os,
  path,
  rawTmpCwd,
  registerFlatMember,
  removeAdHocWorktree,
  run,
  spawnSync,
  startSession,
  stateView,
  tmpCwd,
  tmpLinkedWorktree,
  toDoneViaChain,
  toProposed,
  viewPath,
  writeAuthFailFake,
  writeCleanupTtlConfig,
  writeCreateFake,
  writeFakeGh,
  writeHangScript,
  writeMarkerFake,
  writeMergeSuccessFake,
  writeRunnerConfig,
  writeShortRunnerConfig,
  writeViewFake,
} from './helpers/fgos-cli-harness.mjs';

function moveRootToResolved(cwd, rootId, finalStatus) {
  run(cwd, ['move', rootId, '--to', 'doing']);
  if (finalStatus === 'wontfix') {
    run(cwd, ['move', rootId, '--to', 'wontfix']);
  } else {
    run(cwd, ['move', rootId, '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
    run(cwd, ['move', rootId, '--to', 'delivered']);
  }
  commitPending(cwd, `state: resolve ${rootId} to ${finalStatus}`);
}


// tsk-2p6: same pre-flight-before-merge shape as the acceptance-evidence
// regression test immediately above, for the plan-evidence gate.
test('approve on a risk:heavy runner-sourced item with no plan.md on its branch is refused BEFORE the real git merge: precondition, main HEAD unchanged, item stays awaiting-approval', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'runner-heavy-no-plan', { risk: 'heavy' });

  const mainHeadBefore = gitAtCwd(cwd, ['rev-parse', 'main']).trim();
  const result = run(cwd, ['approve', 'runner-heavy-no-plan']);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /no plan\.md found on branch "fgw\/runner-heavy-no-plan"/);

  assert.equal(gitAtCwd(cwd, ['rev-parse', 'main']).trim(), mainHeadBefore, 'main HEAD must be completely unchanged by a refused approve');
  assert.equal(stateView(cwd).work['runner-heavy-no-plan'].status, 'awaiting-approval');
});


test('approve on a risk:heavy runner-sourced item that DOES carry a plan.md on its branch succeeds normally', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'runner-heavy-with-plan', { risk: 'heavy', verify: 'test -f runner-heavy-with-plan-produced.txt' });

  // makeRunnerProposedItem's own commit landed on fgw/<id> while main was
  // checked out -- add the plan.md as a follow-up commit on that same
  // branch, mirroring how a real session commits plan.md during planning.
  gitAtCwd(cwd, ['checkout', 'fgw/runner-heavy-with-plan']);
  fs.mkdirSync(path.join(cwd, 'docs', 'history', 'runner-heavy-with-plan'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'history', 'runner-heavy-with-plan', 'plan.md'), '# plan\n');
  gitAtCwd(cwd, ['add', 'docs']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'plan']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const result = run(cwd, ['approve', 'runner-heavy-with-plan']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['runner-heavy-with-plan'].status, 'delivered');
});


// --- approve's post-success moveWork guard ---------------------------------
//
// Approve's own success paths record `delivered` as their last step. A write that cannot happen then
// (here: another process holds the state mutex past its timeout) must be caught, recorded and left
// diagnosable instead of crashing uncaught, because the verify that preceded it already happened.

test('approve (pull-door/verify-only): a status write that times out on the held state mutex is caught, recorded, and left diagnosable instead of crashing uncaught', async () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-lock-timeout', { verify: 'true' });
  run(cwd, ['move', 'approve-lock-timeout', '--to', 'doing']);
  run(cwd, ['move', 'approve-lock-timeout', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const before = eventLines(cwd).length;
  const holder = await holdStateInChild(path.join(cwd, '.fgos'));
  let result;
  try {
    result = run(cwd, ['approve', 'approve-lock-timeout']);
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }

  // Caught, not an uncaught crash: exit 0, a well-formed envelope, not the
  // generic "fgos: <message>" exit-1/exit-2 shape an unhandled throw would
  // have produced.
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.mode, 'verify-only');
  assert.equal(data.to, 'awaiting-approval');
  assert.equal(data.deliveryUnrecorded, true);
  assert.match(data.error, /timed out/);
  assert.ok(data.diagnosticLog, 'envelope must point at a real diagnostic log path');

  // Visible immediately to whoever is watching the terminal, not just to a
  // later reader of the JSON envelope or the log file.
  assert.match(result.stderr, /status write failed/);
  assert.match(result.stderr, /diagnostic recorded/);

  // The status write genuinely never happened — no new event, item stays
  // exactly where it was, never silently promoted to "delivered".
  assert.equal(stateView(cwd).work['approve-lock-timeout'].status, 'awaiting-approval');
  assert.equal(eventLines(cwd).length, before);

  // The diagnostic record is real and on disk, independent of events.jsonl.
  const diagnosticLines = fs.readFileSync(data.diagnosticLog, 'utf8').trim().split('\n');
  const record = JSON.parse(diagnosticLines.at(-1));
  assert.equal(record.id, 'approve-lock-timeout');
  assert.equal(record.phase, 'pull-door verify-only');
  assert.match(record.detail, /timed out/);
});


test('approve (pull-door/verify-only): with the state mutex free, the same item approves normally — the guard changes nothing on the happy path', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-lock-timeout-control', { verify: 'true' });
  run(cwd, ['move', 'approve-lock-timeout-control', '--to', 'doing']);
  run(cwd, ['move', 'approve-lock-timeout-control', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const result = run(cwd, ['approve', 'approve-lock-timeout-control']);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.to, 'delivered');
  assert.equal(data.deliveryUnrecorded, undefined);
  assert.equal(typeof data.seq, 'number');
  assert.equal(stateView(cwd).work['approve-lock-timeout-control'].status, 'delivered');
});


test('approve --no-wait fails immediately while another process holds the trunk\'s merge slot, main left untouched -- merge next inherits the same flag by forwarding, per bin/fgos.mjs:1152', async () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'wait-no-wait-approve', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'wait-no-wait-approve');
  const holder = await holdLockInChild('merge-slot', { fgosDir: path.join(cwd, '.fgos'), ref: encodeURIComponent('refs/heads/main') });
  try {
    const result = run(cwd, ['approve', 'wait-no-wait-approve', '--no-wait']);

    // 9 ('merge-fail'), not 7 ('lock-timeout') -- MergeError's category is
    // unconditionally 'merge-fail' for every failure mode.
    assert.equal(result.status, 9, result.stderr);
    assert.match(result.stderr, /merge slot of "refs\/heads\/main" is held by another process \(pid \d+/);
    // A run that waited would tag the final error with the time it waited; none appears
    // when the flag skipped the wait. The holder never releases, so a waiting run could not
    // have succeeded either.
    assert.doesNotMatch(result.stderr, /after waiting \d+ ms/, '--no-wait must not wait before giving up');
    assert.equal(stateView(cwd).work['wait-no-wait-approve'].status, 'awaiting-approval', 'a refused-before-merge attempt must leave the item exactly where it was');
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
});


test('approve of a runner item is blocked (reason merge-blocked-other-item), not misclassified as a conflict, when the main checkout already has an unrelated item\'s pre-existing MERGE_HEAD -- and that other item\'s merge state is left untouched', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-blocked-item');

  // Simulate another item's in-progress/abandoned merge already staged on
  // the main checkout by a concurrent session -- a real, unrelated branch,
  // staged but never committed or aborted.
  gitAtCwd(cwd, ['checkout', '-b', 'fgw/other-blocker-item']);
  fs.writeFileSync(path.join(cwd, 'other-blocker-produced.txt'), 'other\n');
  gitAtCwd(cwd, ['add', 'other-blocker-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'worker output for other-blocker-item']);
  gitAtCwd(cwd, ['checkout', 'main']);
  gitAtCwd(cwd, ['merge', '--no-commit', '--no-ff', 'fgw/other-blocker-item']);

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'approve-blocked-item']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'blocked');
  assert.equal(data.reason, 'merge-blocked-other-item');

  assert.equal(gitHead(cwd), headBefore, 'HEAD must be unchanged');
  assert.doesNotThrow(
    () => gitAtCwd(cwd, ['rev-parse', '--verify', 'MERGE_HEAD']),
    'the other item\'s MERGE_HEAD must survive untouched',
  );
  assert.match(gitAtCwd(cwd, ['diff', '--name-only', '--cached']), /other-blocker-produced\.txt/);
  assert.equal(fs.existsSync(path.join(cwd, 'approve-blocked-item-produced.txt')), false, 'the approved item\'s own merge must never have been attempted');

  const view = stateView(cwd);
  assert.equal(view.work['approve-blocked-item'].status, 'blocked');
  assert.equal(view.frictions['approve-blocked-item'][0].errorClass, 'merge-blocked-other-item');
});


test('approve of a root item, whose merge into main hits a pre-existing MERGE_HEAD from an unrelated item, parks with reason merge-blocked-other-item (root→main call site, tsk-4hj D2)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'approve-blocked-root-item');
  run(cwd, ['move', 'approve-blocked-root-item', '--to', 'doing']);
  commitPending(cwd, 'state: claim approve-blocked-root-item');

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/approve-blocked-root-item']);
  fs.writeFileSync(path.join(cwd, 'approve-blocked-root-item-produced.txt'), 'ok\n');
  gitAtCwd(cwd, ['add', 'approve-blocked-root-item-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'worker output for approve-blocked-root-item']);
  gitAtCwd(cwd, ['checkout', 'main']);

  run(cwd, ['move', 'approve-blocked-root-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPending(cwd, 'state: propose approve-blocked-root-item');

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/other-blocker-root-item']);
  fs.writeFileSync(path.join(cwd, 'other-blocker-root-produced.txt'), 'other\n');
  gitAtCwd(cwd, ['add', 'other-blocker-root-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'worker output for other-blocker-root-item']);
  gitAtCwd(cwd, ['checkout', 'main']);
  gitAtCwd(cwd, ['merge', '--no-commit', '--no-ff', 'fgw/other-blocker-root-item']);

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'approve-blocked-root-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).reason, 'merge-blocked-other-item');

  assert.equal(gitHead(cwd), headBefore, 'HEAD must be unchanged');
  assert.doesNotThrow(() => gitAtCwd(cwd, ['rev-parse', '--verify', 'MERGE_HEAD']));

  const view = stateView(cwd);
  assert.equal(view.work['approve-blocked-root-item'].status, 'blocked');
  assert.equal(view.frictions['approve-blocked-root-item'][0].errorClass, 'merge-blocked-other-item');
});


test('approve of a leaf whose own root is delivered refuses, exit 4, item stays awaiting-approval, no merge attempted', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'resolved-root', 'resolved-root-leaf', { verify: 'true' });
  moveRootToResolved(cwd, 'resolved-root', 'delivered');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'resolved-root-leaf']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /resolved-root/);
  assert.match(result.stderr, /delivered/);
  assert.match(result.stderr, /fgos sync-root/);
  assert.equal(gitHead(cwd), headBefore, 'a refused approve attempts no merge');
  assert.equal(stateView(cwd).work['resolved-root-leaf'].status, 'awaiting-approval');
});


test('approve of a leaf whose own root is wontfix ALSO refuses (D2 — wontfix blocks too, not just delivered/retrospective/cleanup/done)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'wontfix-root', 'wontfix-root-leaf', { verify: 'true' });
  moveRootToResolved(cwd, 'wontfix-root', 'wontfix');

  const result = run(cwd, ['approve', 'wontfix-root-leaf']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /wontfix-root/);
  assert.equal(stateView(cwd).work['wontfix-root-leaf'].status, 'awaiting-approval');
});


test('approve of a leaf whose own root is delivered succeeds with --acknowledge-drift, merges onto fgw/<root> same as before', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'resolved-root-ack', 'resolved-root-ack-leaf', { verify: 'true' });
  moveRootToResolved(cwd, 'resolved-root-ack', 'delivered');

  const result = run(cwd, ['approve', 'resolved-root-ack-leaf', '--acknowledge-drift']);
  assert.equal(result.status, 0, result.stderr);
  const approveData = envelopeData(result.stdout);
  assert.equal(approveData.target, 'fgw/resolved-root-ack');
  assert.equal(stateView(cwd).work['resolved-root-ack-leaf'].status, 'delivered');
});
