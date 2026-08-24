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


test('approve from the main checkout is unaffected by the guard even while a session is registered — runner and pull both close to done, exit 0', () => {
  // runner source: main-checkout approve still merges fgw/<id> and closes.
  const cwdR = initSessionSafeCwd();
  run(cwdR, ['init']);
  makeSessionSafeRunnerItem(cwdR, 'approve-main-runner', { verify: 'test -f approve-main-runner-produced.txt' });
  const sessionR = createSession(cwdR, { sessionId: 'sess-active-runner' });
  try {
    const resR = run(cwdR, ['approve', 'approve-main-runner']);
    assert.equal(resR.status, 0, `runner approve from main must still succeed with a session active: ${resR.stderr}`);
    assert.equal(stateView(cwdR).work['approve-main-runner'].status, 'delivered');
  } finally {
    endSession(cwdR, sessionR.sessionId, { force: true });
  }

  // pull source: main-checkout approve still re-verifies on main and closes.
  const cwdP = initSessionSafeCwd();
  run(cwdP, ['init']);
  addOk(cwdP, 'approve-main-pull', { verify: 'test -f proof.txt' });
  run(cwdP, ['take', '--id', 'approve-main-pull']);
  commitFile(cwdP, 'proof.txt');
  run(cwdP, ['return', 'approve-main-pull']);
  const sessionP = createSession(cwdP, { sessionId: 'sess-active-pull' });
  try {
    const resP = run(cwdP, ['approve', 'approve-main-pull']);
    assert.equal(resP.status, 0, `pull approve from main must still succeed with a session active: ${resP.stderr}`);
    assert.equal(stateView(cwdP).work['approve-main-pull'].status, 'delivered');
  } finally {
    endSession(cwdP, sessionP.sessionId, { force: true });
  }
});


