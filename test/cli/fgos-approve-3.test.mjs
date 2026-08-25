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


// tsk-3vo D5: same shared --timeout/--no-timeout resolution as `return`
// (resolveVerifyTimeoutMs), wired into `approve` too — must reject the same
// way, before any verify runs.
test('approve --timeout and --no-timeout together are rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-timeout-conflict', { verify: 'true' });
  run(cwd, ['move', 'approve-timeout-conflict', '--to', 'doing']);
  run(cwd, ['move', 'approve-timeout-conflict', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const result = run(cwd, ['approve', 'approve-timeout-conflict', '--timeout', '1000', '--no-timeout']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /mutually exclusive/);
  assert.equal(stateView(cwd).work['approve-timeout-conflict'].status, 'awaiting-approval', 'a rejected flag combination never runs verify or moves the item');
});


test('approve twice: the second approve on an already-done item is rejected as precondition, exit 2 (done is terminal)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-twice-item', { verify: 'true' });
  run(cwd, ['move', 'approve-twice-item', '--to', 'doing']);
  run(cwd, ['move', 'approve-twice-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  assert.equal(run(cwd, ['approve', 'approve-twice-item']).status, 0);

  const result = run(cwd, ['approve', 'approve-twice-item']);
  assert.equal(result.status, 2);
});


test('approve of a runner item whose diff touches a self-modifying-capable module (src/runner/**) REFUSES without --acknowledge-iron-law: validation exit 4, item stays proposed, no merge, message names the tripped module', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'iron-refuse-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'iron-refuse-item']);
  assert.equal(result.status, 4, `expected a validation refusal: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Iron Law/);
  assert.match(result.stderr, /src\/runner\/probe\.mjs/, 'the refusal must name the exact module that tripped required:true');
  assert.match(result.stderr, /--acknowledge-iron-law/);

  const view = stateView(cwd);
  assert.equal(view.work['iron-refuse-item'].status, 'awaiting-approval', 'a refused approve leaves the item proposed');
  assert.equal(gitHead(cwd), headBefore, 'a refused approve attempts no merge — HEAD is unchanged');
  const survivingBranches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/']);
  assert.match(survivingBranches, /fgw\/iron-refuse-item/, 'the branch survives an Iron Law refusal — nothing was merged or cleaned up');
});


test('approve --acknowledge-iron-law false (a value form, not the bare flag) still REFUSES -- fail-closed, review-20260718-self-improve-loop f02', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'iron-ack-false-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'iron-ack-false-item', '--acknowledge-iron-law', 'false']);
  assert.equal(result.status, 4, `a value form must refuse exactly like no flag at all: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Iron Law/);

  const view = stateView(cwd);
  assert.equal(view.work['iron-ack-false-item'].status, 'awaiting-approval');
  assert.equal(gitHead(cwd), headBefore);
});


test('approve of the same self-modifying diff PROCEEDS with --acknowledge-iron-law: merges, verifies, awaiting-approval -> delivered, branch SURVIVES (tsk-1p9: cleanup deferred to the cleanup verb)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'iron-ack-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });
  commitPendingBeforeApprove(cwd, 'iron-ack-item');

  const result = run(cwd, ['approve', 'iron-ack-item', '--acknowledge-iron-law']);
  assert.equal(result.status, 0, `approve with acknowledgment must succeed: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'delivered');

  const view = stateView(cwd);
  assert.equal(view.work['iron-ack-item'].status, 'delivered');
  // No 'close' settlement yet -- that fires at cleanup->done, not delivered.
  assert.equal(view.settlements?.['iron-ack-item'], undefined);
  assert.ok(fs.existsSync(path.join(cwd, 'src/runner/probe.mjs')), 'the merged module file is present on main');
  const branches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/']);
  assert.match(branches, /fgw\/iron-ack-item/, 'the merged branch must survive approve — deleted later by the cleanup verb, not here');
});


test('approve of an ordinary runner item (diff touches no self-modifying module) is UNAFFECTED — proceeds to done with no --acknowledge-iron-law flag (backward compatibility)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'iron-plain-item', 'docs/notes.txt', {
    verify: 'test -f docs/notes.txt',
  });
  commitPendingBeforeApprove(cwd, 'iron-plain-item');

  const result = run(cwd, ['approve', 'iron-plain-item']);
  assert.equal(result.status, 0, `an ordinary diff must approve without any acknowledgment: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'delivered');
  assert.doesNotMatch(result.stdout, /Iron Law/);
  assert.equal(stateView(cwd).work['iron-plain-item'].status, 'delivered');
});


// tsk-4voj-iron-law-leaf-scope CONTEXT.md D1: the Iron Law's own
// changedFiles input now diffs a leaf against its resolved root's branch
// (the same D3 leaf-vs-root split `approve`'s merge target and `review`'s
// diff already use), not blind trunk. Before this fix, a leaf forked AFTER
// a sibling already merged a gated-module change into the root inherited
// that sibling's files as if they were its own -- live-reproduced on
// tsk-52g-2. These two tests prove the false-positive is closed (below)
// without under-scoping a leaf's own genuine hit (further below).

