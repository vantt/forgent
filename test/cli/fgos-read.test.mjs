// fgos-read.test.mjs -- phần "list, show, ready, triage, graph, rollup, stale, conflicts, goal, check" của bộ test CLI, tách nguyên văn
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
  writeLiveLock,
  writeMarkerFake,
  writeMergeSuccessFake,
  writeRunnerConfig,
  writeShortRunnerConfig,
  writeViewFake,
} from './helpers/fgos-cli-harness.mjs';


// tsk-56t D2: `list`/`ready`/etc. stay `requiresExistingStore: false` (a
// fresh non-worktree dir with no store is legitimately "not evaluated",
// not an error) — but a worktree-resident session that forgets `--dir`
// should not read that as "no open work" with zero signal. One
// object-shaped verb (`list`) and one array-shaped verb (`ready`, which
// returns a bare array via paginateVerbResult when unpaginated — the
// reason this is a stderr line, never a JSON field: JSON.stringify drops
// a named property set on an array).
test('list from a .fgos/-less linked worktree cwd, no --dir: exit 0, empty view, but a stderr warning names the real store elsewhere', () => {
  const { wt } = tmpLinkedWorktree();
  const result = run(wt, ['list']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout).work, {});
  assert.match(result.stderr, /warning: \.fgos\/ not found/);
  assert.match(result.stderr, /--dir <mainRoot>/);
});


test('ready (array-shaped, unpaginated) from the same linked worktree cwd: exit 0, empty array, same stderr warning', () => {
  const { wt } = tmpLinkedWorktree();
  const result = run(wt, ['ready']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), []);
  assert.match(result.stderr, /warning: \.fgos\/ not found/);
});


test('list with --dir pointed at the real store from the same worktree cwd: no warning, real data', () => {
  const { main, wt } = tmpLinkedWorktree();
  run(main, ['add', 'seen-via-dir', '--title', 'Seen via --dir', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--description', 'tsk-535 fixture description.']);
  const result = run(wt, ['list', '--dir', main]);
  assert.equal(result.status, 0);
  assert.ok(envelopeData(result.stdout).work['seen-via-dir']);
  assert.equal(result.stderr, '');
});


test('list on a fresh non-worktree dir with no store at all: exit 0, empty view, no warning (legitimately "not evaluated", not a worktree footgun)', () => {
  const cwd = rawTmpCwd();
  const result = run(cwd, ['list']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout).work, {});
  assert.equal(result.stderr, '');
});


// --- list open-only default + --all (tsk-5oa D1/D2) -----------------------

test.todo('list by default excludes a done item, but keeps a todo item - migrated to test/direct/fgos-read.test.mjs');
test.todo('list --all restores the done item alongside the open one - migrated to test/direct/fgos-read.test.mjs');
test.todo('list by default excludes a wontfix item, but keeps a todo item - migrated to test/direct/fgos-read.test.mjs');
test.todo('list --all restores the wontfix item alongside the open one - migrated to test/direct/fgos-read.test.mjs');
test.todo('list by default drops a child whose parent is visible, and badges the parent with childProgress - migrated to test/direct/fgos-read.test.mjs');
test.todo('list by default falls back to showing a child as a top-level row when its parent is resolved and hidden - migrated to test/direct/fgos-read.test.mjs');
test.todo('list by default never hides an awaiting-human child, even when its parent is visible - migrated to test/direct/fgos-read.test.mjs');
test.todo('list --all is untouched by the child-view gate: no rows dropped, no childProgress added - migrated to test/direct/fgos-read.test.mjs');
test.todo('list --json exposes parkReason on a blocked item, and omits it on a doing item - migrated to test/direct/fgos-read.test.mjs');
test.todo('list --id returns only that item, ignoring the open-only default and --all entirely - migrated to test/direct/fgos-read.test.mjs');
test.todo('list --id on a done item returns it without needing --all - migrated to test/direct/fgos-read.test.mjs');


test('list --id on an unknown id is rejected as validation (not-found), exit 4 (tsk-42m D2)', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'open-item');

  const result = run(cwd, ['list', '--id', 'no-such-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /list: work "no-such-item" not found/);
});


test.todo('list --id scopes every id-keyed view section to just the requested item, excluding another item\'s data - migrated to test/direct/fgos-read.test.mjs');
test.todo('list --id --fields returns only named fields and omits all history side-log keys - migrated to test/direct/fgos-read.test.mjs');
test.todo('list --id without --fields is unchanged from today behavior - migrated to test/direct/fgos-read.test.mjs');


test('list --id --fields with an invalid field name is rejected as validation error, exit 4 (tsk-4zr)', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'item-invalid');

  const result = run(cwd, ['list', '--id', 'item-invalid', '--fields', 'stage,invalidField']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /list --fields: unknown field "invalidField"/);
});


test.todo('list default keeps an awaiting-human item visible - migrated to test/direct/fgos-read.test.mjs');

