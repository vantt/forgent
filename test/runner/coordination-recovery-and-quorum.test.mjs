// Phase 06 R1-R4 tests for coordination/session-engine.mjs +
// coordination/store.mjs + coordination/replay.mjs:
// - R1 quorum/partial policy (evaluateSessionQuorum, closeSessionByQuorum)
// - R2 retry/replacement (retrySessionTask, replaceSessionActor)
// - R3 crash recovery at the NEW persistence boundaries this phase adds
//   (run-retried declaration, retry dispatch, actor replacement) --
//   constructed as deterministic on-disk fixtures the SAME way this repo's
//   own established house style already does in
//   coordination-store.test.mjs's "crash point" tests (direct fixture
//   construction, not a literal process kill), since R3's OTHER boundaries
//   (Assignment claim, manifest/event atomic-ref) are P01.1/P01.2's own
//   proven territory (unchanged here, still green) and concurrent fan-out/
//   fan-in crash coverage already exists in
//   coordination-research-fan-out.test.mjs (also unchanged, still green).
// - R4 cancellation and bounded terminal-status transitions.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  openStandaloneSession,
  dispatchPrimaryTask,
  retrySessionTask,
  replaceSessionActor,
  cancelSession,
  evaluateSessionQuorum,
  closeSessionByQuorum,
  deriveSessionPhase,
  PRIMARY_ACTOR_ID,
} from '../../src/runner/coordination/session-engine.mjs';
import {
  openSession,
  bindActor,
  createSessionAssignment,
  linkResult,
  recordRunRetry,
  transitionSessionStatus,
  readManifest,
  readSessionEvents,
  appendEvent,
} from '../../src/runner/coordination/store.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coordination-recovery-test-'));
}

function inlineContract(overrides = {}) {
  return {
    objective: 'Gather background facts.',
    contextRefs: [],
    constraints: [],
    expectedOutputs: ['agent-result.json (status, summary)'],
    mutation: 'read-only',
    evidence: { required: 'reported' },
    role: 'researcher',
    budget: { timeoutMs: 60000, maxRuns: 1 },
    ...overrides,
  };
}

// Same real-subprocess-executor pattern as coordination-session-engine.test.mjs
// -- writes agent-result.json into whichever attempt dir the real
// executeAssignment() created, so each call genuinely proves a real Run was
// dispatched (never a JS-level stub of executeAssignment itself).
function fakeExecutor(tempDir, { status = 'done', summary = 'Validated.' } = {}) {
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
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: '${status}', summary: '${summary}' }));
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

function assignmentRunsDir(tempDir, assignmentId) {
  return path.join(tempDir, '.fgos', 'assignments', assignmentId, 'runs');
}

function writeAttemptResult(tempDir, assignmentId, attemptStr, { status = 'done', confidence = 'reported' } = {}) {
  const runDir = path.join(assignmentRunsDir(tempDir, assignmentId), attemptStr);
  fs.mkdirSync(runDir, { recursive: true });
  const runId = `run_${assignmentId}_${attemptStr}`;
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({ runId, assignmentId, status, confidence }, null, 2));
  return runId;
}

// ─── R1: required actors/quorum ────────────────────────────────────────────

test('evaluateSessionQuorum classifies completed/failed/late/missing/replaced branches correctly, and a replaced slot resolves via the replacement chain', () => {
  const tempDir = mkTempDir();
  openSession(
    {
      coordinationId: 'coord_quorum_classify',
      objective: 'Quorum classification fixture.',
      provenanceRoot: { writerId: 'writer-1' },
      actors: [
        { id: 'a', role: 'researcher' },
        { id: 'b', role: 'researcher' },
        { id: 'c', role: 'researcher' },
        { id: 'd', role: 'researcher' },
        { id: 'e', role: 'researcher' },
      ],
    },
    { cwd: tempDir },
  );

  // a: completed
  const asgnA = createSessionAssignment({ coordinationId: 'coord_quorum_classify', taskKey: 'a-task', actorId: 'a', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });
  const runA = writeAttemptResult(tempDir, asgnA.assignmentId, '01', { status: 'done', confidence: 'reported' });
  linkResult('coord_quorum_classify', { assignmentId: asgnA.assignmentId, runId: runA }, { cwd: tempDir });

  // b: failed
  const asgnB = createSessionAssignment({ coordinationId: 'coord_quorum_classify', taskKey: 'b-task', actorId: 'b', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });
  const runB = writeAttemptResult(tempDir, asgnB.assignmentId, '01', { status: 'failed', confidence: 'failed' });
  linkResult('coord_quorum_classify', { assignmentId: asgnB.assignmentId, runId: runB }, { cwd: tempDir });

  // c: late (assignment created, never settled/linked)
  createSessionAssignment({ coordinationId: 'coord_quorum_classify', taskKey: 'c-task', actorId: 'c', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });

  // d: missing (never dispatched)

  // e -> e2 replacement, e2 completes
  bindActor('coord_quorum_classify', { id: 'e2', role: 'researcher' }, { cwd: tempDir });
  appendEvent(
    path.join(tempDir, '.fgos', 'coordination', 'sessions', 'coord_quorum_classify', 'events.jsonl'),
    { type: 'actor-replaced', payload: { oldActorId: 'e', replacementActorId: 'e2', reason: 'executor exhausted' } },
    path.join(tempDir, '.fgos', 'coordination', 'sessions', 'coord_quorum_classify'),
  );
  const asgnE2 = createSessionAssignment({ coordinationId: 'coord_quorum_classify', taskKey: 'e2-task', actorId: 'e2', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });
  const runE2 = writeAttemptResult(tempDir, asgnE2.assignmentId, '01', { status: 'done', confidence: 'reported' });
  linkResult('coord_quorum_classify', { assignmentId: asgnE2.assignmentId, runId: runE2 }, { cwd: tempDir });

  const quorum = evaluateSessionQuorum('coord_quorum_classify', { cwd: tempDir });
  assert.deepEqual(quorum.requiredActorIds, ['a', 'b', 'c', 'd', 'e', 'e2']);
  assert.deepEqual(quorum.completed.map((x) => x.actorId).sort(), ['a', 'e']);
  assert.deepEqual(quorum.failed.map((x) => x.actorId), ['b']);
  assert.deepEqual(quorum.late.map((x) => x.actorId), ['c']);
  assert.deepEqual(quorum.missing.map((x) => x.actorId), ['d']);
  assert.deepEqual(quorum.replaced, [{ actorId: 'e', replacedBy: 'e2' }]);
  // e2 is never evaluated as its own separate top-level required slot
  assert.ok(!quorum.completed.some((x) => x.actorId === 'e2'));
});

