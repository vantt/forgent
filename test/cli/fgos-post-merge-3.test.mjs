// fgos-post-merge.test.mjs -- phần "catchup, cleanup, retrospective, docs-index, doc-sources" của bộ test CLI, tách nguyên văn
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



test('catchup on a root parked with reason integration-drift, after a non-overlapping main-side change, merges main into fgw/<id> and bounces blocked -> awaiting-approval', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedRunnerItem(cwd, 'catchup-root-drift', 'integration-drift', { verify: 'test -f catchup-root-drift-produced.txt' });

  // A genuinely non-overlapping change lands on main AFTER the park
  // (another root's own approve, simulated directly).
  fs.writeFileSync(path.join(cwd, 'main-side-change.txt'), 'landed while parked\n');
  gitAtCwd(cwd, ['add', 'main-side-change.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'another root lands on main']);

  const mainHeadBefore = gitHead(cwd);
  const worktreesBefore = gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);
  const result = run(cwd, ['catchup', 'catchup-root-drift']);
  assert.equal(result.status, 0, result.stderr);
  const catchupData = envelopeData(result.stdout);
  assert.equal(catchupData.from, 'blocked');
  assert.equal(catchupData.to, 'awaiting-approval');

  assert.equal(gitHead(cwd), mainHeadBefore, "catchup must never touch the human's own main checkout");
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the ephemeral catchup worktree is cleaned up — no leftover');
  assert.equal(stateView(cwd).work['catchup-root-drift'].status, 'awaiting-approval');

  const branchLog = gitAtCwd(cwd, ['log', '--oneline', 'fgw/catchup-root-drift']);
  assert.match(branchLog, /catch-up: merge main into fgw\/catchup-root-drift/);
  const producedFile = gitAtCwd(cwd, ['show', 'fgw/catchup-root-drift:catchup-root-drift-produced.txt']);
  assert.match(producedFile, /ok/);
  const mainSideFile = gitAtCwd(cwd, ['show', 'fgw/catchup-root-drift:main-side-change.txt']);
  assert.match(mainSideFile, /landed while parked/);
});


test('catchup on a leaf parked with reason merge-conflict targets its PARENT branch (fgw/<root>), not main, and succeeds the same way', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedLeafItem(cwd, 'catchup-leaf-root', 'catchup-leaf-child', 'merge-conflict', { verify: 'test -f catchup-leaf-child-produced.txt' });

  // A sibling leaf's own merge lands on fgw/<root> AFTER this leaf's park —
  // non-overlapping (a different file).
  gitAtCwd(cwd, ['checkout', 'fgw/catchup-leaf-root']);
  fs.writeFileSync(path.join(cwd, 'sibling-produced.txt'), 'sibling ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'sibling leaf merged into root']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const mainHeadBefore = gitHead(cwd);
  const worktreesBefore = gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);
  const result = run(cwd, ['catchup', 'catchup-leaf-child']);
  assert.equal(result.status, 0, result.stderr);
  const leafCatchupData = envelopeData(result.stdout);
  assert.equal(leafCatchupData.from, 'blocked');
  assert.equal(leafCatchupData.to, 'awaiting-approval');
  assert.equal(leafCatchupData.target, 'fgw/catchup-leaf-root', 'catchup must merge the PARENT branch, not main');

  assert.equal(gitHead(cwd), mainHeadBefore, 'a leaf catchup must never touch main');
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the ephemeral catchup worktree is cleaned up — no leftover');
  assert.equal(stateView(cwd).work['catchup-leaf-child'].status, 'awaiting-approval');

  const branchLog = gitAtCwd(cwd, ['log', '--oneline', 'fgw/catchup-leaf-child']);
  assert.match(branchLog, /catch-up: merge fgw\/catchup-leaf-root into fgw\/catchup-leaf-child/);
  const ownFile = gitAtCwd(cwd, ['show', 'fgw/catchup-leaf-child:catchup-leaf-child-produced.txt']);
  assert.match(ownFile, /ok/);
  const siblingFile = gitAtCwd(cwd, ['show', 'fgw/catchup-leaf-child:sibling-produced.txt']);
  assert.match(siblingFile, /sibling ok/);
});


// tsk-4ax (D3): catchup's own successful verify must be CASHED IN for
// mergedTreeAlreadyVerified (merge.mjs:803) to skip the outbound gate's
// redundant re-verify — without recording branchHeadAtReturn, the second
// of its two conditions can never become true, and the ~185s verify keeps
// re-running INSIDE the main-checkout lock on every single land, the exact
// self-tightening loop this item exists to close.

