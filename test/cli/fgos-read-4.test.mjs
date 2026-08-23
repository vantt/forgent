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
