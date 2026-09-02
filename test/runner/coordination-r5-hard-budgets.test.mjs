// Phase 06 R5 (cell P06.2): adversarial/boundary/concurrency/restart tests
// for `aggregateBounds` (wallTimeMs/maxAssignments/maxConcurrency/maxRounds/
// maxTaskDepth) against the EXISTING enforcement machinery
// (`applyAggregateBoundDefaults` in schema.mjs, `createSessionAssignment`'s
// opt-in lock-held caps in store.mjs, `assertWithinWallTimeBudget`/
// `assertWithinTaskDepth` in session-engine.mjs) -- this cell's own starting
// fact (see current-cell.md) confirmed all of that machinery already existed
// before this cell; these tests hunted for a REAL gap in how (or whether)
// every dispatch path actually forwards to it, not for a build-from-scratch
// requirement.
//
// What this file found and this cell fixed (see session-engine.mjs's own
// updated comments at `dispatchPrimaryTask`/`proposeConsult`/
// `retrySessionTask` for the exact diff): the Phase 01 agent-led,
// undeclared-protocol dispatch path (`openStandaloneSession` +
// `dispatchPrimaryTask`/`proposeConsult`) forwarded NONE of the 3
// concurrency-sensitive session-wide bounds (maxAssignments/maxConcurrency/
// maxRounds) to `createSessionAssignment`, and ran NEITHER of the wall-time
// nor task-depth checks at all -- confirmed empirically (a session opened
// via `openStandaloneSession` with `aggregateBounds.maxAssignments: 1` could
// have a SECOND Assignment created through `dispatchPrimaryTask` with no
// error whatsoever, before this fix). `retrySessionTask` (shared by both
// dispatch paths) also never checked wall time before dispatching a NEW Run,
// even though a retry is a real launch the same way a first dispatch is.
// `dispatchDeclaredOperation`/`recordConsultDisposition` (the declared-
// protocol path) already forwarded/checked everything correctly and are
// covered by their own existing tests in coordination-declared-consult.test.mjs
// -- this file does not re-test that already-covered path, except where a
// test specifically needs to prove parity between the two paths now sharing
// the same enforcement.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  openStandaloneSession,
  dispatchPrimaryTask,
  proposeConsult,
  retrySessionTask,
} from '../../src/runner/coordination/session-engine.mjs';
import { readManifest, readSessionEvents } from '../../src/runner/coordination/store.mjs';
import { CoordinationError, applyAggregateBoundDefaults, validateManifest, DEFAULT_AGGREGATE_BOUNDS, SCHEMA_VERSION } from '../../src/runner/coordination/schema.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coordination-r5-test-'));
}

// Same real-subprocess-executor pattern as coordination-recovery-and-quorum.test.mjs
// / coordination-session-engine.test.mjs -- writes agent-result.json into
// whichever attempt dir the real executeAssignment() created, so each call
// genuinely proves a real Run was dispatched (never a JS-level stub of
// executeAssignment itself).
function fakeExecutor(tempDir, summary = 'done') {
  const executorScript = path.join(tempDir, `fake-executor-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const assignmentsRoot = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(assignmentsRoot)) {
      for (const asgn of fs.readdirSync(assignmentsRoot)) {
        const runsDir = path.join(assignmentsRoot, asgn, 'runs');
        if (!fs.existsSync(runsDir)) continue;
        for (const run of fs.readdirSync(runsDir)) {
          const runDir = path.join(runsDir, run);
          if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\n${summary}\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: '${summary}' }));
          }
        }
      }
    }
    process.stdout.write('${summary}\\n');
    process.exit(0);
    `,
  );
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };
}

function openSoloSession(coordinationId, tempDir, aggregateBounds) {
  return openStandaloneSession(
    { coordinationId, objective: 'R5 hard-budget probe.', writerId: 'writer-1', primaryRole: 'researcher', aggregateBounds },
    { cwd: tempDir },
  );
}

