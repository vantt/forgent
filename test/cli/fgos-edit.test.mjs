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


test('edit changes only the targeted field, every other field unchanged, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-risk', { risk: 'light' });
  const before = eventLines(cwd).length;
  const result = run(cwd, ['edit', 'edit-risk', '--risk', 'heavy']);
  assert.equal(result.status, 0);
  assert.equal(eventLines(cwd).length, before + 1);
  const item = stateView(cwd).work['edit-risk'];
  assert.equal(item.risk, 'heavy');
  assert.equal(item.title, 'Title edit-risk');
  assert.equal(item.kind, 'task');
  assert.equal(item.status, 'todo');
});

test('edit on an unknown id is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['edit', 'never-added', '--risk', 'heavy']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, 0);
});

test('edit with zero field flags is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-no-flags');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['edit', 'edit-no-flags']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('edit --deps pointing at an unknown id is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-bad-dep');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['edit', 'edit-bad-dep', '--deps', 'ghost-dep']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('edit rejects a patch targeting id/status/stage/domain, exit 4, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-locked-fields');
  const before = eventLines(cwd).length;
  for (const field of ['status', 'stage', 'domain']) {
    const result = run(cwd, ['edit', 'edit-locked-fields', `--${field}`, 'whatever']);
    assert.equal(result.status, 4, `--${field} should be rejected`);
  }
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['edit-locked-fields'].status, 'todo');
});

test('edit succeeds identically regardless of the item current status', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-any-status');
  run(cwd, ['move', 'edit-any-status', '--to', 'doing']);
  const result = run(cwd, ['edit', 'edit-any-status', '--risk', 'heavy']);
  assert.equal(result.status, 0);
  const item = stateView(cwd).work['edit-any-status'];
  assert.equal(item.risk, 'heavy');
  assert.equal(item.status, 'doing');
});

test('edit omitting --refs/--deps leaves the field untouched; an explicit empty value clears it', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'edit-refs', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--refs', 'a,b', '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 0);

  const untouched = run(cwd, ['edit', 'edit-refs', '--risk', 'heavy']);
  assert.equal(untouched.status, 0);
  assert.deepEqual(stateView(cwd).work['edit-refs'].refs, ['a', 'b']);

  const cleared = run(cwd, ['edit', 'edit-refs', '--refs', '']);
  assert.equal(cleared.status, 0);
  assert.deepEqual(stateView(cwd).work['edit-refs'].refs, []);
});

test('edit omitting --parent leaves it untouched; an explicit --parent sets it; --parent "" clears it', () => {
  const cwd = tmpCwd();
  assert.equal(addOk(cwd, 'parent-edit-root').status, 0);
  assert.equal(addOk(cwd, 'parent-edit-child').status, 0);
  assert.equal(stateView(cwd).work['parent-edit-child'].parent, undefined);

  const untouched = run(cwd, ['edit', 'parent-edit-child', '--risk', 'heavy']);
  assert.equal(untouched.status, 0);
  assert.equal(stateView(cwd).work['parent-edit-child'].parent, undefined);

  const setParent = run(cwd, ['edit', 'parent-edit-child', '--parent', 'parent-edit-root']);
  assert.equal(setParent.status, 0);
  assert.equal(stateView(cwd).work['parent-edit-child'].parent, 'parent-edit-root');

  const cleared = run(cwd, ['edit', 'parent-edit-child', '--parent', '']);
  assert.equal(cleared.status, 0);
  assert.equal(stateView(cwd).work['parent-edit-child'].parent, null);
});

test('edit --parent (bare, no value) is rejected as a valueless flag, distinct from --parent ""', () => {
  const cwd = tmpCwd();
  assert.equal(addOk(cwd, 'parent-edit-bad').status, 0);
  const result = run(cwd, ['edit', 'parent-edit-bad', '--parent']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--parent requires a value; use --parent "" to clear it/);
});

