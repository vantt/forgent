// fgos-read.test.mjs -- phần "list, show, ready, triage, graph, rollup, stale, conflicts, goal, check" của bộ test CLI, tách nguyên văn
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


// tsk-56t D2: `list`/`ready`/etc. stay `requiresExistingStore: false` (a
// fresh non-worktree dir with no store is legitimately "not evaluated",
// not an error) — but a worktree-resident session that forgets `--dir`
// should not read that as "no open work" with zero signal. One
// object-shaped verb (`list`) and one array-shaped verb (`ready`, which
// returns a bare array via paginateVerbResult when unpaginated — the
// reason this is a stderr line, never a JSON field: JSON.stringify drops
// a named property set on an array).
test('list from a .fgos/-less linked worktree cwd, no --dir: exit 0, empty view, but a stderr warning names the real store elsewhere', () => {
  const { wt } = tmpLinkedWorktree();
  const result = run(wt, ['list']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout).work, {});
  assert.match(result.stderr, /warning: \.fgos\/ not found/);
  assert.match(result.stderr, /--dir <mainRoot>/);
});

test('ready (array-shaped, unpaginated) from the same linked worktree cwd: exit 0, empty array, same stderr warning', () => {
  const { wt } = tmpLinkedWorktree();
  const result = run(wt, ['ready']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), []);
  assert.match(result.stderr, /warning: \.fgos\/ not found/);
});

test('list with --dir pointed at the real store from the same worktree cwd: no warning, real data', () => {
  const { main, wt } = tmpLinkedWorktree();
  run(main, ['add', 'seen-via-dir', '--title', 'Seen via --dir', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--description', 'tsk-535 fixture description.']);
  const result = run(wt, ['list', '--dir', main]);
  assert.equal(result.status, 0);
  assert.ok(envelopeData(result.stdout).work['seen-via-dir']);
  assert.equal(result.stderr, '');
});

test('list on a fresh non-worktree dir with no store at all: exit 0, empty view, no warning (legitimately "not evaluated", not a worktree footgun)', () => {
  const cwd = rawTmpCwd();
  const result = run(cwd, ['list']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout).work, {});
  assert.equal(result.stderr, '');
});

// --- list open-only default + --all (tsk-5oa D1/D2) -----------------------

test('list by default excludes a done item, but keeps a todo item', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'open-item', { title: 'Open Item' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'finished-item', title: 'Finished Item', kind: 'task', status: 'done', deps: [], risk: 'light', refs: [], verify: 'npm test' });

  const work = envelopeData(run(cwd, ['list']).stdout).work;
  assert.ok(work['open-item']);
  assert.equal(work['finished-item'], undefined);
});

test('list --all restores the done item alongside the open one', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'open-item', { title: 'Open Item' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'finished-item', title: 'Finished Item', kind: 'task', status: 'done', deps: [], risk: 'light', refs: [], verify: 'npm test' });

  const work = envelopeData(run(cwd, ['list', '--all']).stdout).work;
  assert.ok(work['open-item']);
  assert.ok(work['finished-item']);
});

// wontfix-terminal-status-filter-consistency D2: the open-only default
// broadens past tsk-5oa's original done-only exclusion to also exclude
// wontfix -- a wontfix item is resolved (nothing further will ever happen
// to it) the same as a done one.
test('list by default excludes a wontfix item, but keeps a todo item', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'open-item', { title: 'Open Item' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'closed-item', title: 'Closed Item', kind: 'task', status: 'wontfix', deps: [], risk: 'light', refs: [], verify: 'npm test' });

  const work = envelopeData(run(cwd, ['list']).stdout).work;
  assert.ok(work['open-item']);
  assert.equal(work['closed-item'], undefined);
});

test('list --all restores the wontfix item alongside the open one', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'open-item', { title: 'Open Item' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'closed-item', title: 'Closed Item', kind: 'task', status: 'wontfix', deps: [], risk: 'light', refs: [], verify: 'npm test' });

  const work = envelopeData(run(cwd, ['list', '--all']).stdout).work;
  assert.ok(work['open-item']);
  assert.ok(work['closed-item']);
});

// tsk-4fg D1/D2: default `list` drops a child row once its parent is also
// visible in the same default view, replacing it with a `childProgress`
// badge on the parent -- reusing the same doneCount rule `rollup` already
// uses (proven live against this repo's own tsk-19y/tsk-5lr mixed set
// during fgos-validating). `--all` stays byte-identical/raw (D1).
test('list by default drops a child whose parent is visible, and badges the parent with childProgress', () => {
  const cwd = tmpCwd();
  const dir = path.join(cwd, '.fgos');
  addOk(cwd, 'root-item', { title: 'Root Item' });
  addWork(dir, { id: 'child-a', title: 'Child A', kind: 'task', status: 'done', deps: [], risk: 'light', refs: [], verify: 'npm test', parent: 'root-item' });
  addWork(dir, { id: 'child-b', title: 'Child B', kind: 'task', status: 'doing', deps: [], risk: 'light', refs: [], verify: 'npm test', parent: 'root-item' });
  addWork(dir, { id: 'child-c', title: 'Child C', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'npm test', parent: 'root-item' });

  const work = envelopeData(run(cwd, ['list', '--json']).stdout).work;
  assert.equal(work['child-a'], undefined);
  assert.equal(work['child-b'], undefined);
  assert.equal(work['child-c'], undefined);
  assert.ok(work['root-item']);
  assert.deepEqual(work['root-item'].childProgress, { done: 1, total: 3 });
});

// D2: a child whose parent is resolved (done/wontfix) and therefore hidden
// from the default view has no parent row left to carry a badge -- it falls
// back to showing as a normal top-level row, exactly as if it had no
// `parent`. Proven live against tsk-19y (done) and its still-open children
// tsk-5lr/tsk-3v2/tsk-4n7 during this item's own fgos-validating pass.
test('list by default falls back to showing a child as a top-level row when its parent is resolved and hidden', () => {
  const cwd = tmpCwd();
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'root-item', title: 'Root Item', kind: 'task', status: 'done', deps: [], risk: 'light', refs: [], verify: 'npm test' });
  addWork(dir, { id: 'orphan-child', title: 'Orphan Child', kind: 'task', status: 'doing', deps: [], risk: 'light', refs: [], verify: 'npm test', parent: 'root-item' });

  const work = envelopeData(run(cwd, ['list', '--json']).stdout).work;
  assert.equal(work['root-item'], undefined, 'resolved parent stays hidden by the pre-existing isResolvedStatus filter');
  assert.ok(work['orphan-child'], 'child with no visible parent falls back to a normal top-level row');
  assert.equal(work['orphan-child'].childProgress, undefined);
});

// A parked `awaiting-human` child must never be hidden by this filter --
// str61's own parent-anchored `awaitingContext` reporting depends on it
// still being present in the default view's `work` map.
test('list by default never hides an awaiting-human child, even when its parent is visible', () => {
  const cwd = tmpCwd();
  const dir = path.join(cwd, '.fgos');
  addOk(cwd, 'root-item', { title: 'Root Item' });
  addWork(dir, { id: 'parked-child', title: 'Parked Child', kind: 'task', status: 'awaiting-human', deps: [], risk: 'light', refs: [], verify: 'npm test', parent: 'root-item' });

  const work = envelopeData(run(cwd, ['list', '--json']).stdout).work;
  assert.ok(work['parked-child'], 'awaiting-human child stays visible regardless of parent visibility');
  assert.ok(work['root-item']);
  assert.deepEqual(work['root-item'].childProgress, { done: 0, total: 1 });
});

// D1: `--all` is untouched -- byte-identical shape to before this item, no
// child dropped, no childProgress badge added. This is the one flagged
// public-contract risk (herdr-plugin parses `list --all --json` literally).
test('list --all is untouched by the child-view gate: no rows dropped, no childProgress added', () => {
  const cwd = tmpCwd();
  const dir = path.join(cwd, '.fgos');
  addOk(cwd, 'root-item', { title: 'Root Item' });
  addWork(dir, { id: 'child-a', title: 'Child A', kind: 'task', status: 'done', deps: [], risk: 'light', refs: [], verify: 'npm test', parent: 'root-item' });
  addWork(dir, { id: 'child-b', title: 'Child B', kind: 'task', status: 'doing', deps: [], risk: 'light', refs: [], verify: 'npm test', parent: 'root-item' });

  const work = envelopeData(run(cwd, ['list', '--all', '--json']).stdout).work;
  assert.ok(work['root-item']);
  assert.ok(work['child-a']);
  assert.ok(work['child-b']);
  assert.equal(work['root-item'].childProgress, undefined);
});

// tsk-48i D1: parkReason (parkReasonForStatus, workflow-stage-graphs.mjs)
// stamped at write time, mirroring statusCategory's own precedent -- lets
// a domain-agnostic consumer of `list --json` (e.g. herdr-plugin) tell a
// park state apart from active work without reading coding's own literal
// status strings.
test('list --json exposes parkReason on a blocked item, and omits it on a doing item', () => {
  const cwd = tmpCwd();
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'parked-item', title: 'Parked Item', kind: 'task', status: 'blocked', deps: [], risk: 'light', refs: [], verify: 'npm test' });
  addWork(dir, { id: 'active-item', title: 'Active Item', kind: 'task', status: 'doing', deps: [], risk: 'light', refs: [], verify: 'npm test' });

  const work = envelopeData(run(cwd, ['list', '--all', '--json']).stdout).work;
  assert.equal(work['parked-item'].parkReason, 'system-error');
  assert.equal(work['active-item'].parkReason, undefined);
});