// ─── Schema-level: zero/negative/overflow/non-integer/unknown-field, every
// one of the 5 aggregateBounds fields, table-driven ─────────────────────────

const AGGREGATE_BOUND_FIELD_NAMES = Object.keys(DEFAULT_AGGREGATE_BOUNDS);

for (const field of AGGREGATE_BOUND_FIELD_NAMES) {
  test(`applyAggregateBoundDefaults rejects aggregateBounds.${field} = 0 (zero boundary)`, () => {
    assert.throws(
      () => applyAggregateBoundDefaults({ [field]: 0 }),
      (err) => err instanceof CoordinationError && new RegExp(`aggregateBounds\\.${field} must be a positive integer`).test(err.message),
    );
  });

  test(`applyAggregateBoundDefaults rejects aggregateBounds.${field} = -1 (negative)`, () => {
    assert.throws(
      () => applyAggregateBoundDefaults({ [field]: -1 }),
      (err) => err instanceof CoordinationError && new RegExp(`aggregateBounds\\.${field} must be a positive integer`).test(err.message),
    );
  });

  test(`applyAggregateBoundDefaults rejects aggregateBounds.${field} = 1.5 (non-integer)`, () => {
    assert.throws(
      () => applyAggregateBoundDefaults({ [field]: 1.5 }),
      (err) => err instanceof CoordinationError && new RegExp(`aggregateBounds\\.${field} must be a positive integer`).test(err.message),
    );
  });

  test(`applyAggregateBoundDefaults rejects aggregateBounds.${field} = NaN/Infinity/-Infinity`, () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      assert.throws(
        () => applyAggregateBoundDefaults({ [field]: bad }),
        (err) => err instanceof CoordinationError && new RegExp(`aggregateBounds\\.${field} must be a positive integer`).test(err.message),
        `expected ${field} = ${bad} to be rejected`,
      );
    }
  });

  test(`applyAggregateBoundDefaults rejects aggregateBounds.${field} of the wrong TYPE (string/bool/array/object/null)`, () => {
    for (const bad of ['5', true, [], {}, null]) {
      assert.throws(
        () => applyAggregateBoundDefaults({ [field]: bad }),
        (err) => err instanceof CoordinationError && new RegExp(`aggregateBounds\\.${field} must be a positive integer`).test(err.message),
        `expected ${field} = ${JSON.stringify(bad)} to be rejected`,
      );
    }
  });
}

test('applyAggregateBoundDefaults rejects an unknown field nested inside aggregateBounds itself (not just at the manifest top level)', () => {
  assert.throws(
    () => applyAggregateBoundDefaults({ ...DEFAULT_AGGREGATE_BOUNDS, unknownBudgetField: 5 }),
    (err) => err instanceof CoordinationError && /aggregateBounds has unknown field "unknownBudgetField"/.test(err.message),
  );
});

test('applyAggregateBoundDefaults does not silently overflow/wrap an extreme but genuinely-integer explicit value -- accepted as declared, never truncated or wrapped to a smaller/negative number', () => {
  const resolved = applyAggregateBoundDefaults({ maxAssignments: Number.MAX_SAFE_INTEGER });
  assert.equal(resolved.maxAssignments, Number.MAX_SAFE_INTEGER, 'an explicit extreme cap is honored exactly, never silently reinterpreted');
});

test('openStandaloneSession rejects a session opened with an unknown aggregateBounds field, through the full manifest-validation path (not just the pure schema unit)', () => {
  const tempDir = mkTempDir();
  assert.throws(
    () => openSoloSession('coord_r5_unknown_field', tempDir, { maxAssignments: 5, notARealBound: 1 }),
    (err) => err instanceof CoordinationError && /aggregateBounds has unknown field "notARealBound"/.test(err.message),
  );
});