test('edit --parent closing a cycle is rejected at the CLI, same "graph cycle" message as the store-layer test', () => {
  const cwd = tmpCwd();
  assert.equal(addOk(cwd, 'parent-cycle-a').status, 0);
  const withParent = run(cwd, ['add', 'parent-cycle-b', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--parent', 'parent-cycle-a', '--description', 'tsk-535 fixture description.']);
  assert.equal(withParent.status, 0);

  const result = run(cwd, ['edit', 'parent-cycle-a', '--parent', 'parent-cycle-b']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /would close a graph cycle/);
  assert.equal(stateView(cwd).work['parent-cycle-a'].parent, undefined, 'the rejected patch never landed');
});

test('editWork rejects a patch containing id/status/stage/domain as validation, before merge, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-store-locked');
  const dir = path.join(cwd, '.fgos');
  const before = eventLines(cwd).length;
  for (const key of ['id', 'status', 'stage', 'domain']) {
    assert.throws(
      () => editWork(dir, { id: 'edit-store-locked', patch: { [key]: 'whatever' } }),
      (err) => err instanceof StoreError && err.category === 'validation',
      `patch.${key} should be rejected`,
    );
  }
  assert.equal(eventLines(cwd).length, before);
});

test('edit reports the real event seq in its envelope data, not undefined', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-seq-check'); // event #1
  const result = run(cwd, ['edit', 'edit-seq-check', '--risk', 'heavy']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.seq, 2);
  assert.equal(data.id, 'edit-seq-check');
  assert.deepEqual(data.fields, ['risk']);
});

// --- str7-str8-priority-intent D1/D3/D6: --priority/--intent on `edit` ---
//
// Both flags exist ONLY on `edit` (D3) — `add`/`submit` are untouched
// (see the add-without-tier/domain coverage above for the established shape
// of an omitted-optional-field add; there is no --priority/--intent
// equivalent there by design, so no test asserts a negative for `add` —
// the flags simply don't appear in its parser wiring at all).

test('edit --priority sets the item priority field to the given integer, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-priority');
  const result = run(cwd, ['edit', 'edit-priority', '--priority', '3']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['edit-priority'].priority, 3);
});

test('edit --intent accepts a negative value (no sign constraint), exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-intent-neg');
  const result = run(cwd, ['edit', 'edit-intent-neg', '--intent', '-1']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['edit-intent-neg'].intent, -1);
});

for (const [label, badFlagArgs, fieldName] of EDIT_BAD_FLAG_CASES) {
  test(`edit with ${label} is rejected as validation, exit 4, no event written, field left unset`, () => {
    const cwd = tmpCwd();
    addOk(cwd, 'edit-bad-flag-item');
    const before = eventLines(cwd).length;
    const result = run(cwd, ['edit', 'edit-bad-flag-item', ...badFlagArgs]);
    assert.equal(result.status, 4);
    assert.equal(eventLines(cwd).length, before);
    assert.equal(stateView(cwd).work['edit-bad-flag-item'][fieldName], undefined);
  });
}

test('edit --urgent/--impact/--effort set the item fields to the given values, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-priority-matrix');
  const result = run(cwd, ['edit', 'edit-priority-matrix', '--urgent', 'critical', '--impact', '12.5', '--effort', '3']);
  assert.equal(result.status, 0);
  const item = stateView(cwd).work['edit-priority-matrix'];
  assert.equal(item.urgent, 'critical');
  assert.equal(item.impact, 12.5);
  assert.equal(item.effort, 3);
});

for (const [label, badFlagArgs, fieldName] of EDIT_PRIORITY_MATRIX_BAD_FLAG_CASES) {
  test(`edit with ${label} is rejected as validation, exit 4, no event written, field left unset`, () => {
    const cwd = tmpCwd();
    addOk(cwd, 'edit-priority-matrix-bad-flag');
    const before = eventLines(cwd).length;
    const result = run(cwd, ['edit', 'edit-priority-matrix-bad-flag', ...badFlagArgs]);
    assert.equal(result.status, 4);
    assert.equal(eventLines(cwd).length, before);
    assert.equal(stateView(cwd).work['edit-priority-matrix-bad-flag'][fieldName], undefined);
  });
}

