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


test('approve of a leaf whose root has NOT moved: no catchup attempted at all, unchanged from before this item (regression guard)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'no-catchup-root', 'no-catchup-leaf', { verify: 'test -f no-catchup-leaf-produced.txt' });
  commitPendingBeforeApprove(cwd, 'no-catchup-leaf');

  const result = run(cwd, ['approve', 'no-catchup-leaf']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'delivered');

  const leafLog = gitAtCwd(cwd, ['log', '--oneline', 'fgw/no-catchup-leaf']);
  assert.doesNotMatch(leafLog, /catch-up:/, 'no catchup commit must exist when the root never moved — the ancestor check must have short-circuited before performCatchUp was ever called');
});


test('approve of a leaf whose root branch was never created (root only ever driven by a live session/pick, never the runner dispatch loop that creates fgw/<rootId> early per D17): falls back to creating it from main instead of crashing raw on the ancestor-check', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  const dir = path.join(cwd, '.fgos');

  const rootId = 'no-early-branch-root';
  const leafId = 'no-early-branch-leaf';

  addWork(dir, { id: rootId, title: `Title ${rootId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  commitPending(cwd, `state: add ${rootId}`);
  // Deliberately no `git branch fgw/${rootId} main` here — this is the
  // exact gap: a root only ever driven live never gets its own branch
  // created early.

  addWork(dir, {
    id: leafId,
    title: `Title ${leafId}`,
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: `test -f ${leafId}-produced.txt`,
    parent: rootId,
  });
  run(cwd, ['move', leafId, '--to', 'doing']);
  commitPending(cwd, `state: claim ${leafId}`);

  gitAtCwd(cwd, ['checkout', '-b', `fgw/${leafId}`, 'main']);
  fs.writeFileSync(path.join(cwd, `${leafId}-produced.txt`), 'ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', `worker output for ${leafId}`]);
  gitAtCwd(cwd, ['checkout', 'main']);

  run(cwd, ['move', leafId, '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPendingBeforeApprove(cwd, leafId);

  const branchesBefore = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.doesNotMatch(branchesBefore, new RegExp(`fgw/${rootId}\\b`), 'fgw/<rootId> must not exist yet — the whole point of this fixture');

  const result = run(cwd, ['approve', leafId]);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'delivered');
  assert.equal(data.target, `fgw/${rootId}`);

  const branchesAfter = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.match(branchesAfter, new RegExp(`fgw/${rootId}\\b`), 'fgw/<rootId> must exist after approve — created by the fallback');

  const rootTip = gitAtCwd(cwd, ['show', `fgw/${rootId}:${leafId}-produced.txt`]);
  assert.match(rootTip, /ok/);
});


test('approve of a leaf whose inline catchup hits a real conflict: parks blocked (reason merge-conflict), the leaf stays awaiting-approval-shaped (not silently delivered), root untouched', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'catchup-conflict-root', 'catchup-conflict-leaf', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'catchup-conflict-leaf');

  // Same-line conflict: the root advances with a same-named file whose
  // content collides with what the leaf's own commit already touches.
  gitAtCwd(cwd, ['checkout', 'fgw/catchup-conflict-root']);
  fs.writeFileSync(path.join(cwd, 'catchup-conflict-leaf-produced.txt'), 'root-side content, different from leaf\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'root touches the same file the leaf does']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const rootTipBefore = gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-conflict-root']).trim();
  const result = run(cwd, ['approve', 'catchup-conflict-leaf']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'blocked');
  assert.equal(data.reason, 'merge-conflict');
  assert.equal(data.target, 'fgw/catchup-conflict-root');

  assert.equal(gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-conflict-root']).trim(), rootTipBefore, 'root must be completely untouched by a failed inline catchup');
  assert.equal(stateView(cwd).work['catchup-conflict-leaf'].status, 'blocked');
});


test('approve of a runner item that conflicts: aborts the merge, awaiting-approval -> blocked (reason merge-conflict), main left byte-for-byte unchanged (must_have: main never holds a broken merge commit)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'base\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'seed shared.txt']);

  addOk(cwd, 'approve-conflict-item');
  run(cwd, ['move', 'approve-conflict-item', '--to', 'doing']);
  commitPending(cwd, 'state: claim approve-conflict-item');

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/approve-conflict-item']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'branch-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'branch changes shared.txt']);
  gitAtCwd(cwd, ['checkout', 'main']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'main-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'main changes shared.txt']);

  run(cwd, ['move', 'approve-conflict-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPending(cwd, 'state: propose approve-conflict-item');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'approve-conflict-item']);
  assert.equal(result.status, 0, result.stderr);
  const conflictData = envelopeData(result.stdout);
  assert.equal(conflictData.to, 'blocked');
  assert.equal(conflictData.reason, 'merge-conflict');

  assert.equal(gitHead(cwd), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(fs.readFileSync(path.join(cwd, 'shared.txt'), 'utf8'), 'main-change\n', 'main content must be unchanged');

  const view = stateView(cwd);
  assert.equal(view.work['approve-conflict-item'].status, 'blocked');
  assert.equal(view.frictions['approve-conflict-item'][0].errorClass, 'merge-conflict');
});


test('approve of a runner item whose staged merge fails its own verify: aborts, awaiting-approval -> blocked (reason verify-fail-post-merge), main left unchanged', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-verify-fail-item', { verify: 'test -f file-never-produced.txt' });

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'approve-verify-fail-item']);
  assert.equal(result.status, 0, result.stderr);
  const verifyFailData = envelopeData(result.stdout);
  assert.equal(verifyFailData.to, 'blocked');
  assert.equal(verifyFailData.reason, 'verify-fail-post-merge');

  assert.equal(gitHead(cwd), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(fs.existsSync(path.join(cwd, 'approve-verify-fail-item-produced.txt')), false, 'a staged-then-aborted merge must not leave its file behind');

  const view = stateView(cwd);
  assert.equal(view.work['approve-verify-fail-item'].status, 'blocked');
  assert.equal(view.frictions['approve-verify-fail-item'][0].errorClass, 'verify-miss');
});


test('approve of a root item that HAD children, whose merge into main conflicts, parks with the distinguishing reason integration-drift and a main@<sha> friction detail', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'base\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'seed shared.txt']);

  const dir = path.join(cwd, '.fgos');
  addOk(cwd, 'drift-root-item');
  // A child (any status) is enough to mark this root as "actually had
  // children" (D8's check reads existence of `parent === id`, per
  // replay.mjs's fold never clearing `parent` even once the child is done).
  addWork(dir, {
    id: 'drift-root-child',
    title: 'drift child',
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'true',
    parent: 'drift-root-item',
  });

  run(cwd, ['move', 'drift-root-item', '--to', 'doing']);
  commitPending(cwd, 'state: claim drift-root-item');

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/drift-root-item']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'branch-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'branch changes shared.txt']);
  gitAtCwd(cwd, ['checkout', 'main']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'main-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'main changes shared.txt']);

  run(cwd, ['move', 'drift-root-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPending(cwd, 'state: propose drift-root-item');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'drift-root-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).reason, 'integration-drift');

  assert.equal(gitHead(cwd), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(fs.readFileSync(path.join(cwd, 'shared.txt'), 'utf8'), 'main-change\n', 'main content must be unchanged');

  const view = stateView(cwd);
  assert.equal(view.work['drift-root-item'].status, 'blocked');
  assert.equal(view.frictions['drift-root-item'][0].errorClass, 'merge-conflict');
  assert.match(view.frictions['drift-root-item'][0].detail, new RegExp(`main@${headBefore}`), 'friction detail must record the main@<sha> ref');
});


test('approve of a pull-door item (no merge, code already on main): re-verifies and closes awaiting-approval -> done with role human', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'approve-pull-item', { verify: 'test -f proof.txt' });
  run(cwd, ['take', '--id', 'approve-pull-item']);
  commitFile(cwd, 'proof.txt');
  run(cwd, ['return', 'approve-pull-item']);
  commitPendingBeforeApprove(cwd, 'approve-pull-item');

  const result = run(cwd, ['approve', 'approve-pull-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).to, 'delivered');

  const view = stateView(cwd);
  assert.equal(view.work['approve-pull-item'].status, 'delivered');
  // No 'close' settlement yet -- that fires at cleanup->done, not delivered.
  assert.equal(view.settlements?.['approve-pull-item'], undefined);
});


test('approve of a legacy item with a failing verify: blocked (reason verify-fail), not merge-related, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-legacy-fail-item', { verify: 'false' });
  run(cwd, ['move', 'approve-legacy-fail-item', '--to', 'doing']);
  run(cwd, ['move', 'approve-legacy-fail-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const result = run(cwd, ['approve', 'approve-legacy-fail-item']);
  assert.equal(result.status, 0, result.stderr);
  const legacyFailData = envelopeData(result.stdout);
  assert.equal(legacyFailData.to, 'blocked');
  assert.equal(legacyFailData.reason, 'verify-fail');

  const view = stateView(cwd);
  assert.equal(view.work['approve-legacy-fail-item'].status, 'blocked');
});


test("approve verify-fail (legacy item): park edge stamps role 'system' (not human) on the awaiting-approval -> blocked event", () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-legacy-fail-role-item', { verify: 'false' });
  run(cwd, ['move', 'approve-legacy-fail-role-item', '--to', 'doing']);
  run(cwd, ['move', 'approve-legacy-fail-role-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const result = run(cwd, ['approve', 'approve-legacy-fail-role-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).to, 'blocked');

  const lines = eventLines(cwd);
  const moveEvent = lines.map((l) => JSON.parse(l)).find((e) => e.type === 'work.move' && e.payload.to === 'blocked');
  assert.ok(moveEvent, 'expected a work.move event to blocked');
  assert.equal(moveEvent.payload.role, 'system');
});


test('approve of a legacy item with a passing verify closes it to done — legacy degrade never blocks approve/reject from working (must_have)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-legacy-ok-item', { verify: 'true' });
  run(cwd, ['move', 'approve-legacy-ok-item', '--to', 'doing']);
  run(cwd, ['move', 'approve-legacy-ok-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const result = run(cwd, ['approve', 'approve-legacy-ok-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['approve-legacy-ok-item'].status, 'delivered');
});


test('approve catches transitionWork CAS conflict when item becomes blocked before failure block write, returning structured result (AC4)', () => {
  const cwd = tmpCwd();
  const verifyCmd = `node --input-type=module -e 'import { moveWork } from "${REAL_REPO_ROOT}/src/state/store.mjs"; moveWork(".fgos", { id: "cas-blocked-item", to: "blocked", expectedStatus: "awaiting-approval", reason: "concurrent-block", role: "system" }); process.exit(1);'`;
  addOk(cwd, 'cas-blocked-item', { verify: verifyCmd });
  run(cwd, ['move', 'cas-blocked-item', '--to', 'doing']);
  run(cwd, ['move', 'cas-blocked-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup"]);

  const result = run(cwd, ['approve', 'cas-blocked-item']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'blocked');
  assert.equal(data.reason, 'state-changed-concurrently');
  assert.equal(data.expected, 'awaiting-approval');
  assert.equal(data.actual, 'blocked');
});


test('approve CAS conflict returns fresh actual status from store on event-regression replay / stale status (AC5)', () => {
  const cwd = tmpCwd();
  const verifyCmd = `node --input-type=module -e 'import { moveWork } from "${REAL_REPO_ROOT}/src/state/store.mjs"; moveWork(".fgos", { id: "cas-todo-item", to: "todo", expectedStatus: "awaiting-approval", reason: "concurrent-todo", role: "system" }); process.exit(1);'`;
  addOk(cwd, 'cas-todo-item', { verify: verifyCmd });
  run(cwd, ['move', 'cas-todo-item', '--to', 'doing']);
  run(cwd, ['move', 'cas-todo-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup"]);

  const result = run(cwd, ['approve', 'cas-todo-item']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'blocked');
  assert.equal(data.reason, 'state-changed-concurrently');
  assert.equal(data.expected, 'awaiting-approval');
  assert.equal(data.actual, 'todo');
});