// ─── The gap this cell found and fixed: dispatchPrimaryTask (agent-led path)
// previously forwarded NONE of the 3 session-wide caps and ran NEITHER
// wall-time nor task-depth checks at all ───────────────────────────────────

test('dispatchPrimaryTask enforces aggregateBounds.maxAssignments -- boundary equality: exactly N distinct-taskKey dispatches succeed, the (N+1)th is rejected, never off-by-one in either direction', async () => {
  const tempDir = mkTempDir();
  openSoloSession('coord_r5_primary_maxasgn', tempDir, { maxAssignments: 2 });

  const first = await dispatchPrimaryTask(
    'coord_r5_primary_maxasgn',
    { taskKey: 'task-1', objective: 'first', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir, 'one') },
  );
  assert.ok(first.assignment.assignmentId, 'assignment 1 of 2 (under the cap) succeeds');

  const second = await dispatchPrimaryTask(
    'coord_r5_primary_maxasgn',
    { taskKey: 'task-2', objective: 'second, exactly AT the cap', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir, 'two') },
  );
  assert.ok(second.assignment.assignmentId, 'assignment 2 of 2 (exactly at the declared cap) still succeeds -- the cap is inclusive of N, not N-1');

  await assert.rejects(
    dispatchPrimaryTask(
      'coord_r5_primary_maxasgn',
      { taskKey: 'task-3', objective: 'third, ONE PAST the cap -- must reject', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
      { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir, 'three') },
    ),
    (err) => err instanceof CoordinationError && /aggregateBounds\.maxAssignments cap of 2/.test(err.message),
  );

  const manifest = readManifest('coord_r5_primary_maxasgn', { cwd: tempDir });
  assert.equal(manifest.assignmentRefs.length, 2, 'the rejected 3rd dispatch created zero Assignments -- rejected before materialization, not after');
});

test('dispatchPrimaryTask enforces aggregateBounds.wallTimeMs -- a session past its wall-time budget rejects a NEW taskKey dispatch, creating zero Assignments', async () => {
  const tempDir = mkTempDir();
  openSoloSession('coord_r5_primary_walltime', tempDir, { wallTimeMs: 50 });
  await new Promise((resolve) => setTimeout(resolve, 80));

  await assert.rejects(
    dispatchPrimaryTask(
      'coord_r5_primary_walltime',
      { objective: 'past budget', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
      { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) },
    ),
    (err) => err instanceof CoordinationError && /wall-time budget/.test(err.message),
  );
  const assignmentsDir = path.join(tempDir, '.fgos', 'assignments');
  assert.ok(!fs.existsSync(assignmentsDir) || fs.readdirSync(assignmentsDir).length === 0, 'a rejected wall-time-exceeded dispatch must create zero Assignments');
});

test('dispatchPrimaryTask still dispatches successfully well inside its wall-time budget (never a false-positive rejection)', async () => {
  const tempDir = mkTempDir();
  openSoloSession('coord_r5_primary_walltime_ok', tempDir, { wallTimeMs: 60000 });
  const result = await dispatchPrimaryTask(
    'coord_r5_primary_walltime_ok',
    { objective: 'well within budget', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) },
  );
  assert.ok(result.assignment.assignmentId);
});

