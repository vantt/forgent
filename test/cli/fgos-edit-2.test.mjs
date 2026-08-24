// fgos-edit.test.mjs -- phần "edit, editing, editWork" của bộ test CLI, tách nguyên văn
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



test('edit --verify-from-children with no children found throws a validation error instead of writing a vacuous verify, exit 4', () => {
  const cwd = tmpCwd();
  assert.equal(addOk(cwd, 'lonely-parent').status, 0);
  const before = stateView(cwd).work['lonely-parent'].verify;
  const result = run(cwd, ['edit', 'lonely-parent', '--verify-from-children']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /no children|no item has parent/i);
  assert.equal(stateView(cwd).work['lonely-parent'].verify, before, 'a failed guard must never write patch.verify');
});


test('edit --verify-from-targets with empty targets throws a validation error instead of writing a vacuous verify, exit 4', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['add', 'targetless-mvp', '--title', 'MVP', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--goal-tier', 'mvp', '--description', 'tsk-535 fixture description.']).status, 0);
  const before = stateView(cwd).work['targetless-mvp'].verify;
  const result = run(cwd, ['edit', 'targetless-mvp', '--verify-from-targets']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /no targets/i);
  assert.equal(stateView(cwd).work['targetless-mvp'].verify, before, 'a failed guard must never write patch.verify');
});


// --- edit --docs-ref: docsRef can now be attached/changed after creation,
// not only at `add` time -- closes the gap where an item created via
// `submit` (no --docs-ref of its own before this) had no way to ever gain
// this link. ---

test('edit --docs-ref sets docsRef on an item that had none, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-docs-ref-new');
  const result = run(cwd, ['edit', 'edit-docs-ref-new', '--docs-ref', 'docs/history/edit-docs-ref-new/']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['edit-docs-ref-new'].docsRef, 'docs/history/edit-docs-ref-new/');
});


test('edit --docs-ref replaces an existing docsRef (latest-wins), exit 0', () => {
  const cwd = tmpCwd();
  run(cwd, ['add', 'edit-docs-ref-replace', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--docs-ref', 'docs/history/old-feature/', '--description', 'tsk-535 fixture description.']);
  const result = run(cwd, ['edit', 'edit-docs-ref-replace', '--docs-ref', 'docs/history/new-feature/']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['edit-docs-ref-replace'].docsRef, 'docs/history/new-feature/');
});


// --- edit --merge-after (tsk-2u0, docs/history/
//     tsk-3bn-merge-conductor-harness-v2/D4/D5) -----------------------------

test('edit --merge-after sets mergeAfter on an item that had none, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'merge-after-target');
  addOk(cwd, 'merge-after-item');
  const result = run(cwd, ['edit', 'merge-after-item', '--merge-after', 'merge-after-target']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(stateView(cwd).work['merge-after-item'].mergeAfter, ['merge-after-target']);
});


test('edit --merge-after "" clears an existing mergeAfter, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'merge-after-clear-target');
  addOk(cwd, 'merge-after-clear-item');
  run(cwd, ['edit', 'merge-after-clear-item', '--merge-after', 'merge-after-clear-target']);
  const result = run(cwd, ['edit', 'merge-after-clear-item', '--merge-after', '']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(stateView(cwd).work['merge-after-clear-item'].mergeAfter, []);
});


test('edit --merge-after rejects a target id that does not exist, exit 4, item unchanged', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'merge-after-ghost-item');
  const result = run(cwd, ['edit', 'merge-after-ghost-item', '--merge-after', 'no-such-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not a known id/);
  assert.equal(stateView(cwd).work['merge-after-ghost-item'].mergeAfter, undefined);
});


test('edit --merge-after rejects an item listing itself, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'merge-after-self-item');
  const result = run(cwd, ['edit', 'merge-after-self-item', '--merge-after', 'merge-after-self-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /own mergeAfter/);
});


test('edit --merge-after rejects a mergeAfter that would close a cycle mixed with deps, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'merge-after-cycle-a');
  addOk(cwd, 'merge-after-cycle-b');
  run(cwd, ['edit', 'merge-after-cycle-b', '--deps', 'merge-after-cycle-a']);
  // a deps:[] currently; setting a.mergeAfter:[b] would close a -> b (waits-for) -> a (blocks).
  const result = run(cwd, ['edit', 'merge-after-cycle-a', '--merge-after', 'merge-after-cycle-b']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /cycle/);
  assert.equal(stateView(cwd).work['merge-after-cycle-a'].mergeAfter, undefined);
});


test('edit --merge-after does not require the deps field to have been touched (byte-identical to other list edits)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'merge-after-independent-target');
  addOk(cwd, 'merge-after-independent-item');
  const result = run(cwd, ['edit', 'merge-after-independent-item', '--merge-after', 'merge-after-independent-target']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(stateView(cwd).work['merge-after-independent-item'].deps, []);
});


// --- edit --superseded-by / --duplicates (tsk-2ie, docs/history/
//     tsk-2ie-duplicate-superseded-guard/ D1-D3) ---------------------------

test('edit --superseded-by sets supersededBy on an item that had none, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'superseded-by-target');
  addOk(cwd, 'superseded-by-item');
  const result = run(cwd, ['edit', 'superseded-by-item', '--superseded-by', 'superseded-by-target']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['superseded-by-item'].supersededBy, 'superseded-by-target');
});


test('edit --superseded-by "" clears an existing supersededBy, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'superseded-by-clear-target');
  addOk(cwd, 'superseded-by-clear-item');
  run(cwd, ['edit', 'superseded-by-clear-item', '--superseded-by', 'superseded-by-clear-target']);
  const result = run(cwd, ['edit', 'superseded-by-clear-item', '--superseded-by', '']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['superseded-by-clear-item'].supersededBy, null);
});