test('list --id returns only that item, ignoring the open-only default and --all entirely (tsk-42m D2)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'open-item', { title: 'Open Item' });
  addOk(cwd, 'other-item', { title: 'Other Item' });

  const work = envelopeData(run(cwd, ['list', '--id', 'open-item']).stdout).work;
  assert.deepEqual(Object.keys(work), ['open-item']);
  assert.equal(work['open-item'].title, 'Open Item');
});

test('list --id on a done item returns it without needing --all (tsk-42m D2: --id bypasses the open-only default entirely)', () => {
  const cwd = tmpCwd();
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'finished-item', title: 'Finished Item', kind: 'task', status: 'done', deps: [], risk: 'light', refs: [], verify: 'npm test' });

  const work = envelopeData(run(cwd, ['list', '--id', 'finished-item']).stdout).work;
  assert.equal(work['finished-item'].status, 'done');
});

test('list --id on an unknown id is rejected as validation (not-found), exit 4 (tsk-42m D2)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'open-item');

  const result = run(cwd, ['list', '--id', 'no-such-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /list: work "no-such-item" not found/);
});

test('list --id scopes every id-keyed view section to just the requested item, excluding another item\'s data (tsk-2u9 D1/D2)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'item-a', { title: 'Item A' });
  addOk(cwd, 'item-b', { title: 'Item B' });

  // Populate decisions (flat array, id-scoped) + decisionsById (dict) for BOTH items.
  assert.equal(run(cwd, ['decision', '--id', 'item-a', '--text', 'decision about A', '--rationale', 'because A', '--relation', 'none']).status, 0);
  assert.equal(run(cwd, ['decision', '--id', 'item-b', '--text', 'decision about B', '--rationale', 'because B', '--relation', 'none']).status, 0);
  // A decision with no --id at all (a global decision, not tied to one item) --
  // must never surface under either item's scoped result.
  assert.equal(run(cwd, ['decision', '--text', 'global decision, no item', '--rationale', 'because global', '--relation', 'none']).status, 0);

  // Populate gates for BOTH items (ask/answer round trip).
  assert.equal(run(cwd, ['ask', 'item-a', '--text', '## Context\n\nBackground needed to understand this question without opening another file.\n\n## Why this matters\n\nThis directly affects the outcome: question about A']).status, 0);
  assert.equal(run(cwd, ['answer', 'item-a', '--text', 'answer about A']).status, 0);
  assert.equal(run(cwd, ['ask', 'item-b', '--text', '## Context\n\nBackground needed to understand this question without opening another file.\n\n## Why this matters\n\nThis directly affects the outcome: question about B']).status, 0);
  assert.equal(run(cwd, ['answer', 'item-b', '--text', 'answer about B']).status, 0);

  // Populate callThreads for BOTH items (consult handoff round trip).
  assert.equal(run(cwd, ['move', 'item-a', '--to', 'doing']).status, 0);
  assert.equal(run(cwd, ['handoff', 'item-a', '--to', 'researcher', '--reason', 'consult', '--outcome', 'consult about A']).status, 0);
  assert.equal(run(cwd, ['move', 'item-b', '--to', 'doing']).status, 0);
  assert.equal(run(cwd, ['handoff', 'item-b', '--to', 'researcher', '--reason', 'consult', '--outcome', 'consult about B']).status, 0);

  const data = envelopeData(run(cwd, ['list', '--id', 'item-a', '--json']).stdout);

  assert.deepEqual(Object.keys(data.work), ['item-a']);

  assert.ok(Array.isArray(data.decisions), 'decisions stays an array (flat-log shape unchanged)');
  assert.ok(data.decisions.some((d) => d.text === 'decision about A'), 'item-a\'s own decision must be present');
  assert.ok(!data.decisions.some((d) => d.text === 'decision about B'), 'item-b\'s decision must be excluded');
  assert.ok(!data.decisions.some((d) => d.text === 'global decision, no item'), 'a decision with no id must be excluded');

  assert.deepEqual(Object.keys(data.decisionsById ?? {}), ['item-a']);
  assert.deepEqual(Object.keys(data.gates ?? {}), ['item-a']);
  assert.equal(data.gates['item-a'].ask, '## Context\n\nBackground needed to understand this question without opening another file.\n\n## Why this matters\n\nThis directly affects the outcome: question about A');
  assert.deepEqual(Object.keys(data.callThreads ?? {}), ['item-a']);
  assert.equal(data.callThreads['item-a'][0].outcome, 'consult about A');
});

test('list --id --fields returns only named fields and omits all history side-log keys (tsk-4zr)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'item-fields', { title: 'Item Fields' });
  run(cwd, ['decision', '--id', 'item-fields', '--text', 'decision text', '--rationale', 'rat', '--relation', 'none']);

  const flagged = envelopeData(run(cwd, ['list', '--id', 'item-fields', '--fields', 'stage,status,holder', '--json']).stdout);
  assert.deepEqual(Object.keys(flagged.work), ['item-fields']);
  assert.deepEqual(Object.keys(flagged.work['item-fields']).sort(), ['stage', 'status'].sort());
  const sideLogKeys = ['decisions', 'discovery', 'gates', 'settlements', 'outcomes', 'frictions', 'learnings', 'decisionsById', 'callThreads'];
  for (const key of sideLogKeys) {
    assert.equal(flagged[key], undefined, `side-log key "${key}" must be omitted when --fields is passed`);
  }
});

test('list --id without --fields is unchanged from today behavior (tsk-4zr)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'item-unflagged', { title: 'Item Unflagged' });
  run(cwd, ['decision', '--id', 'item-unflagged', '--text', 'dec text', '--rationale', 'rat', '--relation', 'none']);

  const data = envelopeData(run(cwd, ['list', '--id', 'item-unflagged', '--json']).stdout);
  assert.ok(data.work['item-unflagged']);
  assert.equal(data.work['item-unflagged'].title, 'Item Unflagged');
  assert.ok(Array.isArray(data.decisions));
  assert.ok(data.discovery);
  assert.ok(data.gates);
  assert.ok(data.settlements);
  assert.ok(data.outcomes);
  assert.ok(data.frictions);
  assert.ok(data.learnings);
  assert.ok(data.decisionsById);
  assert.ok(data.callThreads);
});

test('list --id --fields with an invalid field name is rejected as validation error, exit 4 (tsk-4zr)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'item-invalid');

  const result = run(cwd, ['list', '--id', 'item-invalid', '--fields', 'stage,invalidField']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /list --fields: unknown field "invalidField"/);
});

test('list default keeps an awaiting-human item visible (D2: excludes only the two terminal statuses done/wontfix, per wontfix-terminal-status-filter-consistency D2 -- never a broader ad-hoc closed/parked set like awaiting-human)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'parked-item', { title: 'Parked Item' });
  run(cwd, ['ask', 'parked-item', '--text', '## Context\n\nBackground needed to understand this question without opening another file.\n\n## Why this matters\n\nThis directly affects the outcome: need a decision']);

  const work = envelopeData(run(cwd, ['list']).stdout).work;
  assert.equal(work['parked-item'].status, 'awaiting-human');
});

test('list default on a store with only done items returns an empty work map, not an error', () => {
  const cwd = tmpCwd();
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'finished-item', title: 'Finished Item', kind: 'task', status: 'done', deps: [], risk: 'light', refs: [], verify: 'npm test' });

  const result = run(cwd, ['list']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout).work, {});
});

test('list prints the current view as parseable envelope data, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'listed');
  const result = run(cwd, ['list']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.ok(data.work.listed);
});

test('goal set on a real goal item succeeds, exit 0, and a following goal show reflects it', () => {
  const cwd = tmpCwd();
  addGoalItem(cwd, 'goal-target-1');
  const setResult = run(cwd, ['goal', 'set', 'goal-target-1']);
  assert.equal(setResult.status, 0);
  assert.equal(envelopeData(setResult.stdout).focus, 'goal-target-1');

  const showResult = run(cwd, ['goal', 'show']);
  assert.equal(showResult.status, 0);
  assert.equal(envelopeData(showResult.stdout).focus, 'goal-target-1');
});