test('dispatchPrimaryTask enforces aggregateBounds.maxTaskDepth against the REAL parentAssignmentId chain -- boundary equality: depth exactly at the cap succeeds, one hop past it is rejected', async () => {
  const tempDir = mkTempDir();
  openSoloSession('coord_r5_primary_depth', tempDir, { maxTaskDepth: 2, maxAssignments: 10 });

  // depth 1 (root, no parent) -- always legal regardless of the cap.
  const depth1 = await dispatchPrimaryTask(
    'coord_r5_primary_depth',
    { taskKey: 'root', objective: 'depth 1', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir, 'd1') },
  );

  // depth 2 -- exactly at maxTaskDepth: 2, must still succeed.
  const depth2 = await dispatchPrimaryTask(
    'coord_r5_primary_depth',
    { taskKey: 'child', objective: 'depth 2, exactly at the cap', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1', parentAssignmentId: depth1.assignment.assignmentId },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir, 'd2') },
  );
  assert.ok(depth2.assignment.assignmentId, 'depth 2 (equal to maxTaskDepth: 2) succeeds -- the cap is inclusive');

  // depth 3 -- one hop past the cap, must reject with zero Assignments created.
  await assert.rejects(
    dispatchPrimaryTask(
      'coord_r5_primary_depth',
      { taskKey: 'grandchild', objective: 'depth 3, one past the cap', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1', parentAssignmentId: depth2.assignment.assignmentId },
      { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir, 'd3') },
    ),
    (err) => err instanceof CoordinationError && /aggregateBounds\.maxTaskDepth cap of 2/.test(err.message),
  );
});

test('dispatchPrimaryTask enforces aggregateBounds.maxConcurrency session-wide -- of two concurrent NEW root dispatches, only one is in flight at a time under maxConcurrency: 1 (real, non-sequential race within one process, same shape/reasoning as the declared-path R5 precedent)', async () => {
  const tempDir = mkTempDir();
  openSoloSession('coord_r5_primary_concurrency', tempDir, { maxConcurrency: 1 });

  const outcomes = await Promise.allSettled([
    dispatchPrimaryTask(
      'coord_r5_primary_concurrency',
      { taskKey: 'concurrent-a', objective: 'first concurrent', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
      { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir, 'a') },
    ),
    dispatchPrimaryTask(
      'coord_r5_primary_concurrency',
      { taskKey: 'concurrent-b', objective: 'second concurrent', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
      { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir, 'b') },
    ),
  ]);

  const fulfilled = outcomes.filter((r) => r.status === 'fulfilled');
  const rejected = outcomes.filter((r) => r.status === 'rejected');
  assert.equal(fulfilled.length, 1, 'exactly one of two concurrent dispatches should succeed under aggregateBounds.maxConcurrency: 1');
  assert.equal(rejected.length, 1);
  assert.ok(rejected[0].reason instanceof CoordinationError && /aggregateBounds\.maxConcurrency/.test(rejected[0].reason.message));
});

test('dispatchPrimaryTask enforces aggregateBounds.maxRounds session-wide, independently of maxAssignments', async () => {
  const tempDir = mkTempDir();
  // maxAssignments deliberately generous (10) so a rejection can only come
  // from maxRounds: 1.
  openSoloSession('coord_r5_primary_maxrounds', tempDir, { maxRounds: 1, maxAssignments: 10 });

  await dispatchPrimaryTask(
    'coord_r5_primary_maxrounds',
    { taskKey: 'round-1', objective: 'first round', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) },
  );

  await assert.rejects(
    dispatchPrimaryTask(
      'coord_r5_primary_maxrounds',
      { taskKey: 'round-2', objective: 'second round, past the session-wide cap', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
      { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) },
    ),
    (err) => err instanceof CoordinationError && /already used \d+ round\(s\) session-wide/.test(err.message),
  );
});

// ─── The same gap, on proposeConsult (the other agent-led dispatch entry
// point) -- previously had only an UNLOCKED, maxAssignments-only pre-check
// (validateConsultProposal) and forwarded nothing to the authoritative,
// lock-held enforcement; wall-time and task-depth were never checked at all ─

test('proposeConsult enforces aggregateBounds.wallTimeMs -- a session past its wall-time budget rejects the consult proposal itself, before any Assignment is created', async () => {
  const tempDir = mkTempDir();
  openSoloSession('coord_r5_consult_walltime', tempDir, { wallTimeMs: 200 });
  const primary = await dispatchPrimaryTask(
    'coord_r5_consult_walltime',
    { objective: 'primary', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) },
  );
  await new Promise((resolve) => setTimeout(resolve, 250));

  await assert.rejects(
    proposeConsult(
      'coord_r5_consult_walltime',
      { primaryAssignmentId: primary.assignment.assignmentId, role: 'researcher', objective: 'consult past budget', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
      { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) },
    ),
    (err) => err instanceof CoordinationError && /wall-time budget/.test(err.message),
  );
});

