// fgos-edit.test.mjs -- phần "edit, editing, editWork" của bộ test CLI, tách nguyên văn
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



// --- edit --description/--footprint: `add` already accepted both fields,
// but EDITABLE_FIELDS never listed them, so a description/footprint typo'd
// or left blank at add time -- or an item added before either field
// existed -- had no way to ever gain or correct one after creation. ---

// tsk-535 D1: `add` now always sets description (required flag), so an
// item created via `addOk` can no longer "have none" -- reframed to prove
// `edit --description` still overwrites an existing one, the same
// capability this test always covered.
test('edit --description overwrites an existing description, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-description-existing');
  assert.equal(stateView(cwd).work['edit-description-existing'].description, 'tsk-535 fixture description.');
  const result = run(cwd, ['edit', 'edit-description-existing', '--description', 'the full story']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['edit-description-existing'].description, 'the full story');
});


test('edit --footprint sets footprint on an item that had none, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-footprint-new');
  assert.equal(stateView(cwd).work['edit-footprint-new'].footprint, undefined);
  const result = run(cwd, ['edit', 'edit-footprint-new', '--footprint', 'src/a.mjs,src/b.mjs']);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['edit-footprint-new'].footprint, ['src/a.mjs', 'src/b.mjs']);
});


test('edit --action sets action directive prose on an item, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-action-new');
  assert.equal(stateView(cwd).work['edit-action-new'].action, undefined);
  const result = run(cwd, ['edit', 'edit-action-new', '--action', 'Implement feature X per plan.md']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['edit-action-new'].action, 'Implement feature X per plan.md');
});


test('edit --action with empty string is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-action-empty');
  const result = run(cwd, ['edit', 'edit-action-empty', '--action', '']);
  assert.equal(result.status, 4);
  assert.equal(stateView(cwd).work['edit-action-empty'].action, undefined);
});


test('edit --acceptance is refused when a clause supplies text+evidence together but evidence cites no real path', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-untraceable');
  const result = run(cwd, ['edit', 'edit-untraceable', '--acceptance', JSON.stringify([{ text: 'root cause confirmed', evidence: 'nothing checkable here' }])]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /evidence/);
  assert.equal(stateView(cwd).work['edit-untraceable'].acceptance, undefined, 'the rejected patch never applies');
});


test('edit --acceptance persists work.acceptance as the given array', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-acceptance');
  const clauses = [{ text: 'newly added clause' }];
  const result = run(cwd, ['edit', 'edit-acceptance', '--acceptance', JSON.stringify(clauses)]);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['edit-acceptance'].acceptance, clauses);
});


test('edit --acceptance replaces the whole array (latest-wins), same semantics as --refs/--deps', () => {
  const cwd = tmpCwd();
  const first = [{ text: 'first clause' }, { text: 'second clause' }];
  const result = run(cwd, ['add', 'edit-acceptance-replace', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--acceptance', JSON.stringify(first), '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['edit-acceptance-replace'].acceptance, first);

  const second = [{ text: 'a completely different clause' }];
  const replaced = run(cwd, ['edit', 'edit-acceptance-replace', '--acceptance', JSON.stringify(second)]);
  assert.equal(replaced.status, 0);
  assert.deepEqual(stateView(cwd).work['edit-acceptance-replace'].acceptance, second, 'edit --acceptance must replace, not merge, the array');
});


test('edit with a malformed --acceptance is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
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
  const cwd = tmpCwd();
  toProposed(cwd, 'cli-cos-retry');
  run(cwd, ['edit', 'cli-cos-retry', '--acceptance', JSON.stringify([{ text: 'ship it' }])]);

  assert.equal(run(cwd, ['move', 'cli-cos-retry', '--to', 'delivered']).status, 2);
  assert.equal(stateView(cwd).work['cli-cos-retry'].status, 'awaiting-approval');

  // tsk-5q5-2: evidence must resolve to a real path under cwd.
  const retryEdit = run(cwd, ['edit', 'cli-cos-retry', '--acceptance', JSON.stringify([{ text: 'ship it', evidence: '.fgos/events.jsonl' }])]);
  assert.equal(retryEdit.status, 0, 'edit --acceptance with real, traceable evidence must succeed');
  const result = run(cwd, ['move', 'cli-cos-retry', '--to', 'delivered']);
  assert.equal(result.status, 0, 'the retry must re-read the just-edited evidence, not a cached refusal');
  assert.equal(stateView(cwd).work['cli-cos-retry'].status, 'delivered');
});


// tsk-34o: edit --role, mirroring take --role's own optional-flag pattern --
// role only ever lands in the raw event's payload (never projected onto
// work[id], unlike take's claimRole), so these read eventLines directly.
test('edit --role session tags the stored event payload.role "session" instead of the default human', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-role-session');

  const result = run(cwd, ['edit', 'edit-role-session', '--risk', 'heavy', '--role', 'session']);
  assert.equal(result.status, 0, `edit failed: ${result.stderr}`);

  const last = JSON.parse(eventLines(cwd).at(-1));
  assert.equal(last.payload.role, 'session');
});


test('edit omitting --role still stamps payload.role "human" -- unchanged default for every existing caller', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-role-default');

  const result = run(cwd, ['edit', 'edit-role-default', '--risk', 'heavy']);
  assert.equal(result.status, 0, `edit failed: ${result.stderr}`);

  const last = JSON.parse(eventLines(cwd).at(-1));
  assert.equal(last.payload.role, 'human');
});


test('edit --role with an invalid value is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-role-bad');
  const before = eventLines(cwd).length;

  const result = run(cwd, ['edit', 'edit-role-bad', '--risk', 'heavy', '--role', 'robot']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before, 'an invalid --role must not append any event');
});


test('resolve-park-reason on unknown id is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;

  const result = run(cwd, ['resolve-park-reason', 'unknown-id', '--note', 'human override']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});


test('resolve-park-reason with missing or empty --note is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'resolve-bad-note');

  const res1 = run(cwd, ['resolve-park-reason', 'resolve-bad-note']);
  assert.equal(res1.status, 4);

  const res2 = run(cwd, ['resolve-park-reason', 'resolve-bad-note', '--note', '  ']);
  assert.equal(res2.status, 4);
});


test('resolve-park-reason on non-terminal item (todo/doing/blocked/awaiting-human/awaiting-approval) is refused, exit 4', () => {
  const cwd = tmpCwd();
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
  const cwd = tmpCwd();
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
  const cwd = tmpCwd();
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
  const cwd = tmpCwd();
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
  const cwd = tmpCwd();
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
