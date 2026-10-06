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
  moveStep,
  moveToDurableDoingForTest,
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

// --- backlog-triage impact ranking (P21) ------------------------------------
//
// Separate from P14's intake-time risk/lane classification: `triage` ranks
// OPEN work by blocking fan-out (how many other still-open items depend on
// it), highest first.

test('triage on an empty backlog returns an empty ranked list, exit 0', () => {
  const cwd = tmpCwdFromTemplate();
  const result = run(cwd, ['triage']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), []);
});


test('triage ranks a base item above the items that depend on it', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'base');
  run(cwd, ['add', 'dep1', '--title', 'Dep1', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--deps', 'base', '--description', 'tsk-535 fixture description.']);
  run(cwd, ['add', 'dep2', '--title', 'Dep2', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--deps', 'base', '--description', 'tsk-535 fixture description.']);

  const result = run(cwd, ['triage']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  const base = data.find((r) => r.id === 'base');
  const dep1 = data.find((r) => r.id === 'dep1');
  assert.equal(base.title, 'Title base');
  assert.equal(base.status, 'todo');
  assert.equal(base.blocks, 2);
  assert.equal(dep1.title, 'Dep1');
  assert.equal(dep1.blocks, 0);
});


test('triage excludes a done item from ranking, and a done dependent never counts as blocked', () => {
  const cwd = tmpCwdFromTemplate();
  const dir = path.join(cwd, '.fgos');
  addOk(cwd, 'base');
  addWork(dir, { id: 'finished-dependent', title: 'Finished Dependent', kind: 'task', status: 'done', deps: ['base'], risk: 'light', refs: [], verify: 'npm test' });
  addWork(dir, { id: 'done-item', title: 'Done Item', kind: 'task', status: 'done', deps: [], risk: 'light', refs: [], verify: 'npm test' });

  const result = run(cwd, ['triage']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  const base = data.find((r) => r.id === 'base');
  assert.equal(base.status, 'todo');
  assert.equal(base.blocks, 0);
  assert.ok(!data.some((r) => r.id === 'done-item'));
});


test('triage --all appends done items after the ranked open rows, each with blocks:0 (tsk-5oa D1)', () => {
  const cwd = tmpCwdFromTemplate();
  const dir = path.join(cwd, '.fgos');
  addOk(cwd, 'base');
  addWork(dir, { id: 'done-item', title: 'Done Item', kind: 'task', status: 'done', deps: ['base'], risk: 'light', refs: [], verify: 'npm test' });

  const withoutAll = envelopeData(run(cwd, ['triage']).stdout);
  const withAll = envelopeData(run(cwd, ['triage', '--all']).stdout);
  assert.ok(!withoutAll.some((r) => r.id === 'done-item'));
  assert.deepEqual(withAll.slice(0, withoutAll.length), withoutAll);
  const doneRow = withAll.find((r) => r.id === 'done-item');
  assert.ok(doneRow);
  assert.equal(doneRow.blocks, 0);
  assert.equal(doneRow.componentSize, 0);
  assert.equal(doneRow.isIsolated, true);
});


test('triage never mutates state: no event is appended', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'base');

  const before = eventLines(cwd);
  const result = run(cwd, ['triage']);
  assert.equal(result.status, 0);
  assert.deepEqual(eventLines(cwd), before);
});


test('triage rows carry stage, goalTier, and component membership; declared goals sort ahead of ungrouped work', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'plain');
  run(cwd, ['add', 'goal-item', '--title', 'Goal Item', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--goal-tier', 'mvp', '--description', 'tsk-535 fixture description.']);

  const result = run(cwd, ['triage']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  const plain = data.find((r) => r.id === 'plain');
  const goal = data.find((r) => r.id === 'goal-item');
  assert.equal(plain.workflowStep, 'executing');
  assert.equal(plain.goalTier, null);
  assert.equal(plain.isIsolated, true);
  assert.equal(plain.componentSize, 1);
  assert.equal(goal.goalTier, 'mvp');
  assert.deepEqual(data.map((r) => r.id), ['goal-item', 'plain']);
});


