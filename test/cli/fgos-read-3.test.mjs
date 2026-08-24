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
