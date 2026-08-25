// fgos-return.test.mjs -- phần "return, reject" của bộ test CLI, tách nguyên văn
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



test('return with no id at all is rejected as validation, exit 4', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  const result = run(cwd, ['return']);
  assert.equal(result.status, 4);
});


test('return --timeout with a non-numeric or non-positive value is rejected as validation, exit 4', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-bad-timeout', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-bad-timeout']).status, 0);
  commitFile(cwd, 'proof.txt');

  const result = run(cwd, ['return', 'pull-return-bad-timeout', '--timeout', 'soon']);
  assert.equal(result.status, 4);
  assert.equal(stateView(cwd).work['pull-return-bad-timeout'].status, 'doing', 'a rejected --timeout never runs verify or moves the item');
});


test('return omitting --timeout falls back to the runner config\'s timeoutMs, blocking a verify that outlives it', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  writeShortRunnerConfig(cwd, 200);
  const scriptPath = writeHangScript(cwd, 1500);
  addOk(cwd, 'pull-return-fallback-timeout', { verify: `${process.execPath} ${JSON.stringify(scriptPath)}` });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-fallback-timeout']).status, 0);
  commitFile(cwd, 'proof.txt');

  const result = run(cwd, ['return', 'pull-return-fallback-timeout']);
  assert.equal(result.status, 0, `return should exit 0 for a defined blocked outcome: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'blocked', 'the 200ms fallback timeout should have killed the 1.5s verify');
  assert.equal(stateView(cwd).work['pull-return-fallback-timeout'].status, 'blocked');
});


test('return --no-timeout opts out of the fallback, letting a verify that outlives the config timeout finish and pass', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  writeShortRunnerConfig(cwd, 200);
  const scriptPath = writeHangScript(cwd, 500);
  addOk(cwd, 'pull-return-no-timeout', { verify: `${process.execPath} ${JSON.stringify(scriptPath)}` });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-no-timeout']).status, 0);
  commitFile(cwd, 'proof.txt');

  const result = run(cwd, ['return', 'pull-return-no-timeout', '--no-timeout']);
  assert.equal(result.status, 0, `return should succeed: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'awaiting-approval', '--no-timeout should have let the 500ms verify finish past the 200ms config timeout');
  assert.equal(stateView(cwd).work['pull-return-no-timeout'].status, 'awaiting-approval');
});


test('return --timeout and --no-timeout together are rejected as validation, exit 4', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-timeout-conflict', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-timeout-conflict']).status, 0);
  commitFile(cwd, 'proof.txt');

  const result = run(cwd, ['return', 'pull-return-timeout-conflict', '--timeout', '1000', '--no-timeout']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /mutually exclusive/);
  assert.equal(stateView(cwd).work['pull-return-timeout-conflict'].status, 'doing', 'a rejected flag combination never runs verify or moves the item');
});


test('return --timeout error text no longer claims omitting --timeout means no timeout', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-timeout-error-text', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-timeout-error-text']).status, 0);
  commitFile(cwd, 'proof.txt');

  // A bare --timeout (no value, last arg) is what actually triggers this
  // specific message -- 'soon' fails the separate numeric-check message
  // instead, which never carried the old "omit ... for no timeout" wording.
  const result = run(cwd, ['return', 'pull-return-timeout-error-text', '--timeout']);
  assert.equal(result.status, 4);
  assert.doesNotMatch(result.stderr, /omit --timeout entirely for no timeout/);
});


test('reject on a nonexistent id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['reject', 'ghost', '--reason', 'nope']);
  assert.equal(result.status, 4);
});


test('reject without --reason is rejected as validation, exit 4, item stays proposed', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'reject-no-reason-item');
  run(cwd, ['move', 'reject-no-reason-item', '--to', 'doing']);
  run(cwd, ['move', 'reject-no-reason-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const result = run(cwd, ['reject', 'reject-no-reason-item']);
  assert.equal(result.status, 4);
  assert.equal(stateView(cwd).work['reject-no-reason-item'].status, 'awaiting-approval');
});


test('reject on a non-proposed item is rejected as precondition, exit 2', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'reject-not-proposed-item');
  const result = run(cwd, ['reject', 'reject-not-proposed-item', '--reason', 'nope']);
  assert.equal(result.status, 2);
});


