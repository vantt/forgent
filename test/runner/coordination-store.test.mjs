import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import {
  openSession,
  bindActor,
  createSessionAssignment,
  linkResult,
  transitionSessionStatus,
  readManifest,
  readSessionEvents,
  hashTaskKey,
  appendEvent,
} from '../../src/runner/coordination/store.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coordination-store-test-'));
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

// ─── R1/R2: open + atomic membership ───────────────────────────────────────

test('openSession persists session.json and a session-opened event before any Assignment exists', () => {
  const tempDir = mkTempDir();
  const manifest = openSession(
    { coordinationId: 'coord_open_001', objective: 'Probe a bounded consult.', provenanceRoot: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );

  assert.equal(manifest.coordinationId, 'coord_open_001');
  assert.equal(manifest.status, 'active');
  assert.deepEqual(manifest.assignmentRefs, []);
  assert.equal(manifest.missionId, undefined);

  const manifestPath = path.join(tempDir, '.fgos', 'coordination', 'sessions', 'coord_open_001', 'session.json');
  const eventsPath = path.join(tempDir, '.fgos', 'coordination', 'sessions', 'coord_open_001', 'events.jsonl');
  assert.ok(fs.existsSync(manifestPath));
  assert.ok(fs.existsSync(eventsPath));

  const events = readSessionEvents('coord_open_001', { cwd: tempDir });
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'session-opened');
});

test('openSession with declared actors writes actor-bound events and manifest.actors before the first Assignment', () => {
  const tempDir = mkTempDir();
  openSession(
    {
      coordinationId: 'coord_open_actors',
      objective: 'Bounded consult with declared actors.',
      provenanceRoot: { writerId: 'writer-1' },
      actors: [
        { id: 'primary', role: 'researcher' },
        { id: 'specialist', role: 'reviewer' },
      ],
    },
    { cwd: tempDir },
  );

  const manifest = readManifest('coord_open_actors', { cwd: tempDir });
  assert.equal(manifest.actors.length, 2);

  const events = readSessionEvents('coord_open_actors', { cwd: tempDir });
  assert.equal(events.filter((e) => e.type === 'actor-bound').length, 2);
});

test('openSession rejects a duplicate explicit coordinationId', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_dup', objective: 'first', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  assert.throws(
    () => openSession({ coordinationId: 'coord_dup', objective: 'second', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /already exists/.test(err.message),
  );
});

test('createSessionAssignment builds the Assignment via buildAssignment()/claimAssignmentId() (canonical .fgos/assignments/ record, no parallel path)', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_asgn_001', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });

  const assignment = createSessionAssignment(
    { coordinationId: 'coord_asgn_001', taskKey: 'primary-round-1', actorId: 'primary', contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );

  assert.equal(assignment.provenance.kind, 'inline');
  assert.equal(assignment.mutation, 'read-only');
  assert.equal(assignment.workId, null);
  // Assignment stays session-blind (ADR-008 Decision 2) -- no field naming
  // the session/coordination it belongs to.
  assert.equal(assignment.coordinationId, undefined);
  assert.equal(assignment.sessionId, undefined);

  const canonicalPath = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'assignment.json');
  assert.ok(fs.existsSync(canonicalPath));

  const manifest = readManifest('coord_asgn_001', { cwd: tempDir });
  assert.deepEqual(manifest.assignmentRefs, [assignment.assignmentId]);

  const events = readSessionEvents('coord_asgn_001', { cwd: tempDir });
  const created = events.find((e) => e.type === 'assignment-created');
  assert.equal(created.payload.assignmentId, assignment.assignmentId);
  assert.equal(created.payload.actorId, 'primary');
});

test('createSessionAssignment is idempotent for the same taskKey within one process (no duplicate Assignment on repeat call)', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_asgn_idem', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });

  const params = { coordinationId: 'coord_asgn_idem', taskKey: 'primary-round-1', contract: inlineContract(), caller: { writerId: 'writer-1' } };
  const first = createSessionAssignment(params, { cwd: tempDir });
  const second = createSessionAssignment(params, { cwd: tempDir });

  assert.equal(first.assignmentId, second.assignmentId);
  const manifest = readManifest('coord_asgn_idem', { cwd: tempDir });
  assert.deepEqual(manifest.assignmentRefs, [first.assignmentId]);
});