test('approve refuses from an ad-hoc worktree never created through "fgos session start" (runner source) — no merge, item stays proposed, main HEAD unchanged, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-adhoc-runner', { verify: 'test -f approve-adhoc-runner-produced.txt' });
  const headBefore = gitHead(cwd);

  const worktreePath = addAdHocWorktree(cwd, 'adhoc-runner-branch');
  try {
    assert.equal(stateView(cwd).work['approve-adhoc-runner'].status, 'awaiting-approval', 'sanity: the ad-hoc worktree really does see the item (real committed events log)');
    const result = run(worktreePath, ['approve', 'approve-adhoc-runner']);
    assert.equal(result.status, 4, `expected a clean validation refusal, not a merge on an unregistered worktree: ${result.stdout}${result.stderr}`);
    assert.equal(stateView(cwd).work['approve-adhoc-runner'].status, 'awaiting-approval', 'item is untouched — no merge, no false "done"');
    assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged — nothing landed on main');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});


test('approve refuses from an ad-hoc worktree never created through "fgos session start" (pull source) — refuses before any goal-check, item stays proposed, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  commitPending(cwd, 'state: init');
  addOk(cwd, 'approve-adhoc-pull', { verify: 'test -f proof.txt' });
  commitPending(cwd, 'state: add');
  run(cwd, ['take', '--id', 'approve-adhoc-pull']);
  commitFile(cwd, 'proof.txt');
  run(cwd, ['return', 'approve-adhoc-pull']);
  commitPending(cwd, 'state: return');

  // proof.txt exists at HEAD, so an unguarded ad-hoc-worktree approve would
  // run goal-check, pass, and mark the item done without ever having proven
  // anything about the actual main checkout — the exact silent
  // false-verification this guard must close.
  const worktreePath = addAdHocWorktree(cwd, 'adhoc-pull-branch');
  try {
    assert.equal(stateView(cwd).work['approve-adhoc-pull'].status, 'awaiting-approval', 'sanity: the ad-hoc worktree really does see the item');
    const result = run(worktreePath, ['approve', 'approve-adhoc-pull']);
    assert.equal(result.status, 4, `expected a clean validation refusal, not a false-verified goal-check: ${result.stdout}${result.stderr}`);
    assert.equal(stateView(cwd).work['approve-adhoc-pull'].status, 'awaiting-approval', 'item stays proposed — goal-check never ran to close it');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});


test('approve from the main checkout is unaffected by the ad-hoc-worktree guard — runner and pull both still close to done, exit 0', () => {
  const cwdR = initGitCwdMain();
  run(cwdR, ['init']);
  makeRunnerProposedItem(cwdR, 'approve-adhoc-main-runner', { verify: 'test -f approve-adhoc-main-runner-produced.txt' });
  commitPendingBeforeApprove(cwdR, 'approve-adhoc-main-runner');
  const resR = run(cwdR, ['approve', 'approve-adhoc-main-runner']);
  assert.equal(resR.status, 0, `runner approve from main must still succeed: ${resR.stderr}`);
  assert.equal(stateView(cwdR).work['approve-adhoc-main-runner'].status, 'delivered');

  const cwdP = initGitCwdMain();
  run(cwdP, ['init']);
  addOk(cwdP, 'approve-adhoc-main-pull', { verify: 'test -f proof.txt' });
  run(cwdP, ['take', '--id', 'approve-adhoc-main-pull']);
  commitFile(cwdP, 'proof.txt');
  run(cwdP, ['return', 'approve-adhoc-main-pull']);
  commitPendingBeforeApprove(cwdP, 'approve-adhoc-main-pull');
  const resP = run(cwdP, ['approve', 'approve-adhoc-main-pull']);
  assert.equal(resP.status, 0, `pull approve from main must still succeed: ${resP.stderr}`);
  assert.equal(stateView(cwdP).work['approve-adhoc-main-pull'].status, 'delivered');
});


// --- approve --github + worktree guard (approve-worktree-guard-github-fix) -
//
// P1 finding (review-260718-concurrency-hard-gate-cluster): the --github
// branch (github-adapter) merged server-side and called moveWork/returned
// BEFORE the registry guard loop or isMainWorktree ever ran, so it was never
// covered by P44/approve-worktree-guard — a linked worktree (registered
// session or ad-hoc) running `approve --github` reached `done` while GitHub
// showed the PR merged, exactly the false-verification class the guard
// exists to close. Red-before-green: run against the pre-fix code (guards
// positioned after the `if (flags.github)` branch), each test below fails —
// approve reaches the gh fake and/or moveWork; after relocating the guards
// ahead of the --github branch, both refuse cleanly, proving the fix.

test('approve --github --pr refuses from an ad-hoc worktree never created through "fgos session start" — no gh call, no moveWork, item stays proposed, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-adhoc-github', { verify: 'test -f approve-adhoc-github-produced.txt' });
  const headBefore = gitHead(cwd);
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const worktreePath = addAdHocWorktree(cwd, 'adhoc-github-branch');
  try {
    const result = run(worktreePath, ['approve', 'approve-adhoc-github', '--github', '--pr', '9'], { FGOS_GH_COMMAND: fake });
    assert.equal(result.status, 4, `expected a clean validation refusal, not a GitHub merge from an unregistered worktree: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /main working tree/, 'the structural worktree-identity message, not the --github source-mismatch message');
    assert.ok(!fs.existsSync(marker), 'the worktree guard must reject before any gh CLI call');
    assert.equal(stateView(cwd).work['approve-adhoc-github'].status, 'awaiting-approval', 'item is untouched — no moveWork, no false "done"');
    assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged — nothing landed on main');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});


test('approve --github --pr refuses from inside a registered session worktree, with the registry guard\'s friendlier session-naming message (same precedence as the local path) — no gh call, item stays proposed, exit 4', () => {
  const cwd = initSessionSafeCwd();
  run(cwd, ['init']);
  makeSessionSafeRunnerItem(cwd, 'approve-session-github', { verify: 'test -f approve-session-github-produced.txt' });
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const session = createSession(cwd, { sessionId: 'sess-github' });
  try {
    const result = run(session.worktreePath, ['approve', 'approve-session-github', '--github', '--pr', '9'], { FGOS_GH_COMMAND: fake });
    assert.equal(result.status, 4, `expected a clean validation refusal: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /sess-github/, "the registry guard's friendlier session-naming message wins, not the generic structural message");
    assert.match(result.stderr, /session end/, 'the refusal tells the caller how to proceed');
    assert.ok(!fs.existsSync(marker), 'the worktree guard must reject before any gh CLI call');
    assert.equal(stateView(cwd).work['approve-session-github'].status, 'awaiting-approval', 'item is untouched — no moveWork, no false "done"');
  } finally {
    endSession(cwd, session.sessionId, { force: true });
  }
});