test('reject moves awaiting-approval -> todo with the reason recorded, role human, and runs no git command at all — never a revert', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'reject-pull-item', { verify: 'test -f proof.txt' });
  run(cwd, ['take', '--id', 'reject-pull-item']);
  commitFile(cwd, 'proof.txt');
  run(cwd, ['return', 'reject-pull-item']);

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['reject', 'reject-pull-item', '--reason', 'needs more test coverage']);
  assert.equal(result.status, 0, result.stderr);
  const rejectData = envelopeData(result.stdout);
  assert.equal(rejectData.from, 'awaiting-approval');
  assert.equal(rejectData.to, 'todo');
  assert.equal(rejectData.reason, 'needs more test coverage');

  assert.equal(gitHead(cwd), headBefore, 'reject must never touch git — HEAD unchanged');
  assert.ok(fs.existsSync(path.join(cwd, 'proof.txt')), 'reject never reverts the code already on main (D4)');

  const view = stateView(cwd);
  assert.equal(view.work['reject-pull-item'].status, 'todo');

  const lines = eventLines(cwd);
  const lastEvent = JSON.parse(lines[lines.length - 1]);
  assert.equal(lastEvent.payload.reason, 'needs more test coverage');
  assert.equal(lastEvent.payload.role, 'human');
});


test('return succeeds after a FIRST pick (todo -> doing, no prior blocked branch) once real work is committed on the fresh fgw/<id> worktree — a fresh pick claim records branchHeadAtTake exactly like a blocked reclaim does, so return recognizes the branch\'s own progress instead of checking the (unchanged) main checkout', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'pick-fresh-return-ok', { verify: 'test -f proof.txt' });
  const mainHeadBefore = gitHead(cwd);

  const pickResult = run(cwd, ['pick', '--id', 'pick-fresh-return-ok']);
  assert.equal(pickResult.status, 0, `pick failed: ${pickResult.stderr}`);
  const pickData = envelopeData(pickResult.stdout);
  assert.equal(pickData.worktree.reused, false, 'sanity: this is a fresh claim, not a blocked reclaim');

  // The real work happens on the fresh worktree pick just stood up — never
  // on the human's own main checkout.
  fs.writeFileSync(path.join(pickData.worktree.path, 'proof.txt'), 'built by the fresh pick\n');
  execFileSync('git', ['add', '-A'], { cwd: pickData.worktree.path });
  execFileSync('git', ['commit', '-q', '-m', 'work: proof.txt'], { cwd: pickData.worktree.path });
  const branchHeadAtReturn = gitAtCwd(cwd, ['rev-parse', 'fgw/pick-fresh-return-ok']).trim();
  const worktreesBefore = gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);

  const result = run(cwd, ['return', 'pick-fresh-return-ok']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.match(result.stdout, /awaiting-approval/);

  const view = stateView(cwd);
  assert.equal(view.work['pick-fresh-return-ok'].status, 'awaiting-approval');
  assert.equal(view.work['pick-fresh-return-ok'].branchHeadAtReturn, branchHeadAtReturn);
  assert.equal('headAtReturn' in view.work['pick-fresh-return-ok'], false, 'a branch-source return never records the main-based headAtReturn');
  assert.equal(gitHead(cwd), mainHeadBefore, "return never advances or touches the human's own main checkout");
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the disposable detached verify worktree is cleaned up — no leftover');
});


