// fgos-edit.test.mjs -- phần "edit, editing, editWork" của bộ test CLI, tách nguyên văn
// từ test/cli/fgos.test.mjs (tsk-3um). Nội dung test không đổi, chỉ chỗ ở đổi.
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
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
  tmpCwdFromTemplate,
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


test('edit with a malformed --acceptance is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'edit-bad-acceptance');
  const before = eventLines(cwd).length;

  const invalidJson = run(cwd, ['edit', 'edit-bad-acceptance', '--acceptance', 'not json']);
  assert.equal(invalidJson.status, 4);

  const notArray = run(cwd, ['edit', 'edit-bad-acceptance', '--acceptance', JSON.stringify({ text: 'x' })]);
  assert.equal(notArray.status, 4);

  const missingText = run(cwd, ['edit', 'edit-bad-acceptance', '--acceptance', JSON.stringify([{ evidence: 'e' }])]);
  assert.equal(missingText.status, 4);

  const emptyText = run(cwd, ['edit', 'edit-bad-acceptance', '--acceptance', JSON.stringify([{ text: '' }])]);
  assert.equal(emptyText.status, 4);

  assert.equal(eventLines(cwd).length, before, 'no malformed --acceptance edit should append any event');
  assert.equal('acceptance' in stateView(cwd).work['edit-bad-acceptance'], false);
});


test('editing in the missing evidence after a refusal, then retrying move --to delivered, succeeds — no cached verdict', () => {
  const cwd = tmpCwdFromTemplate();
  toProposed(cwd, 'cli-cos-retry');
  run(cwd, ['edit', 'cli-cos-retry', '--acceptance', JSON.stringify([{ text: 'ship it' }])]);

  assert.equal(run(cwd, ['move', 'cli-cos-retry', '--to', 'delivered']).status, 2);
  assert.equal(stateView(cwd).work['cli-cos-retry'].status, 'awaiting-approval');

  // tsk-5q5-2: evidence must resolve to a real path under cwd.
  const retryEdit = run(cwd, ['edit', 'cli-cos-retry', '--acceptance', JSON.stringify([{ text: 'ship it', evidence: '.fgos/coexistence.json' }])]);
  assert.equal(retryEdit.status, 0, 'edit --acceptance with real, traceable evidence must succeed');
  const result = run(cwd, ['move', 'cli-cos-retry', '--to', 'delivered']);
  assert.equal(result.status, 0, 'the retry must re-read the just-edited evidence, not a cached refusal');
  assert.equal(stateView(cwd).work['cli-cos-retry'].status, 'delivered');
});


// tsk-34o: edit --role, mirroring take --role's own optional-flag pattern --
// role only ever lands in the raw event's payload (never projected onto
// work[id], unlike take's claimRole), so these read eventLines directly.


test('resolve-park-reason on unknown id is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwdFromTemplate();
  const before = eventLines(cwd).length;

  const result = run(cwd, ['resolve-park-reason', 'unknown-id', '--note', 'human override']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});


test('resolve-park-reason with missing or empty --note is rejected as validation, exit 4', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'resolve-bad-note');

  const res1 = run(cwd, ['resolve-park-reason', 'resolve-bad-note']);
  assert.equal(res1.status, 4);

  const res2 = run(cwd, ['resolve-park-reason', 'resolve-bad-note', '--note', '  ']);
  assert.equal(res2.status, 4);
});


test('resolve-park-reason on non-terminal item (todo/doing/blocked/awaiting-human/awaiting-approval) is refused, exit 4', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'resolve-non-terminal');

  // status todo
  const resTodo = run(cwd, ['resolve-park-reason', 'resolve-non-terminal', '--note', 'clearing']);
  assert.equal(resTodo.status, 4);

  // status doing
  run(cwd, ['move', 'resolve-non-terminal', '--to', 'doing']);
  const resDoing = run(cwd, ['resolve-park-reason', 'resolve-non-terminal', '--note', 'clearing']);
  assert.equal(resDoing.status, 4);

  // status blocked with reason
  run(cwd, ['move', 'resolve-non-terminal', '--to', 'blocked', '--reason', 'parked reason']);
  const resBlocked = run(cwd, ['resolve-park-reason', 'resolve-non-terminal', '--note', 'clearing']);
  assert.equal(resBlocked.status, 4);
});


