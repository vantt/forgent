// Phase 01 R5-R7 tests for coordination/session-engine.mjs.
//
// Positive dispatch tests inject a fake executor the SAME way
// assignment-runresult.test.mjs already does for executeAssignment: a real
// Node subprocess (runnerConfig.executor = { command: process.execPath,
// args: [scriptPath, '{prompt}'] }) that simulates a CLI worker by writing
// agent-report.md/agent-result.json into the run dir the real
// executeExecutorCli path creates. This proves every dispatch genuinely
// goes through buildAssignment()/executeAssignment() -- no JS-level stub
// ever replaces those functions.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  openStandaloneSession,
  dispatchPrimaryTask,
  proposeConsult,
  validateConsultProposal,
  resumeSession,
  PRIMARY_ACTOR_ID,
  DEFAULT_SPECIALIST_ACTOR_ID,
} from '../../src/runner/coordination/session-engine.mjs';
import { openSession, createSessionAssignment, linkResult, readManifest, readSessionEvents, hashTaskKey, bindActor } from '../../src/runner/coordination/store.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coordination-engine-test-'));
}

function fakeExecutor(tempDir, { status = 'done', summary = 'Validated.' } = {}) {
  const executorScript = path.join(tempDir, 'fake-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const assignmentsRoot = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(assignmentsRoot)) {
      for (const asgn of fs.readdirSync(assignmentsRoot)) {
        const runDir = path.join(assignmentsRoot, asgn, 'runs', '01');
        if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
          fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\n${summary}\\n');
          fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: '${status}', summary: '${summary}' }));
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

// Same shape as fakeExecutor() above, but delays writing the RunResult by
// `delayMs` and scans every attempt directory under runs/ (not just '01') --
// needed to reproduce a genuine concurrent-dispatch race, where two racing
// callers' own real subprocess executors could in principle both be
// spawned for the same Assignment and each claim a different attempt
// number. The delay widens the window the same way the Red-Team's own
// reproduction did (`runnerConfig.executor` + an 800ms delay before writing
// `agent-result.json`).
function fakeExecutorDelayed(tempDir, { delayMs = 800, status = 'done', summary = 'Validated.' } = {}) {
  const executorScript = path.join(tempDir, `fake-executor-delayed-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    setTimeout(() => {
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
              fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: '${status}', summary: '${summary}' }));
            }
          }
        }
      }
      process.stdout.write('${summary}\\n');
      process.exit(0);
    }, ${delayMs});
    `,
  );
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };
}

function primaryTaskParams(overrides = {}) {
  return {
    objective: 'Read package.json and report its name and version.',
    expectedOutputs: ['agent-result.json (status, summary)'],
    evidenceRequired: 'reported',
    writerId: 'coordinator-1',
    ...overrides,
  };
}

function consultParams(primaryAssignmentId, overrides = {}) {
  return {
    primaryAssignmentId,
    role: 'reviewer',
    objective: 'Double-check the reported version string.',
    expectedOutputs: ['agent-result.json (status, summary)'],
    evidenceRequired: 'reported',
    writerId: 'coordinator-1',
    ...overrides,
  };
}

// ─── R5: session engine dispatch ───────────────────────────────────────────

test('dispatchPrimaryTask materializes and dispatches the primary actor through createSessionAssignment/executeAssignment, and links the RunResult', async () => {
  const tempDir = mkTempDir();
  openStandaloneSession(
    { coordinationId: 'coord_engine_primary', objective: 'Investigate package.json.', writerId: 'coordinator-1', primaryRole: 'researcher' },
    { cwd: tempDir },
  );

  const runnerConfig = fakeExecutor(tempDir);
  const { assignment, runResult, resumed } = await dispatchPrimaryTask(
    'coord_engine_primary',
    primaryTaskParams(),
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );

  assert.equal(resumed, false);
  assert.equal(assignment.provenance.kind, 'inline');
  assert.equal(assignment.mutation, 'read-only');
  assert.equal(assignment.provenance.inline.caller.writerId, 'coordinator-1');
  assert.equal(runResult.status, 'done');
  assert.equal(runResult.confidence, 'reported');

  const manifest = readManifest('coord_engine_primary', { cwd: tempDir });
  assert.deepEqual(manifest.assignmentRefs, [assignment.assignmentId]);
  assert.equal(manifest.actors.find((a) => a.id === PRIMARY_ACTOR_ID).role, 'researcher');

  const events = readSessionEvents('coord_engine_primary', { cwd: tempDir });
  assert.ok(events.some((e) => e.type === 'result-linked' && e.payload.assignmentId === assignment.assignmentId && e.payload.runId === runResult.runId));

  // Real Assignment/Run/RunResult files exist under .fgos/assignments/ --
  // the canonical store, never copied into .fgos/coordination/.
  const assignmentJsonPath = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'assignment.json');
  assert.ok(fs.existsSync(assignmentJsonPath));
});