test('goal set on a non-existent id is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;
  const result = run(cwd, ['goal', 'set', 'does-not-exist']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('goal set on an existing item without goalTier is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'non-goal-item');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['goal', 'set', 'non-goal-item']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('goal show with no focus ever set returns focus: null, exit 0, not an error', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['goal', 'show']);
  assert.equal(result.status, 0);
  assert.equal(envelopeData(result.stdout).focus, null);
});

test('goal show after a successful set returns the focus id plus goal-scoped ranking data', () => {
  const cwd = tmpCwd();
  addGoalItem(cwd, 'goal-target-2');
  run(cwd, ['goal', 'set', 'goal-target-2']);
  const data = envelopeData(run(cwd, ['goal', 'show']).stdout);
  assert.equal(data.focus, 'goal-target-2');
  assert.ok('criticalPath' in data);
  assert.ok('topUnblock' in data);
});

test('goal focus is not auto-cleared when the focused item reaches status done', () => {
  const cwd = tmpCwd();
  addGoalItem(cwd, 'goal-target-done');
  run(cwd, ['goal', 'set', 'goal-target-done']);
  run(cwd, ['move', 'goal-target-done', '--to', 'doing']);
  run(cwd, ['move', 'goal-target-done', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  const moveResult = toDoneViaChain(cwd, 'goal-target-done');
  assert.equal(moveResult.status, 0);
  assert.equal(stateView(cwd).work['goal-target-done'].status, 'done');

  const data = envelopeData(run(cwd, ['goal', 'show']).stdout);
  assert.equal(data.focus, 'goal-target-done');
});

test('list shows tier and the proposed status for the real CLI view, exit 0', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'listed-proposed');
  const result = run(cwd, ['list']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.work['listed-proposed'].status, 'awaiting-approval');
  assert.equal(data.work['listed-proposed'].tier, 'standard');
});

// --- `fgos ready` (phase-2-routing-5) ---

test('ready prints the frontier as parseable, machine-readable envelope data, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'freestanding');
  const result = run(cwd, ['ready']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.ok(Array.isArray(data));
  assert.equal(data.length, 1);
  assert.equal(data[0].id, 'freestanding');
});

test('ready excludes a todo item whose dep sits at proposed (proposed is not done): dep at proposed does NOT open dependent work', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'dep-in-proposed');
  const result = run(cwd, ['add', 'blocked-on-proposed', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--deps', 'dep-in-proposed', '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 0);

  const ready = envelopeData(run(cwd, ['ready']).stdout);
  assert.ok(!ready.some((item) => item.id === 'blocked-on-proposed'));
  assert.ok(!ready.some((item) => item.id === 'dep-in-proposed'));
});

test('ready opens a todo item once its dep reaches done (approved, not merely proposed)', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'dep-approved');
  assert.equal(toDoneViaChain(cwd, 'dep-approved').status, 0);
  assert.equal(
    run(cwd, ['add', 'unblocked-item', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--deps', 'dep-approved', '--stage', 'executing', '--description', 'tsk-535 fixture description.']).status,
    0,
  );

  const ready = envelopeData(run(cwd, ['ready']).stdout);
  assert.ok(ready.some((item) => item.id === 'unblocked-item'));
});

test('ready on a directory with no log at all returns an empty result, exit 0 (a read never initializes .fgos/)', () => {
  const cwd = rawTmpCwd();
  const result = run(cwd, ['ready']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), []);
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')));
});

test('ready on a corrupt log is refused as corrupt-log, exit 5', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'before-corruption-ready');
  fs.appendFileSync(logPath(cwd), 'not valid json\n', 'utf8');

  const result = run(cwd, ['ready']);
  assert.equal(result.status, 5);
});

// --- tsk-4so D1: `ready --step` wiring (docs/history/execution-fanout/
// CONTEXT-tsk-4so.md) -- the flag existed in `frontier.mjs` since tsk-19j
// D9 but was silently swallowed by the CLI/store layer until now ---------

test('ready --step Divide returns only planning-stage items, not the default Execute frontier (tsk-qod D1/D2: Clarify no longer maps to any coding stage, so Divide is the demonstration step now)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'atplanning', { stage: 'planning' });
  addOk(cwd, 'atexecuting', { stage: 'executing' });

  const divide = envelopeData(run(cwd, ['ready', '--step', 'Divide']).stdout);
  assert.deepEqual(divide.map((i) => i.id), ['atplanning']);

  // tsk-qod D1/D2: `clarify` is retired as a coding stage entirely --
  // stageForStep(domain, 'Clarify') is undefined for coding now, so no
  // item (whatever its own `stage` field reads) can ever match this step.
  const clarify = envelopeData(run(cwd, ['ready', '--step', 'Clarify']).stdout);
  assert.deepEqual(clarify, []);
});

test('ready with no --step defaults to Execute, byte-identical to before --step wiring existed', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'atdiscovery', { stage: 'discovery' });
  addOk(cwd, 'atexecuting', { stage: 'executing' });

  const bare = envelopeData(run(cwd, ['ready']).stdout);
  const explicitExecute = envelopeData(run(cwd, ['ready', '--step', 'Execute']).stdout);
  assert.deepEqual(bare.map((i) => i.id), ['atexecuting']);
  assert.deepEqual(bare, explicitExecute);
});

// --- pagination (str46-io-contract D5/D35): `ready`/`triage`/`evolve`/`list`
// opt in to --cursor/--limit; omitting both keeps every one of these verbs'
// default output byte-identical to before this cell (asserted throughout
// this file's existing `ready`/`triage`/`evolve`/`list` tests above, none of
// which pass --cursor/--limit) — this section only exercises the opt-in
// paginated shape through the real CLI binary.

test('ready --limit paginates through the real CLI binary: envelope data carries items+nextCursor, and the cursor round-trips into the remaining items', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'page-a');
  addOk(cwd, 'page-b');
  addOk(cwd, 'page-c');

  const first = run(cwd, ['ready', '--limit', '1']);
  assert.equal(first.status, 0);
  const firstData = envelopeData(first.stdout);
  assert.deepEqual(Object.keys(firstData).sort(), ['items', 'nextCursor']);
  assert.equal(firstData.items.length, 1);
  assert.ok(typeof firstData.nextCursor === 'string' && firstData.nextCursor.length > 0);

  const second = run(cwd, ['ready', '--limit', '1', '--cursor', firstData.nextCursor]);
  assert.equal(second.status, 0);
  const secondData = envelopeData(second.stdout);
  assert.equal(secondData.items.length, 1);
  assert.notEqual(secondData.items[0].id, firstData.items[0].id);

  const third = run(cwd, ['ready', '--limit', '1', '--cursor', secondData.nextCursor]);
  const thirdData = envelopeData(third.stdout);
  assert.equal(thirdData.items.length, 1);
  assert.equal(thirdData.nextCursor, null);

  const allIds = [firstData.items[0].id, secondData.items[0].id, thirdData.items[0].id].sort();
  assert.deepEqual(allIds, ['page-a', 'page-b', 'page-c']);
});

test('ready with no --cursor/--limit still returns the bare frontier array, not the paginated shape (byte-identical default)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'unpaginated-item');
  const result = run(cwd, ['ready']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.ok(Array.isArray(data));
});

test('ready --cursor rejects a stale cursor (id no longer in the current frontier) as validation, exit 4, message states the restart remedy', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'only-item');
  const staleCursor = Buffer.from(JSON.stringify({ order: 'ready-v1', lastId: 'never-existed' }), 'utf8').toString('base64');
  const result = run(cwd, ['ready', '--cursor', staleCursor]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /re-issue the call without --cursor/);
});

test('list --limit paginates only the work map: view.work becomes {items, nextCursor} while other view keys are untouched', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'list-page-a');
  addOk(cwd, 'list-page-b');
  const result = run(cwd, ['list', '--limit', '1']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(Object.keys(data.work).sort(), ['items', 'nextCursor']);
  assert.equal(Object.keys(data.work.items).length, 1);
  assert.ok(Array.isArray(data.decisions));
});

// --- `fgos check` (phase-3-compound-learning-3): predicted-vs-actual report ---
//
// `check` is a pure read (per D1 request-class, same as `ready`/`list`) over
// `listWork(dir).outcomes` — until compound-learn-enduser-docs slice 3, the
// CLI had no verb that WRITES a work.outcome event (only the runner did, per
// plan Approach S1; `compound --doc-type` is now the one CLI producer, see
// its own tests above), so these tests seed outcome data directly through
// store.mjs's addOutcome, the same single write door the runner uses, then
// exercise the real `check` binary.

test('check on an item with no recorded outcome returns a null predicted/actual entry for that id, exit 0, no throw', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'unchecked-item');
  const result = run(cwd, ['check', 'unchecked-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(data.outcomes, [{ id: 'unchecked-item', predicted: null, actual: null, docType: null, docPath: null }]);
});

test('check on a directory with no log at all returns an empty outcomes list, exit 0 (a read never initializes .fgos/)', () => {
  const cwd = rawTmpCwd();
  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(data.outcomes, []);
  assert.equal(data.friction, null);
  assert.equal(data.entropy, null);
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')));
});

test('check returns BOTH predicted and actual values for an item with real outcome data, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'checked-item');
  const dir = path.join(cwd, '.fgos');
  addOutcome(dir, { id: 'checked-item', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });
  addOutcome(dir, {
    id: 'checked-item',
    actual: { outcome: 'awaiting-approval', passed: true, attempts: 1, errorClass: null, aheadCount: 1, visits: 1 },
  });

  const result = run(cwd, ['check', 'checked-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcomes.length, 1);
  assert.equal(data.outcomes[0].id, 'checked-item');
  assert.equal(data.outcomes[0].predicted.tier, 'standard');
  assert.equal(data.outcomes[0].actual.outcome, 'awaiting-approval');
  assert.equal(data.outcomes[0].actual.passed, true);
});

test('check with no id given reports every item that has outcome data, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'item-a');
  addOk(cwd, 'item-b');
  const dir = path.join(cwd, '.fgos');
  addOutcome(dir, { id: 'item-a', predicted: { tier: 'light', deps: 0, priorVisits: 0 } });
  addOutcome(dir, { id: 'item-a', actual: { outcome: 'awaiting-approval', passed: true, attempts: 1, errorClass: null, aheadCount: 1, visits: 1 } });

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcomes.length, 1);
  assert.equal(data.outcomes[0].id, 'item-a', 'item-b has no outcome data yet, so it is not listed');
});

// --- Diataxis docType surfacing in `check` (CONTEXT D5/D6) ------------------
//
// docType rides the SAME outcome/friction capture these tests above already
// exercise — no new collector, no new write door. `check` surfaces a tagged
// outcome via `collectOutcomeEntry`; a tagged friction rides through
// `collectFrictionData`'s existing `recent` spread with no code change
// beyond the store validation these tests prove separately.

