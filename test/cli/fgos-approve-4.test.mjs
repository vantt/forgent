// fgos-approve.test.mjs -- phần "approve" của bộ test CLI, tách nguyên văn
// từ test/cli/fgos.test.mjs (tsk-3um). Nội dung test không đổi, chỉ chỗ ở đổi.
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import { test } from 'node:test';
import {
  ADD_BAD_FLAG_CASES,
  DEFAULT_TTL_MS,
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
  addFriction,
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
  mainCheckoutLockPath,
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
  moveStage,
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
  writeLiveLock,
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


test('approve of a milestone with no drift on any target succeeds normally, unaffected by the guard', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  // A root with a real branch but zero drift (no leaf work landed on it
  // beyond main's own tip).
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'closeout-clean-root', title: 'root', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  commitPending(cwd, 'state: add closeout-clean-root');
  gitAtCwd(cwd, ['branch', 'fgw/closeout-clean-root', 'main']);
  addWork(dir, { id: 'closeout-clean-child', title: 'child', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', parent: 'closeout-clean-root' });
  commitPending(cwd, 'state: add closeout-clean-child');

  makeMilestone(cwd, 'closeout-clean-milestone', ['closeout-clean-child']);

  const result = run(cwd, ['approve', 'closeout-clean-milestone']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['closeout-clean-milestone'].status, 'delivered');
});


test('approve of an ordinary item with no targets is completely unaffected by the close-out guard (regression)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'closeout-no-targets-item', { verify: 'true' });
  run(cwd, ['move', 'closeout-no-targets-item', '--to', 'doing']);
  run(cwd, ['move', 'closeout-no-targets-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const result = run(cwd, ['approve', 'closeout-no-targets-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['closeout-no-targets-item'].status, 'delivered');
});


test('approve --github on a legacy (non-runner) item is a validation error, no state change, and no gh call is attempted', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeLegacyProposedItem(cwd, 'gh-approve-legacy');
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  // --pr present too — the source gate must still win over the --pr check.
  const result = run(cwd, ['approve', 'gh-approve-legacy', '--github', '--pr', '7'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /runner-sourced item/);
  assert.equal(stateView(cwd).work['gh-approve-legacy'].status, 'awaiting-approval');
  assert.ok(!fs.existsSync(marker), 'the source gate must reject before any gh CLI call');
});


test('approve --github without --pr is a validation error, item stays proposed, and mergeGitHubPR is never called', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-nopr');
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const result = run(cwd, ['approve', 'gh-approve-nopr', '--github'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /requires --pr/);
  assert.equal(stateView(cwd).work['gh-approve-nopr'].status, 'awaiting-approval');
  assert.ok(!fs.existsSync(marker), 'no gh call is made when --pr is missing');
});


// tsk-396 D2: regression for the merge-before-gate ordering bug on the
// --github transport specifically. Before this fix, mergeGitHubPR (a real,
// server-side GitHub merge) ran BEFORE the acceptance-evidence gate — unlike
// a local git merge, a GitHub-side merge can't be aborted, so this path
// carried irreversible-merge risk the local paths don't. The fake gh here
// would succeed if invoked; the test proves it is never invoked at all.
test('approve --github --pr on an item with a missing-evidence acceptance clause is refused BEFORE the real GitHub merge: precondition, exit 2, mergeGitHubPR/gh is never called', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-cos-missing');
  run(cwd, ['edit', 'gh-approve-cos-missing', '--acceptance', JSON.stringify([{ text: 'ship it' }])]);
  commitPendingBeforeApprove(cwd, 'gh-approve-cos-missing');
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const result = run(cwd, ['approve', 'gh-approve-cos-missing', '--github', '--pr', '42'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 2, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /ship it/);
  assert.equal(stateView(cwd).work['gh-approve-cos-missing'].status, 'awaiting-approval');
  assert.ok(!fs.existsSync(marker), 'the acceptance-evidence gate must reject before any gh CLI call, including the real merge');
});


test('approve --github with a dirty main tree is NOT blocked by the local dirty-tree gate and proceeds to the GitHub merge', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-dirty');
  commitPendingBeforeApprove(cwd, 'gh-approve-dirty');
  // An unrelated dirty file on main — a LOCAL approve would refuse this, but
  // a GitHub-side merge never touches the local tree, so it must not gate.
  fs.writeFileSync(path.join(cwd, 'unrelated-dirt.txt'), 'uncommitted\n');
  const fake = writeMergeSuccessFake(cwd);

  const result = run(cwd, ['approve', 'gh-approve-dirty', '--github', '--pr', '5'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.doesNotMatch(result.stdout, /not clean/);
  assert.equal(envelopeData(result.stdout).to, 'delivered');
  assert.equal(stateView(cwd).work['gh-approve-dirty'].status, 'delivered');
});


test('approve --github --pr on a fake gh merge success transitions the item awaiting-approval -> delivered with role human', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-merged');
  commitPendingBeforeApprove(cwd, 'gh-approve-merged');
  const fake = writeMergeSuccessFake(cwd);

  const result = run(cwd, ['approve', 'gh-approve-merged', '--github', '--pr', '42'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const mergedData = envelopeData(result.stdout);
  assert.equal(mergedData.prNumber, '42');
  assert.equal(mergedData.to, 'delivered');

  const view = stateView(cwd);
  assert.equal(view.work['gh-approve-merged'].status, 'delivered');
  // No 'close' settlement yet -- that fires at cleanup->done, not delivered.
  assert.equal(view.settlements?.['gh-approve-merged'], undefined);
});


test('approve --github --pr on a fake gh merge failure transitions awaiting-approval -> blocked and records friction with the classified reason, layer, and gh detail', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-blocked');
  const fake = writeAuthFailFake(cwd);

  const result = run(cwd, ['approve', 'gh-approve-blocked', '--github', '--pr', '99'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const blockedData = envelopeData(result.stdout);
  assert.equal(blockedData.to, 'blocked');
  assert.equal(blockedData.reason, 'auth-failure');

  const view = stateView(cwd);
  assert.equal(view.work['gh-approve-blocked'].status, 'blocked');
  const friction = view.frictions['gh-approve-blocked'][0];
  assert.equal(friction.errorClass, 'auth-failure');
  assert.equal(friction.layer, 'environment');
  assert.match(friction.detail, /Bad credentials/);
});


test('approve refuses from inside a registered session worktree (runner source) — no merge, item stays proposed, main HEAD unchanged, exit 4', () => {
  const cwd = initSessionSafeCwd();
  run(cwd, ['init']);
  makeSessionSafeRunnerItem(cwd, 'approve-nested-runner', { verify: 'test -f approve-nested-runner-produced.txt' });
  const headBefore = gitHead(cwd);

  const session = createSession(cwd, { sessionId: 'sess-runner' });
  try {
    const result = run(session.worktreePath, ['approve', 'approve-nested-runner']);
    assert.equal(result.status, 4, `expected a clean validation refusal: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /sess-runner/, 'the refusal names the session id cwd is nested inside');
    assert.match(result.stderr, /session end/, 'the refusal tells the caller how to proceed');
    assert.equal(stateView(cwd).work['approve-nested-runner'].status, 'awaiting-approval', 'item is untouched — no merge, no state change');
    assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged — no merge landed');
  } finally {
    endSession(cwd, session.sessionId, { force: true });
  }
});


test('approve refuses from inside a registered session worktree (pull source) — refuses before any goal-check, item stays proposed, exit 4', () => {
  const cwd = initSessionSafeCwd();
  run(cwd, ['init']);
  addOk(cwd, 'approve-nested-pull', { verify: 'test -f proof.txt' });
  run(cwd, ['take', '--id', 'approve-nested-pull']);
  commitFile(cwd, 'proof.txt');
  run(cwd, ['return', 'approve-nested-pull']);

  const session = createSession(cwd, { sessionId: 'sess-pull' });
  try {
    // proof.txt exists at HEAD, so an unguarded pull-source approve would run
    // goal-check, pass, and mark the item done. The guard must refuse first.
    const result = run(session.worktreePath, ['approve', 'approve-nested-pull']);
    assert.equal(result.status, 4, `expected a clean validation refusal: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /sess-pull/, 'the refusal names the session id cwd is nested inside');
    assert.equal(stateView(cwd).work['approve-nested-pull'].status, 'awaiting-approval', 'item stays proposed — goal-check never ran to close it');
  } finally {
    endSession(cwd, session.sessionId, { force: true });
  }
});