test('resolve-park-reason on done item clears reason and parkReason and records note in parkResolutions', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'resolve-done-item');
  run(cwd, ['move', 'resolve-done-item', '--to', 'doing']);
  run(cwd, ['move', 'resolve-done-item', '--to', 'awaiting-approval', '--skip-return-guard', 'test setup']);
  run(cwd, ['move', 'resolve-done-item', '--to', 'blocked', '--reason', 'commit X is no longer reachable from fgw/parent']);
  run(cwd, ['move', 'resolve-done-item', '--to', 'doing']);
  run(cwd, ['move', 'resolve-done-item', '--to', 'awaiting-approval', '--skip-return-guard', 'test setup']);
  toDoneViaChain(cwd, 'resolve-done-item');

  const beforeView = stateView(cwd);
  assert.equal(beforeView.work['resolve-done-item'].reason, 'commit X is no longer reachable from fgw/parent');
  assert.equal(beforeView.work['resolve-done-item'].parkReason, 'natural-finish');

  const result = run(cwd, ['resolve-park-reason', 'resolve-done-item', '--note', 'Human confirmed content is present on main']);
  assert.equal(result.status, 0);

  const afterView = stateView(cwd);
  assert.equal(afterView.work['resolve-done-item'].reason, undefined);
  assert.equal(afterView.work['resolve-done-item'].parkReason, undefined);
  assert.ok(Array.isArray(afterView.parkResolutions['resolve-done-item']));
  assert.equal(afterView.parkResolutions['resolve-done-item'].length, 1);
  assert.equal(afterView.parkResolutions['resolve-done-item'][0].note, 'Human confirmed content is present on main');
});


test('resolve-park-reason on wontfix item clears reason', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'resolve-wontfix-item');
  run(cwd, ['move', 'resolve-wontfix-item', '--to', 'doing']);
  run(cwd, ['move', 'resolve-wontfix-item', '--to', 'awaiting-approval', '--skip-return-guard', 'test setup']);
  run(cwd, ['move', 'resolve-wontfix-item', '--to', 'blocked', '--reason', 'stale park text']);
  run(cwd, ['move', 'resolve-wontfix-item', '--to', 'wontfix']);

  const beforeView = stateView(cwd);
  assert.equal(beforeView.work['resolve-wontfix-item'].reason, 'stale park text');

  const result = run(cwd, ['resolve-park-reason', 'resolve-wontfix-item', '--note', 'Closed as wontfix and verified safe']);
  assert.equal(result.status, 0);

  const afterView = stateView(cwd);
  assert.equal(afterView.work['resolve-wontfix-item'].reason, undefined);
  assert.equal(afterView.parkResolutions['resolve-wontfix-item'][0].note, 'Closed as wontfix and verified safe');
});


test('resolve-park-reason on a done item without prior reason succeeds as a no-op clear and records note', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'resolve-no-reason-item');
  run(cwd, ['move', 'resolve-no-reason-item', '--to', 'doing']);
  run(cwd, ['move', 'resolve-no-reason-item', '--to', 'awaiting-approval', '--skip-return-guard', 'test setup']);
  toDoneViaChain(cwd, 'resolve-no-reason-item');

  const beforeView = stateView(cwd);
  assert.equal(beforeView.work['resolve-no-reason-item'].reason, undefined);

  const result = run(cwd, ['resolve-park-reason', 'resolve-no-reason-item', '--note', 'Clean close check']);
  assert.equal(result.status, 0);

  const afterView = stateView(cwd);
  assert.equal(afterView.work['resolve-no-reason-item'].reason, undefined);
  assert.equal(afterView.parkResolutions['resolve-no-reason-item'][0].note, 'Clean close check');
});


test('resolve-park-reason regression guard: ordinary work.move reason fold on active item is unaffected (RUL32)', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'resolve-item-a');
  addOk(cwd, 'active-item-b');

  // Item A is done and resolved
  run(cwd, ['move', 'resolve-item-a', '--to', 'doing']);
  run(cwd, ['move', 'resolve-item-a', '--to', 'awaiting-approval', '--skip-return-guard', 'test setup']);
  run(cwd, ['move', 'resolve-item-a', '--to', 'blocked', '--reason', 'parked reason A']);
  run(cwd, ['move', 'resolve-item-a', '--to', 'doing']);
  run(cwd, ['move', 'resolve-item-a', '--to', 'awaiting-approval', '--skip-return-guard', 'test setup']);
  toDoneViaChain(cwd, 'resolve-item-a');
  run(cwd, ['resolve-park-reason', 'resolve-item-a', '--note', 'cleared A']);

  // Item B is actively parked
  run(cwd, ['move', 'active-item-b', '--to', 'doing']);
  run(cwd, ['move', 'active-item-b', '--to', 'awaiting-approval', '--skip-return-guard', 'test setup']);
  run(cwd, ['move', 'active-item-b', '--to', 'blocked', '--reason', 'parked reason B']);

  const view = stateView(cwd);
  assert.equal(view.work['resolve-item-a'].reason, undefined);
  assert.equal(view.work['active-item-b'].reason, 'parked reason B');
});