test('check surfaces docType for a tagged outcome; an untagged outcome nulls it, output shape otherwise unchanged', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'tagged-outcome-item');
  addOk(cwd, 'untagged-outcome-item');
  const dir = path.join(cwd, '.fgos');
  addOutcome(dir, { id: 'tagged-outcome-item', docType: 'tutorial', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });
  addOutcome(dir, { id: 'untagged-outcome-item', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });

  const taggedResult = run(cwd, ['check', 'tagged-outcome-item']);
  assert.equal(taggedResult.status, 0);
  assert.deepEqual(envelopeData(taggedResult.stdout).outcomes[0], {
    id: 'tagged-outcome-item',
    predicted: { tier: 'standard', deps: 0, priorVisits: 0 },
    actual: null,
    docType: 'tutorial',
    docPath: null,
  });

  const untaggedResult = run(cwd, ['check', 'untagged-outcome-item']);
  assert.equal(untaggedResult.status, 0);
  assert.deepEqual(envelopeData(untaggedResult.stdout).outcomes[0], {
    id: 'untagged-outcome-item',
    predicted: { tier: 'standard', deps: 0, priorVisits: 0 },
    actual: null,
    docType: null,
    docPath: null,
  });
});

// --- rollup view theo bộ (P24) ----------------------------------------------
//
// A root item's children carry `parent` (set by decompose, P16) — `add`
// itself has no `--parent` flag, so these seed a child through store.mjs's
// addWork directly, the same way decompose.mjs writes one in production.

test('rollup on a root with n children, k done, prints k/n and lists every child with its own status, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'root-item', { title: 'Root Item' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'child-a', title: 'Child A', kind: 'task', status: 'done', deps: [], risk: 'light', refs: [], verify: 'npm test', parent: 'root-item' });
  addWork(dir, { id: 'child-b', title: 'Child B', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'npm test', parent: 'root-item' });
  addWork(dir, { id: 'child-c', title: 'Child C', kind: 'task', status: 'done', deps: [], risk: 'light', refs: [], verify: 'npm test', parent: 'root-item' });

  const result = run(cwd, ['rollup', 'root-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.id, 'root-item');
  assert.equal(data.title, 'Root Item');
  assert.equal(data.status, 'todo');
  assert.equal(data.doneCount, 2);
  assert.equal(data.totalCount, 3);
  assert.deepEqual(data.children, [
    { id: 'child-a', title: 'Child A', status: 'done', stageEffective: 'executing' },
    { id: 'child-b', title: 'Child B', status: 'todo', stageEffective: 'executing' },
    { id: 'child-c', title: 'Child C', status: 'done', stageEffective: 'executing' },
  ]);
});

test('rollup renders stageEffective on the root and on each child independently, mixing explicit and defaulted stages (tsk-4zj D6)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'root-item', { title: 'Root Item' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'child-a', title: 'Child A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'npm test', parent: 'root-item', stage: 'discovery' });
  addWork(dir, { id: 'child-b', title: 'Child B', kind: 'task', status: 'doing', deps: [], risk: 'light', refs: [], verify: 'npm test', parent: 'root-item', stage: 'decompose' });
  addWork(dir, { id: 'child-c', title: 'Child C', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'npm test', parent: 'root-item' });

  const result = run(cwd, ['rollup', 'root-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.stageEffective, 'executing');
  assert.deepEqual(data.children, [
    { id: 'child-a', title: 'Child A', status: 'todo', stageEffective: 'discovery' },
    { id: 'child-b', title: 'Child B', status: 'doing', stageEffective: 'decompose' },
    { id: 'child-c', title: 'Child C', status: 'todo', stageEffective: 'executing' },
  ]);
});

test('rollup on an item with no children returns 0/0 and an empty children list, exit 0, no throw', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'lonely-item');

  const result = run(cwd, ['rollup', 'lonely-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.doneCount, 0);
  assert.equal(data.totalCount, 0);
  assert.deepEqual(data.children, []);
});

test('rollup on a nonexistent id is rejected as validation (not-found), exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'root-item');

  const result = run(cwd, ['rollup', 'no-such-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /rollup: work "no-such-item" not found/);
});

test('rollup with no id at all is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['rollup']);
  assert.equal(result.status, 4);
});

test('rollup never mutates state: no event is appended and no children of an unrelated item are counted', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'root-item');
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'child-a', title: 'Child A', kind: 'task', status: 'done', deps: [], risk: 'light', refs: [], verify: 'npm test', parent: 'root-item' });
  addOk(cwd, 'unrelated-item');

  const before = eventLines(cwd);
  const result = run(cwd, ['rollup', 'root-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.doneCount, 1);
  assert.equal(data.totalCount, 1);
  assert.ok(!data.children.some((c) => c.id === 'unrelated-item'));
  assert.deepEqual(eventLines(cwd), before);
});

// --- rollup reads `targets`, not just `parent` (tsk-1ug) --------------------
//
// A goalTier milestone's `targets` are a different relationship from a
// decomposed root's children: they never go through `resolveRoot`, so each
// one merges independently onto main (execution-fanout CONTEXT.md D4).
// They therefore get their own array and their own count pair, leaving
// `doneCount`/`totalCount` meaning exactly what they always meant.

test('rollup on a milestone counts its targets in targetDoneCount/targetTotalCount and leaves the children counts at 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'seed-item');
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'target-a', title: 'Target A', kind: 'task', status: 'done', deps: [], risk: 'light', refs: [], verify: 'npm test' });
  addWork(dir, { id: 'target-b', title: 'Target B', kind: 'task', status: 'done', deps: [], risk: 'light', refs: [], verify: 'npm test' });
  addWork(dir, { id: 'target-c', title: 'Target C', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'npm test' });
  addWork(dir, { id: 'milestone-x', title: 'Milestone X', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'npm test', goalTier: 'milestone', targets: ['target-a', 'target-b', 'target-c'] });

  const result = run(cwd, ['rollup', 'milestone-x']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.targetDoneCount, 2);
  assert.equal(data.targetTotalCount, 3);
  assert.deepEqual(data.targets, [
    { id: 'target-a', title: 'Target A', status: 'done' },
    { id: 'target-b', title: 'Target B', status: 'done' },
    { id: 'target-c', title: 'Target C', status: 'todo' },
  ]);
  // The children pair keeps its own meaning -- a milestone has none.
  assert.equal(data.doneCount, 0);
  assert.equal(data.totalCount, 0);
  assert.deepEqual(data.children, []);
});

test('rollup on an item with no targets reports an empty targets array and 0/0, leaving the children counts untouched', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'root-item');
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'child-a', title: 'Child A', kind: 'task', status: 'done', deps: [], risk: 'light', refs: [], verify: 'npm test', parent: 'root-item' });

  const result = run(cwd, ['rollup', 'root-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.doneCount, 1);
  assert.equal(data.totalCount, 1);
  assert.equal(data.targetDoneCount, 0);
  assert.equal(data.targetTotalCount, 0);
  assert.deepEqual(data.targets, []);
});

test('rollup reports a target id that matches no work item as a null-title/null-status row, counted as not done, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'seed-item');
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'target-a', title: 'Target A', kind: 'task', status: 'done', deps: [], risk: 'light', refs: [], verify: 'npm test' });
  addWork(dir, { id: 'milestone-x', title: 'Milestone X', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'npm test', goalTier: 'milestone', targets: ['target-a', 'no-such-target'] });

  const result = run(cwd, ['rollup', 'milestone-x']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(data.targets, [
    { id: 'target-a', title: 'Target A', status: 'done' },
    { id: 'no-such-target', title: null, status: null },
  ]);
  assert.equal(data.targetDoneCount, 1);
  assert.equal(data.targetTotalCount, 2);
});

test('rollup on an item carrying both children and targets keeps the two count pairs independent', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'seed-item');
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'target-a', title: 'Target A', kind: 'task', status: 'done', deps: [], risk: 'light', refs: [], verify: 'npm test' });
  addWork(dir, { id: 'both-item', title: 'Both', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'npm test', goalTier: 'milestone', targets: ['target-a'] });
  addWork(dir, { id: 'child-a', title: 'Child A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'npm test', parent: 'both-item' });

  const result = run(cwd, ['rollup', 'both-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.doneCount, 0);
  assert.equal(data.totalCount, 1);
  assert.equal(data.targetDoneCount, 1);
  assert.equal(data.targetTotalCount, 1);
  assert.deepEqual(data.children, [{ id: 'child-a', title: 'Child A', status: 'todo', stageEffective: 'executing' }]);
  assert.deepEqual(data.targets, [{ id: 'target-a', title: 'Target A', status: 'done' }]);
});

test('rollup reading targets never mutates state: no event is appended', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'seed-item');
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'target-a', title: 'Target A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'npm test' });
  addWork(dir, { id: 'milestone-x', title: 'Milestone X', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'npm test', goalTier: 'milestone', targets: ['target-a'] });

  const before = eventLines(cwd);
  const result = run(cwd, ['rollup', 'milestone-x']);
  assert.equal(result.status, 0);
  assert.deepEqual(eventLines(cwd), before);
});

// --- fgos show: scoped single-task full detail ------------------------------
//
// Unlike `list --id`, which only scopes the `work` map and leaves every
// other per-item log global, `show` scopes ALL of them to the one id given.
// docs/history/fgos-show-scoped-detail/CONTEXT.md D1/D2.