test('catchup records branchHeadAtReturn as its own commit tip, so a subsequent approve skips re-verifying entirely (the core reason this item exists)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  const sentinel = path.join(cwd, 'verify-ran.sentinel');
  makeBlockedRunnerItem(cwd, 'catchup-cashin', 'integration-drift', { verify: `touch ${JSON.stringify(sentinel)} && test -f catchup-cashin-produced.txt` });

  fs.writeFileSync(path.join(cwd, 'main-side-change.txt'), 'landed while parked\n');
  gitAtCwd(cwd, ['add', 'main-side-change.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'another root lands on main']);

  const result = run(cwd, ['catchup', 'catchup-cashin']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(sentinel), true, 'catchup itself must have run the real verify once');

  const branchTipAfterCatchup = gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-cashin']).trim();
  assert.equal(stateView(cwd).work['catchup-cashin'].branchHeadAtReturn, branchTipAfterCatchup, 'branchHeadAtReturn must record exactly the commit catchup just verified — the tip mergedTreeAlreadyVerified compares against');

  // Prove the outbound gate genuinely skips re-verifying: delete the
  // sentinel, then approve. If the full verify ran again inside the lock,
  // the sentinel would be recreated; asserting it stays absent is the
  // "assert, not measure time" proof acceptance 1 demands.
  fs.rmSync(sentinel);
  const approveResult = run(cwd, ['approve', 'catchup-cashin']);
  assert.equal(approveResult.status, 0, approveResult.stderr);
  const approveData = envelopeData(approveResult.stdout);
  assert.equal(approveData.to, 'delivered');
  assert.equal(fs.existsSync(sentinel), false, 'the outbound gate must NOT have re-run verify — mergedTreeAlreadyVerified must have skipped it');
});


test('catchup on the already-caught-up path ALSO records branchHeadAtReturn (no new commit, but still a real verify that must be cashed in)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  const sentinel = path.join(cwd, 'verify-ran.sentinel');
  makeAlreadyCaughtUpItem(cwd, 'catchup-caughtup-cashin', `touch ${JSON.stringify(sentinel)} && test -f catchup-caughtup-cashin-produced.txt`);

  const result = run(cwd, ['catchup', 'catchup-caughtup-cashin']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).outcome, 'already-caught-up');
  assert.equal(fs.existsSync(sentinel), true);

  const branchTip = gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-caughtup-cashin']).trim();
  assert.equal(stateView(cwd).work['catchup-caughtup-cashin'].branchHeadAtReturn, branchTip);

  fs.rmSync(sentinel);
  const approveResult = run(cwd, ['approve', 'catchup-caughtup-cashin']);
  assert.equal(approveResult.status, 0, approveResult.stderr);
  assert.equal(envelopeData(approveResult.stdout).to, 'delivered');
  assert.equal(fs.existsSync(sentinel), false, 'already-caught-up must also cash in its verify for the outbound skip');
});


test('an item that trips catchup verify-fail (never reaches awaiting-approval) does not have branchHeadAtReturn touched, and a later successful catchup still fixes it (fail-closed unaffected)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedRunnerItem(cwd, 'catchup-redverify', 'integration-drift', { verify: 'test -f this-file-does-not-exist.txt' });
  const before = stateView(cwd).work['catchup-redverify'].branchHeadAtReturn;

  const result = run(cwd, ['catchup', 'catchup-redverify']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).outcome, 'verify-fail');
  assert.equal(stateView(cwd).work['catchup-redverify'].status, 'blocked', 'a red catchup verify must leave the item blocked, not move it');
  assert.equal(stateView(cwd).work['catchup-redverify'].branchHeadAtReturn, before, 'a failed catchup must never record a tip it never actually verified green');
});