test('edit --verify-from-children generates a jq command listing all direct children ids with the resolved-set check and an absolute --dir, exit 0', () => {
  const { cwd, worktreePath } = initGitCwdWithWorktree();
  assert.equal(run(cwd, ['add', 'parent-x', '--title', 'Parent', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['add', 'child-1', '--title', 'Child 1', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--parent', 'parent-x', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['add', 'child-2', '--title', 'Child 2', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--parent', 'parent-x', '--description', 'tsk-535 fixture description.']).status, 0);
  // child-1 already resolved (delivered, not yet cleanup/done) -- the
  // resolved-set default (D3) must still count it, unlike a strict-done check.
  assert.equal(run(cwd, ['move', 'child-1', '--to', 'doing']).status, 0);
  assert.equal(run(cwd, ['move', 'child-1', '--to', 'delivered']).status, 0);

  // Run the edit itself with process cwd INSIDE the linked worktree, while
  // --dir still points at the main checkout's real fgOS store -- the exact
  // split real usage has (implementation happens inside a worktree, but
  // .fgos/ only ever lives at the main checkout, ADR0020).
  const result = run(worktreePath, ['edit', 'parent-x', '--verify-from-children', '--dir', cwd]);
  assert.equal(result.status, 0);
  const verify = stateView(cwd).work['parent-x'].verify;
  assert.match(verify, /child-1/);
  assert.match(verify, /child-2/);
  assert.match(verify, /delivered/);
  assert.match(verify, /retrospective/);
  assert.match(verify, /cleanup/);
  assert.match(verify, /"done"/);
  assert.ok(verify.includes(`--dir ${cwd}`), `expected --dir "${cwd}" (main checkout, not the worktree) in: ${verify}`);
  assert.ok(!verify.includes(worktreePath), `verify must not bake in the worktree's own path: ${verify}`);
});

test('edit --verify-from-targets generates a jq command listing all target ids with the resolved-set check and an absolute --dir, exit 0', () => {
  const { cwd, worktreePath } = initGitCwdWithWorktree();
  assert.equal(run(cwd, ['add', 'target-1', '--title', 'Target 1', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['add', 'mvp-x', '--title', 'MVP', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--goal-tier', 'mvp', '--targets', 'target-1', '--description', 'tsk-535 fixture description.']).status, 0);

  const result = run(worktreePath, ['edit', 'mvp-x', '--verify-from-targets', '--dir', cwd]);
  assert.equal(result.status, 0);
  const verify = stateView(cwd).work['mvp-x'].verify;
  assert.match(verify, /target-1/);
  assert.match(verify, /delivered/);
  assert.ok(verify.includes(`--dir ${cwd}`), `expected --dir "${cwd}" (main checkout, not the worktree) in: ${verify}`);
});

// tsk-1ia: the two tests above only assert the generated command's STRING
// content (contains the right ids/keywords) -- they never actually RAN the
// jq expression, which is exactly how tsk-580's own real bug (`all([...] |
// index(.) != null)` always evaluating true, since `.` inside `index(.)`
// rebinds to the literal array, not the per-element status) rode into
// `main` unnoticed. These two tests close that gap by spawning the
// generated `verify` command for real against a genuinely-resolved and a
// genuinely-unresolved fixture, and asserting the real exit code.
test("edit --verify-from-children's generated jq expression correctly returns true when all children are resolved (actually running it, not just checking its text)", () => {
  const { cwd, worktreePath } = initGitCwdWithWorktree();
  assert.equal(run(cwd, ['add', 'parent-all-resolved', '--title', 'Parent', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['add', 'child-r1', '--title', 'Child 1', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--parent', 'parent-all-resolved', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['add', 'child-r2', '--title', 'Child 2', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--parent', 'parent-all-resolved', '--description', 'tsk-535 fixture description.']).status, 0);
  // child-r1 delivered, child-r2 cleanup -- both resolved-set, neither strict-done.
  assert.equal(run(cwd, ['move', 'child-r1', '--to', 'doing']).status, 0);
  assert.equal(run(cwd, ['move', 'child-r1', '--to', 'delivered']).status, 0);
  assert.equal(run(cwd, ['move', 'child-r2', '--to', 'doing']).status, 0);
  assert.equal(run(cwd, ['move', 'child-r2', '--to', 'delivered']).status, 0);
  assert.equal(run(cwd, ['move', 'child-r2', '--to', 'retrospective']).status, 0);
  assert.equal(run(cwd, ['move', 'child-r2', '--to', 'cleanup']).status, 0);
  linkFgosBinInto(cwd);

  assert.equal(run(worktreePath, ['edit', 'parent-all-resolved', '--verify-from-children', '--dir', cwd]).status, 0);
  const verify = stateView(cwd).work['parent-all-resolved'].verify;
  const executed = spawnSync(verify, { cwd, shell: true, encoding: 'utf8' });
  assert.equal(executed.status, 0, `expected the generated verify to PASS when every child is resolved; got status ${executed.status}, stderr: ${executed.stderr}`);
});

test("edit --verify-from-children's generated jq expression correctly returns false when not all children are resolved (actually running it, not just checking its text)", () => {
  const { cwd, worktreePath } = initGitCwdWithWorktree();
  assert.equal(run(cwd, ['add', 'parent-partial', '--title', 'Parent', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['add', 'child-p1', '--title', 'Child 1', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--parent', 'parent-partial', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['add', 'child-p2', '--title', 'Child 2', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--parent', 'parent-partial', '--description', 'tsk-535 fixture description.']).status, 0);
  // child-p1 resolved (delivered); child-p2 stays at todo -- NOT resolved.
  assert.equal(run(cwd, ['move', 'child-p1', '--to', 'doing']).status, 0);
  assert.equal(run(cwd, ['move', 'child-p1', '--to', 'delivered']).status, 0);
  linkFgosBinInto(cwd);

  assert.equal(run(worktreePath, ['edit', 'parent-partial', '--verify-from-children', '--dir', cwd]).status, 0);
  const verify = stateView(cwd).work['parent-partial'].verify;
  const executed = spawnSync(verify, { cwd, shell: true, encoding: 'utf8' });
  assert.notEqual(executed.status, 0, 'expected the generated verify to FAIL when a child is still todo (not resolved) -- a status 0 here reproduces tsk-580\'s own vacuous-pass bug');
});

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

// --- edit --description/--footprint: `add` already accepted both fields,
// but EDITABLE_FIELDS never listed them, so a description/footprint typo'd
// or left blank at add time -- or an item added before either field
// existed -- had no way to ever gain or correct one after creation. ---

// tsk-535 D1: `add` now always sets description (required flag), so an
// item created via `addOk` can no longer "have none" -- reframed to prove
// `edit --description` still overwrites an existing one, the same
// capability this test always covered.
test('edit --description overwrites an existing description, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-description-existing');
  assert.equal(stateView(cwd).work['edit-description-existing'].description, 'tsk-535 fixture description.');
  const result = run(cwd, ['edit', 'edit-description-existing', '--description', 'the full story']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['edit-description-existing'].description, 'the full story');
});

test('edit --footprint sets footprint on an item that had none, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-footprint-new');
  assert.equal(stateView(cwd).work['edit-footprint-new'].footprint, undefined);
  const result = run(cwd, ['edit', 'edit-footprint-new', '--footprint', 'src/a.mjs,src/b.mjs']);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['edit-footprint-new'].footprint, ['src/a.mjs', 'src/b.mjs']);
});

test('edit --action sets action directive prose on an item, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-action-new');
  assert.equal(stateView(cwd).work['edit-action-new'].action, undefined);
  const result = run(cwd, ['edit', 'edit-action-new', '--action', 'Implement feature X per plan.md']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['edit-action-new'].action, 'Implement feature X per plan.md');
});

