import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openSession, createSessionAssignment, linkResult, recordHumanTurn } from '../../src/runner/coordination/store.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { CoordinationError, SCHEMA_VERSION } from '../../src/runner/coordination/schema.mjs';
import { EventLogError } from '../../src/state/events.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coordination-replay-test-'));
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

function sessionPaths(tempDir, coordinationId) {
  const sessionDir = path.join(tempDir, '.fgos', 'coordination', 'sessions', coordinationId);
  return { sessionDir, manifestPath: path.join(sessionDir, 'session.json'), eventsPath: path.join(sessionDir, 'events.jsonl') };
}

function openAndCreate(tempDir, coordinationId, taskKey = 'primary-round-1') {
  openSession({ coordinationId, objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  return createSessionAssignment(
    { coordinationId, taskKey, contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  );
}

test('replaySession reconstructs a clean session: assignmentRefs matches assignment-created events exactly', () => {
  const tempDir = mkTempDir();
  const assignment = openAndCreate(tempDir, 'coord_replay_clean');
  const replayed = replaySession('coord_replay_clean', { cwd: tempDir });
  assert.deepEqual(replayed.assignmentRefs, [assignment.assignmentId]);
  assert.equal(replayed.manifest.coordinationId, 'coord_replay_clean');
});

test('replaySession detects a dangling ref: assignmentRefs entry with no corresponding assignment-created event', () => {
  const tempDir = mkTempDir();
  openAndCreate(tempDir, 'coord_replay_dangling_ref');
  const { manifestPath } = sessionPaths(tempDir, 'coord_replay_dangling_ref');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.assignmentRefs.push('asgn_never_eventlogged_001');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  assert.throws(
    () => replaySession('coord_replay_dangling_ref', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'dangling-ref' && /has no corresponding "assignment-created" event/.test(err.message),
  );
});

test('replaySession detects a dangling ref the other direction: assignment-created event with no assignmentRefs entry ("interrupted write")', () => {
  const tempDir = mkTempDir();
  const assignment = openAndCreate(tempDir, 'coord_replay_dangling_event');
  const { manifestPath } = sessionPaths(tempDir, 'coord_replay_dangling_event');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.assignmentRefs = manifest.assignmentRefs.filter((id) => id !== assignment.assignmentId);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  assert.throws(
    () => replaySession('coord_replay_dangling_event', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'dangling-ref' && /has no corresponding assignmentRefs entry \(interrupted write/.test(err.message),
  );
});

test('replaySession detects a duplicate assignment-created event for the same id', () => {
  const tempDir = mkTempDir();
  const assignment = openAndCreate(tempDir, 'coord_replay_duplicate');
  const { eventsPath } = sessionPaths(tempDir, 'coord_replay_duplicate');
  const lines = fs.readFileSync(eventsPath, 'utf8').trimEnd().split('\n');
  const createdLine = lines.find((l) => JSON.parse(l).type === 'assignment-created');
  const createdEvent = JSON.parse(createdLine);
  const duplicated = { ...createdEvent, seq: createdEvent.seq + 100 };
  fs.appendFileSync(eventsPath, `${JSON.stringify(duplicated)}\n`);

  assert.throws(
    () => replaySession('coord_replay_duplicate', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'duplicate-ref' && new RegExp(assignment.assignmentId).test(err.message),
  );
});

test('replaySession detects a duplicate result-linked event for the same assignmentId, symmetric with its adjacent duplicate assignment-created check', () => {
  const tempDir = mkTempDir();
  const assignment = openAndCreate(tempDir, 'coord_replay_duplicate_link');
  linkResult('coord_replay_duplicate_link', { assignmentId: assignment.assignmentId, runId: `run_${assignment.assignmentId}_01` }, { cwd: tempDir });
  const { eventsPath } = sessionPaths(tempDir, 'coord_replay_duplicate_link');
  const lines = fs.readFileSync(eventsPath, 'utf8').trimEnd().split('\n');
  const linkedLine = lines.find((l) => JSON.parse(l).type === 'result-linked');
  const linkedEvent = JSON.parse(linkedLine);
  // Hand-append a SECOND result-linked event directly to the raw log --
  // bypassing store.mjs's own linkResult() write-time guard entirely -- so
  // this test proves replaySession's own READ-time consistency check
  // independently, the same way this file's other duplicate-ref test does
  // for assignment-created.
  const duplicated = { ...linkedEvent, seq: linkedEvent.seq + 100, payload: { ...linkedEvent.payload, runId: `run_${assignment.assignmentId}_02` } };
  fs.appendFileSync(eventsPath, `${JSON.stringify(duplicated)}\n`);

  assert.throws(
    () => replaySession('coord_replay_duplicate_link', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'duplicate-ref' && new RegExp(assignment.assignmentId).test(err.message),
  );
});

test('replaySession detects a foreign ref: assignmentRefs entry whose Assignment does not exist under .fgos/assignments/', () => {
  const tempDir = mkTempDir();
  const assignment = openAndCreate(tempDir, 'coord_replay_foreign');
  const assignmentDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId);
  fs.rmSync(assignmentDir, { recursive: true, force: true });

  assert.throws(
    () => replaySession('coord_replay_foreign', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'foreign-ref',
  );
});

test('replaySession detects an Assignment record carrying a forbidden session/coordination field (Assignment must stay session-blind)', () => {
  const tempDir = mkTempDir();
  const assignment = openAndCreate(tempDir, 'coord_replay_tampered_assignment');
  const assignmentJsonPath = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'assignment.json');
  const tampered = { ...JSON.parse(fs.readFileSync(assignmentJsonPath, 'utf8')), coordinationId: 'coord_replay_tampered_assignment' };
  fs.writeFileSync(assignmentJsonPath, `${JSON.stringify(tampered, null, 2)}\n`);

  assert.throws(
    () => replaySession('coord_replay_tampered_assignment', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /session-blind/.test(err.message),
  );
});

test('replaySession detects an out-of-order ref: result-linked for an assignment that was never assignment-created', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_replay_out_of_order', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  const { eventsPath } = sessionPaths(tempDir, 'coord_replay_out_of_order');
  fs.appendFileSync(
    eventsPath,
    `${JSON.stringify({ seq: 99, ts: new Date().toISOString(), type: 'result-linked', payload: { assignmentId: 'asgn_never_created_001', runId: 'run_x' }, v: '1' })}\n`,
  );

  assert.throws(
    () => replaySession('coord_replay_out_of_order', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'out-of-order-ref',
  );
});

test('replaySession does not throw for a legitimate result-linked event following its own assignment-created', () => {
  const tempDir = mkTempDir();
  const assignment = openAndCreate(tempDir, 'coord_replay_linked_ok');
  linkResult('coord_replay_linked_ok', { assignmentId: assignment.assignmentId, runId: `run_${assignment.assignmentId}_01` }, { cwd: tempDir });
  assert.doesNotThrow(() => replaySession('coord_replay_linked_ok', { cwd: tempDir }));
});

test('replaySession fails clearly on a schemaVersion mismatch instead of reinterpreting the manifest', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_replay_schema_mismatch', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  const { manifestPath } = sessionPaths(tempDir, 'coord_replay_schema_mismatch');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.schemaVersion = '999';
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  assert.throws(
    () => replaySession('coord_replay_schema_mismatch', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'schema-version-mismatch' && err.message.includes(SCHEMA_VERSION),
  );
});

test('replaySession bubbles state/events.mjs\'s own corrupt-log detection unchanged for a truncated/corrupt event line', () => {
  const tempDir = mkTempDir();
  openAndCreate(tempDir, 'coord_replay_corrupt');
  const { eventsPath } = sessionPaths(tempDir, 'coord_replay_corrupt');
  fs.appendFileSync(eventsPath, '{not valid json\n');

  assert.throws(
    () => replaySession('coord_replay_corrupt', { cwd: tempDir }),
    (err) => err instanceof EventLogError && err.category === 'corrupt-log',
  );
});

// ─── Phase 03.1: human-turn-recorded replay-time re-validation ─────────────
//
// `recordHumanTurn` (store.mjs) already enforces every one of these at write
// time; these cases prove `replaySession` re-checks the SAME properties
// independently against a hand-crafted log that never went through that
// door -- defense in depth, matching this file's own established pattern
// for `assignment-created`/`result-linked` above.

function openHumanTurnSession(tempDir, coordinationId, overrides = {}) {
  openSession(
    {
      coordinationId,
      objective: 'Prove human-turn replay re-validation.',
      provenanceRoot: { writerId: 'writer-1' },
      actors: [{ id: 'reviewer', role: 'reviewer' }],
      ...overrides,
    },
    { cwd: tempDir },
  );
}

function humanTurnPayload(overrides = {}) {
  return {
    turnId: 'turn_1',
    turnOrdinal: 1,
    channel: 'claude-code-chat',
    artifactRef: 'human/1-person.md',
    revision: `sha256:${'a'.repeat(64)}`,
    externalRef: 'claude-code-transcript:sess-1:uuid-1',
    attributedTo: { type: 'person', id: 'the-user' },
    recordedBy: { type: 'driver', id: 'writer-1' },
    ...overrides,
  };
}

function appendRawHumanTurn(eventsPath, seq, payloadOverrides = {}) {
  fs.appendFileSync(
    eventsPath,
    `${JSON.stringify({ seq, ts: new Date().toISOString(), v: '1', type: 'human-turn-recorded', payload: humanTurnPayload(payloadOverrides) })}\n`,
  );
}

test('replaySession reconstructs a real human turn cleanly and never throws for it', () => {
  const tempDir = mkTempDir();
  openHumanTurnSession(tempDir, 'coord_replay_ht_clean');
  recordHumanTurn('coord_replay_ht_clean', humanTurnPayload(), { cwd: tempDir });
  const replayed = replaySession('coord_replay_ht_clean', { cwd: tempDir });
  assert.equal(replayed.humanTurns.length, 1);
  assert.equal(replayed.humanTurns[0].turnId, 'turn_1');
});

test('replaySession rejects a human-turn-recorded event whose recordedBy is not this session\'s driver identity', () => {
  const tempDir = mkTempDir();
  openHumanTurnSession(tempDir, 'coord_replay_ht_foreign_driver');
  const { eventsPath } = sessionPaths(tempDir, 'coord_replay_ht_foreign_driver');
  appendRawHumanTurn(eventsPath, 99, { recordedBy: { type: 'driver', id: 'someone-else' } });

  assert.throws(
    () => replaySession('coord_replay_ht_foreign_driver', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'foreign-ref' && /not this session's driver identity/.test(err.message),
  );
});

test('replaySession rejects a human-turn-recorded event that attributes the turn to its own recordedBy (self-attribution)', () => {
  const tempDir = mkTempDir();
  openHumanTurnSession(tempDir, 'coord_replay_ht_self_attrib');
  const { eventsPath } = sessionPaths(tempDir, 'coord_replay_ht_self_attrib');
  appendRawHumanTurn(eventsPath, 99, { attributedTo: { type: 'person', id: 'writer-1' } });

  assert.throws(
    () => replaySession('coord_replay_ht_self_attrib', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /cannot attribute a human turn to itself/.test(err.message),
  );
});

test('replaySession rejects a human-turn-recorded event that attributes the turn to a declared panel actor', () => {
  const tempDir = mkTempDir();
  openHumanTurnSession(tempDir, 'coord_replay_ht_panel_actor');
  const { eventsPath } = sessionPaths(tempDir, 'coord_replay_ht_panel_actor');
  appendRawHumanTurn(eventsPath, 99, { attributedTo: { type: 'person', id: 'reviewer' } });

  assert.throws(
    () => replaySession('coord_replay_ht_panel_actor', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /declared panel actor/.test(err.message),
  );
});

// Fix round 1 (Reviewer R-P03.1-02 / Red-Team Finding 1): the write door
// (`recordHumanTurn`, store.mjs) has FOUR `attributedTo` refusals -- self,
// panel actor, and TWO driver-authored-ref shapes (`asgn_`/`contribution:`/
// `human-turn:`). Only the first two were re-checked at replay before this
// fix; a hand-written event with a driver-authored-ref-shaped
// `attributedTo.id` replayed clean and rendered as a legitimate person
// turn. These three cases (one per reserved shape) prove the fourth
// refusal now has a real replay-side counterpart.
test('replaySession rejects a human-turn-recorded event that attributes the turn to an Assignment-id-shaped ref ("asgn_" prefix)', () => {
  const tempDir = mkTempDir();
  openHumanTurnSession(tempDir, 'coord_replay_ht_asgn_shape');
  const { eventsPath } = sessionPaths(tempDir, 'coord_replay_ht_asgn_shape');
  appendRawHumanTurn(eventsPath, 99, { attributedTo: { type: 'person', id: 'asgn_deadbeefcafe0001' } });

  assert.throws(
    () => replaySession('coord_replay_ht_asgn_shape', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /shaped like a driver-authored ref/.test(err.message),
  );
});

test('replaySession rejects a human-turn-recorded event that attributes the turn to a "contribution:"-shaped ref', () => {
  const tempDir = mkTempDir();
  openHumanTurnSession(tempDir, 'coord_replay_ht_contribution_shape');
  const { eventsPath } = sessionPaths(tempDir, 'coord_replay_ht_contribution_shape');
  appendRawHumanTurn(eventsPath, 99, { attributedTo: { type: 'person', id: 'contribution:x1' } });

  assert.throws(
    () => replaySession('coord_replay_ht_contribution_shape', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /shaped like a driver-authored ref/.test(err.message),
  );
});

test('replaySession rejects a human-turn-recorded event that attributes the turn to a "human-turn:"-shaped ref', () => {
  const tempDir = mkTempDir();
  openHumanTurnSession(tempDir, 'coord_replay_ht_humanturn_shape');
  const { eventsPath } = sessionPaths(tempDir, 'coord_replay_ht_humanturn_shape');
  appendRawHumanTurn(eventsPath, 99, { attributedTo: { type: 'person', id: 'human-turn:t1' } });

  assert.throws(
    () => replaySession('coord_replay_ht_humanturn_shape', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /shaped like a driver-authored ref/.test(err.message),
  );
});

// Fix round 1 (Red-Team Finding 2): `respondsToRefs` ownership was
// write-door-only -- replay copied it into the reconstructed record with no
// re-check, unlike the disposition's own `human-turn:` targetRef right
// beside it (which IS re-checked, see the "not yet recorded" test above).
test('replaySession rejects a human-turn-recorded event whose respondsToRefs cites a human turn not yet recorded at that point in the log', () => {
  const tempDir = mkTempDir();
  openHumanTurnSession(tempDir, 'coord_replay_ht_responds_dangling');
  const { eventsPath } = sessionPaths(tempDir, 'coord_replay_ht_responds_dangling');
  appendRawHumanTurn(eventsPath, 99, { respondsToRefs: ['human-turn:turn_never_recorded'] });

  assert.throws(
    () => replaySession('coord_replay_ht_responds_dangling', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'out-of-order-ref' && /respondsToRefs entry "human-turn:turn_never_recorded"/.test(err.message),
  );
});

test('replaySession rejects a human-turn-recorded event whose respondsToRefs cites a contribution this session never linked', () => {
  const tempDir = mkTempDir();
  openHumanTurnSession(tempDir, 'coord_replay_ht_responds_contribution_dangling');
  const { eventsPath } = sessionPaths(tempDir, 'coord_replay_ht_responds_contribution_dangling');
  appendRawHumanTurn(eventsPath, 99, { respondsToRefs: ['contribution:never_linked'] });

  assert.throws(
    () => replaySession('coord_replay_ht_responds_contribution_dangling', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'dangling-ref' && /respondsToRefs entry "contribution:never_linked"/.test(err.message),
  );
});

test('replaySession rejects a human-turn-recorded event whose respondsToRefs cites a bare id as a near-miss', () => {
  const tempDir = mkTempDir();
  openHumanTurnSession(tempDir, 'coord_replay_ht_responds_bare');
  const { eventsPath } = sessionPaths(tempDir, 'coord_replay_ht_responds_bare');
  recordHumanTurn('coord_replay_ht_responds_bare', humanTurnPayload(), { cwd: tempDir }); // turn_1
  appendRawHumanTurn(eventsPath, 99, {
    turnId: 'turn_2',
    turnOrdinal: 2,
    externalRef: 'claude-code-transcript:sess-1:uuid-2',
    respondsToRefs: ['turn_1'],
  });

  assert.throws(
    () => replaySession('coord_replay_ht_responds_bare', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /targets nothing/.test(err.message),
  );
});

test('replaySession accepts a human-turn-recorded event whose respondsToRefs cites a real, already-recorded human turn', () => {
  const tempDir = mkTempDir();
  openHumanTurnSession(tempDir, 'coord_replay_ht_responds_ok');
  recordHumanTurn('coord_replay_ht_responds_ok', humanTurnPayload(), { cwd: tempDir }); // turn_1
  recordHumanTurn(
    'coord_replay_ht_responds_ok',
    humanTurnPayload({
      turnId: 'turn_2',
      turnOrdinal: 2,
      externalRef: 'claude-code-transcript:sess-1:uuid-2',
      respondsToRefs: ['human-turn:turn_1'],
    }),
    { cwd: tempDir },
  );

  const replayed = replaySession('coord_replay_ht_responds_ok', { cwd: tempDir });
  assert.equal(replayed.humanTurns.length, 2);
  assert.deepEqual(replayed.humanTurns[1].respondsToRefs, ['human-turn:turn_1']);
});

test('replaySession rejects a non-contiguous turnOrdinal (a gap, hand-crafted past the write door)', () => {
  const tempDir = mkTempDir();
  openHumanTurnSession(tempDir, 'coord_replay_ht_ordinal_gap');
  const { eventsPath } = sessionPaths(tempDir, 'coord_replay_ht_ordinal_gap');
  appendRawHumanTurn(eventsPath, 99, { turnOrdinal: 2 }); // no ordinal 1 exists

  assert.throws(
    () => replaySession('coord_replay_ht_ordinal_gap', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /no gaps, no ordinal reuse/.test(err.message),
  );
});

test('replaySession rejects a duplicate turnId (hand-crafted past the write door)', () => {
  const tempDir = mkTempDir();
  openHumanTurnSession(tempDir, 'coord_replay_ht_dup_turn');
  recordHumanTurn('coord_replay_ht_dup_turn', humanTurnPayload(), { cwd: tempDir });
  const { eventsPath } = sessionPaths(tempDir, 'coord_replay_ht_dup_turn');
  appendRawHumanTurn(eventsPath, 99, { turnOrdinal: 2, externalRef: 'claude-code-transcript:sess-1:uuid-2' });

  assert.throws(
    () => replaySession('coord_replay_ht_dup_turn', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'duplicate-ref' && /duplicate "human-turn-recorded"/.test(err.message),
  );
});

test('replaySession rejects a reused externalRef across two different turnIds (hand-crafted past the write door)', () => {
  const tempDir = mkTempDir();
  openHumanTurnSession(tempDir, 'coord_replay_ht_dup_external');
  recordHumanTurn('coord_replay_ht_dup_external', humanTurnPayload(), { cwd: tempDir });
  const { eventsPath } = sessionPaths(tempDir, 'coord_replay_ht_dup_external');
  appendRawHumanTurn(eventsPath, 99, { turnId: 'turn_2', turnOrdinal: 2 }); // same default externalRef as turn_1

  assert.throws(
    () => replaySession('coord_replay_ht_dup_external', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'duplicate-ref' && /may back at most one real human turn/.test(err.message),
  );
});

test('replaySession rejects a driver-disposition-recorded event citing a human-turn: ref not yet recorded at that point in the log', () => {
  const tempDir = mkTempDir();
  openHumanTurnSession(tempDir, 'coord_replay_ht_disposition_early');
  const { eventsPath } = sessionPaths(tempDir, 'coord_replay_ht_disposition_early');
  // No "human-turn-recorded" event exists anywhere in this log.
  fs.appendFileSync(
    eventsPath,
    `${JSON.stringify({
      seq: 99,
      ts: new Date().toISOString(),
      v: '1',
      type: 'driver-disposition-recorded',
      payload: {
        targetRef: 'human-turn:turn_never_recorded',
        disposition: 'accepted',
        rationale: 'x',
        evidenceRefs: [],
        authorizedBy: { type: 'driver', id: 'writer-1' },
      },
    })}\n`,
  );

  assert.throws(
    () => replaySession('coord_replay_ht_disposition_early', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'out-of-order-ref' && /has no "human-turn-recorded" event before it/.test(err.message),
  );
});

test('replaySession accepts a driver-disposition-recorded event citing a human-turn: ref recorded earlier in the log', () => {
  const tempDir = mkTempDir();
  openHumanTurnSession(tempDir, 'coord_replay_ht_disposition_ok');
  recordHumanTurn('coord_replay_ht_disposition_ok', humanTurnPayload(), { cwd: tempDir });
  const { eventsPath } = sessionPaths(tempDir, 'coord_replay_ht_disposition_ok');
  fs.appendFileSync(
    eventsPath,
    `${JSON.stringify({
      seq: 99,
      ts: new Date().toISOString(),
      v: '1',
      type: 'driver-disposition-recorded',
      payload: {
        targetRef: 'human-turn:turn_1',
        disposition: 'accepted',
        rationale: 'x',
        evidenceRefs: [],
        authorizedBy: { type: 'driver', id: 'writer-1' },
      },
    })}\n`,
  );

  assert.doesNotThrow(() => replaySession('coord_replay_ht_disposition_ok', { cwd: tempDir }));
});

test('replaySession rejects a manifest carrying missionId (validated on every load, not just at creation)', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_replay_manifest_missionid', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  const { manifestPath } = sessionPaths(tempDir, 'coord_replay_manifest_missionid');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.missionId = 'mission_001';
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  assert.throws(
    () => replaySession('coord_replay_manifest_missionid', { cwd: tempDir }),
    (err) => err instanceof CoordinationError,
  );
});
