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