test('proposeConsult enforces aggregateBounds.maxTaskDepth against the primary Assignment as the real parent -- rejected once the consult would exceed the cap', async () => {
  const tempDir = mkTempDir();
  openSoloSession('coord_r5_consult_depth', tempDir, { maxTaskDepth: 1 });
  const primary = await dispatchPrimaryTask(
    'coord_r5_consult_depth',
    { objective: 'primary, depth 1', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) },
  );

  await assert.rejects(
    proposeConsult(
      'coord_r5_consult_depth',
      { primaryAssignmentId: primary.assignment.assignmentId, role: 'researcher', objective: 'consult, depth 2 -- exceeds maxTaskDepth: 1', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
      { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) },
    ),
    (err) => err instanceof CoordinationError && /aggregateBounds\.maxTaskDepth cap of 1/.test(err.message),
  );
});

test('proposeConsult now forwards maxConcurrencyForSession to the authoritative lock-held check -- previously this bound had ZERO enforcement (not even an unlocked pre-check) on the consult path', async () => {
  const tempDir = mkTempDir();
  // maxAssignments generous (10) so the pre-existing unlocked maxAssignments
  // pre-check in validateConsultProposal cannot be the source of rejection --
  // isolates this test to the maxConcurrency forwarding this cell added.
  openSoloSession('coord_r5_consult_concurrency', tempDir, { maxAssignments: 10, maxConcurrency: 1 });
  const primary = await dispatchPrimaryTask(
    'coord_r5_consult_concurrency',
    { objective: 'primary', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) },
  );

  // The primary's own Assignment is already result-linked (settled) by the
  // time dispatchPrimaryTask resolves, so it does not itself count as
  // "in flight" for maxConcurrency purposes -- manufacture a genuinely
  // in-flight Assignment first (created, deliberately never linked) so the
  // consult's own createSessionAssignment call sees 1 in-flight entry
  // against maxConcurrency: 1.
  const dispatchClaimDir = path.join(tempDir, '.fgos', 'assignments');
  // A second primary taskKey creates a genuinely in-flight Assignment by
  // constructing it directly through the store (never linking a result),
  // simulating "still running" without needing a hung executor.
  const { createSessionAssignment } = await import('../../src/runner/coordination/store.mjs');
  createSessionAssignment(
    {
      coordinationId: 'coord_r5_consult_concurrency',
      taskKey: 'still-running',
      actorId: 'primary',
      contract: {
        objective: 'still running', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'],
        mutation: 'read-only', evidence: { required: 'reported' }, role: 'researcher', budget: { timeoutMs: 60000, maxRuns: 1 },
      },
      caller: { writerId: 'writer-1' },
    },
    { cwd: tempDir },
  );
  assert.ok(fs.existsSync(dispatchClaimDir));

  await assert.rejects(
    proposeConsult(
      'coord_r5_consult_concurrency',
      { primaryAssignmentId: primary.assignment.assignmentId, role: 'researcher', objective: 'consult while another Assignment is still in flight', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
      { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) },
    ),
    (err) => err instanceof CoordinationError && /aggregateBounds\.maxConcurrency/.test(err.message),
  );
});

// ─── retrySessionTask: the same "before each launch" wall-time gap, shared
// by both dispatch paths (retrySessionTask is not path-specific) ──────────