test('closeSessionByQuorum refuses to close while a required actor is missing and no partialPolicy is declared -- default completion requires every required actor', () => {
  const tempDir = mkTempDir();
  openSession(
    { coordinationId: 'coord_quorum_no_policy', objective: 'x', provenanceRoot: { writerId: 'writer-1' }, actors: [{ id: 'a', role: 'researcher' }, { id: 'b', role: 'researcher' }] },
    { cwd: tempDir },
  );
  const asgnA = createSessionAssignment({ coordinationId: 'coord_quorum_no_policy', taskKey: 'a-task', actorId: 'a', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });
  const runA = writeAttemptResult(tempDir, asgnA.assignmentId, '01');
  linkResult('coord_quorum_no_policy', { assignmentId: asgnA.assignmentId, runId: runA }, { cwd: tempDir });

  assert.throws(
    () => closeSessionByQuorum('coord_quorum_no_policy', {}, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /declares no partialPolicy/.test(err.message),
  );
  assert.equal(readManifest('coord_quorum_no_policy', { cwd: tempDir }).status, 'active');
});

test('closeSessionByQuorum closes to "partial" (never "completed") under an explicit partialPolicy naming the missing actor', () => {
  const tempDir = mkTempDir();
  openSession(
    {
      coordinationId: 'coord_quorum_partial',
      objective: 'x',
      provenanceRoot: { writerId: 'writer-1' },
      actors: [{ id: 'a', role: 'researcher' }, { id: 'b', role: 'researcher' }],
      partialPolicy: { allowedOmissions: ['b'] },
    },
    { cwd: tempDir },
  );
  const asgnA = createSessionAssignment({ coordinationId: 'coord_quorum_partial', taskKey: 'a-task', actorId: 'a', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });
  const runA = writeAttemptResult(tempDir, asgnA.assignmentId, '01');
  linkResult('coord_quorum_partial', { assignmentId: asgnA.assignmentId, runId: runA }, { cwd: tempDir });

  const manifest = closeSessionByQuorum('coord_quorum_partial', {}, { cwd: tempDir });
  assert.equal(manifest.status, 'partial');
  assert.notEqual(manifest.status, 'completed');

  const events = readSessionEvents('coord_quorum_partial', { cwd: tempDir });
  const partialEvent = events.find((e) => e.type === 'session-partial');
  assert.deepEqual(partialEvent.payload.missingActors, ['b']);
});

test('closeSessionByQuorum refuses an undeclared partial close even with a partialPolicy present, when the incomplete actor is not named in allowedOmissions', () => {
  const tempDir = mkTempDir();
  openSession(
    {
      coordinationId: 'coord_quorum_undeclared',
      objective: 'x',
      provenanceRoot: { writerId: 'writer-1' },
      actors: [{ id: 'a', role: 'researcher' }, { id: 'b', role: 'researcher' }],
      partialPolicy: { allowedOmissions: ['c'] }, // names an actor that isn't even required
    },
    { cwd: tempDir },
  );
  const asgnA = createSessionAssignment({ coordinationId: 'coord_quorum_undeclared', taskKey: 'a-task', actorId: 'a', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });
  linkResult('coord_quorum_undeclared', { assignmentId: asgnA.assignmentId, runId: writeAttemptResult(tempDir, asgnA.assignmentId, '01') }, { cwd: tempDir });

  assert.throws(
    () => closeSessionByQuorum('coord_quorum_undeclared', {}, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /not named in session .* declared partialPolicy/.test(err.message),
  );
});

test('closeSessionByQuorum refuses a partial close below the declared partialPolicy.minimumActors floor', () => {
  const tempDir = mkTempDir();
  openSession(
    {
      coordinationId: 'coord_quorum_minimum',
      objective: 'x',
      provenanceRoot: { writerId: 'writer-1' },
      actors: [{ id: 'a', role: 'researcher' }, { id: 'b', role: 'researcher' }, { id: 'c', role: 'researcher' }],
      partialPolicy: { allowedOmissions: ['b', 'c'], minimumActors: 2 },
    },
    { cwd: tempDir },
  );
  const asgnA = createSessionAssignment({ coordinationId: 'coord_quorum_minimum', taskKey: 'a-task', actorId: 'a', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });
  linkResult('coord_quorum_minimum', { assignmentId: asgnA.assignmentId, runId: writeAttemptResult(tempDir, asgnA.assignmentId, '01') }, { cwd: tempDir });

  assert.throws(
    () => closeSessionByQuorum('coord_quorum_minimum', {}, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /below the declared partialPolicy.minimumActors/.test(err.message),
  );
});

test('closeSessionByQuorum closes to "completed" (never "partial") once every required actor has genuinely completed', () => {
  const tempDir = mkTempDir();
  openSession(
    { coordinationId: 'coord_quorum_complete', objective: 'x', provenanceRoot: { writerId: 'writer-1' }, actors: [{ id: 'a', role: 'researcher' }] },
    { cwd: tempDir },
  );
  const asgnA = createSessionAssignment({ coordinationId: 'coord_quorum_complete', taskKey: 'a-task', actorId: 'a', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });
  linkResult('coord_quorum_complete', { assignmentId: asgnA.assignmentId, runId: writeAttemptResult(tempDir, asgnA.assignmentId, '01') }, { cwd: tempDir });

  const manifest = closeSessionByQuorum('coord_quorum_complete', {}, { cwd: tempDir });
  assert.equal(manifest.status, 'completed');
});

test('closeSessionByQuorum records caller-declared dissentingActorIds on the terminal event, pass-through only (never inferred)', () => {
  const tempDir = mkTempDir();
  openSession(
    { coordinationId: 'coord_quorum_dissent', objective: 'x', provenanceRoot: { writerId: 'writer-1' }, actors: [{ id: 'a', role: 'researcher' }] },
    { cwd: tempDir },
  );
  const asgnA = createSessionAssignment({ coordinationId: 'coord_quorum_dissent', taskKey: 'a-task', actorId: 'a', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });
  linkResult('coord_quorum_dissent', { assignmentId: asgnA.assignmentId, runId: writeAttemptResult(tempDir, asgnA.assignmentId, '01') }, { cwd: tempDir });

  closeSessionByQuorum('coord_quorum_dissent', { dissentingActorIds: ['a'] }, { cwd: tempDir });
  const events = readSessionEvents('coord_quorum_dissent', { cwd: tempDir });
  const completedEvent = events.find((e) => e.type === 'session-completed');
  assert.deepEqual(completedEvent.payload.dissentingActors, ['a']);
});

test('H2 regression: closeSessionByQuorum classifies quorum from a FRESH read taken INSIDE the terminal write\'s lock, never a stale pre-lock snapshot -- real cross-process race, no mocked I/O', async () => {
  const tempDir = mkTempDir();
  openSession(
    { coordinationId: 'coord_h2_race', objective: 'x', provenanceRoot: { writerId: 'writer-1' }, actors: [{ id: 'a', role: 'researcher' }, { id: 'b', role: 'researcher' }] },
    { cwd: tempDir },
  );
  const asgnA = createSessionAssignment({ coordinationId: 'coord_h2_race', taskKey: 'a-task', actorId: 'a', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });
  linkResult('coord_h2_race', { assignmentId: asgnA.assignmentId, runId: writeAttemptResult(tempDir, asgnA.assignmentId, '01') }, { cwd: tempDir });

  const asgnB = createSessionAssignment({ coordinationId: 'coord_h2_race', taskKey: 'b-task', actorId: 'b', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });
  // b's result genuinely exists on disk but is NOT YET LINKED -- "late" at
  // this exact instant, precisely the state a classification read would see
  // if it ran right now.
  const runB = writeAttemptResult(tempDir, asgnB.assignmentId, '01');

  const sessionDir = path.join(tempDir, '.fgos', 'coordination', 'sessions', 'coord_h2_race');
  const eventsPath = path.join(sessionDir, 'events.jsonl');
  const lockPath = path.join(sessionDir, 'events.lock');

  // Simulate a concurrent writer already holding the session's REAL
  // events.lock -- the exact same acquisition protocol acquireEventsLock
  // itself uses (hardlink from a pid-stamped tmp file) -- a genuine lock
  // hold, never a mock/stub of any coordination/store.mjs function.
  const tmpLockSrc = path.join(sessionDir, `.events.lock.tmp-test-${process.pid}`);
  fs.writeFileSync(tmpLockSrc, String(process.pid), 'utf8');
  fs.linkSync(tmpLockSrc, lockPath);
  fs.unlinkSync(tmpLockSrc);

  // A real, separate OS process races to durably link b's already-completed
  // result while closeSessionByQuorum below is blocked retrying for the
  // lock we just took -- it releases the lock ONLY once that write is
  // durable on disk, so whichever classification closeSessionByQuorum ends
  // up using is provably taken from a state at least as fresh as this.
  const racerScript = path.join(tempDir, 'race-link.mjs');
  fs.writeFileSync(
    racerScript,
    `
    import fs from 'node:fs';
    setTimeout(() => {
      const line = JSON.stringify({ type: 'result-linked', payload: { assignmentId: ${JSON.stringify(asgnB.assignmentId)}, runId: ${JSON.stringify(runB)} } }) + '\\n';
      fs.appendFileSync(${JSON.stringify(eventsPath)}, line, 'utf8');
      try { fs.unlinkSync(${JSON.stringify(lockPath)}); } catch (err) { if (err.code !== 'ENOENT') throw err; }
      process.exit(0);
    }, 250);
    `,
  );
  const racer = spawn(process.execPath, [racerScript], { stdio: 'ignore' });
  const racerExit = new Promise((resolve) => racer.on('exit', resolve));

  // No partialPolicy is declared -- if closeSessionByQuorum used the STALE
  // pre-lock snapshot (b still "late"), it would throw "missing required
  // actor(s) [b]" instead of ever reaching a terminal write. The fix must
  // instead see b's fresh completion (read AFTER acquiring the lock the
  // racer just released) and close 'completed'.
  const manifest = closeSessionByQuorum('coord_h2_race', {}, { cwd: tempDir });
  assert.equal(manifest.status, 'completed', 'fresh in-lock classification must see b as genuinely completed, never the stale pre-lock "late" snapshot');

  const events = readSessionEvents('coord_h2_race', { cwd: tempDir });
  const completedEvent = events.find((e) => e.type === 'session-completed');
  assert.ok(completedEvent, 'session-completed event was written');
  assert.equal(completedEvent.payload.missingActors, undefined, 'no actor is falsely, permanently recorded as missing/late');

  await racerExit;
});

// ─── R2: retry ──────────────────────────────────────────────────────────────

test('retrySessionTask dispatches a NEW Run for the SAME Assignment, supersedes the linked view, and never deletes/rewrites the original evidence', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeExecutor(tempDir, { summary: 'first attempt' });
  openStandaloneSession({ coordinationId: 'coord_retry_basic', objective: 'x', writerId: 'writer-1', primaryRole: 'researcher' }, { cwd: tempDir });
  const first = await dispatchPrimaryTask(
    'coord_retry_basic',
    { objective: 'Read package.json.', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );
  const assignmentId = first.assignment.assignmentId;
  const originalResultPath = path.join(tempDir, '.fgos', 'assignments', assignmentId, 'runs', '01', 'result.json');
  const originalResultBefore = fs.readFileSync(originalResultPath, 'utf8');

  const retryRunnerConfig = fakeExecutor(tempDir, { summary: 'retry attempt' });
  const retried = await retrySessionTask('coord_retry_basic', { assignmentId, reason: 'transient failure', maxRetries: 2 }, { cwd: tempDir, repoRoot: tempDir, runnerConfig: retryRunnerConfig });

  assert.equal(retried.retried, true);
  assert.notEqual(retried.runResult.runId, first.runResult.runId);
  assert.ok(fs.existsSync(path.join(tempDir, '.fgos', 'assignments', assignmentId, 'runs', '02', 'result.json')), 'a NEW attempt (02) was dispatched');
  // Original evidence is untouched, byte-for-byte.
  assert.equal(fs.readFileSync(originalResultPath, 'utf8'), originalResultBefore);

  const events = readSessionEvents('coord_retry_basic', { cwd: tempDir });
  assert.equal(events.filter((e) => e.type === 'run-retried').length, 1);
  const linkedEvents = events.filter((e) => e.type === 'result-linked' && e.payload.assignmentId === assignmentId);
  assert.equal(linkedEvents.length, 2, 'BOTH the original and the retry stay in the log -- never rewritten');
  assert.equal(linkedEvents[1].payload.runId, retried.runResult.runId, 'the LATEST link is the retry');

  // replaySession still reconstructs cleanly after a supersession.
  const reconciled = replaySession('coord_retry_basic', { cwd: tempDir });
  assert.deepEqual(reconciled.assignmentRefs, [assignmentId]);
});

test('retrySessionTask enforces the declared maxRetries policy', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeExecutor(tempDir);
  openStandaloneSession({ coordinationId: 'coord_retry_cap', objective: 'x', writerId: 'writer-1', primaryRole: 'researcher' }, { cwd: tempDir });
  const first = await dispatchPrimaryTask(
    'coord_retry_cap',
    { objective: 'x', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );
  const assignmentId = first.assignment.assignmentId;

  await retrySessionTask('coord_retry_cap', { assignmentId, reason: 'retry 1', maxRetries: 1 }, { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) });
  await assert.rejects(
    retrySessionTask('coord_retry_cap', { assignmentId, reason: 'retry 2', maxRetries: 1 }, { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) }),
    (err) => err instanceof CoordinationError && /at or above the declared maxRetries cap/.test(err.message),
  );
});

test('retrySessionTask rejects retrying an assignment that is not a member of the session', async () => {
  const tempDir = mkTempDir();
  openStandaloneSession({ coordinationId: 'coord_retry_foreign', objective: 'x', writerId: 'writer-1', primaryRole: 'researcher' }, { cwd: tempDir });
  await assert.rejects(
    retrySessionTask('coord_retry_foreign', { assignmentId: 'asgn_does_not_exist', reason: 'x' }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /is not a member of session/.test(err.message),
  );
});

test('crash point "run-retried declared, dispatch never started": retrySessionTask resumes the SAME declaration (never double-declares) and dispatches attempt 02', async () => {
  const tempDir = mkTempDir();
  openStandaloneSession({ coordinationId: 'coord_retry_crash_predispatch', objective: 'x', writerId: 'writer-1', primaryRole: 'researcher' }, { cwd: tempDir });
  const asgn = createSessionAssignment(
    { coordinationId: 'coord_retry_crash_predispatch', taskKey: 'primary', actorId: PRIMARY_ACTOR_ID, contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );
  const runId01 = writeAttemptResult(tempDir, asgn.assignmentId, '01');
  linkResult('coord_retry_crash_predispatch', { assignmentId: asgn.assignmentId, runId: runId01 }, { cwd: tempDir });
  // Simulate the crash: the retry was DECLARED (event durably appended) but
  // nothing was ever dispatched -- no attempt-02 dir, no retry-1.claim.
  recordRunRetry('coord_retry_crash_predispatch', { assignmentId: asgn.assignmentId, reason: 'simulated crash before dispatch', previousRunId: runId01, maxRetries: 3 }, { cwd: tempDir });

  const runnerConfig = fakeExecutor(tempDir, { summary: 'resumed retry' });
  const result = await retrySessionTask('coord_retry_crash_predispatch', { assignmentId: asgn.assignmentId, reason: 'ignored -- resumes existing declaration', maxRetries: 3 }, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.equal(result.retried, true);
  assert.ok(fs.existsSync(path.join(tempDir, '.fgos', 'assignments', asgn.assignmentId, 'runs', '02', 'result.json')));
  const events = readSessionEvents('coord_retry_crash_predispatch', { cwd: tempDir });
  assert.equal(events.filter((e) => e.type === 'run-retried').length, 1, 'the pre-crash declaration was resumed, never duplicated');
});

test('crash point "retry attempt settled on disk, never linked": retrySessionTask self-heals by linking it, never re-dispatching a redundant attempt', async () => {
  const tempDir = mkTempDir();
  openStandaloneSession({ coordinationId: 'coord_retry_crash_postdispatch', objective: 'x', writerId: 'writer-1', primaryRole: 'researcher' }, { cwd: tempDir });
  const asgn = createSessionAssignment(
    { coordinationId: 'coord_retry_crash_postdispatch', taskKey: 'primary', actorId: PRIMARY_ACTOR_ID, contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );
  const runId01 = writeAttemptResult(tempDir, asgn.assignmentId, '01');
  linkResult('coord_retry_crash_postdispatch', { assignmentId: asgn.assignmentId, runId: runId01 }, { cwd: tempDir });
  recordRunRetry('coord_retry_crash_postdispatch', { assignmentId: asgn.assignmentId, reason: 'simulated crash after dispatch', previousRunId: runId01, maxRetries: 3 }, { cwd: tempDir });
  // The retry's own executeAssignment "already ran" (attempt 02 settled on
  // disk) but the process crashed before linkResult ever ran.
  const runId02 = writeAttemptResult(tempDir, asgn.assignmentId, '02', { status: 'done', confidence: 'reported' });

  const result = await retrySessionTask('coord_retry_crash_postdispatch', { assignmentId: asgn.assignmentId, reason: 'ignored -- self-heals' }, { cwd: tempDir });

  assert.equal(result.resumed, true);
  assert.equal(result.retried, false, 'no new dispatch happened -- this call only linked the already-settled attempt');
  assert.equal(result.runResult.runId, runId02);
  assert.ok(!fs.existsSync(path.join(tempDir, '.fgos', 'assignments', asgn.assignmentId, 'runs', '03')), 'never dispatched a redundant third attempt');
});

test('crash point "retry claim in progress, no settled attempt": retrySessionTask fails closed with named repair guidance instead of guessing past the ambiguity', async () => {
  const tempDir = mkTempDir();
  openStandaloneSession({ coordinationId: 'coord_retry_crash_ambiguous', objective: 'x', writerId: 'writer-1', primaryRole: 'researcher' }, { cwd: tempDir });
  const asgn = createSessionAssignment(
    { coordinationId: 'coord_retry_crash_ambiguous', taskKey: 'primary', actorId: PRIMARY_ACTOR_ID, contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );
  const runId01 = writeAttemptResult(tempDir, asgn.assignmentId, '01');
  linkResult('coord_retry_crash_ambiguous', { assignmentId: asgn.assignmentId, runId: runId01 }, { cwd: tempDir });
  recordRunRetry('coord_retry_crash_ambiguous', { assignmentId: asgn.assignmentId, reason: 'simulated mid-dispatch crash', previousRunId: runId01, maxRetries: 3 }, { cwd: tempDir });
  // Simulate: the retry's claim was written (dispatch genuinely started) but
  // the subprocess never settled attempt 02 before the crash.
  fs.closeSync(fs.openSync(path.join(tempDir, '.fgos', 'assignments', asgn.assignmentId, 'retry-1.claim'), 'w'));

  await assert.rejects(
    retrySessionTask('coord_retry_crash_ambiguous', { assignmentId: asgn.assignmentId, reason: 'ignored' }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /repair guidance|already has a claim in progress/.test(err.message),
  );
});

test('replay.mjs rejects a hand-crafted second result-linked event with no intervening run-retried authorization -- evidence-laundering/duplicate-ref negative test', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_replay_duplicate_link', objective: 'x', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  const asgn = createSessionAssignment({ coordinationId: 'coord_replay_duplicate_link', taskKey: 'a', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });
  const sessionDir = path.join(tempDir, '.fgos', 'coordination', 'sessions', 'coord_replay_duplicate_link');
  const eventsPath = path.join(sessionDir, 'events.jsonl');
  appendEvent(eventsPath, { type: 'result-linked', payload: { assignmentId: asgn.assignmentId, runId: `run_${asgn.assignmentId}_01` } }, sessionDir);
  writeAttemptResult(tempDir, asgn.assignmentId, '02');
  // A SECOND result-linked with no run-retried event between the two --
  // never authorized, must be rejected at replay time regardless of how it
  // got onto disk.
  appendEvent(eventsPath, { type: 'result-linked', payload: { assignmentId: asgn.assignmentId, runId: `run_${asgn.assignmentId}_02` } }, sessionDir);

  assert.throws(
    () => replaySession('coord_replay_duplicate_link', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'duplicate-ref' && /no intervening "run-retried" authorization/.test(err.message),
  );
});

test('store.mjs linkResult({allowSupersede: true}) refuses to supersede without a prior run-retried authorization', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_link_supersede_unauthorized', objective: 'x', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  const asgn = createSessionAssignment({ coordinationId: 'coord_link_supersede_unauthorized', taskKey: 'a', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });
  linkResult('coord_link_supersede_unauthorized', { assignmentId: asgn.assignmentId, runId: `run_${asgn.assignmentId}_01` }, { cwd: tempDir });

  assert.throws(
    () => linkResult('coord_link_supersede_unauthorized', { assignmentId: asgn.assignmentId, runId: `run_${asgn.assignmentId}_02` }, { cwd: tempDir, allowSupersede: true }),
    (err) => err instanceof CoordinationError && /no "run-retried" event authorizes/.test(err.message),
  );
});

test('concurrent retry race: two concurrent retrySessionTask calls for the SAME assignment (real Promise.all, one process) dispatch exactly ONE new attempt -- the loser gets a clear rejection, never a silent duplicate', async () => {
  const tempDir = mkTempDir();
  openStandaloneSession({ coordinationId: 'coord_retry_race', objective: 'x', writerId: 'writer-1', primaryRole: 'researcher' }, { cwd: tempDir });
  const asgn = createSessionAssignment(
    { coordinationId: 'coord_retry_race', taskKey: 'primary', actorId: PRIMARY_ACTOR_ID, contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );
  const runId01 = writeAttemptResult(tempDir, asgn.assignmentId, '01');
  linkResult('coord_retry_race', { assignmentId: asgn.assignmentId, runId: runId01 }, { cwd: tempDir });

  const runnerConfig = fakeExecutor(tempDir, { summary: 'race attempt' });
  const settled = await Promise.allSettled([
    retrySessionTask('coord_retry_race', { assignmentId: asgn.assignmentId, reason: 'racer A', maxRetries: 1 }, { cwd: tempDir, repoRoot: tempDir, runnerConfig }),
    retrySessionTask('coord_retry_race', { assignmentId: asgn.assignmentId, reason: 'racer B', maxRetries: 1 }, { cwd: tempDir, repoRoot: tempDir, runnerConfig }),
  ]);

  const fulfilled = settled.filter((s) => s.status === 'fulfilled');
  const rejected = settled.filter((s) => s.status === 'rejected');
  assert.equal(fulfilled.length, 1, 'exactly one racer actually retried');
  assert.equal(rejected.length, 1, 'the other racer was rejected, never silently duplicated');
  assert.ok(rejected[0].reason instanceof CoordinationError);

  const attemptDirs = fs.readdirSync(assignmentRunsDir(tempDir, asgn.assignmentId)).filter((d) => /^\d+$/.test(d));
  assert.deepEqual(attemptDirs.sort(), ['01', '02'], 'exactly one new attempt was dispatched, never two');
});

// ─── R2: actor replacement ──────────────────────────────────────────────────

test('replaceSessionActor binds the replacement under the SAME role, records old/new actor + reason + allocationProvenance, and never rewrites the original actor-bound event', () => {
  const tempDir = mkTempDir();
  openSession(
    { coordinationId: 'coord_replace_basic', objective: 'x', provenanceRoot: { writerId: 'writer-1' }, actors: [{ id: 'specialist', role: 'reviewer', persona: 'careful-reviewer' }] },
    { cwd: tempDir },
  );

  const manifest = replaceSessionActor(
    'coord_replace_basic',
    { oldActorId: 'specialist', newActorId: 'specialist-2', reason: 'original provider exhausted', allocationProvenance: { executorId: 'backup-executor', tier: 'standard' } },
    { cwd: tempDir },
  );

  const newActor = manifest.actors.find((a) => a.id === 'specialist-2');
  assert.ok(newActor, 'replacement actor is bound');
  assert.equal(newActor.role, 'reviewer', 'role is inherited unchanged from the replaced actor');

  const events = readSessionEvents('coord_replace_basic', { cwd: tempDir });
  assert.equal(events.filter((e) => e.type === 'actor-bound' && e.payload.actorId === 'specialist').length, 1, 'original actor-bound event untouched');
  const replacedEvent = events.find((e) => e.type === 'actor-replaced');
  assert.equal(replacedEvent.payload.oldActorId, 'specialist');
  assert.equal(replacedEvent.payload.replacementActorId, 'specialist-2');
  assert.deepEqual(replacedEvent.payload.allocationProvenance, { executorId: 'backup-executor', tier: 'standard' });
});

test('replaceSessionActor rejects replacing an actor that has already been replaced (no double-replacement of one slot)', () => {
  const tempDir = mkTempDir();
  openSession(
    { coordinationId: 'coord_replace_twice', objective: 'x', provenanceRoot: { writerId: 'writer-1' }, actors: [{ id: 'specialist', role: 'reviewer' }] },
    { cwd: tempDir },
  );
  replaceSessionActor('coord_replace_twice', { oldActorId: 'specialist', newActorId: 'specialist-2', reason: 'first replacement' }, { cwd: tempDir });

  assert.throws(
    () => replaceSessionActor('coord_replace_twice', { oldActorId: 'specialist', newActorId: 'specialist-3', reason: 'second replacement' }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /has already been replaced/.test(err.message),
  );
});

test('replaceSessionActor refuses once the session has left active status -- stops new materialization', () => {
  const tempDir = mkTempDir();
  openSession(
    { coordinationId: 'coord_replace_after_cancel', objective: 'x', provenanceRoot: { writerId: 'writer-1' }, actors: [{ id: 'specialist', role: 'reviewer' }] },
    { cwd: tempDir },
  );
  cancelSession('coord_replace_after_cancel', { reason: 'operator abort' }, { cwd: tempDir });

  assert.throws(
    () => replaceSessionActor('coord_replace_after_cancel', { oldActorId: 'specialist', newActorId: 'specialist-2', reason: 'x' }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /is not active/.test(err.message),
  );
});

test('crash point "actor bound, replacement not yet recorded": replaceSessionActor self-heals -- resumes without a duplicate actor-bound event', () => {
  const tempDir = mkTempDir();
  openSession(
    { coordinationId: 'coord_replace_crash', objective: 'x', provenanceRoot: { writerId: 'writer-1' }, actors: [{ id: 'specialist', role: 'reviewer' }] },
    { cwd: tempDir },
  );
  // Simulate the crash: the replacement claim was written and bindActor
  // already succeeded, but the process died before recordActorReplacement
  // ever ran -- the SAME two-step fixture shape retrySessionTask's own
  // claim-based crash-point tests use (write the claim file, then the step
  // it guards) rather than a literal process kill.
  fs.closeSync(fs.openSync(path.join(tempDir, '.fgos', 'coordination', 'sessions', 'coord_replace_crash', 'actor-replace-specialist--specialist-2.claim'), 'w'));
  bindActor('coord_replace_crash', { id: 'specialist-2', role: 'reviewer' }, { cwd: tempDir });

  const manifest = replaceSessionActor('coord_replace_crash', { oldActorId: 'specialist', newActorId: 'specialist-2', reason: 'resumed after crash' }, { cwd: tempDir });

  assert.equal(manifest.actors.filter((a) => a.id === 'specialist-2').length, 1);
  const events = readSessionEvents('coord_replace_crash', { cwd: tempDir });
  assert.equal(events.filter((e) => e.type === 'actor-bound' && e.payload.actorId === 'specialist-2').length, 1, 'never double-bound');
  assert.equal(events.filter((e) => e.type === 'actor-replaced').length, 1);
});

test('H1 regression: replaceSessionActor throws when newActorId collides with an unrelated, independently-required actor that has already completed its OWN real work -- never silently double-counts one result to cover two required slots', () => {
  const tempDir = mkTempDir();
  openSession(
    {
      coordinationId: 'coord_replace_collision',
      objective: 'x',
      provenanceRoot: { writerId: 'writer-1' },
      actors: [{ id: 'a', role: 'researcher' }, { id: 'x', role: 'researcher' }],
    },
    { cwd: tempDir },
  );
  // 'x' is its OWN independently-required actor (declared at openSession
  // time, unrelated to 'a') and has ALREADY genuinely completed its own
  // real work -- exactly the scenario the bug describes.
  const asgnX = createSessionAssignment({ coordinationId: 'coord_replace_collision', taskKey: 'x-task', actorId: 'x', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });
  const runX = writeAttemptResult(tempDir, asgnX.assignmentId, '01');
  linkResult('coord_replace_collision', { assignmentId: asgnX.assignmentId, runId: runX }, { cwd: tempDir });

  assert.throws(
    () => replaceSessionActor('coord_replace_collision', { oldActorId: 'a', newActorId: 'x', reason: 'attempted (mistaken) replacement' }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /already bound to session .* with its own independent activity on record/.test(err.message),
  );

  const events = readSessionEvents('coord_replace_collision', { cwd: tempDir });
  assert.equal(events.filter((e) => e.type === 'actor-replaced').length, 0, 'no actor-replaced event was written for a rejected collision');

  // Quorum still correctly requires BOTH 'a' and 'x' independently -- x's
  // already-completed work was never silently absorbed to also cover a's
  // slot, and a's own slot is never resolved via x's unrelated chain.
  const quorum = evaluateSessionQuorum('coord_replace_collision', { cwd: tempDir });
  assert.deepEqual(quorum.completed.map((e) => e.actorId), ['x']);
  assert.deepEqual(quorum.missing.map((e) => e.actorId), ['a']);
  assert.deepEqual(quorum.replaced, []);
});

test('H1 residual-gap regression: replaceSessionActor throws when newActorId is an UNDISPATCHED, independently-required actor (no assignment-created, no prior actor-replaced) -- the round-1 fix\'s own gap, closed by the claim-file mechanism', () => {
  const tempDir = mkTempDir();
  // Both 'a' and 'c' are session-declared required actors, bound via
  // actor-bound at openSession time -- NEITHER has been dispatched (no
  // assignment-created for either). This is the exact reproduction Red-Team
  // used to show the round-1 "definite collision" check never fires here:
  // an undispatched required actor is the DEFAULT state, not a rare corner
  // case, and carries no on-disk signal the round-1 check looked for.
  openSession(
    {
      coordinationId: 'coord_replace_undispatched_collision',
      objective: 'x',
      provenanceRoot: { writerId: 'writer-1' },
      actors: [{ id: 'a', role: 'researcher' }, { id: 'c', role: 'researcher' }],
    },
    { cwd: tempDir },
  );

  assert.throws(
    () => replaceSessionActor('coord_replace_undispatched_collision', { oldActorId: 'a', newActorId: 'c', reason: 'attempted (mistaken) replacement' }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /no prior replacement claim recorded/.test(err.message),
    'must throw, not silently succeed -- c was never dispatched and has no claim file for this exact pair',
  );

  const events = readSessionEvents('coord_replace_undispatched_collision', { cwd: tempDir });
  assert.equal(events.filter((e) => e.type === 'actor-replaced').length, 0, 'no actor-replaced event was written for a rejected collision');

  // c must remain its OWN independently-evaluable required slot -- never
  // silently absorbed into a's replaced slot. c later completes its own
  // real, independent work; quorum must still show BOTH a (missing) and c
  // (completed) as separate slots.
  const asgnC = createSessionAssignment({ coordinationId: 'coord_replace_undispatched_collision', taskKey: 'c-task', actorId: 'c', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });
  const runC = writeAttemptResult(tempDir, asgnC.assignmentId, '01');
  linkResult('coord_replace_undispatched_collision', { assignmentId: asgnC.assignmentId, runId: runC }, { cwd: tempDir });

  const quorum = evaluateSessionQuorum('coord_replace_undispatched_collision', { cwd: tempDir });
  assert.deepEqual(quorum.completed.map((e) => e.actorId), ['c']);
  assert.deepEqual(quorum.missing.map((e) => e.actorId), ['a']);
  assert.deepEqual(quorum.replaced, []);

  // A session cannot falsely, permanently close 'completed' while a's real
  // required slot was never verified -- closeSessionByQuorum still refuses.
  assert.throws(
    () => closeSessionByQuorum('coord_replace_undispatched_collision', {}, { cwd: tempDir }),
    (err) => err instanceof CoordinationError,
  );
});

// ─── R4: cancellation and terminal states ──────────────────────────────────

test('cancelSession stops new materialization, records an accurate in-flight snapshot, and never deletes or mutates persisted evidence', () => {
  const tempDir = mkTempDir();
  openSession(
    { coordinationId: 'coord_cancel_basic', objective: 'x', provenanceRoot: { writerId: 'writer-1' }, actors: [{ id: 'a', role: 'researcher' }, { id: 'b', role: 'researcher' }] },
    { cwd: tempDir },
  );
  // a: settled (not in-flight at cancellation)
  const asgnA = createSessionAssignment({ coordinationId: 'coord_cancel_basic', taskKey: 'a-task', actorId: 'a', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });
  const runA = writeAttemptResult(tempDir, asgnA.assignmentId, '01');
  linkResult('coord_cancel_basic', { assignmentId: asgnA.assignmentId, runId: runA }, { cwd: tempDir });
  // b: genuinely in-flight (created, not yet settled/linked)
  const asgnB = createSessionAssignment({ coordinationId: 'coord_cancel_basic', taskKey: 'b-task', actorId: 'b', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });

  const assignmentJsonPathA = path.join(tempDir, '.fgos', 'assignments', asgnA.assignmentId, 'assignment.json');
  const resultJsonPathA = path.join(tempDir, '.fgos', 'assignments', asgnA.assignmentId, 'runs', '01', 'result.json');
  const assignmentJsonBefore = fs.readFileSync(assignmentJsonPathA, 'utf8');
  const resultJsonBefore = fs.readFileSync(resultJsonPathA, 'utf8');

  const manifest = cancelSession('coord_cancel_basic', { reason: 'operator abort' }, { cwd: tempDir });
  assert.equal(manifest.status, 'cancelled');

  const events = readSessionEvents('coord_cancel_basic', { cwd: tempDir });
  const cancelledEvent = events.find((e) => e.type === 'session-cancelled');
  assert.equal(cancelledEvent.payload.reason, 'operator abort');
  assert.deepEqual(cancelledEvent.payload.inFlightAssignmentIds, [asgnB.assignmentId]);

  // Stops new materialization.
  assert.throws(
    () => createSessionAssignment({ coordinationId: 'coord_cancel_basic', taskKey: 'c-task', actorId: 'a', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /cannot create an Assignment/.test(err.message),
  );

  // A genuinely in-flight run that finishes AFTER cancellation can still be
  // linked (never silently loses the outcome).
  const runB = writeAttemptResult(tempDir, asgnB.assignmentId, '01');
  assert.doesNotThrow(() => linkResult('coord_cancel_basic', { assignmentId: asgnB.assignmentId, runId: runB }, { cwd: tempDir }));

  // Evidence for the settled run is byte-for-byte unchanged.
  assert.equal(fs.readFileSync(assignmentJsonPathA, 'utf8'), assignmentJsonBefore);
  assert.equal(fs.readFileSync(resultJsonPathA, 'utf8'), resultJsonBefore);
});

test('terminal statuses are absorbing: bounded transitions active -> {completed, partial, failed, cancelled}, never any transition out of a terminal status', () => {
  const cases = [
    { status: 'completed', extra: {} },
    { status: 'partial', extra: { missingActors: ['a'] } },
    { status: 'failed', extra: { reason: 'unrecoverable' } },
    { status: 'cancelled', extra: { reason: 'operator abort' } },
  ];
  for (const { status, extra } of cases) {
    const tempDir = mkTempDir();
    const coordinationId = `coord_bounded_${status}`;
    openSession({ coordinationId, objective: 'x', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });

    const manifest = transitionSessionStatus(coordinationId, status, extra, { cwd: tempDir });
    assert.equal(manifest.status, status);

    for (const { status: target, extra: targetExtra } of cases) {
      assert.throws(
        () => transitionSessionStatus(coordinationId, target, targetExtra, { cwd: tempDir }),
        (err) => err instanceof CoordinationError && /is not active/.test(err.message),
        `expected transitioning "${status}" -> "${target}" to be refused`,
      );
    }
  }
});

test('deriveSessionPhase reports planned -> running -> the terminal status, matching the phase file\'s own vocabulary', async () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_phase', objective: 'x', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  assert.equal(deriveSessionPhase('coord_phase', { cwd: tempDir }), 'planned');

  const asgn = createSessionAssignment({ coordinationId: 'coord_phase', taskKey: 'a', contract: inlineContract(), caller: { writerId: 'writer-1' } }, { cwd: tempDir });
  assert.equal(deriveSessionPhase('coord_phase', { cwd: tempDir }), 'running');

  linkResult('coord_phase', { assignmentId: asgn.assignmentId, runId: writeAttemptResult(tempDir, asgn.assignmentId, '01') }, { cwd: tempDir });
  transitionSessionStatus('coord_phase', 'completed', {}, { cwd: tempDir });
  assert.equal(deriveSessionPhase('coord_phase', { cwd: tempDir }), 'completed');

  const tempDir2 = mkTempDir();
  openSession({ coordinationId: 'coord_phase_partial', objective: 'x', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir2 });
  transitionSessionStatus('coord_phase_partial', 'partial', { missingActors: ['a'] }, { cwd: tempDir2 });
  assert.equal(deriveSessionPhase('coord_phase_partial', { cwd: tempDir2 }), 'partially-complete');
});
