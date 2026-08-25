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
  assert.equal(run(cwd, ['move', 'item-a', '--to', 'blocked']).status, 0); // tsk-40m: blocked stands in for the retired todo->doing edge
  assert.equal(run(cwd, ['handoff', 'item-a', '--to', 'researcher', '--reason', 'consult', '--outcome', 'consult about A']).status, 0);
  assert.equal(run(cwd, ['move', 'item-b', '--to', 'blocked']).status, 0); // tsk-40m: blocked stands in for the retired todo->doing edge
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