test('retrySessionTask enforces aggregateBounds.wallTimeMs before dispatching a NEW retry Run -- a session past budget refuses to retry', async () => {
  const tempDir = mkTempDir();
  openSoloSession('coord_r5_retry_walltime', tempDir, { wallTimeMs: 200 });
  const first = await dispatchPrimaryTask(
    'coord_r5_retry_walltime',
    { objective: 'first', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir, 'one') },
  );
  await new Promise((resolve) => setTimeout(resolve, 250));

  await assert.rejects(
    retrySessionTask(
      'coord_r5_retry_walltime',
      { assignmentId: first.assignment.assignmentId, reason: 'past budget', maxRetries: 2 },
      { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir, 'two') },
    ),
    (err) => err instanceof CoordinationError && /wall-time budget/.test(err.message),
  );
  const events = readSessionEvents('coord_r5_retry_walltime', { cwd: tempDir });
  assert.equal(events.filter((e) => e.type === 'run-retried').length, 0, 'the wall-time-rejected retry never even declared a run-retried event');
});

test('retrySessionTask self-heal (linking an already-settled disk result) is NEVER blocked by wall-time -- only a genuinely NEW dispatch launch is gated', async () => {
  const tempDir = mkTempDir();
  openSoloSession('coord_r5_retry_walltime_selfheal', tempDir, { wallTimeMs: 200 });
  const first = await dispatchPrimaryTask(
    'coord_r5_retry_walltime_selfheal',
    { objective: 'first', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir, 'one') },
  );
  const assignmentId = first.assignment.assignmentId;

  // Declare a retry and write a SETTLED result directly to the next attempt
  // dir WITHOUT going through retrySessionTask's own dispatch (simulates
  // "crash after executeAssignment succeeded, before linkResult" -- the
  // exact self-heal window this function's own doc comment describes).
  const { recordRunRetry } = await import('../../src/runner/coordination/store.mjs');
  recordRunRetry('coord_r5_retry_walltime_selfheal', { assignmentId, reason: 'simulate crash before link', maxRetries: 2 }, { cwd: tempDir });
  const runDir = path.join(tempDir, '.fgos', 'assignments', assignmentId, 'runs', '02');
  fs.mkdirSync(runDir, { recursive: true });
  const runId = `run_${assignmentId}_02`;
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({ runId, assignmentId, status: 'done', confidence: 'reported' }, null, 2));

  // Wall time has now elapsed well past the 200ms budget.
  await new Promise((resolve) => setTimeout(resolve, 250));

  const resumed = await retrySessionTask(
    'coord_r5_retry_walltime_selfheal',
    { assignmentId, reason: 'resume after simulated crash', maxRetries: 2 },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir, 'unused') },
  );
  assert.equal(resumed.resumed, true, 'self-heal (linking the already-settled disk result) succeeds even though wall time has elapsed -- it never launches anything new');
  assert.equal(resumed.runResult.runId, runId);
});

// ─── Real cross-process concurrent race (H2 pattern reused verbatim, per
// this cell's own brief: genuine separate OS processes, real events.lock
// hardlink acquisition, never simulated) -- proves the newly-added
// dispatchPrimaryTask forwarding is authoritative under REAL concurrency,
// not merely correct for the trivial sequential/same-process case ─────────