test('edit --action with empty string is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-action-empty');
  const result = run(cwd, ['edit', 'edit-action-empty', '--action', '']);
  assert.equal(result.status, 4);
  assert.equal(stateView(cwd).work['edit-action-empty'].action, undefined);
});

test('edit --acceptance is refused when a clause supplies text+evidence together but evidence cites no real path', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-untraceable');
  const result = run(cwd, ['edit', 'edit-untraceable', '--acceptance', JSON.stringify([{ text: 'root cause confirmed', evidence: 'nothing checkable here' }])]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /evidence/);
  assert.equal(stateView(cwd).work['edit-untraceable'].acceptance, undefined, 'the rejected patch never applies');
});

test('edit --acceptance persists work.acceptance as the given array', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-acceptance');
  const clauses = [{ text: 'newly added clause' }];
  const result = run(cwd, ['edit', 'edit-acceptance', '--acceptance', JSON.stringify(clauses)]);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['edit-acceptance'].acceptance, clauses);
});

test('edit --acceptance replaces the whole array (latest-wins), same semantics as --refs/--deps', () => {
  const cwd = tmpCwd();
  const first = [{ text: 'first clause' }, { text: 'second clause' }];
  const result = run(cwd, ['add', 'edit-acceptance-replace', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--acceptance', JSON.stringify(first), '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['edit-acceptance-replace'].acceptance, first);

  const second = [{ text: 'a completely different clause' }];
  const replaced = run(cwd, ['edit', 'edit-acceptance-replace', '--acceptance', JSON.stringify(second)]);
  assert.equal(replaced.status, 0);
  assert.deepEqual(stateView(cwd).work['edit-acceptance-replace'].acceptance, second, 'edit --acceptance must replace, not merge, the array');
});

test('edit with a malformed --acceptance is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-bad-acceptance');
  const before = eventLines(cwd).length;

  const invalidJson = run(cwd, ['edit', 'edit-bad-acceptance', '--acceptance', 'not json']);
  assert.equal(invalidJson.status, 4);

  const notArray = run(cwd, ['edit', 'edit-bad-acceptance', '--acceptance', JSON.stringify({ text: 'x' })]);
  assert.equal(notArray.status, 4);

  const missingText = run(cwd, ['edit', 'edit-bad-acceptance', '--acceptance', JSON.stringify([{ evidence: 'e' }])]);
  assert.equal(missingText.status, 4);

  const emptyText = run(cwd, ['edit', 'edit-bad-acceptance', '--acceptance', JSON.stringify([{ text: '' }])]);
  assert.equal(emptyText.status, 4);

  assert.equal(eventLines(cwd).length, before, 'no malformed --acceptance edit should append any event');
  assert.equal('acceptance' in stateView(cwd).work['edit-bad-acceptance'], false);
});