test('show returns the work record plus every per-item log scoped to just that id, leaving a second item\'s data out entirely, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'show-detail-item', { title: 'Show Detail Item' });
  addOk(cwd, 'other-item', { title: 'Other Item' });
  const dir = path.join(cwd, '.fgos');

  addDiscovery(dir, { id: 'show-detail-item', clear: true, verify: 'run the thing' });
  addDiscovery(dir, { id: 'other-item', clear: false, question: 'unrelated question' });
  run(cwd, ['decision', '--id', 'show-detail-item', '--text', 'D1: scoped detail', '--rationale', 'test fixture', '--relation', 'none']);
  run(cwd, ['decision', '--id', 'other-item', '--text', 'D1: unrelated decision', '--rationale', 'test fixture', '--relation', 'none']);
  run(cwd, ['ask', 'show-detail-item', '--text', '## Context\n\nBackground needed to understand this question without opening another file.\n\n## Why this matters\n\nThis directly affects the outcome: which shape?']);
  run(cwd, ['answer', 'show-detail-item', '--text', 'this one']);
  run(cwd, ['ask', 'other-item', '--text', '## Context\n\nBackground needed to understand this question without opening another file.\n\n## Why this matters\n\nThis directly affects the outcome: unrelated ask']);
  addOutcome(dir, { id: 'show-detail-item', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });
  addOutcome(dir, { id: 'other-item', predicted: { tier: 'light', deps: 0, priorVisits: 0 } });
  addFriction(dir, { id: 'show-detail-item', disposition: 'parked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'goal-check failed' });
  addFriction(dir, { id: 'other-item', disposition: 'halted', errorClass: 'worker-timeout', layer: 'environment', attempts: 1, detail: 'timed out' });

  const result = run(cwd, ['show', 'show-detail-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);

  assert.equal(data.work.id, 'show-detail-item');
  assert.equal(data.work.title, 'Show Detail Item');

  assert.equal(data.discovery.length, 1);
  assert.equal(data.discovery[0].clear, true);

  assert.equal(data.decisions.length, 1);
  assert.equal(data.decisions[0].text, 'D1: scoped detail');

  assert.equal(data.gates.ask, '## Context\n\nBackground needed to understand this question without opening another file.\n\n## Why this matters\n\nThis directly affects the outcome: which shape?');
  assert.equal(data.gates.answer, 'this one');

  assert.equal(data.outcome.id, 'show-detail-item');
  assert.equal(data.outcome.predicted.tier, 'standard');

  assert.equal(data.friction.count, 1);
  assert.equal(data.friction.recent[0].errorClass, 'verify-miss');

  // Nothing from 'other-item' leaked into 'show-detail-item's scoped view.
  assert.ok(!JSON.stringify(data).includes('unrelated'));
  assert.ok(!JSON.stringify(data).includes('worker-timeout'));
});

test('show on a fresh item with no logs yet returns every key present but empty/null, not omitted, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'bare-item');

  const result = run(cwd, ['show', 'bare-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);

  assert.equal(data.work.id, 'bare-item');
  assert.deepEqual(data.discovery, []);
  assert.deepEqual(data.decisions, []);
  assert.equal(data.gates, null);
  assert.deepEqual(data.outcome, { id: 'bare-item', predicted: null, actual: null, docType: null, docPath: null });
  assert.equal(data.friction, null);
  assert.equal(data.settlement, null);
  assert.equal(data.learning, null);
});

test('show on an unknown id is rejected as validation (not-found), exit 4, same shape as list --id\'s miss', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'some-item');

  const result = run(cwd, ['show', 'no-such-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /show: work "no-such-item" not found/);
});

test('show with no id at all is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['show']);
  assert.equal(result.status, 4);
});

test('show --json is a byte-identical no-op: output matches show without --json exactly, except generated_at', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'json-noop-item');

  const withoutJson = run(cwd, ['show', 'json-noop-item']).stdout;
  const withJson = run(cwd, ['show', 'json-noop-item', '--json']).stdout;

  const stripGeneratedAt = (s) => s.replace(/"generated_at": "[^"]*"/, '"generated_at": ""');
  assert.equal(stripGeneratedAt(withoutJson), stripGeneratedAt(withJson));
});

test('show never mutates state: no event is appended', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'read-only-item');

  const before = eventLines(cwd);
  const result = run(cwd, ['show', 'read-only-item']);
  assert.equal(result.status, 0);
  assert.deepEqual(eventLines(cwd), before);
});

// --- backlog-triage impact ranking (P21) ------------------------------------
//
// Separate from P14's intake-time risk/lane classification: `triage` ranks
// OPEN work by blocking fan-out (how many other still-open items depend on
// it), highest first.

test('triage on an empty backlog returns an empty ranked list, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['triage']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), []);
});

test('triage ranks a base item above the items that depend on it', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'base');
  run(cwd, ['add', 'dep1', '--title', 'Dep1', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--deps', 'base', '--description', 'tsk-535 fixture description.']);
  run(cwd, ['add', 'dep2', '--title', 'Dep2', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--deps', 'base', '--description', 'tsk-535 fixture description.']);

  const result = run(cwd, ['triage']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  const base = data.find((r) => r.id === 'base');
  const dep1 = data.find((r) => r.id === 'dep1');
  assert.equal(base.title, 'Title base');
  assert.equal(base.status, 'todo');
  assert.equal(base.blocks, 2);
  assert.equal(dep1.title, 'Dep1');
  assert.equal(dep1.blocks, 0);
});

test('triage excludes a done item from ranking, and a done dependent never counts as blocked', () => {
  const cwd = tmpCwd();
  const dir = path.join(cwd, '.fgos');
  addOk(cwd, 'base');
  addWork(dir, { id: 'finished-dependent', title: 'Finished Dependent', kind: 'task', status: 'done', deps: ['base'], risk: 'light', refs: [], verify: 'npm test' });
  addWork(dir, { id: 'done-item', title: 'Done Item', kind: 'task', status: 'done', deps: [], risk: 'light', refs: [], verify: 'npm test' });

  const result = run(cwd, ['triage']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  const base = data.find((r) => r.id === 'base');
  assert.equal(base.status, 'todo');
  assert.equal(base.blocks, 0);
  assert.ok(!data.some((r) => r.id === 'done-item'));
});

test('triage --all appends done items after the ranked open rows, each with blocks:0 (tsk-5oa D1)', () => {
  const cwd = tmpCwd();
  const dir = path.join(cwd, '.fgos');
  addOk(cwd, 'base');
  addWork(dir, { id: 'done-item', title: 'Done Item', kind: 'task', status: 'done', deps: ['base'], risk: 'light', refs: [], verify: 'npm test' });

  const withoutAll = envelopeData(run(cwd, ['triage']).stdout);
  const withAll = envelopeData(run(cwd, ['triage', '--all']).stdout);
  assert.ok(!withoutAll.some((r) => r.id === 'done-item'));
  assert.deepEqual(withAll.slice(0, withoutAll.length), withoutAll);
  const doneRow = withAll.find((r) => r.id === 'done-item');
  assert.ok(doneRow);
  assert.equal(doneRow.blocks, 0);
  assert.equal(doneRow.componentSize, 0);
  assert.equal(doneRow.isIsolated, true);
});

test('triage never mutates state: no event is appended', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'base');

  const before = eventLines(cwd);
  const result = run(cwd, ['triage']);
  assert.equal(result.status, 0);
  assert.deepEqual(eventLines(cwd), before);
});

test('triage rows carry stage, goalTier, and component membership; declared goals sort ahead of ungrouped work', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'plain');
  run(cwd, ['add', 'goal-item', '--title', 'Goal Item', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--goal-tier', 'mvp', '--description', 'tsk-535 fixture description.']);

  const result = run(cwd, ['triage']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  const plain = data.find((r) => r.id === 'plain');
  const goal = data.find((r) => r.id === 'goal-item');
  assert.equal(plain.stage, 'executing');
  assert.equal(plain.goalTier, null);
  assert.equal(plain.isIsolated, true);
  assert.equal(plain.componentSize, 1);
  assert.equal(goal.goalTier, 'mvp');
  assert.deepEqual(data.map((r) => r.id), ['goal-item', 'plain']);
});

// --- friction channel in `check` (phase-3-compound-learning-4, S2) ---------
//
// Same write-door discipline as the outcome tests above: only the runner
// writes work.friction in production, so these seed through store.mjs's
// addFriction and exercise the real `check` binary read-side.

test('check returns the friction data — per-layer counts + recent records — when friction data exists', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'fric-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'fric-item', disposition: 'parked', errorClass: 'verify-miss', layer: 'verification', attempts: 2, detail: 'goal-check failed (exit 1)' });
  addFriction(dir, { id: 'fric-item', disposition: 'halted', errorClass: 'worker-timeout', layer: 'environment', attempts: 1, detail: 'timed out' });

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const { friction } = envelopeData(result.stdout);
  assert.equal(friction.count, 2);
  assert.deepEqual(friction.byLayer, { verification: 1, environment: 1 });
  const parked = friction.recent.find((r) => r.disposition === 'parked');
  const halted = friction.recent.find((r) => r.disposition === 'halted');
  assert.equal(parked.id, 'fric-item');
  assert.equal(parked.errorClass, 'verify-miss');
  assert.equal(parked.layer, 'verification');
  assert.equal(parked.attempts, 2);
  assert.equal(halted.id, 'fric-item');
  assert.equal(halted.errorClass, 'worker-timeout');
  assert.equal(halted.layer, 'environment');
});

test('check surfaces docType for a tagged friction via the existing recent spread — no collectFrictionData change needed', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'fric-doctype-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'fric-doctype-item', docType: 'explanation', disposition: 'parked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'x' });

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const { friction } = envelopeData(result.stdout);
  const record = friction.recent.find((r) => r.id === 'fric-doctype-item');
  assert.equal(record.docType, 'explanation');
});

