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


test('approve of a leaf whose root is still open (not resolved) is unaffected by the resolved-root guard (regression)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'open-root', 'open-root-leaf', { verify: 'true' });
  // root stays at its default 'todo' status — never resolved.

  const result = run(cwd, ['approve', 'open-root-leaf']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['open-root-leaf'].status, 'delivered');
});


test('approve of a root-to-main item (no parent) is unaffected by the resolved-root guard even though the item is a fresh proposal (regression)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'standalone-root-item', { verify: 'true' });

  const result = run(cwd, ['approve', 'standalone-root-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['standalone-root-item'].status, 'delivered');
});


test('approve --github --pr on a leaf whose own root is delivered ALSO refuses before any gh call (hoisted ahead of --github, same as the Iron Law gate), gh is never invoked', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'gh-resolved-root', 'gh-resolved-root-leaf', { verify: 'true' });
  moveRootToResolved(cwd, 'gh-resolved-root', 'delivered');
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const result = run(cwd, ['approve', 'gh-resolved-root-leaf', '--github', '--pr', '7'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4);
  assert.match(result.stderr, /gh-resolved-root/);
  assert.equal(stateView(cwd).work['gh-resolved-root-leaf'].status, 'awaiting-approval');
  assert.ok(!fs.existsSync(marker), 'the resolved-root guard must refuse before any gh CLI call');
});


test('approve --trust-dir with --dir succeeds from inside an ad-hoc worktree (tsk-4uj)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-trust-dir', { verify: 'test -f approve-trust-dir-produced.txt' });

  const worktreePath = addAdHocWorktree(cwd, 'adhoc-trust-dir-branch');
  try {
    const result = run(worktreePath, ['approve', 'approve-trust-dir', '--trust-dir', '--dir', cwd]);
    assert.equal(result.status, 0, `approve --trust-dir --dir from an ad-hoc worktree unexpectedly failed: ${result.stdout}${result.stderr}`);
    assert.equal(stateView(cwd).work['approve-trust-dir'].status, 'delivered');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});


test('approve --trust-dir WITHOUT --dir is a no-op -- still refuses from inside an ad-hoc worktree (tsk-4uj)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-trust-dir-noop', { verify: 'test -f approve-trust-dir-noop-produced.txt' });
  const headBefore = gitHead(cwd);

  const worktreePath = addAdHocWorktree(cwd, 'adhoc-trust-dir-noop-branch');
  try {
    const result = run(worktreePath, ['approve', 'approve-trust-dir-noop', '--trust-dir']);
    assert.equal(result.status, 4, `expected a clean validation refusal, not a merge on an unregistered worktree: ${result.stdout}${result.stderr}`);
    assert.equal(stateView(cwd).work['approve-trust-dir-noop'].status, 'awaiting-approval', 'item is untouched — no merge, no false "done"');
    assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged — nothing landed on main');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});


test('approve --github --pr --trust-dir WITHOUT --dir is a no-op -- still refuses from an ad-hoc worktree before any gh call (tsk-4uj)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-gh-trust-noop', { verify: 'test -f approve-gh-trust-noop-produced.txt' });
  const headBefore = gitHead(cwd);
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const worktreePath = addAdHocWorktree(cwd, 'adhoc-github-trust-dir-noop-branch');
  try {
    const result = run(worktreePath, ['approve', 'approve-gh-trust-noop', '--github', '--pr', '9', '--trust-dir'], { FGOS_GH_COMMAND: fake });
    assert.equal(result.status, 4, `expected a clean validation refusal, not a GitHub merge from an unregistered worktree: ${result.stdout}${result.stderr}`);
    assert.ok(!fs.existsSync(marker), 'the worktree guard must reject before any gh CLI call');
    assert.equal(stateView(cwd).work['approve-gh-trust-noop'].status, 'awaiting-approval', 'item is untouched — no moveWork, no false "done"');
    assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged — nothing landed on main');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});