test('editing in the missing evidence after a refusal, then retrying move --to delivered, succeeds — no cached verdict', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'cli-cos-retry');
  run(cwd, ['edit', 'cli-cos-retry', '--acceptance', JSON.stringify([{ text: 'ship it' }])]);

  assert.equal(run(cwd, ['move', 'cli-cos-retry', '--to', 'delivered']).status, 2);
  assert.equal(stateView(cwd).work['cli-cos-retry'].status, 'awaiting-approval');

  // tsk-5q5-2: evidence must resolve to a real path under cwd.
  const retryEdit = run(cwd, ['edit', 'cli-cos-retry', '--acceptance', JSON.stringify([{ text: 'ship it', evidence: '.fgos/events.jsonl' }])]);
  assert.equal(retryEdit.status, 0, 'edit --acceptance with real, traceable evidence must succeed');
  const result = run(cwd, ['move', 'cli-cos-retry', '--to', 'delivered']);
  assert.equal(result.status, 0, 'the retry must re-read the just-edited evidence, not a cached refusal');
  assert.equal(stateView(cwd).work['cli-cos-retry'].status, 'delivered');
});

// tsk-34o: edit --role, mirroring take --role's own optional-flag pattern --
// role only ever lands in the raw event's payload (never projected onto
// work[id], unlike take's claimRole), so these read eventLines directly.
test('edit --role session tags the stored event payload.role "session" instead of the default human', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-role-session');

  const result = run(cwd, ['edit', 'edit-role-session', '--risk', 'heavy', '--role', 'session']);
  assert.equal(result.status, 0, `edit failed: ${result.stderr}`);

  const last = JSON.parse(eventLines(cwd).at(-1));
  assert.equal(last.payload.role, 'session');
});