test('approve of a leaf item forked AFTER a sibling already merged a gated-module change into the root does NOT trip Iron Law on the ancestor\'s file (tsk-4voj false-positive closed)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);

  const rootId = 'iron-leaf-root';
  const leafId = 'iron-leaf-child';
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: rootId, title: `Title ${rootId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  commitPending(cwd, `state: add ${rootId}`);
  gitAtCwd(cwd, ['branch', `fgw/${rootId}`, 'main']);

  // A sibling child's already-merged gated-module change, landed on the
  // root's own integration branch BEFORE this leaf forks from it -- the
  // exact tsk-52g-2 shape.
  gitAtCwd(cwd, ['checkout', `fgw/${rootId}`]);
  fs.mkdirSync(path.join(cwd, 'src/runner'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'src/runner/sibling-produced.mjs'), 'export const sibling = true;\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'sibling child merged into root (already has its own evidence elsewhere)']);
  gitAtCwd(cwd, ['checkout', 'main']);

  addWork(dir, {
    id: leafId, title: `Title ${leafId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [],
    verify: 'test -f docs/leaf-note.txt', parent: rootId,
  });
  run(cwd, ['move', leafId, '--to', 'doing']);
  commitPending(cwd, `state: claim ${leafId}`);

  gitAtCwd(cwd, ['checkout', '-b', `fgw/${leafId}`, `fgw/${rootId}`]);
  fs.mkdirSync(path.join(cwd, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs/leaf-note.txt'), 'ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', `worker output for ${leafId}`]);
  gitAtCwd(cwd, ['checkout', 'main']);

  run(cwd, ['move', leafId, '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPendingBeforeApprove(cwd, leafId);

  const result = run(cwd, ['approve', leafId]);
  assert.equal(result.status, 0, `leaf's own diff never touches a gated module -- must approve without --acknowledge-iron-law: ${result.stdout}${result.stderr}`);
  assert.doesNotMatch(result.stdout, /Iron Law/);
  assert.equal(stateView(cwd).work[leafId].status, 'delivered');
});


// Superseded by docs/history/iron-law-gate-human-ux/CONTEXT.md D1: this used
// to assert the leaf REFUSES, back when the gate fired at every merge
// boundary. It now fires only where the target is trunk, and a leaf's target
// is `fgw/<root>` — so what stays worth proving here is the leaf-scoped diff
// itself (tsk-4voj D1's own subject): the leaf's own gated-module commit is
// still SEEN, it just no longer refuses at this boundary. The refusal half
// moved to test/cli/fgos-iron-law-gate.test.mjs, which pins the same diff
// tripping the gate at the trunk boundary it does still guard.
test('approve of a leaf item whose OWN commit touches a gated module (src/runner/**) PROCEEDS — the leaf lands on fgw/<root>, never trunk (iron-law-gate-human-ux D1)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);

  const rootId = 'iron-leaf-genuine-root';
  const leafId = 'iron-leaf-genuine-child';
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: rootId, title: `Title ${rootId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  commitPending(cwd, `state: add ${rootId}`);
  gitAtCwd(cwd, ['branch', `fgw/${rootId}`, 'main']);

  addWork(dir, {
    id: leafId, title: `Title ${leafId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [],
    verify: 'test -f src/runner/iron-leaf-genuine-child-produced.mjs', parent: rootId,
  });
  run(cwd, ['move', leafId, '--to', 'doing']);
  commitPending(cwd, `state: claim ${leafId}`);

  gitAtCwd(cwd, ['checkout', '-b', `fgw/${leafId}`, `fgw/${rootId}`]);
  fs.mkdirSync(path.join(cwd, 'src/runner'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'src/runner/iron-leaf-genuine-child-produced.mjs'), 'export const producedByLeaf = true;\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', `worker output for ${leafId}`]);
  gitAtCwd(cwd, ['checkout', 'main']);

  run(cwd, ['move', leafId, '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPendingBeforeApprove(cwd, leafId);

  const result = run(cwd, ['approve', leafId]);
  assert.equal(result.status, 0, `a leaf never lands on trunk -- the gate must not fire here: ${result.stdout}${result.stderr}`);
  assert.doesNotMatch(result.stdout, /Iron Law/);
  assert.equal(stateView(cwd).work[leafId].status, 'delivered');
  assert.match(
    gitAtCwd(cwd, ['ls-tree', '-r', '--name-only', `fgw/${rootId}`]),
    /src\/runner\/iron-leaf-genuine-child-produced\.mjs/,
    "the leaf's own gated-module file really did land on the root branch -- this is the diff the trunk-boundary gate will see when the root itself merges",
  );
});


test('approve of a milestone blocks when a targeted item\'s root has unsynced drift, exit 4, item stays awaiting-approval', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'closeout-root', { verify: 'true' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'closeout-child', title: 'child', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', parent: 'closeout-root' });
  commitPending(cwd, 'state: add closeout-child');

  makeMilestone(cwd, 'closeout-milestone', ['closeout-child']);

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'closeout-milestone']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /unsynced drift/);
  assert.match(result.stderr, /closeout-child/);
  assert.match(result.stderr, /closeout-root/);
  assert.match(result.stderr, /fgos sync-root/);
  assert.equal(gitHead(cwd), headBefore, 'a blocked close-out attempts no merge');
  assert.equal(stateView(cwd).work['closeout-milestone'].status, 'awaiting-approval');
});


test('approve of a milestone succeeds with --acknowledge-drift despite a targeted item\'s root having unsynced drift', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'closeout-ack-root', { verify: 'true' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'closeout-ack-child', title: 'child', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', parent: 'closeout-ack-root' });
  commitPending(cwd, 'state: add closeout-ack-child');

  makeMilestone(cwd, 'closeout-ack-milestone', ['closeout-ack-child']);

  const result = run(cwd, ['approve', 'closeout-ack-milestone', '--acknowledge-drift']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['closeout-ack-milestone'].status, 'delivered');
});