test('check nags items sitting in a final status without their actual half (porting-outcome-lifecycle: no silent record)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'nag-item');
  toProposed(cwd, 'nag-item');

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const { missingOutcomeNag } = envelopeData(result.stdout);
  assert.deepEqual(missingOutcomeNag, { count: 1, ids: ['nag-item'] });
});

// tsk-38t-4 (decision record 0027's audit §2): bin/fgos.mjs's FINAL_STATUSES
// used to be a locally-declared Set here, separate from and inconsistent
// with entropy.mjs's own local copy. It now imports the single shared
// export from entropy.mjs instead — this test locks that a tail-segment
// status (delivered, reached via the mechanical move chain, not the normal
// doing->awaiting-approval addOutcome stamp) still nags, unchanged by the
// refactor from a local Set to a shared import.
test('check still nags an item sitting at "delivered" (a tail-segment status) without its actual half, after the FINAL_STATUSES local-Set-to-shared-import refactor', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'nag-item-delivered');
  toProposed(cwd, 'nag-item-delivered');
  run(cwd, ['move', 'nag-item-delivered', '--to', 'delivered']);

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const { missingOutcomeNag } = envelopeData(result.stdout);
  assert.deepEqual(missingOutcomeNag, { count: 1, ids: ['nag-item-delivered'] });
});

test('check output on a log with no friction and no final-status gaps is unchanged — no friction data, no nag', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'clean-item');
  const dir = path.join(cwd, '.fgos');
  addOutcome(dir, { id: 'clean-item', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.friction, null);
  assert.equal(data.missingOutcomeNag, null);
});

test('check never mutates state: events.jsonl and state.json are byte-identical before/after', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'read-only-item');
  const dir = path.join(cwd, '.fgos');
  addOutcome(dir, { id: 'read-only-item', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });

  const logBefore = fs.readFileSync(logPath(cwd), 'utf8');
  const viewBefore = fs.readFileSync(viewPath(cwd), 'utf8');

  const result = run(cwd, ['check', 'read-only-item']);
  assert.equal(result.status, 0);

  assert.equal(fs.readFileSync(logPath(cwd), 'utf8'), logBefore, 'events.jsonl must be untouched by check');
  assert.equal(fs.readFileSync(viewPath(cwd), 'utf8'), viewBefore, 'state.json must be untouched by check');
});

test('check returns the settlement data — per-kind/role counts + recent records — when settlement data exists', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'settle-item');
  toDoneViaChain(cwd, 'settle-item');

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const { settlement } = envelopeData(result.stdout);
  assert.equal(settlement.count, 1);
  assert.deepEqual(settlement.byKindRole, { 'close/human': 1 });
  assert.equal(settlement.recent[0].kind, 'close');
  assert.equal(settlement.recent[0].id, 'settle-item');
  assert.equal(settlement.recent[0].role, 'human');
});

test('check output on a log with no settling transitions is unchanged — no settlement data', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'no-settlement-item');

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  assert.equal(envelopeData(result.stdout).settlement, null);
});

// --- entropy-trend + seal-digest in `check` (phase-3-compound-learning-6,
// S3-closeout (b)) — a real event-backed store (never fixture-only, per this
// cell's must_haves: repo has NO live .fgos to assume data from, confirmed
// by `ls`), driven entirely through the real `fgos` binary so the trend
// history file (entropy-history.jsonl, in the SAME data dir as
// events.jsonl) is genuinely written and read back across two runs. ------

test('check reports a nonzero baseline entropy score with an explainable part for a real event-backed store with a stale-doing item', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'entropy-item');
  assert.equal(run(cwd, ['move', 'entropy-item', '--to', 'doing']).status, 0);

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const { entropy } = envelopeData(result.stdout);
  assert.equal(entropy.trend.baseline, true);
  assert.equal(entropy.trend.delta, null);
  const stalePart = entropy.parts.find((p) => p.label === 'stale-doing');
  assert.deepEqual(stalePart, { label: 'stale-doing', count: 1, weight: 5, points: 5 });
  assert.notEqual(entropy.score, 0, 'a doing item must contribute a nonzero baseline score');
});

test('check reports a seal-digest delta only meaningfully for channels with real compound data, and every channel is always present (per this cell action (3))', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'seal-digest-item');
  const dir = path.join(cwd, '.fgos');
  addOutcome(dir, { id: 'seal-digest-item', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });
  addOutcome(dir, {
    id: 'seal-digest-item',
    actual: { outcome: 'awaiting-approval', passed: true, attempts: 1, errorClass: null, aheadCount: 1, visits: 1 },
  });

  const first = run(cwd, ['check']);
  assert.equal(first.status, 0);
  const firstEntropy = envelopeData(first.stdout).entropy;
  assert.equal(firstEntropy.compounded.outcomes, 1);
  assert.equal(firstEntropy.compounded.frictions, 0);
  assert.equal(firstEntropy.compounded.settlements, 0);

  // Second run over the same (unchanged) store: the outcome channel already
  // has data, so its delta is now zero against the last checkpoint — the
  // digest is a live snapshot, not a one-shot "something changed" flag.
  const second = run(cwd, ['check']);
  assert.equal(second.status, 0);
  assert.equal(envelopeData(second.stdout).entropy.compounded.outcomes, 0);
});

test('check on a second consecutive run over the same store prints a real trend delta against the first run (not baseline again)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'entropy-trend-item');
  assert.equal(run(cwd, ['move', 'entropy-trend-item', '--to', 'doing']).status, 0);

  const first = run(cwd, ['check']);
  assert.equal(first.status, 0);
  assert.equal(envelopeData(first.stdout).entropy.trend.baseline, true);

  // Move the item out of "doing" (stale-suspect ×5) into "awaiting-human"
  // (×2) between the two checks — the score must genuinely shift, not just
  // repeat, so the delta on run 2 is real evidence of trend.
  assert.equal(run(cwd, ['ask', 'entropy-trend-item', '--text', '## Context\n\nBackground needed to understand this question without opening another file.\n\n## Why this matters\n\nThis directly affects the outcome: blocked on what?']).status, 0);

  const second = run(cwd, ['check']);
  assert.equal(second.status, 0);
  const secondEntropy = envelopeData(second.stdout).entropy;
  assert.equal(secondEntropy.trend.baseline, false);
  assert.equal(secondEntropy.trend.delta, 2 - 5, 'doing(×5) -> awaiting-human(×2) must show a -3 delta');
});

test('check tolerates a torn final entropy-history line — folds trend against the last COMPLETE checkpoint instead of throwing', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'torn-history-item');
  run(cwd, ['move', 'torn-history-item', '--to', 'doing']);

  // First check writes one complete checkpoint line — the baseline.
  const first = run(cwd, ['check']);
  assert.equal(first.status, 0);
  assert.equal(envelopeData(first.stdout).entropy.trend.baseline, true);

  // Simulate a crash mid-append: a partial, unparseable JSON line at EOF.
  const historyPath = path.join(cwd, '.fgos', 'entropy-history.jsonl');
  fs.appendFileSync(historyPath, '{"ts":"2026-07-18T00:00:00.000Z","score":9,"cou', 'utf8');

  // The torn last line must NOT crash check: readLastHistoryEntry walks back to
  // the previous COMPLETE checkpoint, so trend still folds as a real delta.
  const second = run(cwd, ['check']);
  assert.equal(second.status, 0);
  const trend = envelopeData(second.stdout).entropy.trend;
  assert.equal(trend.baseline, false);
  assert.equal(typeof trend.delta, 'number');
});

test('check on a directory with no log at all still never initializes .fgos/ (entropy data stays absent, same as friction/settlement)', () => {
  const cwd = rawTmpCwd();
  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(data.outcomes, []);
  assert.equal(data.entropy, null);
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')));
});

// --- câu-6 tự động (phase-3-compound-learning-7, S3-closeout (c)) — the
// learning record is composed mechanically by store.mjs at close time
// (never here); these tests only exercise its surfacing through the real
// `fgos check` binary. ------------------------------------------------------

test('check returns the learning data — outcome/friction/settlement summary — for an item that reached done with real outcome+friction data', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'learning-item');
  const dir = path.join(cwd, '.fgos');
  run(cwd, ['move', 'learning-item', '--to', 'doing']);
  addOutcome(dir, {
    id: 'learning-item',
    actual: { outcome: 'pass', passed: true, attempts: 1, errorClass: null, aheadCount: 0, visits: 1 },
  });
  addFriction(dir, {
    id: 'learning-item',
    disposition: 'parked',
    errorClass: 'verify-miss',
    layer: 'verification',
    attempts: 1,
    detail: 'miss',
  });

  // Walk the sequential chain to done's one remaining door in (work-item-
  // status-delivered-retrospective-cleanup D1/D2/D10).
  moveWork(dir, { id: 'learning-item', to: 'delivered', expectedStatus: 'doing' });
  moveWork(dir, { id: 'learning-item', to: 'retrospective', expectedStatus: 'delivered' });
  moveWork(dir, { id: 'learning-item', to: 'cleanup', expectedStatus: 'retrospective' });
  const result = run(cwd, ['move', 'learning-item', '--to', 'done']);
  assert.equal(result.status, 0);

  const check = run(cwd, ['check']);
  assert.equal(check.status, 0);
  const { learning } = envelopeData(check.stdout);
  assert.equal(learning.count, 1);
  const record = learning.recent[0];
  assert.equal(record.id, 'learning-item');
  assert.equal(record.outcome.disposition, 'pass');
  assert.equal(record.outcome.attempts, 1);
  assert.equal(record.outcome.errorClass, null);
  assert.deepEqual(record.frictions, { verification: 1 });
  assert.deepEqual(record.settlements, { 'close/human': 1 });
});