test('edit omitting --role still stamps payload.role "human" -- unchanged default for every existing caller', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-role-default');

  const result = run(cwd, ['edit', 'edit-role-default', '--risk', 'heavy']);
  assert.equal(result.status, 0, `edit failed: ${result.stderr}`);

  const last = JSON.parse(eventLines(cwd).at(-1));
  assert.equal(last.payload.role, 'human');
});

test('edit --role with an invalid value is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-role-bad');
  const before = eventLines(cwd).length;

  const result = run(cwd, ['edit', 'edit-role-bad', '--risk', 'heavy', '--role', 'robot']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before, 'an invalid --role must not append any event');
});

test('resolve-park-reason on unknown id is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;

  const result = run(cwd, ['resolve-park-reason', 'unknown-id', '--note', 'human override']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('resolve-park-reason with missing or empty --note is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'resolve-bad-note');

  const res1 = run(cwd, ['resolve-park-reason', 'resolve-bad-note']);
  assert.equal(res1.status, 4);

  const res2 = run(cwd, ['resolve-park-reason', 'resolve-bad-note', '--note', '  ']);
  assert.equal(res2.status, 4);
});

test('resolve-park-reason on non-terminal item (todo/doing/blocked/awaiting-human/awaiting-approval) is refused, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'resolve-non-terminal');

  // status todo
  const resTodo = run(cwd, ['resolve-park-reason', 'resolve-non-terminal', '--note', 'clearing']);
  assert.equal(resTodo.status, 4);

  // status doing
  run(cwd, ['move', 'resolve-non-terminal', '--to', 'doing']);
  const resDoing = run(cwd, ['resolve-park-reason', 'resolve-non-terminal', '--note', 'clearing']);
  assert.equal(resDoing.status, 4);

  // status blocked with reason
  run(cwd, ['move', 'resolve-non-terminal', '--to', 'blocked', '--reason', 'parked reason']);
  const resBlocked = run(cwd, ['resolve-park-reason', 'resolve-non-terminal', '--note', 'clearing']);
  assert.equal(resBlocked.status, 4);
});

test('resolve-park-reason on done item clears reason and parkReason and records note in parkResolutions', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'resolve-done-item');
  run(cwd, ['move', 'resolve-done-item', '--to', 'doing']);
  run(cwd, ['move', 'resolve-done-item', '--to', 'awaiting-approval', '--skip-return-guard', 'test setup']);
  run(cwd, ['move', 'resolve-done-item', '--to', 'blocked', '--reason', 'commit X is no longer reachable from fgw/parent']);
  run(cwd, ['move', 'resolve-done-item', '--to', 'doing']);
  run(cwd, ['move', 'resolve-done-item', '--to', 'awaiting-approval', '--skip-return-guard', 'test setup']);
  toDoneViaChain(cwd, 'resolve-done-item');

  const beforeView = stateView(cwd);
  assert.equal(beforeView.work['resolve-done-item'].reason, 'commit X is no longer reachable from fgw/parent');
  assert.equal(beforeView.work['resolve-done-item'].parkReason, 'natural-finish');

  const result = run(cwd, ['resolve-park-reason', 'resolve-done-item', '--note', 'Human confirmed content is present on main']);
  assert.equal(result.status, 0);

  const afterView = stateView(cwd);
  assert.equal(afterView.work['resolve-done-item'].reason, undefined);
  assert.equal(afterView.work['resolve-done-item'].parkReason, undefined);
  assert.ok(Array.isArray(afterView.parkResolutions['resolve-done-item']));
  assert.equal(afterView.parkResolutions['resolve-done-item'].length, 1);
  assert.equal(afterView.parkResolutions['resolve-done-item'][0].note, 'Human confirmed content is present on main');
});