test('createSessionAssignment refuses to create an Assignment once the session has left active status', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_asgn_closed', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  transitionSessionStatus('coord_asgn_closed', 'completed', {}, { cwd: tempDir });

  assert.throws(
    () =>
      createSessionAssignment(
        { coordinationId: 'coord_asgn_closed', taskKey: 'late-task', contract: inlineContract(), caller: { writerId: 'writer-1' } },
        { cwd: tempDir },
      ),
    (err) => err instanceof CoordinationError && /is not active/.test(err.message),
  );
});

test('linkResult appends result-linked only for an assignment that is a real session member', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_link_001', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  const assignment = createSessionAssignment(
    { coordinationId: 'coord_link_001', taskKey: 'primary-round-1', contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );

  linkResult('coord_link_001', { assignmentId: assignment.assignmentId, runId: `${assignment.assignmentId}_run_01` }, { cwd: tempDir });
  const events = readSessionEvents('coord_link_001', { cwd: tempDir });
  assert.ok(events.some((e) => e.type === 'result-linked' && e.payload.assignmentId === assignment.assignmentId));

  assert.throws(
    () => linkResult('coord_link_001', { assignmentId: 'asgn_never_created_001', runId: 'run_x' }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /not a member/.test(err.message),
  );
});

test('bindActor appends actor-bound and updates manifest.actors atomically, refusing a duplicate actor id', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_bind_001', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  bindActor('coord_bind_001', { id: 'specialist', role: 'reviewer' }, { cwd: tempDir });

  const manifest = readManifest('coord_bind_001', { cwd: tempDir });
  assert.equal(manifest.actors.length, 1);
  assert.equal(manifest.actors[0].id, 'specialist');

  assert.throws(
    () => bindActor('coord_bind_001', { id: 'specialist', role: 'researcher' }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /already has an actor bound/.test(err.message),
  );
});

// ─── Terminal transitions ───────────────────────────────────────────────────

test('transitionSessionStatus(completed) appends session-completed and sets status/completedAt atomically', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_term_completed', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  const manifest = transitionSessionStatus('coord_term_completed', 'completed', {}, { cwd: tempDir });
  assert.equal(manifest.status, 'completed');
  assert.ok(manifest.completedAt);
  assert.throws(() => transitionSessionStatus('coord_term_completed', 'completed', {}, { cwd: tempDir }));
});

test('transitionSessionStatus(partial) requires a non-empty named missingActors list', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_term_partial', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  assert.throws(
    () => transitionSessionStatus('coord_term_partial', 'partial', {}, { cwd: tempDir }),
    (err) => err instanceof CoordinationError,
  );
  const manifest = transitionSessionStatus('coord_term_partial', 'partial', { missingActors: ['specialist'] }, { cwd: tempDir });
  assert.equal(manifest.status, 'partial');
});

test('transitionSessionStatus(failed) requires a reason', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_term_failed', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  const manifest = transitionSessionStatus('coord_term_failed', 'failed', { reason: 'aggregate bounds exhausted' }, { cwd: tempDir });
  assert.equal(manifest.status, 'failed');
});

// ─── R2: real concurrent-process/thread races ───────────────────────────────

