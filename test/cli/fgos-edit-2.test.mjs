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


test('edit --verify-from-children with no children found throws a validation error instead of writing a vacuous verify, exit 4', () => {
  const cwd = tmpCwdFromTemplate();
  assert.equal(addOk(cwd, 'lonely-parent').status, 0);
  const before = stateView(cwd).work['lonely-parent'].verify;
  const result = run(cwd, ['edit', 'lonely-parent', '--verify-from-children']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /no children|no item has parent/i);
  assert.equal(stateView(cwd).work['lonely-parent'].verify, before, 'a failed guard must never write patch.verify');
});


test('edit --verify-from-targets with empty targets throws a validation error instead of writing a vacuous verify, exit 4', () => {
  const cwd = tmpCwdFromTemplate();
  assert.equal(run(cwd, ['add', 'targetless-mvp', '--title', 'MVP', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--goal-tier', 'mvp', '--description', 'tsk-535 fixture description.']).status, 0);
  const before = stateView(cwd).work['targetless-mvp'].verify;
  const result = run(cwd, ['edit', 'targetless-mvp', '--verify-from-targets']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /no targets/i);
  assert.equal(stateView(cwd).work['targetless-mvp'].verify, before, 'a failed guard must never write patch.verify');
});


// --- edit --superseded-by / --duplicates (tsk-2ie, docs/history/
//     tsk-2ie-duplicate-superseded-guard/ D1-D3) ---------------------------


test('edit --superseded-by with no value is a validation error, exit 4', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'superseded-by-noval-item');
  const result = run(cwd, ['edit', 'superseded-by-noval-item', '--superseded-by']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--superseded-by requires a value/);
});