test('resolve-park-reason on wontfix item clears reason', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'resolve-wontfix-item');
  run(cwd, ['move', 'resolve-wontfix-item', '--to', 'doing']);
  run(cwd, ['move', 'resolve-wontfix-item', '--to', 'awaiting-approval', '--skip-return-guard', 'test setup']);
  run(cwd, ['move', 'resolve-wontfix-item', '--to', 'blocked', '--reason', 'stale park text']);
  run(cwd, ['move', 'resolve-wontfix-item', '--to', 'wontfix']);

  const beforeView = stateView(cwd);
  assert.equal(beforeView.work['resolve-wontfix-item'].reason, 'stale park text');

  const result = run(cwd, ['resolve-park-reason', 'resolve-wontfix-item', '--note', 'Closed as wontfix and verified safe']);
  assert.equal(result.status, 0);

  const afterView = stateView(cwd);
  assert.equal(afterView.work['resolve-wontfix-item'].reason, undefined);
  assert.equal(afterView.parkResolutions['resolve-wontfix-item'][0].note, 'Closed as wontfix and verified safe');
});

test('resolve-park-reason on a done item without prior reason succeeds as a no-op clear and records note', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'resolve-no-reason-item');
  run(cwd, ['move', 'resolve-no-reason-item', '--to', 'doing']);
  run(cwd, ['move', 'resolve-no-reason-item', '--to', 'awaiting-approval', '--skip-return-guard', 'test setup']);
  toDoneViaChain(cwd, 'resolve-no-reason-item');

  const beforeView = stateView(cwd);
  assert.equal(beforeView.work['resolve-no-reason-item'].reason, undefined);

  const result = run(cwd, ['resolve-park-reason', 'resolve-no-reason-item', '--note', 'Clean close check']);
  assert.equal(result.status, 0);

  const afterView = stateView(cwd);
  assert.equal(afterView.work['resolve-no-reason-item'].reason, undefined);
  assert.equal(afterView.parkResolutions['resolve-no-reason-item'][0].note, 'Clean close check');
});

test('resolve-park-reason regression guard: ordinary work.move reason fold on active item is unaffected (RUL32)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'resolve-item-a');
  addOk(cwd, 'active-item-b');

  // Item A is done and resolved
  run(cwd, ['move', 'resolve-item-a', '--to', 'doing']);
  run(cwd, ['move', 'resolve-item-a', '--to', 'awaiting-approval', '--skip-return-guard', 'test setup']);
  run(cwd, ['move', 'resolve-item-a', '--to', 'blocked', '--reason', 'parked reason A']);
  run(cwd, ['move', 'resolve-item-a', '--to', 'doing']);
  run(cwd, ['move', 'resolve-item-a', '--to', 'awaiting-approval', '--skip-return-guard', 'test setup']);
  toDoneViaChain(cwd, 'resolve-item-a');
  run(cwd, ['resolve-park-reason', 'resolve-item-a', '--note', 'cleared A']);

  // Item B is actively parked
  run(cwd, ['move', 'active-item-b', '--to', 'doing']);
  run(cwd, ['move', 'active-item-b', '--to', 'awaiting-approval', '--skip-return-guard', 'test setup']);
  run(cwd, ['move', 'active-item-b', '--to', 'blocked', '--reason', 'parked reason B']);

  const view = stateView(cwd);
  assert.equal(view.work['resolve-item-a'].reason, undefined);
  assert.equal(view.work['active-item-b'].reason, 'parked reason B');
});




