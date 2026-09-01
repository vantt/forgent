import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openSession, createSessionAssignment, linkResult } from '../../src/runner/coordination/store.mjs';
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
  linkResult('coord_replay_linked_ok', { assignmentId: assignment.assignmentId, runId: `${assignment.assignmentId}_run_01` }, { cwd: tempDir });
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