test('return on a branch-source take: verify passes in a disposable detached worktree at the branch tip -> awaiting-approval, branchHeadAtReturn recorded (never headAtReturn), the human\'s own main checkout is untouched and no worktree is left behind', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedBranchItem(cwd, 'branch-return-ok', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'branch-return-ok']).status, 0);
  // take's own event lands on events.jsonl in the SAME main tree (take never
  // uses a worktree) — commit that bookkeeping to main before switching
  // branches, exactly like commitFile's own doc comment describes.
  commitPending(cwd, 'state: take branch-return-ok');

  // The human commits their fix ON THE BRANCH — never on main.
  gitAtCwd(cwd, ['checkout', 'fgw/branch-return-ok']);
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'fixed by hand\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'human fix']);
  const branchHeadAtReturn = gitAtCwd(cwd, ['rev-parse', 'fgw/branch-return-ok']).trim();
  gitAtCwd(cwd, ['checkout', 'main']);
  const mainHeadBefore = gitHead(cwd);
  const worktreesBefore = gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);

  const result = run(cwd, ['return', 'branch-return-ok']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.match(result.stdout, /awaiting-approval/);

  const view = stateView(cwd);
  assert.equal(view.work['branch-return-ok'].status, 'awaiting-approval');
  assert.equal(view.work['branch-return-ok'].branchHeadAtReturn, branchHeadAtReturn);
  assert.equal('headAtReturn' in view.work['branch-return-ok'], false, 'a branch return never records the main-based headAtReturn (D2 CẤM)');
  assert.equal(gitHead(cwd), mainHeadBefore, "return never advances or touches the human's own main checkout");
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the disposable detached verify worktree is cleaned up — no leftover');
});


test('return on a branch-source take whose branch declares a real npm dependency: verify passes because the disposable detached worktree gets its own node_modules provisioned first (tsk-2vd — reproduces the real failure that blocked tsk-32n\'s own return)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);

  const localDep = mkLocalDependency();
  fs.writeFileSync(
    path.join(cwd, 'package.json'),
    JSON.stringify({ name: 'x', version: '1.0.0', dependencies: { 'fgos-test-localdep': `file:${localDep}` } }),
  );
  gitAtCwd(cwd, ['add', 'package.json']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'declare a dependency']);

  makeBlockedBranchItem(cwd, 'branch-return-deps', { verify: `node -e "require('fgos-test-localdep')"` });
  assert.equal(run(cwd, ['take', '--id', 'branch-return-deps']).status, 0);
  commitPending(cwd, 'state: take branch-return-deps');

  gitAtCwd(cwd, ['checkout', 'fgw/branch-return-deps']);
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'fixed by hand\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'human fix']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const result = run(cwd, ['return', 'branch-return-deps']);
  assert.equal(result.status, 0, `return failed (before this item's fix, this failed with ERR_MODULE_NOT_FOUND exactly like tsk-32n's own return did): ${result.stderr}`);
  assert.match(result.stdout, /awaiting-approval/);

  const view = stateView(cwd);
  assert.equal(view.work['branch-return-deps'].status, 'awaiting-approval');
});


test('return on a branch-source take never touches a live main-checkout.lock (tsk-45z D1 scope: only the main-source path releases early — worktree commits never contend for this shared lock)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  // tsk-40m: settleClaim now verifies the settling caller is the SAME
  // session that acquired the claim (writer-identity check) — take and
  // return must share the SAME FGOS_SESSION_ID for this test's own actor
  // to legitimately be the one returning it. Orthogonal to what this test
  // actually asserts (the pre-existing main-checkout.lock below, recorded
  // under the SAME identity for a different reason, must survive untouched).
  makeBlockedBranchItem(cwd, 'branch-return-lock-untouched', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'branch-return-lock-untouched'], { FGOS_SESSION_ID: 'tsk-45z-branch-session' }).status, 0);
  commitPending(cwd, 'state: take branch-return-lock-untouched');

  gitAtCwd(cwd, ['checkout', 'fgw/branch-return-lock-untouched']);
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'fixed by hand\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'human fix']);
  gitAtCwd(cwd, ['checkout', 'main']);

  // A lock recorded under this session's OWN identity — if return's release
  // wiring wrongly fired on the branch-source path too, this would vanish.
  const lockPath = path.join(cwd, '.fgos', 'main-checkout.lock');
  fs.writeFileSync(lockPath, JSON.stringify({ pid: 'tsk-45z-branch-session', ts: Date.now() }));

  const result = run(cwd, ['return', 'branch-return-lock-untouched'], { FGOS_SESSION_ID: 'tsk-45z-branch-session' });
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.match(result.stdout, /awaiting-approval/);
  assert.equal(fs.existsSync(lockPath), true, 'a branch-source return must never touch main-checkout.lock, even one it could self-recognize');
});