test('two concurrent creators racing the SAME logical task under one session produce exactly one Assignment ref (real OS-thread race, not simulated sequentially)', async () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_race_same', objective: 'Race same task.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });

  const storeUrl = new URL('../../src/runner/coordination/store.mjs', import.meta.url).href;
  const workerSource = `
import { parentPort, workerData } from 'node:worker_threads';
import { createSessionAssignment } from ${JSON.stringify(storeUrl)};

const { cwd, coordinationId, taskKey } = workerData;
try {
  const assignment = createSessionAssignment(
    {
      coordinationId,
      taskKey,
      contract: {
        objective: 'Gather background facts.',
        contextRefs: [],
        constraints: [],
        expectedOutputs: ['agent-result.json (status, summary)'],
        mutation: 'read-only',
        evidence: { required: 'reported' },
        role: 'researcher',
        budget: { timeoutMs: 60000, maxRuns: 1 },
      },
      caller: { writerId: 'writer-1' },
    },
    { cwd },
  );
  parentPort.postMessage({ ok: true, assignmentId: assignment.assignmentId });
} catch (err) {
  parentPort.postMessage({ ok: false, error: err.message });
}
`;
  const workerFile = path.join(tempDir, 'race-same-task-worker.mjs');
  fs.writeFileSync(workerFile, workerSource);

  function spawnWorker() {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerFile, { workerData: { cwd: tempDir, coordinationId: 'coord_race_same', taskKey: 'shared-round-1' } });
      worker.once('message', (msg) => worker.terminate().then(() => resolve(msg), reject));
      worker.once('error', reject);
    });
  }

  const [a, b] = await Promise.all([spawnWorker(), spawnWorker()]);
  assert.ok(a.ok, `worker A failed: ${a.error}`);
  assert.ok(b.ok, `worker B failed: ${b.error}`);
  assert.equal(a.assignmentId, b.assignmentId, 'two concurrent creators for the SAME logical task must resolve to one Assignment');

  const manifest = readManifest('coord_race_same', { cwd: tempDir });
  assert.deepEqual(manifest.assignmentRefs, [a.assignmentId]);
  const replayed = replaySession('coord_race_same', { cwd: tempDir });
  assert.deepEqual(replayed.assignmentRefs, [a.assignmentId]);
});

test('two concurrent creators racing DIFFERENT logical tasks under one session never lose an assignmentRefs append (both land)', async () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_race_diff', objective: 'Race different tasks.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });

  const storeUrl = new URL('../../src/runner/coordination/store.mjs', import.meta.url).href;
  const workerSource = `
import { parentPort, workerData } from 'node:worker_threads';
import { createSessionAssignment } from ${JSON.stringify(storeUrl)};

const { cwd, coordinationId, taskKey, role } = workerData;
try {
  const assignment = createSessionAssignment(
    {
      coordinationId,
      taskKey,
      contract: {
        objective: 'Gather background facts.',
        contextRefs: [],
        constraints: [],
        expectedOutputs: ['agent-result.json (status, summary)'],
        mutation: 'read-only',
        evidence: { required: 'reported' },
        role,
        budget: { timeoutMs: 60000, maxRuns: 1 },
      },
      caller: { writerId: 'writer-1' },
    },
    { cwd },
  );
  parentPort.postMessage({ ok: true, assignmentId: assignment.assignmentId });
} catch (err) {
  parentPort.postMessage({ ok: false, error: err.message });
}
`;
  const workerFile = path.join(tempDir, 'race-diff-task-worker.mjs');
  fs.writeFileSync(workerFile, workerSource);

  function spawnWorker(taskKey, role) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerFile, { workerData: { cwd: tempDir, coordinationId: 'coord_race_diff', taskKey, role } });
      worker.once('message', (msg) => worker.terminate().then(() => resolve(msg), reject));
      worker.once('error', reject);
    });
  }

  const [a, b] = await Promise.all([spawnWorker('round-a', 'researcher'), spawnWorker('round-b', 'reviewer')]);
  assert.ok(a.ok, `worker A failed: ${a.error}`);
  assert.ok(b.ok, `worker B failed: ${b.error}`);
  assert.notEqual(a.assignmentId, b.assignmentId);

  const manifest = readManifest('coord_race_diff', { cwd: tempDir });
  assert.equal(manifest.assignmentRefs.length, 2);
  assert.ok(manifest.assignmentRefs.includes(a.assignmentId));
  assert.ok(manifest.assignmentRefs.includes(b.assignmentId));
});

// ─── R3: crash-point on-disk state, constructed directly ───────────────────

test('crash point "after Assignment claim, before ref": an orphan Assignment on disk with no session event/ref is simply absent from replay (harmless, no fabrication)', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_crash_before_ref', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });

  // Simulate: claimAssignmentId already reserved+wrote assignment.json, but
  // the process crashed before the event+ref append ever ran.
  const orphanId = 'asgn_writer_1_op_001';
  const orphanDir = path.join(tempDir, '.fgos', 'assignments', orphanId);
  fs.mkdirSync(orphanDir, { recursive: true });
  fs.writeFileSync(
    path.join(orphanDir, 'assignment.json'),
    `${JSON.stringify({ assignmentId: orphanId, workId: null, role: 'researcher', mutation: 'read-only' }, null, 2)}\n`,
  );

  const replayed = replaySession('coord_crash_before_ref', { cwd: tempDir });
  assert.deepEqual(replayed.assignmentRefs, []);
});