test('R5 real cross-process race: two genuinely separate OS processes racing dispatchPrimaryTask with DIFFERENT taskKeys under aggregateBounds.maxAssignments: 1 -- exactly one wins, the loser gets a named rejection, never a silent double-materialization', async () => {
  const tempDir = mkTempDir();
  openSoloSession('coord_r5_cross_process_race', tempDir, { maxAssignments: 1 });

  const runnerConfigA = fakeExecutor(tempDir, 'racer-a');
  const runnerConfigB = fakeExecutor(tempDir, 'racer-b');

  function racerScript(taskKey, runnerConfig) {
    const scriptPath = path.join(tempDir, `racer-${taskKey}.mjs`);
    fs.writeFileSync(
      scriptPath,
      `
      import { dispatchPrimaryTask } from ${JSON.stringify(new URL('../../src/runner/coordination/session-engine.mjs', import.meta.url).href)};
      try {
        const result = await dispatchPrimaryTask(
          'coord_r5_cross_process_race',
          { taskKey: ${JSON.stringify(taskKey)}, objective: 'racer', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
          { cwd: ${JSON.stringify(tempDir)}, repoRoot: ${JSON.stringify(tempDir)}, runnerConfig: ${JSON.stringify(runnerConfig)} },
        );
        process.stdout.write(JSON.stringify({ ok: true, assignmentId: result.assignment.assignmentId }));
        process.exit(0);
      } catch (err) {
        process.stdout.write(JSON.stringify({ ok: false, error: err.message }));
        process.exit(0);
      }
      `,
    );
    return scriptPath;
  }

  function runRacer(scriptPath) {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [scriptPath], { stdio: ['ignore', 'pipe', 'inherit'] });
      let stdout = '';
      child.stdout.on('data', (chunk) => { stdout += chunk; });
      child.on('error', reject);
      child.on('exit', () => {
        try {
          resolve(JSON.parse(stdout));
        } catch (err) {
          reject(new Error(`racer produced non-JSON stdout: ${stdout}`));
        }
      });
    });
  }

  const scriptA = racerScript('racer-a', runnerConfigA);
  const scriptB = racerScript('racer-b', runnerConfigB);

  // Real, genuinely concurrent OS processes -- both started before either
  // can possibly have finished, racing for the SAME session's real
  // events.lock (the exact hardlink-based mutex acquireEventsLock itself
  // uses), never a mock or a simulated/sequential stand-in.
  const [resultA, resultB] = await Promise.all([runRacer(scriptA), runRacer(scriptB)]);

  const results = [resultA, resultB];
  const succeeded = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  assert.equal(succeeded.length, 1, `exactly one racer should succeed under maxAssignments: 1 -- got ${JSON.stringify(results)}`);
  assert.equal(failed.length, 1);
  assert.match(failed[0].error, /aggregateBounds\.maxAssignments cap of 1/);

  const manifest = readManifest('coord_r5_cross_process_race', { cwd: tempDir });
  assert.equal(manifest.assignmentRefs.length, 1, 'the session-wide cap held under a real cross-process race -- never two Assignments for a cap of 1');
});

// ─── Restart cannot bypass limits: a fresh, separate OS process (zero shared
// in-memory state with whatever dispatched before it) reads the SAME
// on-disk aggregateBounds/assignmentRefs/createdAt and is bound by them
// identically -- "restart" is not a special code path anywhere in this
// engine, so this proves that by construction, not by assertion ──────────

