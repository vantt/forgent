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
  authorizeOperation,
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

test('createSessionAssignment with opts.maxRoundsForActor rejects a genuinely new taskKey/round once the actor\'s round count is already at the cap -- checked inside the SAME locked critical section as the write, on a fresh readEvents(), not a caller\'s own earlier unlocked check', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_round_cap', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' }, actors: [{ id: 'consultant', role: 'reviewer' }] }, { cwd: tempDir });

  // Round 1: no cap supplied yet -- simulates the actor already having used
  // its one allowed round (e.g. via an earlier, uncapped call, or written
  // directly to the event log before this call, as the TOCTOU scenario
  // requires).
  const first = createSessionAssignment(
    { coordinationId: 'coord_round_cap', taskKey: 'round-1', actorId: 'consultant', contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );

  // Round 2: a genuinely NEW taskKey for the SAME actor, with the cap now
  // enforced -- must be rejected BEFORE any new Assignment/event is written,
  // proving the check-and-write are atomic within one critical section.
  assert.throws(
    () =>
      createSessionAssignment(
        { coordinationId: 'coord_round_cap', taskKey: 'round-2', actorId: 'consultant', contract: inlineContract(), caller: { writerId: 'writer-1' } },
        { cwd: tempDir, maxRoundsForActor: 1 },
      ),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /already used 1 round\(s\), at or above the declared cap of 1/.test(err.message),
  );

  const manifest = readManifest('coord_round_cap', { cwd: tempDir });
  assert.deepEqual(manifest.assignmentRefs, [first.assignmentId], 'a rejected new round must not append a second assignmentRef');
  const events = readSessionEvents('coord_round_cap', { cwd: tempDir });
  assert.equal(events.filter((e) => e.type === 'assignment-created').length, 1, 'a rejected new round must not append a second assignment-created event');
  const assignmentsDir = path.join(tempDir, '.fgos', 'assignments');
  assert.deepEqual(fs.readdirSync(assignmentsDir), [first.assignmentId], 'a rejected new round must never even reserve a new assignmentId');
});

test('createSessionAssignment with opts.maxRoundsForActor never double-counts a legitimate RESUME of the SAME taskKey -- the existing taskClaimPath check runs first and takes priority over the new round-cap check', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_round_cap_resume', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' }, actors: [{ id: 'consultant', role: 'reviewer' }] }, { cwd: tempDir });

  const params = { coordinationId: 'coord_round_cap_resume', taskKey: 'round-1', actorId: 'consultant', contract: inlineContract(), caller: { writerId: 'writer-1' } };
  const opts = { cwd: tempDir, maxRoundsForActor: 1 };

  const first = createSessionAssignment(params, opts);
  // Resuming the SAME taskKey a second time, with the cap already "used" by
  // this very round, must still succeed as an idempotent no-op -- not be
  // wrongly rejected as "cap exceeded".
  const resumed = createSessionAssignment(params, opts);

  assert.equal(resumed.assignmentId, first.assignmentId);
  const manifest = readManifest('coord_round_cap_resume', { cwd: tempDir });
  assert.deepEqual(manifest.assignmentRefs, [first.assignmentId]);
});

test('createSessionAssignment without opts.maxRoundsForActor (the default) still allows creating multiple distinct-taskKey Assignments for the same actor -- the round-cap invariant is opt-in, not a blanket restriction', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_round_cap_default', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' }, actors: [{ id: 'consultant', role: 'reviewer' }] }, { cwd: tempDir });

  const first = createSessionAssignment(
    { coordinationId: 'coord_round_cap_default', taskKey: 'round-1', actorId: 'consultant', contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );
  const second = createSessionAssignment(
    { coordinationId: 'coord_round_cap_default', taskKey: 'round-2', actorId: 'consultant', contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );

  const manifest = readManifest('coord_round_cap_default', { cwd: tempDir });
  assert.deepEqual(manifest.assignmentRefs.sort(), [first.assignmentId, second.assignmentId].sort());
});

test('createSessionAssignment throws when opts.maxRoundsForActor is set but no actorId is supplied -- the round-cap check requires an actor identity to count against, and must fail loud rather than silently skip the invariant', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_round_cap_no_actor', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });

  assert.throws(
    () =>
      createSessionAssignment(
        { coordinationId: 'coord_round_cap_no_actor', taskKey: 'round-1', contract: inlineContract(), caller: { writerId: 'writer-1' } },
        { cwd: tempDir, maxRoundsForActor: 1 },
      ),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /requires a non-empty actorId/.test(err.message),
  );
});