test('crash point "before Assignment": replaying a freshly opened session with no Assignments yet succeeds with empty membership', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_crash_none', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  const replayed = replaySession('coord_crash_none', { cwd: tempDir });
  assert.deepEqual(replayed.assignmentRefs, []);
  assert.equal(replayed.manifest.status, 'active');
});

test('crash point "restart after completion": replaying a completed session twice is idempotent (pure read, same result)', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_crash_restart', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  const assignment = createSessionAssignment(
    { coordinationId: 'coord_crash_restart', taskKey: 'primary-round-1', contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );
  transitionSessionStatus('coord_crash_restart', 'completed', {}, { cwd: tempDir });

  const first = replaySession('coord_crash_restart', { cwd: tempDir });
  const second = replaySession('coord_crash_restart', { cwd: tempDir });
  assert.deepEqual(first.assignmentRefs, second.assignmentRefs);
  assert.deepEqual(first.assignmentRefs, [assignment.assignmentId]);
  assert.equal(first.manifest.status, 'completed');
  assert.equal(second.manifest.status, 'completed');
});

// ─── HIGH fix regression: taskKey claim record written FIRST, before
// assignment.json/event/ref -- Required Negative Test #3 ("does not
// duplicate the Assignment on retry") ─────────────────────────────────────
//
// Claim-file names are a hash of the RAW taskKey (`hashTaskKey`, imported
// directly from store.mjs so this test never re-derives a second, possibly
// diverging naming scheme) -- these tests hand-construct on-disk state at
// exactly that path.

test('crash between claim-record write and assignment.json write: retry with the same taskKey throws CoordinationError("corrupt-log"), never a second Assignment', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_crash_claim_only', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });

  const taskKey = 'primary-round-1';
  const orphanId = 'asgn_writer_1_op_001';
  const sessionDir = path.join(tempDir, '.fgos', 'coordination', 'sessions', 'coord_crash_claim_only');
  const tasksDir = path.join(sessionDir, 'tasks');
  fs.mkdirSync(tasksDir, { recursive: true });
  // Exactly what createSessionAssignment's new step 2 writes -- the claim
  // record -- with NO assignment.json ever written for the claimed id (the
  // crash landed between reserving the id/claim record and writing
  // assignment.json's content).
  fs.writeFileSync(
    path.join(tasksDir, `${hashTaskKey(taskKey)}.json`),
    `${JSON.stringify({ taskKey, assignmentId: orphanId, claimedAt: new Date().toISOString() }, null, 2)}\n`,
  );

  assert.throws(
    () =>
      createSessionAssignment(
        { coordinationId: 'coord_crash_claim_only', taskKey, contract: inlineContract(), caller: { writerId: 'writer-1' } },
        { cwd: tempDir },
      ),
    (err) => err instanceof CoordinationError && err.category === 'corrupt-log',
  );

  // No second Assignment was created for this taskKey as a side effect of the retry.
  const assignmentsDir = path.join(tempDir, '.fgos', 'assignments');
  assert.ok(!fs.existsSync(assignmentsDir) || fs.readdirSync(assignmentsDir).length === 0);
});

