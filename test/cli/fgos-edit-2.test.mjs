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
  writeLiveLock,
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


// --- edit --docs-ref: docsRef can now be attached/changed after creation,
// not only at `add` time -- closes the gap where an item created via
// `submit` (no --docs-ref of its own before this) had no way to ever gain
// this link. ---

test.todo('edit --docs-ref sets docsRef on an item that had none, exit 0 - migrated to test/direct/fgos-edit.test.mjs');


test.todo('edit --docs-ref replaces an existing docsRef (latest-wins), exit 0 - migrated to test/direct/fgos-edit.test.mjs');


// --- edit --merge-after (tsk-2u0, docs/history/
//     tsk-3bn-merge-conductor-harness-v2/D4/D5) -----------------------------

test.todo('edit --merge-after sets mergeAfter on an item that had none, exit 0 - migrated to test/direct/fgos-edit.test.mjs');


test.todo('edit --merge-after "" clears an existing mergeAfter, exit 0 - migrated to test/direct/fgos-edit.test.mjs');


test('edit --merge-after rejects a target id that does not exist, exit 4, item unchanged', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'merge-after-ghost-item');
  const result = run(cwd, ['edit', 'merge-after-ghost-item', '--merge-after', 'no-such-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not a known id/);
  assert.equal(stateView(cwd).work['merge-after-ghost-item'].mergeAfter, undefined);
});


test('edit --merge-after rejects an item listing itself, exit 4', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'merge-after-self-item');
  const result = run(cwd, ['edit', 'merge-after-self-item', '--merge-after', 'merge-after-self-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /own mergeAfter/);
});


test('edit --merge-after rejects a mergeAfter that would close a cycle mixed with deps, exit 4', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'merge-after-cycle-a');
  addOk(cwd, 'merge-after-cycle-b');
  run(cwd, ['edit', 'merge-after-cycle-b', '--deps', 'merge-after-cycle-a']);
  // a deps:[] currently; setting a.mergeAfter:[b] would close a -> b (waits-for) -> a (blocks).
  const result = run(cwd, ['edit', 'merge-after-cycle-a', '--merge-after', 'merge-after-cycle-b']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /cycle/);
  assert.equal(stateView(cwd).work['merge-after-cycle-a'].mergeAfter, undefined);
});


test.todo('edit --merge-after does not require the deps field to have been touched (byte-identical to other list edits) - migrated to test/direct/fgos-edit.test.mjs');


// --- edit --superseded-by / --duplicates (tsk-2ie, docs/history/
//     tsk-2ie-duplicate-superseded-guard/ D1-D3) ---------------------------

test.todo('edit --superseded-by sets supersededBy on an item that had none, exit 0 - migrated to test/direct/fgos-edit.test.mjs');


test.todo('edit --superseded-by "" clears an existing supersededBy, exit 0 - migrated to test/direct/fgos-edit.test.mjs');


test('edit --superseded-by rejects a target id that does not exist, exit 4, item unchanged', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'superseded-by-ghost-item');
  const result = run(cwd, ['edit', 'superseded-by-ghost-item', '--superseded-by', 'no-such-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not a known id/);
  assert.equal(stateView(cwd).work['superseded-by-ghost-item'].supersededBy, undefined);
});


test('edit --superseded-by rejects an item listing itself, exit 4', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'superseded-by-self-item');
  const result = run(cwd, ['edit', 'superseded-by-self-item', '--superseded-by', 'superseded-by-self-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /own supersededBy/);
});


test('edit --superseded-by with no value is a validation error, exit 4', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'superseded-by-noval-item');
  const result = run(cwd, ['edit', 'superseded-by-noval-item', '--superseded-by']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--superseded-by requires a value/);
});


test.todo('edit --duplicates sets duplicates on an item that had none, exit 0 - migrated to test/direct/fgos-edit.test.mjs');


test.todo('edit --duplicates "" clears an existing duplicates, exit 0 - migrated to test/direct/fgos-edit.test.mjs');


test('edit --duplicates rejects a target id that does not exist, exit 4, item unchanged', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'duplicates-ghost-item');
  const result = run(cwd, ['edit', 'duplicates-ghost-item', '--duplicates', 'no-such-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not a known id/);
  assert.equal(stateView(cwd).work['duplicates-ghost-item'].duplicates, undefined);
});


test('edit --duplicates rejects an item listing itself, exit 4', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'duplicates-self-item');
  const result = run(cwd, ['edit', 'duplicates-self-item', '--duplicates', 'duplicates-self-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /own duplicates/);
});