// ─── Phase 03 R5: session-wide aggregateBounds enforcement (opt-in, mirrors
// opts.maxRoundsForActor's own shape and lock placement exactly) ──────────

test('createSessionAssignment with opts.maxAssignmentsForSession rejects a genuinely new taskKey once the session\'s total assignment count is already at the cap, checked inside the SAME locked critical section as the write', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_max_asgn_session', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });

  const first = createSessionAssignment(
    { coordinationId: 'coord_max_asgn_session', taskKey: 'task-1', contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );

  assert.throws(
    () =>
      createSessionAssignment(
        { coordinationId: 'coord_max_asgn_session', taskKey: 'task-2', contract: inlineContract(), caller: { writerId: 'writer-1' } },
        { cwd: tempDir, maxAssignmentsForSession: 1 },
      ),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /already created 1 Assignment\(s\), at or above the declared aggregateBounds\.maxAssignments cap of 1/.test(err.message),
  );

  const manifest = readManifest('coord_max_asgn_session', { cwd: tempDir });
  assert.deepEqual(manifest.assignmentRefs, [first.assignmentId], 'a rejected new Assignment must not append a second assignmentRef');
});

test('createSessionAssignment with opts.maxAssignmentsForSession never double-counts a legitimate RESUME of the SAME taskKey -- the existing taskClaimPath check runs first and takes priority', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_max_asgn_resume', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });

  const params = { coordinationId: 'coord_max_asgn_resume', taskKey: 'task-1', contract: inlineContract(), caller: { writerId: 'writer-1' } };
  const opts = { cwd: tempDir, maxAssignmentsForSession: 1 };

  const first = createSessionAssignment(params, opts);
  const resumed = createSessionAssignment(params, opts);

  assert.equal(resumed.assignmentId, first.assignmentId);
  const manifest = readManifest('coord_max_asgn_resume', { cwd: tempDir });
  assert.deepEqual(manifest.assignmentRefs, [first.assignmentId]);
});

test('createSessionAssignment with opts.maxRoundsForSession rejects a genuinely new taskKey once the session\'s total round count is already at the cap, independently of opts.maxAssignmentsForSession', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_max_rounds_session', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });

  const first = createSessionAssignment(
    { coordinationId: 'coord_max_rounds_session', taskKey: 'task-1', contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );

  assert.throws(
    () =>
      createSessionAssignment(
        { coordinationId: 'coord_max_rounds_session', taskKey: 'task-2', contract: inlineContract(), caller: { writerId: 'writer-1' } },
        // maxAssignmentsForSession deliberately absent/high (not set at all
        // here) -- a rejection can only come from maxRoundsForSession.
        { cwd: tempDir, maxRoundsForSession: 1 },
      ),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /already used 1 round\(s\) session-wide, at or above the declared aggregateBounds\.maxRounds cap of 1/.test(err.message),
  );

  const manifest = readManifest('coord_max_rounds_session', { cwd: tempDir });
  assert.deepEqual(manifest.assignmentRefs, [first.assignmentId]);
});

test('createSessionAssignment with opts.maxConcurrencyForSession rejects a genuinely new taskKey while an existing session Assignment is still in flight (created but not yet result-linked), and allows it again once that Assignment is linked', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_max_concurrency_session', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });

  const first = createSessionAssignment(
    { coordinationId: 'coord_max_concurrency_session', taskKey: 'task-1', contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );

  // `first` has no linked result yet -- 1 Assignment in flight, at the cap.
  assert.throws(
    () =>
      createSessionAssignment(
        { coordinationId: 'coord_max_concurrency_session', taskKey: 'task-2', contract: inlineContract(), caller: { writerId: 'writer-1' } },
        { cwd: tempDir, maxConcurrencyForSession: 1 },
      ),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /already has 1 Assignment\(s\) in flight .* at or above the declared aggregateBounds\.maxConcurrency cap of 1/.test(err.message),
  );

  // Once `first` settles (result-linked), in-flight count drops back to 0
  // -- the SAME cap now legally admits a new Assignment.
  linkResult('coord_max_concurrency_session', { assignmentId: first.assignmentId, runId: `run_${first.assignmentId}_01` }, { cwd: tempDir });
  const second = createSessionAssignment(
    { coordinationId: 'coord_max_concurrency_session', taskKey: 'task-2', contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir, maxConcurrencyForSession: 1 },
  );

  const manifest = readManifest('coord_max_concurrency_session', { cwd: tempDir });
  assert.deepEqual(manifest.assignmentRefs.sort(), [first.assignmentId, second.assignmentId].sort());
});