test('crash after claim-record + assignment.json written, before event/ref: retry with the same taskKey self-heals -- registers the orphaned Assignment as a real session member, and a further retry does not duplicate it', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_crash_claim_asgn', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });

  const taskKey = 'primary-round-1';
  const orphanId = 'asgn_writer_1_op_001';
  const sessionDir = path.join(tempDir, '.fgos', 'coordination', 'sessions', 'coord_crash_claim_asgn');
  const tasksDir = path.join(sessionDir, 'tasks');
  fs.mkdirSync(tasksDir, { recursive: true });
  fs.writeFileSync(
    path.join(tasksDir, `${hashTaskKey(taskKey)}.json`),
    `${JSON.stringify({ taskKey, assignmentId: orphanId, claimedAt: new Date().toISOString() }, null, 2)}\n`,
  );

  // Exactly what createSessionAssignment's new step 3 writes -- the
  // Assignment's own record -- with NO assignment-created event and NO
  // assignmentRefs entry (the crash landed between assignment.json and the
  // event/ref append, the classic "interrupted assignment-created write"
  // shape).
  const assignmentsDir = path.join(tempDir, '.fgos', 'assignments');
  const orphanDir = path.join(assignmentsDir, orphanId);
  fs.mkdirSync(orphanDir, { recursive: true });
  fs.writeFileSync(
    path.join(orphanDir, 'assignment.json'),
    `${JSON.stringify({ assignmentId: orphanId, workId: null, role: 'researcher', mutation: 'read-only' }, null, 2)}\n`,
  );

  const retried = createSessionAssignment(
    { coordinationId: 'coord_crash_claim_asgn', taskKey, contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );

  assert.equal(retried.assignmentId, orphanId);
  // Exactly one Assignment directory exists for this taskKey -- the retry
  // did not mint a second one.
  assert.deepEqual(fs.readdirSync(assignmentsDir), [orphanId]);

  // The retry must have self-healed the interrupted write: the Assignment is
  // now a REAL session member (this is exactly the assertion the Red-Team
  // found missing from the prior Fixer round -- `assignmentId` equality
  // alone does not prove session membership).
  const manifestAfterHeal = readManifest('coord_crash_claim_asgn', { cwd: tempDir });
  assert.ok(manifestAfterHeal.assignmentRefs.includes(orphanId), 'self-heal must add the orphaned assignmentId to manifest.assignmentRefs');
  const eventsAfterHeal = readSessionEvents('coord_crash_claim_asgn', { cwd: tempDir });
  assert.ok(
    eventsAfterHeal.some((e) => e.type === 'assignment-created' && e.payload.assignmentId === orphanId),
    'self-heal must append an assignment-created event for the orphaned assignmentId',
  );

  // A THIRD call for the same taskKey is now the TRUE idempotent-retry case
  // (the self-heal already completed): it must return the same Assignment
  // without appending a second event or duplicating the ref.
  const thirdCall = createSessionAssignment(
    { coordinationId: 'coord_crash_claim_asgn', taskKey, contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );
  assert.equal(thirdCall.assignmentId, orphanId);
  const manifestAfterThird = readManifest('coord_crash_claim_asgn', { cwd: tempDir });
  assert.deepEqual(manifestAfterThird.assignmentRefs, [orphanId], 'a further retry must not duplicate the assignmentRefs entry');
  const eventsAfterThird = readSessionEvents('coord_crash_claim_asgn', { cwd: tempDir });
  assert.equal(
    eventsAfterThird.filter((e) => e.type === 'assignment-created' && e.payload.assignmentId === orphanId).length,
    1,
    'a further retry must not append a second assignment-created event',
  );
});

test('crash INSIDE the self-heal step itself (assignment-created event already appended, assignmentRefs still missing the id): retry completes the ref without appending a duplicate event', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_crash_inner_heal', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });

  const taskKey = 'primary-round-1';
  const orphanId = 'asgn_writer_1_op_001';
  const sessionDir = path.join(tempDir, '.fgos', 'coordination', 'sessions', 'coord_crash_inner_heal');
  const eventsPath = path.join(sessionDir, 'events.jsonl');
  const tasksDir = path.join(sessionDir, 'tasks');
  fs.mkdirSync(tasksDir, { recursive: true });
  fs.writeFileSync(
    path.join(tasksDir, `${hashTaskKey(taskKey)}.json`),
    `${JSON.stringify({ taskKey, assignmentId: orphanId, claimedAt: new Date().toISOString() }, null, 2)}\n`,
  );

  const assignmentsDir = path.join(tempDir, '.fgos', 'assignments');
  const orphanDir = path.join(assignmentsDir, orphanId);
  fs.mkdirSync(orphanDir, { recursive: true });
  fs.writeFileSync(
    path.join(orphanDir, 'assignment.json'),
    `${JSON.stringify({ assignmentId: orphanId, workId: null, role: 'researcher', mutation: 'read-only' }, null, 2)}\n`,
  );

  // Simulate a crash landing between the self-heal's own event append and
  // its manifest write: the assignment-created event IS already in the
  // log, but assignmentRefs was never updated.
  appendEvent(eventsPath, { type: 'assignment-created', payload: { assignmentId: orphanId } }, sessionDir);

  const retried = createSessionAssignment(
    { coordinationId: 'coord_crash_inner_heal', taskKey, contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );

  assert.equal(retried.assignmentId, orphanId);
  const manifest = readManifest('coord_crash_inner_heal', { cwd: tempDir });
  assert.ok(manifest.assignmentRefs.includes(orphanId), 'the retry must complete the still-missing assignmentRefs write');
  const events = readSessionEvents('coord_crash_inner_heal', { cwd: tempDir });
  assert.equal(
    events.filter((e) => e.type === 'assignment-created' && e.payload.assignmentId === orphanId).length,
    1,
    'the retry must not append a second assignment-created event for the same id (would trip replay.mjs\'s duplicate-ref check)',
  );
});

// ─── MEDIUM fix regression: claim-file naming is collision-resistant
// against the RAW taskKey, not a lossy-sanitized form ──────────────────────

test('createSessionAssignment treats textually-distinct taskKeys as distinct even when they would have collided under lossy sanitization ("primary-round-1" vs "primary_round_1")', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_taskkey_distinct', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });

  const a = createSessionAssignment(
    {
      coordinationId: 'coord_taskkey_distinct',
      taskKey: 'primary-round-1',
      contract: inlineContract({ objective: 'Task A.' }),
      caller: { writerId: 'writer-1' },
    },
    { cwd: tempDir },
  );
  const b = createSessionAssignment(
    {
      coordinationId: 'coord_taskkey_distinct',
      taskKey: 'primary_round_1',
      contract: inlineContract({ objective: 'Task B.' }),
      caller: { writerId: 'writer-1' },
    },
    { cwd: tempDir },
  );

  assert.notEqual(a.assignmentId, b.assignmentId, 'two distinct raw taskKeys must never collide onto the same Assignment');

  const manifest = readManifest('coord_taskkey_distinct', { cwd: tempDir });
  assert.equal(manifest.assignmentRefs.length, 2);
  assert.ok(manifest.assignmentRefs.includes(a.assignmentId));
  assert.ok(manifest.assignmentRefs.includes(b.assignmentId));
});

