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

// tsk-1t2: real events for tsk-26r (work.move/work.outcome/work.edit) were
// once found sitting in the shared repo's frozen `.fgos/events.jsonl`
// baseline (seq 24089-24092) instead of a per-writer shard under
// `.fgos/events/` -- exactly the "fgos edit <id> --verify ..." + a
// pick/return lifecycle this test drives end to end through the REAL
// spawned CLI process (not a bare store.mjs function call, which
// test/state/store.test.mjs's own "learning record rides the SAME
// work.move event" test already covers at the in-process level -- this is
// the CLI-process-boundary layer the incident's own command actually ran
// through). `logPath(cwd)` (TA-D12's baseline-0) must never gain a single
// byte across add/edit/move/edit again: every event this whole sequence
// produces belongs under `.fgos/events/` instead.
test('a full add -> edit -> move -> edit CLI lifecycle never appends to the frozen events.jsonl baseline -- every event lands under .fgos/events/', () => {
  const cwd = tmpCwd();
  const baselineBefore = fs.readFileSync(logPath(cwd), 'utf8');
  assert.equal(baselineBefore, '', 'tmpCwd(): baseline should start empty (init writes no events, just an empty file)');

  assert.equal(addOk(cwd, 'tsk-write-path-guard').status, 0);
  assert.equal(run(cwd, ['edit', 'tsk-write-path-guard', '--verify', 'echo first']).status, 0);
  assert.equal(run(cwd, ['move', 'tsk-write-path-guard', '--to', 'doing']).status, 0);
  assert.equal(run(cwd, ['edit', 'tsk-write-path-guard', '--verify', 'echo second']).status, 0);

  const baselineAfter = fs.readFileSync(logPath(cwd), 'utf8');
  assert.equal(baselineAfter, '', 'the frozen events.jsonl baseline must stay byte-identical (empty) -- every event above belongs in a per-writer shard, never here');

  const eventsDir = path.join(cwd, '.fgos', 'events');
  const shardFiles = fs.readdirSync(eventsDir).filter((name) => name.endsWith('.jsonl'));
  assert.equal(shardFiles.length, 1, 'exactly one writer, one open shard file');
  const shardLines = fs.readFileSync(path.join(eventsDir, shardFiles[0]), 'utf8').split('\n').filter(Boolean);
  const shardTypes = shardLines.map((line) => JSON.parse(line).type);
  assert.deepEqual(shardTypes, ['work.add', 'work.edit', 'work.move', 'work.edit'], 'the whole lifecycle landed in the shard, in order, none of it in the baseline');
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