test('linkResult appends result-linked only for an assignment that is a real session member', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_link_001', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  const assignment = createSessionAssignment(
    { coordinationId: 'coord_link_001', taskKey: 'primary-round-1', contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );

  linkResult('coord_link_001', { assignmentId: assignment.assignmentId, runId: `run_${assignment.assignmentId}_01` }, { cwd: tempDir });
  const events = readSessionEvents('coord_link_001', { cwd: tempDir });
  assert.ok(events.some((e) => e.type === 'result-linked' && e.payload.assignmentId === assignment.assignmentId));

  assert.throws(
    () => linkResult('coord_link_001', { assignmentId: 'asgn_never_created_001', runId: 'run_x' }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /not a member/.test(err.message),
  );
});

test('linkResult is idempotent for the SAME runId re-linked twice (a no-op, matching createSessionAssignment\'s own "retry returns existing" philosophy), but rejects a SECOND, DIFFERENT runId for an assignment that already has one linked -- defense in depth against session-engine.mjs\'s own duplicate-dispatch race', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_link_dup', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  const assignment = createSessionAssignment(
    { coordinationId: 'coord_link_dup', taskKey: 'primary-round-1', contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );
  const runIdA = `run_${assignment.assignmentId}_01`;
  const runIdB = `run_${assignment.assignmentId}_02`;

  linkResult('coord_link_dup', { assignmentId: assignment.assignmentId, runId: runIdA }, { cwd: tempDir });

  // Re-linking the SAME runId a second time is a harmless idempotent retry.
  linkResult('coord_link_dup', { assignmentId: assignment.assignmentId, runId: runIdA }, { cwd: tempDir });
  const eventsAfterSameRelink = readSessionEvents('coord_link_dup', { cwd: tempDir });
  assert.equal(eventsAfterSameRelink.filter((e) => e.type === 'result-linked').length, 1, 'a same-runId re-link must not append a second event');

  // Linking a genuinely DIFFERENT runId for an already-linked assignment is
  // a real conflict -- two distinct real runs both claiming to be "the"
  // result -- and must be rejected, not silently accepted as a second event.
  assert.throws(
    () => linkResult('coord_link_dup', { assignmentId: assignment.assignmentId, runId: runIdB }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'duplicate-ref' && /already has a result linked/.test(err.message),
  );
  const eventsAfterConflict = readSessionEvents('coord_link_dup', { cwd: tempDir });
  assert.equal(eventsAfterConflict.filter((e) => e.type === 'result-linked').length, 1, 'a different-runId conflict must not append a second event either');
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

test('bindActor with opts.primaryActorId rejects binding a second, different non-primary actor under the SAME locked critical section as the write -- closing the cross-process TOCTOU an earlier unlocked read-then-decide check cannot close by itself', () => {
  const tempDir = mkTempDir();
  openSession(
    { coordinationId: 'coord_bind_single_specialist', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' }, actors: [{ id: 'primary', role: 'researcher' }] },
    { cwd: tempDir },
  );

  // First specialist bind succeeds (no conflicting non-primary actor yet).
  bindActor('coord_bind_single_specialist', { id: 'specialist-A', role: 'reviewer' }, { cwd: tempDir, primaryActorId: 'primary' });

  // A second, DIFFERENT specialist id must be rejected -- this is the exact
  // write-site check that the earlier, unlocked `validateConsultProposal`
  // read in session-engine.mjs cannot enforce atomically by itself.
  assert.throws(
    () => bindActor('coord_bind_single_specialist', { id: 'specialist-B', role: 'reviewer' }, { cwd: tempDir, primaryActorId: 'primary' }),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /already has a non-primary actor bound/.test(err.message),
  );

  const manifest = readManifest('coord_bind_single_specialist', { cwd: tempDir });
  const nonPrimaryIds = manifest.actors.filter((a) => a.id !== 'primary').map((a) => a.id);
  assert.deepEqual(nonPrimaryIds, ['specialist-A']);
});

test('bindActor without opts.primaryActorId (the default) still allows binding multiple distinct actor ids -- the single-non-primary invariant is opt-in, not a blanket restriction', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_bind_multi_no_opt', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });

  bindActor('coord_bind_multi_no_opt', { id: 'actor-1', role: 'reviewer' }, { cwd: tempDir });
  bindActor('coord_bind_multi_no_opt', { id: 'actor-2', role: 'reviewer' }, { cwd: tempDir });

  const manifest = readManifest('coord_bind_multi_no_opt', { cwd: tempDir });
  assert.deepEqual(manifest.actors.map((a) => a.id).sort(), ['actor-1', 'actor-2']);
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

// ─── Driver-authorization provenance is verified on EVERY writing path,
// including the self-heal branch ───────────────────────────────────────────
//
// These need no concurrency: the crash state the real race produces (claim
// record + assignment.json written, no assignment-created event, no ref) is
// constructed directly, exactly as the crash-point tests above do, and the
// competing consumption is then performed sequentially.

function authorizedProvenance(authorizationId) {
  return {
    operationId: 'reviewer-recheck',
    nodeId: 'phase-recheck',
    authorizationId,
    invocationKey: `recheck:${authorizationId}`,
    contextGrant: { refs: [] },
  };
}

function issueAuthorization(coordinationId, authorizationId, tempDir) {
  authorizeOperation(
    coordinationId,
    {
      authorizationId,
      operationId: 'reviewer-recheck',
      nodeId: 'phase-recheck',
      targetActorId: 'reviewer',
      invocationKey: `recheck:${authorizationId}`,
      authorizedBy: { type: 'driver', id: 'driver-1' },
      reason: 'Recheck the revised candidate.',
      grantedContextRefs: [],
    },
    { cwd: tempDir },
  );
}

// Writes the "crashed between assignment.json and the event/ref append"
// state for `taskKey` by hand, and returns the orphaned assignmentId.
function writeUnregisteredClaim(tempDir, coordinationId, taskKey, orphanId) {
  const sessionDir = path.join(tempDir, '.fgos', 'coordination', 'sessions', coordinationId);
  const tasksDir = path.join(sessionDir, 'tasks');
  fs.mkdirSync(tasksDir, { recursive: true });
  fs.writeFileSync(
    path.join(tasksDir, `${hashTaskKey(taskKey)}.json`),
    `${JSON.stringify({ taskKey, assignmentId: orphanId, claimedAt: new Date().toISOString() }, null, 2)}\n`,
  );
  const orphanDir = path.join(tempDir, '.fgos', 'assignments', orphanId);
  fs.mkdirSync(orphanDir, { recursive: true });
  fs.writeFileSync(
    path.join(orphanDir, 'assignment.json'),
    `${JSON.stringify({ assignmentId: orphanId, workId: null, role: 'reviewer', mutation: 'read-only' }, null, 2)}\n`,
  );
  return orphanId;
}

test('the self-heal path refuses an authorization a DIFFERENT taskKey already consumed -- one authorization still materializes at most one Assignment', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_heal_double_spend', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  issueAuthorization('coord_heal_double_spend', 'auth_recheck_1', tempDir);

  // A genuinely new taskKey spends the authorization first.
  const winner = createSessionAssignment(
    {
      coordinationId: 'coord_heal_double_spend',
      taskKey: 'recheck-new',
      actorId: 'reviewer',
      contract: inlineContract(),
      caller: { writerId: 'writer-1' },
      authorizationProvenance: authorizedProvenance('auth_recheck_1'),
    },
    { cwd: tempDir },
  );

  // A SECOND taskKey crashed earlier, mid-registration, holding its own
  // claimed-but-unregistered Assignment. Resuming it must not spend the
  // authorization the winner above already spent.
  const orphanId = writeUnregisteredClaim(tempDir, 'coord_heal_double_spend', 'recheck-crashed', 'asgn_writer_1_op_900');

  assert.throws(
    () =>
      createSessionAssignment(
        {
          coordinationId: 'coord_heal_double_spend',
          taskKey: 'recheck-crashed',
          actorId: 'reviewer',
          contract: inlineContract(),
          caller: { writerId: 'writer-1' },
          authorizationProvenance: authorizedProvenance('auth_recheck_1'),
        },
        { cwd: tempDir },
      ),
    (err) =>
      err instanceof CoordinationError &&
      err.category === 'validation' &&
      /already consumed by Assignment "asgn_writer_1_op_001"/.test(err.message),
  );

  // Exactly ONE consumer reached the log, and the refused resume registered
  // nothing -- so the session stays replayable rather than being bricked by
  // a duplicate consumption.
  const events = readSessionEvents('coord_heal_double_spend', { cwd: tempDir });
  const consumers = events.filter((e) => e.type === 'assignment-created' && e.payload.authorizationId === 'auth_recheck_1');
  assert.equal(consumers.length, 1, 'exactly one assignment-created may consume one authorizationId');
  assert.equal(consumers[0].payload.assignmentId, winner.assignmentId);

  const manifest = readManifest('coord_heal_double_spend', { cwd: tempDir });
  assert.deepEqual(manifest.assignmentRefs, [winner.assignmentId]);
  assert.ok(!manifest.assignmentRefs.includes(orphanId), 'the refused resume must not register its orphaned Assignment');
  assert.doesNotThrow(() => replaySession('coord_heal_double_spend', { cwd: tempDir }));
});

test('the self-heal path still completes a genuine resume of its OWN authorization, whether or not the consuming event already landed', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_heal_own_auth', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  issueAuthorization('coord_heal_own_auth', 'auth_a', tempDir);
  issueAuthorization('coord_heal_own_auth', 'auth_b', tempDir);

  // (a) Crash BEFORE the consuming event: the authorization is unconsumed,
  // so the resume spends it and completes the registration.
  const orphanA = writeUnregisteredClaim(tempDir, 'coord_heal_own_auth', 'recheck-a', 'asgn_writer_1_op_800');
  const healedA = createSessionAssignment(
    {
      coordinationId: 'coord_heal_own_auth',
      taskKey: 'recheck-a',
      actorId: 'reviewer',
      contract: inlineContract(),
      caller: { writerId: 'writer-1' },
      authorizationProvenance: authorizedProvenance('auth_a'),
    },
    { cwd: tempDir },
  );
  assert.equal(healedA.assignmentId, orphanA);
  assert.ok(readManifest('coord_heal_own_auth', { cwd: tempDir }).assignmentRefs.includes(orphanA));

  // (b) Crash INSIDE the self-heal, AFTER its own consuming event landed:
  // the sole consumer is this very claim's Assignment, so the resume is
  // exempt and only the still-missing assignmentRefs write is completed.
  const orphanB = writeUnregisteredClaim(tempDir, 'coord_heal_own_auth', 'recheck-b', 'asgn_writer_1_op_801');
  const sessionDir = path.join(tempDir, '.fgos', 'coordination', 'sessions', 'coord_heal_own_auth');
  appendEvent(
    path.join(sessionDir, 'events.jsonl'),
    { type: 'assignment-created', payload: { assignmentId: orphanB, actorId: 'reviewer', ...authorizedProvenance('auth_b') } },
    sessionDir,
  );

  const healedB = createSessionAssignment(
    {
      coordinationId: 'coord_heal_own_auth',
      taskKey: 'recheck-b',
      actorId: 'reviewer',
      contract: inlineContract(),
      caller: { writerId: 'writer-1' },
      authorizationProvenance: authorizedProvenance('auth_b'),
    },
    { cwd: tempDir },
  );
  assert.equal(healedB.assignmentId, orphanB);
  assert.ok(readManifest('coord_heal_own_auth', { cwd: tempDir }).assignmentRefs.includes(orphanB));
  const events = readSessionEvents('coord_heal_own_auth', { cwd: tempDir });
  assert.equal(
    events.filter((e) => e.type === 'assignment-created' && e.payload.assignmentId === orphanB).length,
    1,
    'the exempt resume must not append a second consuming event',
  );
  assert.doesNotThrow(() => replaySession('coord_heal_own_auth', { cwd: tempDir }));
});

test('createSessionAssignment refuses provenance naming an authorizationId no operation-authorized event ever issued, at WRITE time', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_fabricated_auth', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  issueAuthorization('coord_fabricated_auth', 'auth_real', tempDir);

  for (const [taskKey, params] of [
    ['recheck-fabricated', { coordinationId: 'coord_fabricated_auth', taskKey: 'recheck-fabricated' }],
    ['recheck-crashed', { coordinationId: 'coord_fabricated_auth', taskKey: 'recheck-crashed' }],
  ]) {
    // The second iteration drives the SELF-HEAL branch, so the existence
    // check is proven on both writing paths, not just the new-taskKey one.
    if (taskKey === 'recheck-crashed') writeUnregisteredClaim(tempDir, 'coord_fabricated_auth', taskKey, 'asgn_writer_1_op_700');

    assert.throws(
      () =>
        createSessionAssignment(
          {
            ...params,
            actorId: 'reviewer',
            contract: inlineContract(),
            caller: { writerId: 'writer-1' },
            authorizationProvenance: authorizedProvenance('auth_never_issued'),
          },
          { cwd: tempDir },
        ),
      (err) =>
        err instanceof CoordinationError &&
        err.category === 'validation' &&
        /names no "operation-authorized" event/.test(err.message),
      `expected the fabricated authorizationId to be refused on the "${taskKey}" path`,
    );
  }

  // Nothing was written, so the session is still readable -- the whole point
  // of refusing at write time instead of leaving replay to throw dangling-ref.
  const events = readSessionEvents('coord_fabricated_auth', { cwd: tempDir });
  assert.equal(events.filter((e) => e.type === 'assignment-created').length, 0);
  assert.doesNotThrow(() => replaySession('coord_fabricated_auth', { cwd: tempDir }));
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