// ─── MEDIUM fix regression: every mutating store door refuses a manifest
// whose persisted schemaVersion no longer matches the running SCHEMA_VERSION
// ─────────────────────────────────────────────────────────────────────────

function corruptSchemaVersion(tempDir, coordinationId) {
  const manifestPath = path.join(tempDir, '.fgos', 'coordination', 'sessions', coordinationId, 'session.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.schemaVersion = '999-does-not-exist';
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

test('createSessionAssignment refuses to mutate a session whose manifest schemaVersion does not match the running contract', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_schema_asgn', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  corruptSchemaVersion(tempDir, 'coord_schema_asgn');

  assert.throws(
    () =>
      createSessionAssignment(
        { coordinationId: 'coord_schema_asgn', taskKey: 'primary-round-1', contract: inlineContract(), caller: { writerId: 'writer-1' } },
        { cwd: tempDir },
      ),
    (err) => err instanceof CoordinationError && err.category === 'schema-version-mismatch',
  );
});

test('bindActor refuses to mutate a session whose manifest schemaVersion does not match the running contract', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_schema_bind', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  corruptSchemaVersion(tempDir, 'coord_schema_bind');

  assert.throws(
    () => bindActor('coord_schema_bind', { id: 'specialist', role: 'reviewer' }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'schema-version-mismatch',
  );
});

test('linkResult refuses to mutate a session whose manifest schemaVersion does not match the running contract', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_schema_link', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  corruptSchemaVersion(tempDir, 'coord_schema_link');

  assert.throws(
    () => linkResult('coord_schema_link', { assignmentId: 'asgn_never_created_001', runId: 'run_x' }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'schema-version-mismatch',
  );
});

test('transitionSessionStatus refuses to mutate a session whose manifest schemaVersion does not match the running contract', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_schema_term', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  corruptSchemaVersion(tempDir, 'coord_schema_term');

  assert.throws(
    () => transitionSessionStatus('coord_schema_term', 'completed', {}, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'schema-version-mismatch',
  );
});