test('proposeConsult dispatches exactly one specialist consult under the primary Assignment as caller.parentAssignmentId', async () => {
  const tempDir = mkTempDir();
  openStandaloneSession(
    { coordinationId: 'coord_engine_consult', objective: 'Investigate package.json.', writerId: 'coordinator-1', primaryRole: 'researcher' },
    { cwd: tempDir },
  );
  const runnerConfig = fakeExecutor(tempDir);
  const primary = await dispatchPrimaryTask('coord_engine_consult', primaryTaskParams(), { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  const consult = await proposeConsult('coord_engine_consult', consultParams(primary.assignment.assignmentId), {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
  });

  assert.equal(consult.assignment.mutation, 'read-only');
  assert.equal(consult.assignment.provenance.inline.caller.parentAssignmentId, primary.assignment.assignmentId);
  assert.equal(consult.runResult.status, 'done');

  const manifest = readManifest('coord_engine_consult', { cwd: tempDir });
  assert.equal(manifest.actors.find((a) => a.id === DEFAULT_SPECIALIST_ACTOR_ID)?.role, 'reviewer');
  assert.deepEqual(manifest.assignmentRefs.sort(), [primary.assignment.assignmentId, consult.assignment.assignmentId].sort());
});

// ─── R7: resume/idempotency ────────────────────────────────────────────────

test('resume: calling dispatchPrimaryTask again with the same taskKey after completion performs zero duplicate runs', async () => {
  const tempDir = mkTempDir();
  openStandaloneSession(
    { coordinationId: 'coord_engine_resume', objective: 'Investigate package.json.', writerId: 'coordinator-1', primaryRole: 'researcher' },
    { cwd: tempDir },
  );
  const runnerConfig = fakeExecutor(tempDir);
  const first = await dispatchPrimaryTask('coord_engine_resume', primaryTaskParams(), { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  const second = await dispatchPrimaryTask('coord_engine_resume', primaryTaskParams(), { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.equal(second.assignment.assignmentId, first.assignment.assignmentId);
  assert.equal(second.resumed, true);
  // second.runResult is read back off disk via JSON.parse (the resumed
  // path), so compare against the JSON round-trip of the freshly computed
  // in-memory result rather than the in-memory object itself (which can
  // carry explicit `undefined`-valued keys JSON.stringify drops).
  assert.deepEqual(second.runResult, JSON.parse(JSON.stringify(first.runResult)));

  const runsDir = path.join(tempDir, '.fgos', 'assignments', first.assignment.assignmentId, 'runs');
  assert.deepEqual(fs.readdirSync(runsDir), ['01'], 'a resumed dispatch for a completed task must never create a second run attempt');

  const manifest = readManifest('coord_engine_resume', { cwd: tempDir });
  assert.deepEqual(manifest.assignmentRefs, [first.assignment.assignmentId]);
  const events = readSessionEvents('coord_engine_resume', { cwd: tempDir });
  assert.equal(events.filter((e) => e.type === 'result-linked' && e.payload.assignmentId === first.assignment.assignmentId).length, 1);
});

test('resume crash point "after result, before event": a settled result.json with no result-linked event self-heals by linking, never re-dispatching', async () => {
  const tempDir = mkTempDir();
  openStandaloneSession(
    { coordinationId: 'coord_engine_crash_result', objective: 'Investigate package.json.', writerId: 'coordinator-1', primaryRole: 'researcher' },
    { cwd: tempDir },
  );

  const taskKey = 'primary';
  const contract = {
    objective: 'Read package.json and report its name and version.',
    contextRefs: [],
    constraints: [],
    expectedOutputs: ['agent-result.json (status, summary)'],
    mutation: 'read-only',
    evidence: { required: 'reported' },
    role: 'researcher',
    budget: { timeoutMs: 60000, maxRuns: 1 },
  };
  const assignment = createSessionAssignment(
    { coordinationId: 'coord_engine_crash_result', taskKey, actorId: PRIMARY_ACTOR_ID, contract, caller: { writerId: 'coordinator-1' } },
    { cwd: tempDir },
  );

  // Hand-construct the "executeAssignment settled, but the engine crashed
  // before calling linkResult()" window: a real result.json on disk, no
  // result-linked event anywhere in the session's log.
  const runDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  const orphanRunId = `run_${assignment.assignmentId}_01`;
  const orphanResult = { runId: orphanRunId, assignmentId: assignment.assignmentId, status: 'done', confidence: 'reported' };
  fs.writeFileSync(path.join(runDir, 'result.json'), `${JSON.stringify(orphanResult, null, 2)}\n`);

  const eventsBefore = readSessionEvents('coord_engine_crash_result', { cwd: tempDir });
  assert.ok(!eventsBefore.some((e) => e.type === 'result-linked'));

  const resumed = await dispatchPrimaryTask('coord_engine_crash_result', primaryTaskParams({ taskKey }), { cwd: tempDir, repoRoot: tempDir });

  assert.equal(resumed.assignment.assignmentId, assignment.assignmentId);
  assert.equal(resumed.resumed, true);
  assert.deepEqual(resumed.runResult, orphanResult);

  // No second run attempt was dispatched -- only "01" exists.
  assert.deepEqual(fs.readdirSync(path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs')), ['01']);
  const eventsAfter = readSessionEvents('coord_engine_crash_result', { cwd: tempDir });
  assert.equal(eventsAfter.filter((e) => e.type === 'result-linked' && e.payload.runId === orphanRunId).length, 1);
});

test('resume propagates ambiguous foreign/corrupt session state as a fail-closed CoordinationError instead of guessing past it', async () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_engine_corrupt', objective: 'Investigate.', provenanceRoot: { writerId: 'coordinator-1' }, actors: [{ id: PRIMARY_ACTOR_ID, role: 'researcher' }] }, { cwd: tempDir });

  // Dangling ref: an assignmentRefs entry with no corresponding
  // assignment-created event -- the exact shape replaySession() fails
  // closed on (replay.mjs's own "direction 2" dangling-ref check).
  const manifestPath = path.join(tempDir, '.fgos', 'coordination', 'sessions', 'coord_engine_corrupt', 'session.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.assignmentRefs = ['asgn_does_not_exist_001'];
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  await assert.rejects(
    dispatchPrimaryTask('coord_engine_corrupt', primaryTaskParams(), { cwd: tempDir, repoRoot: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'dangling-ref',
  );
});

test('duplicate-dispatch race: two concurrent dispatchPrimaryTask calls for the same taskKey (a plain Promise.all in one process, no cross-process interleaving) spawn exactly ONE real executor run, and the losing caller receives a CoordinationError instead of silently duplicating', async () => {
  const tempDir = mkTempDir();
  openStandaloneSession(
    { coordinationId: 'coord_engine_dup_dispatch', objective: 'Investigate package.json.', writerId: 'coordinator-1', primaryRole: 'researcher' },
    { cwd: tempDir },
  );
  const runnerConfig = fakeExecutorDelayed(tempDir, { delayMs: 800 });

  const results = await Promise.allSettled([
    dispatchPrimaryTask('coord_engine_dup_dispatch', primaryTaskParams(), { cwd: tempDir, repoRoot: tempDir, runnerConfig }),
    dispatchPrimaryTask('coord_engine_dup_dispatch', primaryTaskParams(), { cwd: tempDir, repoRoot: tempDir, runnerConfig }),
  ]);

  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const rejected = results.filter((r) => r.status === 'rejected');
  assert.equal(fulfilled.length, 1, 'exactly one of the two racing dispatches must succeed');
  assert.equal(rejected.length, 1, 'the losing concurrent dispatch must be rejected, not silently duplicated');
  assert.ok(rejected[0].reason instanceof CoordinationError);
  assert.equal(rejected[0].reason.category, 'validation');
  assert.match(rejected[0].reason.message, /dispatch is already in progress/);

  const assignmentId = fulfilled[0].value.assignment.assignmentId;
  const runsDir = path.join(tempDir, '.fgos', 'assignments', assignmentId, 'runs');
  assert.deepEqual(fs.readdirSync(runsDir), ['01'], 'exactly one run must ever be dispatched for the assignment');

  const events = readSessionEvents('coord_engine_dup_dispatch', { cwd: tempDir });
  assert.equal(
    events.filter((e) => e.type === 'result-linked' && e.payload.assignmentId === assignmentId).length,
    1,
    'exactly one result-linked event must survive for the assignment',
  );
});

test('a pre-spawn RunnerConfigError (governance-blocked config) removes the dispatch.claim it just wrote, so an identical retry with a fixed config is not blocked by a stale claim', async () => {
  const tempDir = mkTempDir();
  openStandaloneSession(
    { coordinationId: 'coord_engine_prespawn_error', objective: 'Investigate package.json.', writerId: 'coordinator-1', primaryRole: 'researcher' },
    { cwd: tempDir },
  );
  const runnerConfig = fakeExecutor(tempDir);

  // `runnerConfig` (fakeExecutor()) registers no `providerModel`/`provider`
  // on its executor entry, so `deriveProviderFamily` resolves it to the
  // default "claude" family (assignment-runner.mjs auto-populates
  // `cfg.executors` from `rawCfg.executor`, so a real registry IS present
  // here). Blocking that resolved family via `disallowedProviders` fails
  // closed inside `resolveAssignmentDispatchPolicy()` -- a RunnerConfigError
  // thrown well before executeAssignment() ever creates a per-attempt run
  // directory or spawns the fake executor subprocess (assignment-policy.mjs's
  // own governance gate, Phase 00 R6/F2).
  await assert.rejects(
    dispatchPrimaryTask('coord_engine_prespawn_error', primaryTaskParams(), {
      cwd: tempDir,
      repoRoot: tempDir,
      runnerConfig,
      options: { disallowedProviders: ['claude'] },
    }),
    (err) => err instanceof RunnerConfigError && /governance gate rejected provider/.test(err.message),
  );

  const assignmentsDir = path.join(tempDir, '.fgos', 'assignments');
  const assignmentIds = fs.readdirSync(assignmentsDir);
  assert.equal(assignmentIds.length, 1, 'the pre-spawn failure must still have created exactly one Assignment (createSessionAssignment ran before the failing executeAssignment call)');
  const [assignmentId] = assignmentIds;

  // No run was ever dispatched for this failed attempt.
  const runsDir = path.join(assignmentsDir, assignmentId, 'runs');
  assert.ok(!fs.existsSync(runsDir) || fs.readdirSync(runsDir).length === 0, 'a pre-spawn RunnerConfigError must never create a run directory');

  const dispatchClaimPath = path.join(assignmentsDir, assignmentId, 'dispatch.claim');
  assert.ok(!fs.existsSync(dispatchClaimPath), 'dispatch.claim must be removed after a pre-spawn RunnerConfigError, not left permanently');

  // Identical retry -- same coordinationId, same default taskKey ('primary'),
  // same params -- but with the governance block removed (the "operator
  // fixed the config" step). Must succeed, not be refused by a stale claim.
  const resumed = await dispatchPrimaryTask('coord_engine_prespawn_error', primaryTaskParams(), {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
  });

  assert.equal(resumed.assignment.assignmentId, assignmentId, 'the retry must reuse the SAME Assignment the failed attempt already registered for this taskKey');
  assert.equal(resumed.resumed, false, 'this is the assignment\'s first-ever successful execution, not a resume of a prior settled run');
  assert.equal(resumed.runResult.status, 'done');

  assert.ok(fs.existsSync(dispatchClaimPath), 'a successful dispatch still writes/keeps dispatch.claim (round-3 behavior, unchanged on the success path)');

  const manifest = readManifest('coord_engine_prespawn_error', { cwd: tempDir });
  assert.deepEqual(manifest.assignmentRefs, [assignmentId], 'no duplicate Assignment must have been created across the failed attempt and the retry');
});

// ─── R6: dynamic consult negative tests ────────────────────────────────────

async function openSessionWithPrimary(coordinationId, tempDir, runnerConfig) {
  openStandaloneSession({ coordinationId, objective: 'Investigate package.json.', writerId: 'coordinator-1', primaryRole: 'researcher' }, { cwd: tempDir });
  const primary = await dispatchPrimaryTask(coordinationId, primaryTaskParams(), { cwd: tempDir, repoRoot: tempDir, runnerConfig });
  return primary.assignment.assignmentId;
}

test('proposeConsult rejects a mutating consult (plan.md: standalone proofs are read-only)', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeExecutor(tempDir);
  const primaryId = await openSessionWithPrimary('coord_consult_mutation', tempDir, runnerConfig);

  assert.throws(
    () => validateConsultProposal('coord_consult_mutation', { ...consultParams(primaryId), mutation: 'mutating' }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /mutation "mutating" is rejected/.test(err.message),
  );
});

test('proposeConsult rejects an unknown/illegal specialist role', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeExecutor(tempDir);
  const primaryId = await openSessionWithPrimary('coord_consult_role', tempDir, runnerConfig);

  assert.throws(
    () => validateConsultProposal('coord_consult_role', { ...consultParams(primaryId), role: 'coder' }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /not a legal\/known/.test(err.message),
  );
});

test('proposeConsult rejects an absent evidence.required declaration', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeExecutor(tempDir);
  const primaryId = await openSessionWithPrimary('coord_consult_evidence', tempDir, runnerConfig);

  assert.throws(
    () => validateConsultProposal('coord_consult_evidence', { ...consultParams(primaryId), evidenceRequired: undefined }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /evidence\.required must be declared/.test(err.message),
  );
});

test('proposeConsult rejects a second consult round once a specialist actor is already bound', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeExecutor(tempDir);
  const primaryId = await openSessionWithPrimary('coord_consult_second_round', tempDir, runnerConfig);

  await proposeConsult('coord_consult_second_round', consultParams(primaryId), { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.throws(
    () => validateConsultProposal('coord_consult_second_round', { ...consultParams(primaryId, { specialistActorId: 'specialist-2' }) }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /exactly one consult round is allowed/.test(err.message),
  );
});

test('proposeConsult resumes the SAME specialist consult idempotently -- not rejected as a second round, and dispatches zero duplicate runs', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeExecutor(tempDir);
  const primaryId = await openSessionWithPrimary('coord_consult_resume', tempDir, runnerConfig);

  const first = await proposeConsult('coord_consult_resume', consultParams(primaryId), { cwd: tempDir, repoRoot: tempDir, runnerConfig });
  const second = await proposeConsult('coord_consult_resume', consultParams(primaryId), { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.equal(second.assignment.assignmentId, first.assignment.assignmentId);
  assert.equal(second.resumed, true);
  const runsDir = path.join(tempDir, '.fgos', 'assignments', first.assignment.assignmentId, 'runs');
  assert.deepEqual(fs.readdirSync(runsDir), ['01']);
});

test('proposeConsult rejects a consult that would exceed aggregateBounds.maxAssignments', async () => {
  const tempDir = mkTempDir();
  openStandaloneSession(
    { coordinationId: 'coord_consult_bounds', objective: 'Investigate.', writerId: 'coordinator-1', primaryRole: 'researcher', aggregateBounds: { maxAssignments: 1 } },
    { cwd: tempDir },
  );
  const runnerConfig = fakeExecutor(tempDir);
  const primary = await dispatchPrimaryTask('coord_consult_bounds', primaryTaskParams(), { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.throws(
    () => validateConsultProposal('coord_consult_bounds', consultParams(primary.assignment.assignmentId), { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /aggregateBounds\.maxAssignments/.test(err.message),
  );
});

test('proposeConsult rejects a contextRef that leaks a foreign Assignment belonging to an unrelated session', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeExecutor(tempDir);
  const primaryId = await openSessionWithPrimary('coord_consult_leak', tempDir, runnerConfig);

  // A real Assignment that exists on disk but is NOT a member of this
  // session -- the exact "leaking OTHER unrelated session state" shape.
  openSession({ coordinationId: 'coord_unrelated', objective: 'Unrelated.', provenanceRoot: { writerId: 'writer-2' } }, { cwd: tempDir });
  const foreignAssignment = createSessionAssignment(
    {
      coordinationId: 'coord_unrelated',
      taskKey: 'foreign-task',
      contract: {
        objective: 'Unrelated work.',
        contextRefs: [],
        constraints: [],
        expectedOutputs: ['x'],
        mutation: 'read-only',
        evidence: { required: 'reported' },
        role: 'researcher',
        budget: { timeoutMs: 1000, maxRuns: 1 },
      },
      caller: { writerId: 'writer-2' },
    },
    { cwd: tempDir },
  );

  assert.throws(
    () =>
      validateConsultProposal(
        'coord_consult_leak',
        { ...consultParams(primaryId), contextRefs: [foreignAssignment.assignmentId] },
        { cwd: tempDir },
      ),
    (err) => err instanceof CoordinationError && /sibling\/foreign context leakage/.test(err.message),
  );

  assert.throws(
    () => validateConsultProposal('coord_consult_leak', { ...consultParams(primaryId), contextRefs: ['coord_unrelated'] }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /cross-session leakage/.test(err.message),
  );
});

test('cross-process TOCTOU: two callers proposing consults for different specialistActorIds cannot both end up bound, even though both pass the earlier unlocked validateConsultProposal check', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeExecutor(tempDir);
  const primaryId = await openSessionWithPrimary('coord_consult_toctou', tempDir, runnerConfig);

  // Step 1: both callers validate BEFORE either binds -- reproducing the
  // exact interleaving two racing processes would produce. Neither call
  // mutates anything, so both legitimately pass: no specialist is bound
  // yet from either one's point of view.
  validateConsultProposal('coord_consult_toctou', consultParams(primaryId, { specialistActorId: 'specialist-A' }), { cwd: tempDir });
  validateConsultProposal('coord_consult_toctou', consultParams(primaryId, { specialistActorId: 'specialist-B' }), { cwd: tempDir });

  // Step 2: both callers now attempt the actual bind -- the same call
  // proposeConsult itself makes, with the SAME opts.primaryActorId this
  // fix adds. The first one to reach the lock wins.
  bindActor('coord_consult_toctou', { id: 'specialist-A', role: 'reviewer' }, { cwd: tempDir, primaryActorId: PRIMARY_ACTOR_ID });

  // The second caller's bind, for a genuinely DIFFERENT specialist id, must
  // now fail -- before this fix it silently succeeded and both specialists
  // ended up bound.
  assert.throws(
    () => bindActor('coord_consult_toctou', { id: 'specialist-B', role: 'reviewer' }, { cwd: tempDir, primaryActorId: PRIMARY_ACTOR_ID }),
    (err) => err instanceof CoordinationError && /already has a non-primary actor bound/.test(err.message),
  );

  const manifest = readManifest('coord_consult_toctou', { cwd: tempDir });
  const nonPrimaryActors = manifest.actors.filter((a) => a.id !== PRIMARY_ACTOR_ID);
  assert.deepEqual(nonPrimaryActors.map((a) => a.id), ['specialist-A'], 'exactly one specialist actor must ever be bound to the session');
});

test('proposeConsult itself (not just bindActor directly) rejects a second consult for a genuinely different specialistActorId proposed after the first is already bound', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeExecutor(tempDir);
  const primaryId = await openSessionWithPrimary('coord_consult_toctou_e2e', tempDir, runnerConfig);

  const first = await proposeConsult('coord_consult_toctou_e2e', consultParams(primaryId, { specialistActorId: 'specialist-A' }), {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
  });
  assert.equal(first.resumed, false);

  await assert.rejects(
    proposeConsult('coord_consult_toctou_e2e', consultParams(primaryId, { specialistActorId: 'specialist-B' }), {
      cwd: tempDir,
      repoRoot: tempDir,
      runnerConfig,
    }),
    (err) => err instanceof CoordinationError,
  );

  const manifest = readManifest('coord_consult_toctou_e2e', { cwd: tempDir });
  const nonPrimaryActors = manifest.actors.filter((a) => a.id !== PRIMARY_ACTOR_ID);
  assert.deepEqual(nonPrimaryActors.map((a) => a.id), ['specialist-A']);
});

test('cross-process race on the SAME specialistActorId: a second later readManifest observing another caller\'s already-bound, DIFFERENT-role specialist must reject rather than silently return that caller\'s Assignment', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeExecutor(tempDir);
  const primaryId = await openSessionWithPrimary('coord_consult_role_race', tempDir, runnerConfig);

  // Caller C validates BEFORE anyone has bound the specialist -- reproducing
  // the exact interleaving two racing processes would produce: C's own
  // unlocked validateConsultProposal read happens first and legitimately
  // passes (no specialist bound yet from C's point of view).
  validateConsultProposal(
    'coord_consult_role_race',
    consultParams(primaryId, { specialistActorId: 'specialist', role: 'advisor' }),
    { cwd: tempDir },
  );

  // Meanwhile caller A runs its ENTIRE proposeConsult body to completion for
  // the SAME specialistActorId but a DIFFERENT role, binding + dispatching.
  const a = await proposeConsult(
    'coord_consult_role_race',
    consultParams(primaryId, { specialistActorId: 'specialist', role: 'reviewer' }),
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );
  assert.equal(a.resumed, false);

  // Caller C now proceeds with its own original arguments -- same
  // specialistActorId as A, but its own requested role ('advisor'). Before
  // this fix, C's second, later readManifest() call would see
  // alreadyBound=true, skip bindActor entirely (bypassing the HIGH fix's
  // invariant check), and fall straight through to createSessionAssignment,
  // silently returning A's reviewer-role Assignment under a resumed:true
  // result with no error. This fix must reject it instead.
  await assert.rejects(
    proposeConsult(
      'coord_consult_role_race',
      consultParams(primaryId, { specialistActorId: 'specialist', role: 'advisor' }),
      { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    ),
    (err) => err instanceof CoordinationError && /already bound with role "reviewer", which conflicts with the requested role "advisor"/.test(err.message),
  );

  // Exactly one specialist Assignment/Run was ever dispatched -- the race
  // does not break the "exactly one specialist actor, ever" invariant
  // itself, only caller-facing honesty for the losing caller.
  const runsDir = path.join(tempDir, '.fgos', 'assignments', a.assignment.assignmentId, 'runs');
  assert.deepEqual(fs.readdirSync(runsDir), ['01']);
  const manifest = readManifest('coord_consult_role_race', { cwd: tempDir });
  const nonPrimaryActors = manifest.actors.filter((act) => act.id !== PRIMARY_ACTOR_ID);
  assert.deepEqual(nonPrimaryActors.map((act) => act.role), ['reviewer']);
});

test('proposeConsult accepts a contextRef pointing back at the primary Assignment itself (the whole point of a consult, not leakage)', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeExecutor(tempDir);
  const primaryId = await openSessionWithPrimary('coord_consult_ok_ref', tempDir, runnerConfig);

  const { manifest } = validateConsultProposal(
    'coord_consult_ok_ref',
    { ...consultParams(primaryId), contextRefs: [primaryId] },
    { cwd: tempDir },
  );
  assert.equal(manifest.coordinationId, 'coord_consult_ok_ref');
});

// ─── R5: role/session sanity ────────────────────────────────────────────────

test('openStandaloneSession rejects an unknown/illegal primaryRole before any session state is written', () => {
  const tempDir = mkTempDir();
  assert.throws(
    () => openStandaloneSession({ coordinationId: 'coord_bad_role', objective: 'X', writerId: 'w', primaryRole: 'coder' }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /not a legal\/known role/.test(err.message),
  );
  assert.ok(!fs.existsSync(path.join(tempDir, '.fgos', 'coordination', 'sessions', 'coord_bad_role')));
});

test('resumeSession is replaySession -- reconstructs manifest/assignmentRefs/events from disk', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeExecutor(tempDir);
  openStandaloneSession({ coordinationId: 'coord_resume_view', objective: 'X', writerId: 'w', primaryRole: 'researcher' }, { cwd: tempDir });
  const { assignment } = await dispatchPrimaryTask('coord_resume_view', primaryTaskParams(), { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  const view = resumeSession('coord_resume_view', { cwd: tempDir });
  assert.deepEqual(view.assignmentRefs, [assignment.assignmentId]);
  assert.equal(view.manifest.coordinationId, 'coord_resume_view');
});