test('edit --superseded-by rejects a target id that does not exist, exit 4, item unchanged', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'superseded-by-ghost-item');
  const result = run(cwd, ['edit', 'superseded-by-ghost-item', '--superseded-by', 'no-such-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not a known id/);
  assert.equal(stateView(cwd).work['superseded-by-ghost-item'].supersededBy, undefined);
});


test('edit --superseded-by rejects an item listing itself, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'superseded-by-self-item');
  const result = run(cwd, ['edit', 'superseded-by-self-item', '--superseded-by', 'superseded-by-self-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /own supersededBy/);
});


test('edit --superseded-by with no value is a validation error, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'superseded-by-noval-item');
  const result = run(cwd, ['edit', 'superseded-by-noval-item', '--superseded-by']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--superseded-by requires a value/);
});


test('edit --duplicates sets duplicates on an item that had none, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'duplicates-target');
  addOk(cwd, 'duplicates-item');
  const result = run(cwd, ['edit', 'duplicates-item', '--duplicates', 'duplicates-target']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(stateView(cwd).work['duplicates-item'].duplicates, ['duplicates-target']);
});


test('edit --duplicates "" clears an existing duplicates, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'duplicates-clear-target');
  addOk(cwd, 'duplicates-clear-item');
  run(cwd, ['edit', 'duplicates-clear-item', '--duplicates', 'duplicates-clear-target']);
  const result = run(cwd, ['edit', 'duplicates-clear-item', '--duplicates', '']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(stateView(cwd).work['duplicates-clear-item'].duplicates, []);
});


test('edit --duplicates rejects a target id that does not exist, exit 4, item unchanged', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'duplicates-ghost-item');
  const result = run(cwd, ['edit', 'duplicates-ghost-item', '--duplicates', 'no-such-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not a known id/);
  assert.equal(stateView(cwd).work['duplicates-ghost-item'].duplicates, undefined);
});


test('edit --duplicates rejects an item listing itself, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'duplicates-self-item');
  const result = run(cwd, ['edit', 'duplicates-self-item', '--duplicates', 'duplicates-self-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /own duplicates/);
});