test('check on a log with no item ever reaching done is unchanged — no learning data', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'no-learning-item');
  run(cwd, ['move', 'no-learning-item', '--to', 'doing']);

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  assert.equal(envelopeData(result.stdout).learning, null);
});

// --- work-graph-intelligence S5: `fgos graph` read verb -------------------

test('graph verb: reports connected components (independent parallel tracks) in a fgos.v1 envelope, and is a pure read (no event appended, exit 0)', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0);
  assert.equal(run(cwd, ['add', 'b', '--title', 'B', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--deps', 'a', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(addOk(cwd, 'c').status, 0); // isolated -> its own track

  const before = eventLines(cwd).length;
  const result = run(cwd, ['graph']);
  assert.equal(result.status, 0);

  const data = envelopeData(result.stdout); // asserts the C1 envelope shape
  assert.equal(data.order_version, 2); // FRONTIER_ORDER_VERSION bumped to v2 by str7-str8-priority-intent D2
  assert.equal(data.componentCount, 2);
  assert.deepEqual(data.components.map((component) => component.items), [['a', 'b'], ['c']]);

  // S6: the umbrella completes P43's stated acceptance — critical path,
  // stale-blocked, and greedy top-k-unblock. S7 adds the architecture frame.
  assert.deepEqual(Object.keys(data), ['order_version', 'frame', 'componentCount', 'components', 'criticalPath', 'staleBlocked', 'topUnblock', 'stageByItem']);
  assert.deepEqual(data.criticalPath, { depth: 2, path: ['b', 'a'] });
  assert.deepEqual(data.staleBlocked, [{ id: 'b', status: 'todo', blockedBy: ['a'] }]);
  assert.deepEqual(data.topUnblock[0], { id: 'a', unblocks: 1, newlyUnblocks: 2 });
  // tsk-4zj D6: a/c via addOk carry addOk's own explicit --stage executing
  // default; b via the raw CLI `add` (no --stage) stamps 'discovery' by
  // default (add-stage-default-gap D1/D2; tsk-qod D1/D2: discovery is
  // stages[0] now, clarify retired).
  assert.deepEqual(data.stageByItem, { a: 'executing', b: 'discovery', c: 'executing' });
  assert.match(data.frame.revision, /^[0-9a-f]{64}$/);
  assert.equal(data.frame.nodeCount, 3);
  assert.deepEqual(data.frame.skipped, []);

  // Pure read: no event written by the verb.
  assert.equal(eventLines(cwd).length, before, 'graph must not append any event');
});

test('graph --what-if <id>: reports what completing that item unblocks, in a fgos.v1 envelope, pure read', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0);
  assert.equal(run(cwd, ['add', 'b', '--title', 'B', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--deps', 'a', '--description', 'tsk-535 fixture description.']).status, 0);

  const before = eventLines(cwd).length;
  const result = run(cwd, ['graph', '--what-if', 'a']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  // tsk-4zj D6: a via addOk carries addOk's own explicit --stage executing
  // default; b via the raw CLI `add` (no --stage) stamps 'discovery' by
  // default (add-stage-default-gap D1/D2; tsk-qod D1/D2: discovery is
  // stages[0] now, clarify retired).
  assert.deepEqual(data, { id: 'a', exists: true, unblocksTransitive: 1, newlyReady: ['b'], stageByItem: { a: 'executing', b: 'discovery' } });
  assert.equal(eventLines(cwd).length, before, 'what-if must not append any event');
});

test('graph --what-if on an unknown id: exists false, zero impact, still exit 0 + envelope', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  const result = run(cwd, ['graph', '--what-if', 'ghost']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), { id: 'ghost', exists: false, unblocksTransitive: 0, newlyReady: [] });
});

// --- work-graph-intelligence S8: `fgos stale` advisory --------------------

test('stale verb: a freshly-claimed doing item is NOT stale; a valid envelope + pure read (no event, exit 0)', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0);
  assert.equal(run(cwd, ['move', 'a', '--to', 'doing', '--expect', 'todo']).status, 0);

  const before = eventLines(cwd).length;
  const result = run(cwd, ['stale']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(data.stale, [], 'a just-claimed item is well within any grace window');
  assert.equal(data.thresholds.agentMs, 15 * 60 * 1000);
  assert.equal(data.thresholds.humanMs, 24 * 60 * 60 * 1000);
  assert.equal(eventLines(cwd).length, before, 'stale must not append any event');
});

test('stale verb on a store with nothing in doing: empty advisory, exit 0', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0); // stays todo, never claimed
  const data = envelopeData(run(cwd, ['stale']).stdout);
  assert.deepEqual(data.stale, []);
});

// --- work-graph-intelligence S10 (tsk-1bl, CONTEXT.md D4/D7): `fgos stale`'s
// `postDelivery` field, additive alongside the existing `stale`/`thresholds`
// this verb already returns -- same one-verb surface, no new CLI command.

test('stale verb: postDelivery is additive — existing stale/thresholds shape is unchanged, postDelivery.stale is a sibling field', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0);
  assert.equal(run(cwd, ['move', 'a', '--to', 'doing', '--expect', 'todo']).status, 0);

  const data = envelopeData(run(cwd, ['stale']).stdout);
  assert.deepEqual(data.stale, [], 'existing doing-advisory shape untouched');
  assert.equal(data.thresholds.agentMs, 15 * 60 * 1000, 'existing doing-advisory thresholds untouched');
  assert.deepEqual(data.postDelivery.stale, [], 'no delivered/retrospective/cleanup items yet');
  assert.ok(Number.isFinite(data.postDelivery.thresholds.deliveredMs));
});

test('stale verb: a just-delivered item is NOT flagged in postDelivery (well within the 3d threshold)', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  addOk(cwd, 'just-delivered');
  run(cwd, ['move', 'just-delivered', '--to', 'doing']);
  run(cwd, ['move', 'just-delivered', '--to', 'delivered']);

  const before = eventLines(cwd).length;
  const data = envelopeData(run(cwd, ['stale']).stdout);
  assert.deepEqual(data.postDelivery.stale, []);
  assert.equal(eventLines(cwd).length, before, 'stale must not append any event');
});