// review-20260718-self-improve-loop finding f01: the Iron Law check was
// hoisted ahead of the --github branch so a self-modifying diff cannot land
// via GitHub without ever being classified, mirroring the local path exactly.

test('approve --github --pr on a runner item touching a self-modifying-capable module REFUSES without --acknowledge-iron-law -- no gh call, item stays proposed, exit 4 (f01)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'gh-iron-refuse-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const result = run(cwd, ['approve', 'gh-iron-refuse-item', '--github', '--pr', '13'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, `expected a clean Iron Law refusal, not a GitHub merge: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Iron Law/);
  assert.match(result.stderr, /src\/runner\/probe\.mjs/, 'the refusal must name the exact module that tripped required:true');
  assert.ok(!fs.existsSync(marker), 'the Iron Law gate must refuse before any gh CLI call');
  assert.equal(stateView(cwd).work['gh-iron-refuse-item'].status, 'awaiting-approval', 'item is untouched — no moveWork, no false "done"');
});


test('approve --github --pr on the same self-modifying diff PROCEEDS with --acknowledge-iron-law: merges via the fake gh, awaiting-approval -> done (f01)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'gh-iron-ack-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });
  commitPendingBeforeApprove(cwd, 'gh-iron-ack-item');
  const fake = writeMergeSuccessFake(cwd);

  const result = run(cwd, ['approve', 'gh-iron-ack-item', '--github', '--acknowledge-iron-law', '--pr', '14'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `approve --github with acknowledgment must succeed: ${result.stdout}${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'delivered');
  assert.equal(stateView(cwd).work['gh-iron-ack-item'].status, 'delivered');
});


test('approve on a proposed item with a missing-evidence acceptance clause is refused the same way as move --to done: precondition, exit 2, item stays proposed, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-cos-missing', { verify: 'true' });
  run(cwd, ['edit', 'approve-cos-missing', '--acceptance', JSON.stringify([{ text: 'ship it' }])]);
  run(cwd, ['move', 'approve-cos-missing', '--to', 'doing']);
  run(cwd, ['move', 'approve-cos-missing', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const before = eventLines(cwd).length;
  const result = run(cwd, ['approve', 'approve-cos-missing']);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /ship it/);
  assert.equal(stateView(cwd).work['approve-cos-missing'].status, 'awaiting-approval');
  assert.equal(eventLines(cwd).length, before);
});


// tsk-396 D1: regression for the merge-before-gate ordering bug. Before this
// fix, a runner-sourced item's real `git merge` (mergeRunnerItem) landed on
// main BEFORE the acceptance-evidence gate ran (inside moveWork's own
// `to === 'delivered'` check), so a refused gate here would still leave a
// merge commit on main. assertAcceptanceEvidence now runs as a pre-flight,
// before mergeRunnerItem is ever called — this test proves main's HEAD is
// completely untouched by a refused approve, not just that approve reports
// an error.
test('approve on a runner-sourced item with a missing-evidence acceptance clause is refused BEFORE the real git merge: precondition, exit 2, main HEAD unchanged, item stays awaiting-approval', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'runner-cos-missing');
  run(cwd, ['edit', 'runner-cos-missing', '--acceptance', JSON.stringify([{ text: 'ship it' }])]);
  commitPendingBeforeApprove(cwd, 'runner-cos-missing');

  const mainHeadBefore = gitAtCwd(cwd, ['rev-parse', 'main']).trim();
  const result = run(cwd, ['approve', 'runner-cos-missing']);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /ship it/);

  assert.equal(gitAtCwd(cwd, ['rev-parse', 'main']).trim(), mainHeadBefore, 'main HEAD must be completely unchanged by a refused approve');
  assert.equal(stateView(cwd).work['runner-cos-missing'].status, 'awaiting-approval');
});