test('catchup on an item whose target has a REAL same-line conflict leaves it blocked, aborts cleanly (branch tip unchanged), and names the conflicted file', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'base\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'seed shared.txt']);

  addOk(cwd, 'catchup-conflict-item');
  run(cwd, ['move', 'catchup-conflict-item', '--to', 'doing']);
  commitPending(cwd, 'state: claim catchup-conflict-item');

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/catchup-conflict-item']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'branch-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'branch changes shared.txt']);
  gitAtCwd(cwd, ['checkout', 'main']);

  run(cwd, ['move', 'catchup-conflict-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPending(cwd, 'state: propose catchup-conflict-item');
  run(cwd, ['move', 'catchup-conflict-item', '--to', 'blocked', '--reason', 'merge-conflict']);
  commitPending(cwd, 'state: park catchup-conflict-item');

  // main changes the SAME line differently after the park — a genuine
  // conflict for catchup's merge (main into the branch) to detect.
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'main-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'main changes shared.txt']);

  const mainHeadBefore = gitHead(cwd);
  const branchHeadBefore = gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-conflict-item']).trim();
  const worktreesBefore = gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);

  const result = run(cwd, ['catchup', 'catchup-conflict-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /conflicted/);
  assert.match(result.stdout, /shared\.txt/);

  assert.equal(gitHead(cwd), mainHeadBefore, 'main must be unchanged by a failed catchup');
  assert.equal(gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-conflict-item']).trim(), branchHeadBefore, "the item's own branch tip must be unchanged after an aborted catchup");
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the ephemeral catchup worktree is cleaned up even on abort — no leftover');
  assert.equal(stateView(cwd).work['catchup-conflict-item'].status, 'blocked');
});


test('catchup on a branch that already contains the target reports outcome "already-caught-up", still runs verify, and bounces blocked -> awaiting-approval without creating a commit', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeAlreadyCaughtUpItem(cwd, 'catchup-caught-up', 'test -f catchup-caught-up-produced.txt');

  const mainHeadBefore = gitHead(cwd);
  const branchHeadBefore = gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-caught-up']).trim();
  const worktreesBefore = gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);

  const result = run(cwd, ['catchup', 'catchup-caught-up']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'already-caught-up');
  assert.equal(data.from, 'blocked');
  assert.equal(data.to, 'awaiting-approval');

  assert.equal(stateView(cwd).work['catchup-caught-up'].status, 'awaiting-approval');
  assert.equal(gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-caught-up']).trim(), branchHeadBefore, 'no commit is created when there was nothing to merge');
  assert.equal(gitHead(cwd), mainHeadBefore, "catchup must never touch the human's own main checkout");
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the ephemeral catchup worktree is cleaned up — no leftover');
});


test('catchup on an already-caught-up branch whose verify is RED stays blocked and reports verify-fail, without attempting a merge --abort that has no merge to abort', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeAlreadyCaughtUpItem(cwd, 'catchup-caught-up-red', 'test -f never-produced.txt');

  const branchHeadBefore = gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-caught-up-red']).trim();

  const result = run(cwd, ['catchup', 'catchup-caught-up-red']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'verify-fail');

  assert.equal(stateView(cwd).work['catchup-caught-up-red'].status, 'blocked');
  assert.equal(gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-caught-up-red']).trim(), branchHeadBefore);
});


test('catchup on an item blocked for an unrelated reason (e.g. anti-loop-max-visits) is rejected with a validation error naming the actual reason, before any git operation runs', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'catchup-unrelated-reason');
  run(cwd, ['move', 'catchup-unrelated-reason', '--to', 'doing']);
  run(cwd, ['move', 'catchup-unrelated-reason', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  run(cwd, ['move', 'catchup-unrelated-reason', '--to', 'blocked', '--reason', 'anti-loop-max-visits']);

  const result = run(cwd, ['catchup', 'catchup-unrelated-reason']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /anti-loop-max-visits/);
  assert.equal(stateView(cwd).work['catchup-unrelated-reason'].status, 'blocked');
});


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


test('catchup on a nonexistent id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['catchup', 'ghost']);
  assert.equal(result.status, 4);
});


test('catchup on a status other than blocked is rejected as precondition, exit 2', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'catchup-not-blocked');
  const result = run(cwd, ['catchup', 'catchup-not-blocked']);
  assert.equal(result.status, 2);
});


test('the CLI usage message for an unknown verb lists catchup in the surface', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['bogus-verb']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /catchup/);
});


test('an item added with no --acceptance flag has work.acceptance absent (undefined), not an empty array', () => {
  const cwd = tmpCwd();
  const result = addOk(cwd, 'no-acceptance-item');
  assert.equal(result.status, 0);
  const view = stateView(cwd);
  assert.equal('acceptance' in view.work['no-acceptance-item'], false, 'an omitted --acceptance leaves the field absent, not []');
  const listed = envelopeData(run(cwd, ['list']).stdout);
  assert.equal('acceptance' in listed.work['no-acceptance-item'], false);
});
