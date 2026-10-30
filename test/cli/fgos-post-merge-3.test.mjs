// fgos-post-merge.test.mjs -- phần "catchup, cleanup, retrospective, docs-index, doc-sources" của bộ test CLI, tách nguyên văn
// từ test/cli/fgos.test.mjs (tsk-3um). Nội dung test không đổi, chỉ chỗ ở đổi.
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import {
  ADD_BAD_FLAG_CASES,
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
  addViaCli,
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


// tsk-3vo D5: same shared --timeout/--no-timeout resolution as `return`
// (resolveVerifyTimeoutMs), wired into `catchup` too — must reject the same
// way, before any git operation runs.
test('catchup --timeout and --no-timeout together are rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'catchup-timeout-conflict');
  run(cwd, ['move', 'catchup-timeout-conflict', '--to', 'doing']);
  run(cwd, ['move', 'catchup-timeout-conflict', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  run(cwd, ['move', 'catchup-timeout-conflict', '--to', 'blocked', '--reason', 'merge-conflict']);

  const result = run(cwd, ['catchup', 'catchup-timeout-conflict', '--timeout', '1000', '--no-timeout']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /mutually exclusive/);
  assert.equal(stateView(cwd).work['catchup-timeout-conflict'].status, 'blocked', 'a rejected flag combination never runs verify or moves the item');
});


test('an item added with no --acceptance flag has work.acceptance absent (undefined), not an empty array', () => {
  const cwd = tmpCwd();
  const result = addViaCli(cwd, 'no-acceptance-item');
  assert.equal(result.status, 0);
  const view = stateView(cwd);
  assert.equal('acceptance' in view.work['no-acceptance-item'], false, 'an omitted --acceptance leaves the field absent, not []');
  const listed = envelopeData(run(cwd, ['list']).stdout);
  assert.equal('acceptance' in listed.work['no-acceptance-item'], false);
});