function runInFreshProcess(tempDir, coordinationId, taskKey, runnerConfig) {
  const scriptPath = path.join(tempDir, `restart-${taskKey}-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(
    scriptPath,
    `
    import { dispatchPrimaryTask } from ${JSON.stringify(new URL('../../src/runner/coordination/session-engine.mjs', import.meta.url).href)};
    try {
      const result = await dispatchPrimaryTask(
        ${JSON.stringify(coordinationId)},
        { taskKey: ${JSON.stringify(taskKey)}, objective: 'post-restart dispatch', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
        { cwd: ${JSON.stringify(tempDir)}, repoRoot: ${JSON.stringify(tempDir)}, runnerConfig: ${JSON.stringify(runnerConfig)} },
      );
      process.stdout.write(JSON.stringify({ ok: true, assignmentId: result.assignment.assignmentId, resumed: result.resumed === true }));
      process.exit(0);
    } catch (err) {
      process.stdout.write(JSON.stringify({ ok: false, error: err.message }));
      process.exit(0);
    }
    `,
  );
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], { stdio: ['ignore', 'pipe', 'inherit'] });
    let stdout = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.on('error', reject);
    child.on('exit', () => {
      try {
        resolve(JSON.parse(stdout));
      } catch (err) {
        reject(new Error(`fresh-process dispatch produced non-JSON stdout: ${stdout}`));
      }
    });
  });
}

test('restart cannot bypass aggregateBounds.maxAssignments -- a brand-new OS process (no shared in-memory state with the process that dispatched the first Assignment) still hits the SAME on-disk cap for a genuinely new taskKey', async () => {
  const tempDir = mkTempDir();
  openSoloSession('coord_r5_restart_maxasgn', tempDir, { maxAssignments: 1 });

  const first = await dispatchPrimaryTask(
    'coord_r5_restart_maxasgn',
    { taskKey: 'before-restart', objective: 'first, in this process', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir, 'pre-restart') },
  );
  assert.ok(first.assignment.assignmentId);

  // "Restart": a genuinely separate OS process, sharing NOTHING but the
  // on-disk session state, attempts a NEW taskKey.
  const afterRestart = await runInFreshProcess(tempDir, 'coord_r5_restart_maxasgn', 'after-restart', fakeExecutor(tempDir, 'post-restart'));
  assert.equal(afterRestart.ok, false, 'a fresh process for a NEW taskKey must still be rejected by the same on-disk cap');
  assert.match(afterRestart.error, /aggregateBounds\.maxAssignments cap of 1/);

  const manifest = readManifest('coord_r5_restart_maxasgn', { cwd: tempDir });
  assert.deepEqual(manifest.assignmentRefs, [first.assignment.assignmentId], 'restart never allowed a second Assignment past the cap');
});

test('restart resumes the SAME taskKey idempotently (never double-dispatches, never treated as a new round against the cap) even from a brand-new OS process', async () => {
  const tempDir = mkTempDir();
  openSoloSession('coord_r5_restart_resume', tempDir, { maxAssignments: 1 });

  const first = await dispatchPrimaryTask(
    'coord_r5_restart_resume',
    { taskKey: 'the-task', objective: 'first, in this process', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir, 'original') },
  );

  // A fresh process resumes the EXACT SAME taskKey -- must resolve to the
  // SAME Assignment (idempotent resume), never a fresh dispatch that would
  // be double-counted against the (already fully consumed) cap of 1.
  const afterRestart = await runInFreshProcess(tempDir, 'coord_r5_restart_resume', 'the-task', fakeExecutor(tempDir, 'should-not-run'));
  assert.equal(afterRestart.ok, true, 'resuming the SAME taskKey after restart must succeed (idempotent), not be rejected as if it were a new dispatch');
  assert.equal(afterRestart.assignmentId, first.assignment.assignmentId, 'resume resolves to the SAME Assignment, never a second one');
  assert.equal(afterRestart.resumed, true);

  const manifest = readManifest('coord_r5_restart_resume', { cwd: tempDir });
  assert.equal(manifest.assignmentRefs.length, 1, 'the idempotent resume never created a second Assignment');
});

test('restart cannot bypass aggregateBounds.wallTimeMs -- the budget is measured from the on-disk manifest.createdAt, not from any in-process clock/counter that a restart would reset', async () => {
  const tempDir = mkTempDir();
  openSoloSession('coord_r5_restart_walltime', tempDir, { wallTimeMs: 100 });
  await new Promise((resolve) => setTimeout(resolve, 150));

  // A brand-new process, with no memory of when the session was opened,
  // still correctly computes "budget already elapsed" purely from disk.
  const afterRestart = await runInFreshProcess(tempDir, 'coord_r5_restart_walltime', 'never-dispatched', fakeExecutor(tempDir));
  assert.equal(afterRestart.ok, false);
  assert.match(afterRestart.error, /wall-time budget/);

  const assignmentsDir = path.join(tempDir, '.fgos', 'assignments');
  assert.ok(!fs.existsSync(assignmentsDir) || fs.readdirSync(assignmentsDir).length === 0);
});
