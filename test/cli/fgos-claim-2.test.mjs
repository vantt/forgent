// fgos-claim.test.mjs -- phần "take, pick, session, unlock, lock-status, main-checkout-reset, take/pick/approve" của bộ test CLI, tách nguyên văn
// từ test/cli/fgos.test.mjs (tsk-3um). Nội dung test không đổi, chỉ chỗ ở đổi.
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import { commandManifest } from '../helpers/command-manifest.mjs';
import {
  ADD_BAD_FLAG_CASES,
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
  commitPending,
  commitPendingBeforeApprove,
  cutMemberBranch,
  docsIndexManifestPath,
  editWork,
  envelopeData,
  eventLines,
  execFileSync,
  fileURLToPath,
  fs,
  gitAtCwd,
  gitHead,
  initGitCwd,
  initGitCwdFast,
  initGitCwdInSubdir,
  initGitCwdMain,
  initGitCwdMainFast,
  initGitCwdWithWorktree,
  initHeadlessGitCwd,
  initHeadlessGitCwdFast,
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
  mkLocalDependency,
  moveStep,
  moveWork,
  os,
  path,
  rawTmpCwd,
  registerFlatMember,
  releaseClaimFor,
  removeAdHocWorktree,
  run,
  spawnSync,
  stateView,
  tmpCwd,
  tmpCwdFast,
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








test('session with no sub-verb, and an unknown sub-verb, are both rejected as validation, exit 4', () => {
  const cwd = initGitCwdFast();
  assert.equal(run(cwd, ['session']).status, 4);
  assert.equal(run(cwd, ['session', 'bogus']).status, 4);
});


test('unlock is gone: an unknown verb, and no manifest entry', () => {
  const cwd = tmpCwdFast();
  const result = run(cwd, ['unlock']);
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /unknown verb "unlock"/);

  const manifest = commandManifest();
  assert.equal(manifest.commands.find((c) => c.name === 'unlock'), undefined);
  const lock = manifest.commands.find((c) => c.name === 'lock');
  assert.ok(lock, 'lock entry missing from the command manifest');
  assert.equal(lock.touchesState, true);
  assert.equal(lock.externalEffect, true);
});


// --- `fgos lock-status`: read-only report of every repo/machine registry lock

test('lock-status: registered in the command manifest as read-only (touchesState/externalEffect both false)', () => {
  const entry = commandManifest().commands.find((c) => c.name === 'lock-status');
  assert.ok(entry, 'lock-status entry missing from the command manifest');
  assert.equal(entry.touchesState, false);
  assert.equal(entry.externalEffect, false);
});


test('take --wait rejects a non-numeric or non-positive value the same way --timeout already does', () => {
  const cwd = initGitCwdFast();
  addOk(cwd, 'wait-bad-value-take');

  const result = run(cwd, ['take', 'wait-bad-value-take', '--wait', 'nope']);
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /--wait must be a positive number of milliseconds/);
});


test('take --wait rejects a value above the 900000ms (15 min) cap -- tsk-2rf D3', () => {
  const cwd = initGitCwdFast();
  addOk(cwd, 'wait-over-cap-take');

  const result = run(cwd, ['take', 'wait-over-cap-take', '--wait', '900001']);
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /--wait must be at most 900000ms \(15 min\)/);
});


test('take/pick/approve are documented in the command manifest with wait/no-wait properties', () => {
  const manifest = commandManifest();
  for (const name of ['take', 'pick', 'approve']) {
    const entry = manifest.commands.find((c) => c.name === name);
    assert.ok(entry, `${name} entry missing from the command manifest`);
    assert.ok(entry.parameters.properties.wait, `${name} manifest entry missing "wait" property`);
    assert.ok(entry.parameters.properties['no-wait'], `${name} manifest entry missing "no-wait" property`);
  }
});


// --- re-claiming an item whose branch and worktree are still standing
// (tsk-65n) -----------------------------------------------------------------

test('pick on an item whose fgw/<id> worktree is still live hands back that SAME worktree instead of removing it out from under the session working there', () => {
  const cwd = initGitCwdFast();
  addOk(cwd, 'repick-live-item');

  const firstPick = envelopeData(run(cwd, ['pick', '--id', 'repick-live-item']).stdout);
  const worktreePath = firstPick.worktree.path;
  fs.writeFileSync(path.join(worktreePath, 'CONTEXT.md'), '# decisions\n');
  execFileSync('git', ['add', 'CONTEXT.md'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-m', 'lock decisions'], { cwd: worktreePath });
  // A claim released at the clarify/decompose -> executing boundary, with the
  // session still sitting in its worktree.
  releaseClaimFor(cwd, 'repick-live-item');

  const secondPick = envelopeData(run(cwd, ['pick', '--id', 'repick-live-item']).stdout);

  assert.equal(secondPick.worktree.path, worktreePath, 'the live worktree is reattached, not replaced');
  assert.equal(secondPick.worktree.reused, true);
  assert.equal(fs.existsSync(worktreePath), true);
  assert.equal(fs.existsSync(path.join(worktreePath, 'CONTEXT.md')), true, 'work committed before the release is still there');
});


test('pick reattaches even when the live worktree has uncommitted work, leaving that work untouched', () => {
  const cwd = initGitCwdFast();
  addOk(cwd, 'repick-dirty-item');

  const firstPick = envelopeData(run(cwd, ['pick', '--id', 'repick-dirty-item']).stdout);
  const worktreePath = firstPick.worktree.path;
  fs.writeFileSync(path.join(worktreePath, 'CONTEXT.md'), '# decisions\n');
  execFileSync('git', ['add', 'CONTEXT.md'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-m', 'lock decisions'], { cwd: worktreePath });
  fs.writeFileSync(path.join(worktreePath, 'draft.md'), 'half-written\n');
  releaseClaimFor(cwd, 'repick-dirty-item');

  const secondPick = envelopeData(run(cwd, ['pick', '--id', 'repick-dirty-item']).stdout);

  assert.equal(secondPick.worktree.path, worktreePath);
  assert.equal(fs.readFileSync(path.join(worktreePath, 'draft.md'), 'utf8'), 'half-written\n');
});


test('take refuses a todo item whose own fgw/<id> branch already exists, naming pick instead of silently claiming source:main', () => {
  const cwd = initGitCwdFast();
  addOk(cwd, 'take-with-branch-item');

  // the branch (and worktree) come into being via pick; the claim is then
  // released, leaving a todo item whose work lives on the branch
  envelopeData(run(cwd, ['pick', '--id', 'take-with-branch-item']).stdout);
  releaseClaimFor(cwd, 'take-with-branch-item');

  const taken = run(cwd, ['take', '--id', 'take-with-branch-item']);

  assert.notEqual(taken.status, 0, 'a main-checkout take of branch-resident work is refused');
  assert.match(taken.stderr, /already has its own branch fgw\/take-with-branch-item/);
  assert.match(taken.stderr, /fgos pick take-with-branch-item/);
  assert.equal(stateView(cwd).work['take-with-branch-item'].status, 'todo', 'the refusal is a clean no-op');
});


test('take still claims a todo item that has no fgw/<id> branch of its own', () => {
  const cwd = initGitCwdFast();
  addOk(cwd, 'take-no-branch-item');

  const taken = run(cwd, ['take', '--id', 'take-no-branch-item']);

  assert.equal(taken.status, 0, `take failed: ${taken.stderr}`);
  const data = envelopeData(taken.stdout);
  assert.equal(data.source, 'main');
  assert.equal(stateView(cwd).work['take-no-branch-item'].status, 'doing');
});