test('conflicts verb: two ready items sharing a footprint path are flagged with shared + suggestions, pure read', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(run(cwd, ['add', 'a', '--title', 'A', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', 'src/x.mjs,src/y.mjs', '--stage', 'executing', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['add', 'b', '--title', 'B', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', 'src/y.mjs,src/z.mjs', '--stage', 'executing', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['add', 'c', '--title', 'C', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', 'src/w.mjs', '--stage', 'executing', '--description', 'tsk-535 fixture description.']).status, 0);

  const before = eventLines(cwd).length;
  const result = run(cwd, ['conflicts']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  // tsk-4zj D7: conflicts' output wraps into {conflicts, stageByItem} --
  // a/b/c were all added with --stage executing above.
  assert.deepEqual(data, {
    conflicts: [{ a: 'a', b: 'b', shared: ['src/y.mjs'], suggestions: ['sequence', 'hoist', 're-slice'] }],
    stageByItem: { a: 'executing', b: 'executing' },
  });
  assert.equal(eventLines(cwd).length, before, 'conflicts must not append any event');
});

test('conflicts verb on a store with no overlaps: empty list, exit 0', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0); // no footprint
  assert.deepEqual(envelopeData(run(cwd, ['conflicts']).stdout), { conflicts: [], stageByItem: {} });
});

// --- tsk-4so D1: conflicts must catch overlap ACROSS steps, not just within
// Execute (docs/history/execution-fanout/CONTEXT-tsk-4so.md) -------------

test('conflicts verb: items at DIFFERENT stages sharing a footprint are flagged (the real gap: a single-step frontier never saw this)', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(run(cwd, ['add', 'atdecompose', '--title', 'A', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', 'bin/fgos.mjs', '--stage', 'planning', '--description', 'tsk-4so fixture description.']).status, 0);
  assert.equal(run(cwd, ['add', 'atexecuting', '--title', 'B', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', 'bin/fgos.mjs', '--stage', 'executing', '--description', 'tsk-4so fixture description.']).status, 0);

  const data = envelopeData(run(cwd, ['conflicts']).stdout);
  // tsk-4zj D7: this is exactly the scenario D7 corrects D6 for -- the two
  // conflicting items are at DIFFERENT stages, so stageByItem is genuinely
  // informative here, not a constant.
  assert.deepEqual(data, {
    conflicts: [{ a: 'atdecompose', b: 'atexecuting', shared: ['bin/fgos.mjs'], suggestions: ['sequence', 'hoist', 're-slice'] }],
    stageByItem: { atdecompose: 'planning', atexecuting: 'executing' },
  });
});

// tsk-qod D1/D2: KNOWN GAP, not a design intent of this item -- footprintConflicts
// (store.mjs) scans frontierAcrossSteps' default step set (Clarify/Divide/
// Execute only); `discovery`/`exploring` were already outside that
// vocabulary before this item (tsk-1w7 D10 — "outside the 5-step
// vocabulary", same as Init/Compound-learn). Pre-tsk-qod, a freshly
// submitted item started at `clarify`, which DID map to the `Clarify` step,
// so it was still caught here. Post-tsk-qod, a freshly submitted item
// starts at `discovery` (`stages[0]`) instead, which maps to no step at
// all -- so it is now invisible to this check for its entire default
// resting stage, not just a brief transient window. Widening
// footprintConflicts' candidate set to cover discovery/exploring is a real
// product decision (does conflicts scan by raw stage instead of by step
// vocabulary now?) outside this test-fixing pass's own scope -- recorded
// here plainly rather than silently patched over.
test('conflicts verb: a discovery-stage item and an executing-stage item sharing a footprint are NOT flagged (discovery has no step mapping, so footprintConflicts cannot see it — see comment above)', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(run(cwd, ['add', 'atdiscovery', '--title', 'A', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', 'src/shared.mjs', '--stage', 'discovery', '--description', 'tsk-4so fixture description.']).status, 0);
  assert.equal(run(cwd, ['add', 'atexecuting', '--title', 'B', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', 'src/shared.mjs', '--stage', 'executing', '--description', 'tsk-4so fixture description.']).status, 0);

  const data = envelopeData(run(cwd, ['conflicts']).stdout);
  assert.deepEqual(data, { conflicts: [], stageByItem: {} });
});

// --- tsk-597z: `fgos recheck-blocked` -- report-only sweep re-running the
// merge-still-resolves ancestry check LIVE against every status:blocked
// item, instead of trusting stored reason/detail text (same live-recheck
// stance `fgos catchup`'s own eligibility gate already takes). ------------

test('recheck-blocked verb on a store with nothing blocked: all-empty envelope, exit 0, pure read (no event)', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0); // stays todo, never blocked
  const before = eventLines(cwd).length;
  const result = run(cwd, ['recheck-blocked']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), { resolvable: [], stillBlocked: [], notApplicable: [] });
  assert.equal(eventLines(cwd).length, before, 'recheck-blocked must not append any event -- report-only, never transitions anything');
});

test('recheck-blocked verb: a blocked item whose recorded commit is (still) a real ancestor of HEAD is reported resolvable, never auto-transitioned', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'catches-up', { verify: 'test -f proof.txt' });
  // Real claim -> commit -> return shape (mirrors fgos-return.test.mjs's
  // own happy-path fixture) so `headAtReturn` is a REAL recorded commit,
  // never a bare `move`'s no-op -- this is what tsk-4n7 (an item stuck
  // blocked from before an unrelated fix landed) actually looked like: a
  // real recorded commit whose ancestry check simply needs re-running.
  assert.equal(run(cwd, ['take', '--id', 'catches-up']).status, 0);
  commitFile(cwd, 'proof.txt');
  const returnResult = run(cwd, ['return', 'catches-up']);
  assert.equal(returnResult.status, 0, returnResult.stderr);
  // Park it by hand (as if an unrelated bug had parked it for a reason
  // that has nothing to do with this ancestry check) -- the sweep must
  // catch this without `reason` ever saying anything about a merge.
  run(cwd, ['move', 'catches-up', '--to', 'blocked', '--reason', 'integration-drift']);

  const data = envelopeData(run(cwd, ['recheck-blocked']).stdout);
  assert.deepEqual(data.stillBlocked, []);
  assert.equal(data.resolvable.length, 1);
  assert.equal(data.resolvable[0].id, 'catches-up');

  // report-only: item.status is untouched by the sweep itself.
  const listed = envelopeData(run(cwd, ['list', '--id', 'catches-up']).stdout);
  assert.equal(listed.work['catches-up'].status, 'blocked', 'recheck-blocked must never transition the item on its own');
});

test('recheck-blocked verb: a blocked item whose recorded commit is no longer reachable (force-pushed away) is reported stillBlocked, never resolvable', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'never-merged', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'never-merged']).status, 0);
  // Scoped `git add proof.txt` -- deliberately NOT `commitFile`'s own
  // `git add -A` (which would sweep the still-untracked `.fgos/`
  // directory into this commit, making it -- and the item's whole state
  // -- vanish under the `git reset --hard` below, the same class of
  // danger AGENTS.md's tsk-56u names for `-A` inside a worktree).
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'work\n');
  gitAtCwd(cwd, ['add', 'proof.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'work: proof.txt']);
  const returnResult = run(cwd, ['return', 'never-merged']);
  assert.equal(returnResult.status, 0, returnResult.stderr);
  run(cwd, ['move', 'never-merged', '--to', 'blocked', '--reason', 'integration-drift']);
  // Simulate a force-push/history-rewrite that drops the recorded commit
  // (same setup `checkMergeStillResolves`'s own unit test uses).
  gitAtCwd(cwd, ['reset', '--hard', 'HEAD~1']);

  const data = envelopeData(run(cwd, ['recheck-blocked']).stdout);
  assert.deepEqual(data.resolvable, []);
  assert.equal(data.stillBlocked.length, 1);
  assert.equal(data.stillBlocked[0].id, 'never-merged');
});

test('graph verb on an empty store: zero components, still a valid envelope, exit 0', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  const result = run(cwd, ['graph']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.componentCount, 0);
  assert.deepEqual(data.components, []);
});

test('list --limit paginates work into {items, nextCursor}, AND scopes every other view key to just the paged ids (tsk-483, supersedes D5/D35)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'list-page-a');
  addOk(cwd, 'list-page-b');
  assert.equal(run(cwd, ['decision', '--id', 'list-page-a', '--text', 'decision for a', '--rationale', 'r', '--relation', 'none']).status, 0);
  assert.equal(run(cwd, ['decision', '--id', 'list-page-b', '--text', 'decision for b', '--rationale', 'r', '--relation', 'none']).status, 0);
  const result = run(cwd, ['list', '--limit', '1']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(Object.keys(data.work).sort(), ['items', 'nextCursor']);
  const pagedIds = Object.keys(data.work.items);
  assert.equal(pagedIds.length, 1);
  // tsk-483: decisions now scoped to exactly the ids on THIS page -- the
  // other item's own decision must not leak through, unlike D5/D35's own
  // "every other view key untouched" behavior this item supersedes.
  assert.deepEqual(
    data.decisions.map((d) => d.id).sort(),
    pagedIds,
  );
});

test('list --all --limit combined: scopes side-logs to the paged ids too -- a combination herdr-plugin never uses (tsk-483 D2)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'list-all-page-a');
  addOk(cwd, 'list-all-page-b');
  assert.equal(run(cwd, ['decision', '--id', 'list-all-page-a', '--text', 'decision for a', '--rationale', 'r', '--relation', 'none']).status, 0);
  assert.equal(run(cwd, ['decision', '--id', 'list-all-page-b', '--text', 'decision for b', '--rationale', 'r', '--relation', 'none']).status, 0);
  const result = run(cwd, ['list', '--all', '--limit', '1']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  const pagedIds = Object.keys(data.work.items);
  assert.equal(pagedIds.length, 1);
  assert.deepEqual(
    data.decisions.map((d) => d.id).sort(),
    pagedIds,
  );
});

test('list default (no flags at all) scopes side-logs to only the open (non-done) ids -- a done item\'s own decision must not appear (tsk-483)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'list-default-open');
  assert.equal(run(cwd, ['decision', '--id', 'list-default-open', '--text', 'decision for open', '--rationale', 'r', '--relation', 'none']).status, 0);
  toProposed(cwd, 'list-default-done');
  assert.equal(run(cwd, ['decision', '--id', 'list-default-done', '--text', 'decision for done', '--rationale', 'r', '--relation', 'none']).status, 0);
  assert.equal(toDoneViaChain(cwd, 'list-default-done').status, 0);
  const result = run(cwd, ['list']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(Object.keys(data.work).sort(), ['list-default-open']);
  assert.deepEqual(data.decisions.map((d) => d.id), ['list-default-open']);
});

test('list --all --json with NO pagination flags stays byte-identical -- herdr-plugin\'s own protected contract (tsk-483 D2)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'list-protected-open');
  assert.equal(run(cwd, ['decision', '--id', 'list-protected-open', '--text', 'decision for open', '--rationale', 'r', '--relation', 'none']).status, 0);
  toProposed(cwd, 'list-protected-done');
  assert.equal(run(cwd, ['decision', '--id', 'list-protected-done', '--text', 'decision for done', '--rationale', 'r', '--relation', 'none']).status, 0);
  assert.equal(toDoneViaChain(cwd, 'list-protected-done').status, 0);
  const result = run(cwd, ['list', '--all', '--json']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  // Both items' work rows present (D1: --all restores done items).
  assert.deepEqual(Object.keys(data.work).sort(), ['list-protected-done', 'list-protected-open']);
  // Both items' decisions present, UNSCOPED -- this exact combination must
  // never gain tsk-483's new scoping, matching herdr-plugin's own real,
  // vendored call sites (herdr-plugin/src/fgos.rs, confirmed directly:
  // every one of its 3 call sites is exactly ["list", "--all", "--json"]).
  // 'list-protected-done' carries TWO: its own explicit decision above,
  // plus the tsk-280 --skip-return-guard override toProposed's own
  // doing -> awaiting-approval move now logs.
  assert.deepEqual(
    data.decisions.map((d) => d.id).sort(),
    ['list-protected-done', 'list-protected-done', 'list-protected-open'],
  );
});

