import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  openSession,
  bindActor,
  createSessionAssignment,
  linkResult,
  transitionSessionStatus,
} from '../../src/runner/coordination/store.mjs';
import { SCHEMA_VERSION_2, SCHEMA_VERSION, CoordinationError } from '../../src/runner/coordination/schema.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import {
  recoverSessionObserveUseCase,
  recoverSessionApplyUseCase,
} from '../../src/verbs/coordination/recover.mjs';
import { computeActionKey, computeSnapshotDigest } from '../../src/runner/coordination/recovery-planner.mjs';
import { StoreError } from '../../src/state/store.mjs';
import { acquireRunControl, releaseRunControl } from '../../src/runner/dispatch/run-lock.mjs';
import { closeSessionByQuorum } from '../../src/runner/coordination/session-engine.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coordination-recovery-verb-test-'));
}

function inlineContract(overrides = {}) {
  return {
    objective: 'Investigate runtime facts.',
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

function createRunningRunDir(tempDir, assignmentId, attempt = '01', { controlEpoch = 0, lastSeenAt } = {}) {
  const runDir = path.join(tempDir, '.fgos', 'assignments', assignmentId, 'runs', attempt);
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(runDir, 'run.json'),
    JSON.stringify({ runId: `run_${assignmentId}_${attempt}`, status: 'running', controlEpoch }),
  );
  if (lastSeenAt !== undefined) {
    fs.writeFileSync(path.join(runDir, 'visibility.json'), JSON.stringify({ lastSeenAt }));
  }
  return runDir;
}

function settleRunDir(runDir, { status = 'done', summary = 'Task completed' } = {}) {
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), `# Report\n${summary}\n`);
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status, summary }));
}

// ─── 1. Observe Public Contract & Parity ────────────────────────────────────

test('observe returns SessionRecoveryRecommendation with expected CAS fields without mutating state', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_rec_001';
  openSession(
    { coordinationId, objective: 'Test recovery recommendation.', provenanceRoot: { writerId: 'driver-1' }, schemaVersion: SCHEMA_VERSION_2 },
    { cwd: tempDir },
  );

  const initialReplay = replaySession(coordinationId, { cwd: tempDir });
  assert.equal(initialReplay.events.length, 1);

  const rec1 = recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId });
  assert.equal(rec1.coordinationId, coordinationId);
  assert.equal(typeof rec1.snapshotDigest, 'string');
  assert.equal(rec1.expectedEventSeq, 1);
  assert.equal(rec1.expectedRunControlEpoch, 0);
  assert.equal(typeof rec1.actionKey, 'string');
  assert.equal(rec1.action, 'close');
  assert.equal(typeof rec1.expiresAt, 'string');
  assert.equal(typeof rec1.reason, 'string');

  // Verify second observe call produces identical deterministic recommendation facts
  const rec2 = recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId });
  assert.equal(rec2.snapshotDigest, rec1.snapshotDigest);
  assert.equal(rec2.expectedEventSeq, rec1.expectedEventSeq);
  assert.equal(rec2.expectedRunControlEpoch, rec1.expectedRunControlEpoch);
  assert.equal(rec2.action, rec1.action);
  assert.equal(rec2.reason, rec1.reason);

  // State remains untouched: zero events appended
  const afterReplay = replaySession(coordinationId, { cwd: tempDir });
  assert.equal(afterReplay.events.length, 1);
});

test('observe and apply parity with write-door legal-next rules on terminal session', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_rec_term';
  openSession(
    { coordinationId, objective: 'Test terminal session refusal.', provenanceRoot: { writerId: 'driver-1' }, schemaVersion: SCHEMA_VERSION_2 },
    { cwd: tempDir },
  );

  transitionSessionStatus(coordinationId, 'completed', {}, { cwd: tempDir });

  // Observe returns parked recommendation
  const rec = recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId });
  assert.equal(rec.kind, 'park');
  assert.match(rec.reason, /not active/);

  const replayed = replaySession(coordinationId, { cwd: tempDir });
  const snapshot = {
    manifest: replayed.manifest,
    assignmentRefs: replayed.assignmentRefs,
    assignments: replayed.assignments,
    results: replayed.results,
    eligibleRunFacts: null,
  };
  const snapshotDigest = computeSnapshotDigest(snapshot);
  const expiresAt = new Date(Date.now() + 60000).toISOString();
  const validKey = computeActionKey({
    snapshotDigest,
    expectedEventSeq: 2,
    expectedRunControlEpoch: 0,
    action: 'close',
    expiresAt,
  });

  // Apply on terminal session returns refuse outcome
  const applyResult = recoverSessionApplyUseCase({ cwd: tempDir }, {
    coordinationId,
    action: 'close',
    expectedSnapshot: snapshotDigest,
    expectedEventSeq: 2,
    expectedRunControlEpoch: 0,
    expectedExpiresAt: expiresAt,
    actionKey: validKey,
    authorizedBy: { type: 'driver', id: 'driver-1' },
  });
  assert.equal(applyResult.outcome, 'refuse');
  assert.match(applyResult.reason, /not active/);
});

// ─── 2. Exact-Eligible-Run Result Collection ──────────────────────────────

test('exact eligible Run result collection recommends collect when result exists on disk but is not linked', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_rec_collect';
  openSession(
    { coordinationId, objective: 'Test collect recommendation.', provenanceRoot: { writerId: 'driver-1' }, schemaVersion: SCHEMA_VERSION_2 },
    { cwd: tempDir },
  );
  bindActor(coordinationId, { id: 'actor-1', role: 'researcher' }, { cwd: tempDir });
  const assignment = createSessionAssignment(
    { coordinationId, taskKey: 'task-collect', actorId: 'actor-1', role: 'researcher', contract: inlineContract(), caller: { writerId: 'driver-1' } },
    { cwd: tempDir },
  );
  const assignmentId = assignment.assignmentId;

  // Simulate worker settled on disk, but result not yet linked in coordination session
  const runDir = createRunningRunDir(tempDir, assignmentId, '01');
  settleRunDir(runDir, { summary: 'Result found.' });

  const rec = recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId });
  assert.equal(rec.action, 'collect');
  assert.equal(rec.assignmentId, assignmentId);
  assert.equal(rec.runId, `run_${assignmentId}_01`);
  assert.match(rec.reason, /settled result exists for the exact eligible Run/);

  // Apply collect recommendation
  const applyResult = recoverSessionApplyUseCase({ cwd: tempDir }, {
    coordinationId,
    action: rec.action,
    expectedSnapshot: rec.snapshotDigest,
    expectedEventSeq: rec.expectedEventSeq,
    expectedRunControlEpoch: rec.expectedRunControlEpoch,
    expectedExpiresAt: rec.expiresAt,
    actionKey: rec.actionKey,
    authorizedBy: { type: 'driver', id: 'driver-1' },
  });

  assert.equal(applyResult.outcome, 'applied');
  assert.equal(applyResult.appended, true);
  assert.equal(applyResult.runId, `run_${assignmentId}_01`);
  assert.equal(applyResult.action, 'collect');
  assert.ok(applyResult.commandId.startsWith('rc_'));

  // Replay confirms recovery-command-recorded event is present in recoveryCommands
  const replayed = replaySession(coordinationId, { cwd: tempDir });
  assert.equal(replayed.recoveryCommands.length, 1);
  assert.equal(replayed.recoveryCommands[0].commandId, applyResult.commandId);
  assert.equal(replayed.recoveryCommands[0].action, 'collect');
  assert.equal(replayed.recoveryCommands[0].runId, `run_${assignmentId}_01`);
});

test('ambiguous in-flight assignments refuse to guess and return needs-input', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_rec_ambig';
  openSession(
    { coordinationId, objective: 'Test ambiguous assignments.', provenanceRoot: { writerId: 'driver-1' }, schemaVersion: SCHEMA_VERSION_2 },
    { cwd: tempDir },
  );
  bindActor(coordinationId, { id: 'actor-1', role: 'researcher' }, { cwd: tempDir });
  bindActor(coordinationId, { id: 'actor-2', role: 'researcher' }, { cwd: tempDir });
  createSessionAssignment({ coordinationId, taskKey: 'task-1', actorId: 'actor-1', role: 'researcher', contract: inlineContract(), caller: { writerId: 'driver-1' } }, { cwd: tempDir });
  createSessionAssignment({ coordinationId, taskKey: 'task-2', actorId: 'actor-2', role: 'researcher', contract: inlineContract(), caller: { writerId: 'driver-1' } }, { cwd: tempDir });

  const rec = recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId });
  assert.equal(rec.kind, 'needs-input');
  assert.match(rec.reason, /more than one in-flight Assignment/);
});

test('settle is recommended when run has no live control holder and no settled result', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_rec_settle';
  openSession(
    { coordinationId, objective: 'Test settle recommendation.', provenanceRoot: { writerId: 'driver-1' }, schemaVersion: SCHEMA_VERSION_2 },
    { cwd: tempDir },
  );
  bindActor(coordinationId, { id: 'actor-1', role: 'researcher' }, { cwd: tempDir });
  const asgn = createSessionAssignment({ coordinationId, taskKey: 'task-settle', actorId: 'actor-1', role: 'researcher', contract: inlineContract(), caller: { writerId: 'driver-1' } }, { cwd: tempDir });

  // Dead driver: visibility timestamp > 60s ago
  const staleSeenAt = new Date(Date.now() - 120000).toISOString();
  createRunningRunDir(tempDir, asgn.assignmentId, '01', { lastSeenAt: staleSeenAt });

  const rec = recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId });
  assert.equal(rec.action, 'settle');
  assert.equal(rec.assignmentId, asgn.assignmentId);
  assert.equal(rec.runId, `run_${asgn.assignmentId}_01`);

  // Applying settle records recovery-command-recorded event
  const applied = recoverSessionApplyUseCase({ cwd: tempDir }, {
    coordinationId,
    action: rec.action,
    expectedSnapshot: rec.snapshotDigest,
    expectedEventSeq: rec.expectedEventSeq,
    expectedRunControlEpoch: rec.expectedRunControlEpoch,
    expectedExpiresAt: rec.expiresAt,
    actionKey: rec.actionKey,
    authorizedBy: { type: 'driver', id: 'driver-1' },
  });
  assert.equal(applied.outcome, 'applied');
  assert.equal(applied.action, 'settle');
});

test('observe is recommended when driver is still live with recent visibility heartbeat', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_rec_live';
  openSession(
    { coordinationId, objective: 'Test live driver observation.', provenanceRoot: { writerId: 'driver-1' }, schemaVersion: SCHEMA_VERSION_2 },
    { cwd: tempDir },
  );
  bindActor(coordinationId, { id: 'actor-1', role: 'researcher' }, { cwd: tempDir });
  const asgn = createSessionAssignment({ coordinationId, taskKey: 'task-live', actorId: 'actor-1', role: 'researcher', contract: inlineContract(), caller: { writerId: 'driver-1' } }, { cwd: tempDir });

  // Live driver: visibility heartbeat from moments ago
  const freshSeenAt = new Date().toISOString();
  createRunningRunDir(tempDir, asgn.assignmentId, '01', { lastSeenAt: freshSeenAt });

  const rec = recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId });
  assert.equal(rec.action, 'observe');
  assert.match(rec.reason, /live control holder/);
});

// ─── 3. Single-Use Apply & Action-Key Idempotency ───────────────────────────

test('single-use apply returns already-applied on repeat call with same actionKey', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_rec_idemp';
  openSession(
    { coordinationId, objective: 'Test action-key idempotency.', provenanceRoot: { writerId: 'driver-1' }, schemaVersion: SCHEMA_VERSION_2 },
    { cwd: tempDir },
  );

  const rec = recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId });
  assert.equal(rec.action, 'close');

  const applyParams = {
    coordinationId,
    action: rec.action,
    expectedSnapshot: rec.snapshotDigest,
    expectedEventSeq: rec.expectedEventSeq,
    expectedRunControlEpoch: rec.expectedRunControlEpoch,
    expectedExpiresAt: rec.expiresAt,
    actionKey: rec.actionKey,
    authorizedBy: { type: 'driver', id: 'driver-1' },
  };

  const firstApply = recoverSessionApplyUseCase({ cwd: tempDir }, applyParams);
  assert.equal(firstApply.outcome, 'applied');
  assert.equal(firstApply.appended, true);

  const secondApply = recoverSessionApplyUseCase({ cwd: tempDir }, applyParams);
  assert.equal(secondApply.outcome, 'already-applied');
  assert.equal(secondApply.appended, false);
  assert.equal(secondApply.commandId, firstApply.commandId);
  assert.equal(secondApply.invocationKey, rec.actionKey);

  // Replay verifies only exactly one recovery-command-recorded event exists
  const replayed = replaySession(coordinationId, { cwd: tempDir });
  assert.equal(replayed.recoveryCommands.length, 1);
});

test('replay refuses log with duplicate invocationKey on recovery-command-recorded events', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_rec_dup';
  openSession(
    { coordinationId, objective: 'Test duplicate invocation key rejection.', provenanceRoot: { writerId: 'driver-1' }, schemaVersion: SCHEMA_VERSION_2 },
    { cwd: tempDir },
  );

  const rec = recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId });
  recoverSessionApplyUseCase({ cwd: tempDir }, {
    coordinationId,
    action: rec.action,
    expectedSnapshot: rec.snapshotDigest,
    expectedEventSeq: rec.expectedEventSeq,
    expectedRunControlEpoch: rec.expectedRunControlEpoch,
    expectedExpiresAt: rec.expiresAt,
    actionKey: rec.actionKey,
    authorizedBy: { type: 'driver', id: 'driver-1' },
  });

  // Manually append a duplicate recovery-command-recorded event with the same invocationKey
  const eventsPath = path.join(tempDir, '.fgos', 'coordination', 'sessions', coordinationId, 'events.jsonl');
  const duplicatePayload = {
    invocationKey: rec.actionKey,
    coordinationId,
    runId: null,
    action: 'close',
    snapshotDigest: rec.snapshotDigest,
    expectedEventSeq: rec.expectedEventSeq,
    expectedRunControlEpoch: rec.expectedRunControlEpoch,
    expiresAt: rec.expiresAt,
    commandId: 'rc_duplicate_manual',
  };
  fs.appendFileSync(eventsPath, `${JSON.stringify({ type: 'recovery-command-recorded', payload: duplicatePayload, ts: new Date().toISOString() })}\n`);

  assert.throws(
    () => replaySession(coordinationId, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'duplicate-ref' && /claimed by more than one/.test(err.message),
  );
});

// ─── 4. Stale Snapshot / Event-Seq / Epoch Refusals ──────────────────────────

test('stale snapshot digest refuses apply with plan-stale', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_rec_stale_snap';
  openSession(
    { coordinationId, objective: 'Test stale snapshot.', provenanceRoot: { writerId: 'driver-1' }, schemaVersion: SCHEMA_VERSION_2 },
    { cwd: tempDir },
  );

  const rec = recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId });

  const result = recoverSessionApplyUseCase({ cwd: tempDir }, {
    coordinationId,
    action: rec.action,
    expectedSnapshot: 'mismatched_snapshot_digest_000',
    expectedEventSeq: rec.expectedEventSeq,
    expectedRunControlEpoch: rec.expectedRunControlEpoch,
    expectedExpiresAt: rec.expiresAt,
    actionKey: rec.actionKey,
    authorizedBy: { type: 'driver', id: 'driver-1' },
  });

  assert.equal(result.outcome, 'plan-stale');
  assert.match(result.reason, /actionKey does not match/);
});

test('stale event sequence refuses apply with plan-stale', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_rec_stale_seq';
  openSession(
    { coordinationId, objective: 'Test stale event sequence.', provenanceRoot: { writerId: 'driver-1' }, schemaVersion: SCHEMA_VERSION_2 },
    { cwd: tempDir },
  );

  const rec = recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId });

  // Advance event sequence by binding an actor
  bindActor(coordinationId, { id: 'actor-1', role: 'researcher' }, { cwd: tempDir });

  const result = recoverSessionApplyUseCase({ cwd: tempDir }, {
    coordinationId,
    action: rec.action,
    expectedSnapshot: rec.snapshotDigest,
    expectedEventSeq: rec.expectedEventSeq,
    expectedRunControlEpoch: rec.expectedRunControlEpoch,
    expectedExpiresAt: rec.expiresAt,
    actionKey: rec.actionKey,
    authorizedBy: { type: 'driver', id: 'driver-1' },
  });

  assert.equal(result.outcome, 'plan-stale');
  assert.match(result.reason, /event sequence has advanced/);
});

test('stale Run control epoch refuses apply with plan-stale', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_rec_stale_epoch';
  openSession(
    { coordinationId, objective: 'Test stale control epoch.', provenanceRoot: { writerId: 'driver-1' }, schemaVersion: SCHEMA_VERSION_2 },
    { cwd: tempDir },
  );
  bindActor(coordinationId, { id: 'actor-1', role: 'researcher' }, { cwd: tempDir });
  const asgn = createSessionAssignment({ coordinationId, taskKey: 'task-epoch', actorId: 'actor-1', role: 'researcher', contract: inlineContract(), caller: { writerId: 'driver-1' } }, { cwd: tempDir });
  const runDir = createRunningRunDir(tempDir, asgn.assignmentId, '01');
  settleRunDir(runDir);

  const rec = recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId });
  assert.equal(rec.expectedRunControlEpoch, 0);

  // Advance Run control epoch via run-lock primitive
  const acq = acquireRunControl(runDir, { holder: { id: 'test-holder', pid: process.pid }, purpose: 'epoch-bump' });
  releaseRunControl(runDir, { controlEpoch: acq.controlEpoch, controlToken: acq.controlToken });

  const result = recoverSessionApplyUseCase({ cwd: tempDir }, {
    coordinationId,
    action: rec.action,
    expectedSnapshot: rec.snapshotDigest,
    expectedEventSeq: rec.expectedEventSeq,
    expectedRunControlEpoch: rec.expectedRunControlEpoch,
    expectedExpiresAt: rec.expiresAt,
    actionKey: rec.actionKey,
    authorizedBy: { type: 'driver', id: 'driver-1' },
  });

  assert.equal(result.outcome, 'plan-stale');
  assert.match(result.reason, /control epoch has advanced/);
});

// ─── 5. Expired-Plan Refusal ────────────────────────────────────────────────

test('expired recommendation refuses apply with plan-stale', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_rec_expired';
  openSession(
    { coordinationId, objective: 'Test expired recommendation.', provenanceRoot: { writerId: 'driver-1' }, schemaVersion: SCHEMA_VERSION_2 },
    { cwd: tempDir },
  );

  // Issued 10 minutes ago -> with 5 min TTL, expired 5 minutes ago
  const pastDate = new Date(Date.now() - 600000).toISOString();
  const rec = recoverSessionObserveUseCase({ cwd: tempDir }, {
    coordinationId,
    now: () => pastDate,
  });

  // Applying with current time returns plan-stale
  const result = recoverSessionApplyUseCase({ cwd: tempDir }, {
    coordinationId,
    action: rec.action,
    expectedSnapshot: rec.snapshotDigest,
    expectedEventSeq: rec.expectedEventSeq,
    expectedRunControlEpoch: rec.expectedRunControlEpoch,
    expectedExpiresAt: rec.expiresAt,
    actionKey: rec.actionKey,
    authorizedBy: { type: 'driver', id: 'driver-1' },
    now: new Date().toISOString(),
  });

  assert.equal(result.outcome, 'plan-stale');
  assert.match(result.reason, /expired/);
});

// ─── 6. Driver Enforcement ──────────────────────────────────────────────────

test('current driver mismatch returns needs-input on apply while observe remains safe', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_rec_driver';
  openSession(
    { coordinationId, objective: 'Test driver identity enforcement.', provenanceRoot: { writerId: 'driver-authorized-id' }, schemaVersion: SCHEMA_VERSION_2 },
    { cwd: tempDir },
  );

  // Safe observation continues without requiring driver identity
  const rec = recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId });
  assert.equal(rec.action, 'close');

  // Apply with foreign/impostor driver id returns needs-input
  const impostorResult = recoverSessionApplyUseCase({ cwd: tempDir }, {
    coordinationId,
    action: rec.action,
    expectedSnapshot: rec.snapshotDigest,
    expectedEventSeq: rec.expectedEventSeq,
    expectedRunControlEpoch: rec.expectedRunControlEpoch,
    expectedExpiresAt: rec.expiresAt,
    actionKey: rec.actionKey,
    authorizedBy: { type: 'driver', id: 'impostor-driver' },
  });
  assert.equal(impostorResult.outcome, 'needs-input');
  assert.match(impostorResult.reason, /is not the driver identity/);

  // Apply with non-driver type returns needs-input
  const nonDriverResult = recoverSessionApplyUseCase({ cwd: tempDir }, {
    coordinationId,
    action: rec.action,
    expectedSnapshot: rec.snapshotDigest,
    expectedEventSeq: rec.expectedEventSeq,
    expectedRunControlEpoch: rec.expectedRunControlEpoch,
    expectedExpiresAt: rec.expiresAt,
    actionKey: rec.actionKey,
    authorizedBy: { type: 'worker', id: 'driver-authorized-id' },
  });
  assert.equal(nonDriverResult.outcome, 'needs-input');
});

// ─── 7. Premature-Close Hazard (X11) Stays Visible ──────────────────────────

test('premature-close hazard stays visible and refuses when close is applied with in-flight assignment', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_rec_x11';
  openSession(
    { coordinationId, objective: 'Test premature close hazard visibility.', provenanceRoot: { writerId: 'driver-1' }, schemaVersion: SCHEMA_VERSION_2 },
    { cwd: tempDir },
  );
  bindActor(coordinationId, { id: 'actor-1', role: 'researcher' }, { cwd: tempDir });
  const asgn = createSessionAssignment({ coordinationId, taskKey: 'task-x11', actorId: 'actor-1', role: 'researcher', contract: inlineContract(), caller: { writerId: 'driver-1' } }, { cwd: tempDir });

  // An assignment is in flight, so observe recommends observe
  const rec = recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId });
  assert.equal(rec.action, 'observe');

  // Craft a valid key specifically declaring "close"
  const validCloseKey = computeActionKey({
    snapshotDigest: rec.snapshotDigest,
    expectedEventSeq: rec.expectedEventSeq,
    expectedRunControlEpoch: rec.expectedRunControlEpoch,
    action: 'close',
    expiresAt: rec.expiresAt,
  });

  const closeResult = recoverSessionApplyUseCase({ cwd: tempDir }, {
    coordinationId,
    action: 'close',
    expectedSnapshot: rec.snapshotDigest,
    expectedEventSeq: rec.expectedEventSeq,
    expectedRunControlEpoch: rec.expectedRunControlEpoch,
    expectedExpiresAt: rec.expiresAt,
    actionKey: validCloseKey,
    authorizedBy: { type: 'driver', id: 'driver-1' },
  });

  assert.equal(closeResult.outcome, 'refuse');
  assert.match(closeResult.reason, /premature-close hazard/);
  assert.match(closeResult.reason, new RegExp(asgn.assignmentId));

  // Zero recovery-command-recorded events appended
  const replayed = replaySession(coordinationId, { cwd: tempDir });
  assert.equal(replayed.recoveryCommands.length, 0);
});

// ─── 8. Schema-1 Sessions Completely Unaffected ─────────────────────────────

test('schema-1 sessions refuse coordination recovery unconditionally', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_rec_schema1';
  openSession(
    { coordinationId, objective: 'Test schema-1 session refusal.', provenanceRoot: { writerId: 'driver-1' }, schemaVersion: SCHEMA_VERSION },
    { cwd: tempDir },
  );

  // Observe throws StoreError validation
  assert.throws(
    () => recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId }),
    (err) => err instanceof StoreError && /schema-2 only/.test(err.message),
  );

  // Apply throws StoreError validation
  assert.throws(
    () =>
      recoverSessionApplyUseCase({ cwd: tempDir }, {
        coordinationId,
        action: 'close',
        expectedSnapshot: 'hash',
        expectedEventSeq: 1,
        expectedRunControlEpoch: 0,
        expectedExpiresAt: new Date(Date.now() + 60000).toISOString(),
        actionKey: 'key',
        authorizedBy: { type: 'driver', id: 'driver-1' },
      }),
    (err) => err instanceof StoreError && /schema-2 only/.test(err.message),
  );
});

// ─── 9. Missing Required Flags Validation ───────────────────────────────────

test('apply requires all expectation flags or throws validation error', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_rec_missing';
  openSession(
    { coordinationId, objective: 'Test missing flags.', provenanceRoot: { writerId: 'driver-1' }, schemaVersion: SCHEMA_VERSION_2 },
    { cwd: tempDir },
  );

  assert.throws(
    () => recoverSessionApplyUseCase({ cwd: tempDir }, { coordinationId, action: 'close' }),
    (err) => err instanceof StoreError && /missing:/.test(err.message),
  );

  assert.throws(
    () =>
      recoverSessionApplyUseCase({ cwd: tempDir }, {
        coordinationId,
        action: 'unrecognized_action',
        expectedSnapshot: 'h',
        expectedEventSeq: 1,
        expectedRunControlEpoch: 0,
        expectedExpiresAt: '2026-09-14T00:00:00Z',
        actionKey: 'k',
      }),
    (err) => err instanceof StoreError && /must be one of/.test(err.message),
  );
});

// ─── 10. Prevention of Duplicate Commands & Quorum Completion Parity ─────────

test('already-recorded recovery command prevents duplicate recommendation and repeat apply for the target Run', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_rec_prevent_duplicate';
  openSession(
    {
      coordinationId,
      objective: 'Test duplicate command prevention on already-recorded Run.',
      provenanceRoot: { writerId: 'driver-1' },
      schemaVersion: SCHEMA_VERSION_2,
    },
    { cwd: tempDir },
  );
  bindActor(coordinationId, { id: 'actor-1', role: 'researcher' }, { cwd: tempDir });
  const asgn = createSessionAssignment(
    {
      coordinationId,
      taskKey: 'task-dup',
      actorId: 'actor-1',
      role: 'researcher',
      contract: inlineContract(),
      caller: { writerId: 'driver-1' },
    },
    { cwd: tempDir },
  );
  createRunningRunDir(tempDir, asgn.assignmentId, '01');

  // Initial observe recommends settle because the run has no live driver and no settled result
  const rec1 = recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId });
  assert.equal(rec1.action, 'settle');
  assert.equal(rec1.runId, `run_${asgn.assignmentId}_01`);

  // First apply successfully records the recovery command
  const apply1 = recoverSessionApplyUseCase({ cwd: tempDir }, {
    coordinationId,
    action: rec1.action,
    expectedSnapshot: rec1.snapshotDigest,
    expectedEventSeq: rec1.expectedEventSeq,
    expectedRunControlEpoch: rec1.expectedRunControlEpoch,
    expectedExpiresAt: rec1.expiresAt,
    actionKey: rec1.actionKey,
    authorizedBy: { type: 'driver', id: 'driver-1' },
  });
  assert.equal(apply1.outcome, 'applied');
  assert.equal(typeof apply1.commandId, 'string');

  const replayed1 = replaySession(coordinationId, { cwd: tempDir });
  assert.equal(replayed1.recoveryCommands.length, 1);
  assert.equal(replayed1.recoveryCommands[0].commandId, apply1.commandId);

  // Fresh observe detects already-recorded command for the target Run and recommends park
  const rec2 = recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId });
  assert.equal(rec2.action, 'park');
  assert.match(rec2.reason, new RegExp(apply1.commandId));
  assert.match(rec2.reason, /already recorded/);

  // Attempting another settle apply against this target Run is refused
  const settleKey = computeActionKey({
    snapshotDigest: rec2.snapshotDigest,
    expectedEventSeq: rec2.expectedEventSeq,
    expectedRunControlEpoch: rec2.expectedRunControlEpoch,
    action: 'settle',
    expiresAt: rec2.expiresAt,
  });
  const apply2 = recoverSessionApplyUseCase({ cwd: tempDir }, {
    coordinationId,
    action: 'settle',
    expectedSnapshot: rec2.snapshotDigest,
    expectedEventSeq: rec2.expectedEventSeq,
    expectedRunControlEpoch: rec2.expectedRunControlEpoch,
    expectedExpiresAt: rec2.expiresAt,
    actionKey: settleKey,
    authorizedBy: { type: 'driver', id: 'driver-1' },
  });
  assert.equal(apply2.outcome, 'refuse');
  assert.match(apply2.reason, new RegExp(apply1.commandId));
  assert.match(apply2.reason, /already recorded/);

  // Session event log still has only the single recorded recovery command
  const replayed2 = replaySession(coordinationId, { cwd: tempDir });
  assert.equal(replayed2.recoveryCommands.length, 1);
});

test('close recommendation and legality match write-door closeSessionByQuorum quorum rules', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_rec_quorum_parity';
  openSession(
    {
      coordinationId,
      objective: 'Test quorum parity for close recommendation.',
      provenanceRoot: { writerId: 'driver-1' },
      schemaVersion: SCHEMA_VERSION_2,
      actors: [
        { id: 'coordinator-actor', role: 'coordinator' },
        { id: 'proposer-actor', role: 'proposer' },
        { id: 'objector-a-actor', role: 'objector' },
        { id: 'objector-b-actor', role: 'objector' },
      ],
    },
    { cwd: tempDir },
  );

  // Verify what the real write door throws on this exact session
  let writeDoorError = null;
  try {
    closeSessionByQuorum(coordinationId, {}, { cwd: tempDir });
  } catch (err) {
    writeDoorError = err;
  }
  assert.ok(writeDoorError, 'closeSessionByQuorum should refuse when required actors are missing');
  const expectedReasonSubstring = 'missing required actor(s) [coordinator-actor, proposer-actor, objector-a-actor, objector-b-actor] and declares no partialPolicy';
  assert.match(writeDoorError.message, new RegExp(expectedReasonSubstring.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')));

  // Observe returns park because quorum rules disallow closing now
  const rec = recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId });
  assert.equal(rec.action, 'park');
  assert.match(rec.reason, new RegExp(expectedReasonSubstring.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')));

  // Apply with action "close" is refused with matching reason
  const closeKey = computeActionKey({
    snapshotDigest: rec.snapshotDigest,
    expectedEventSeq: rec.expectedEventSeq,
    expectedRunControlEpoch: rec.expectedRunControlEpoch,
    action: 'close',
    expiresAt: rec.expiresAt,
  });
  const applyResult = recoverSessionApplyUseCase({ cwd: tempDir }, {
    coordinationId,
    action: 'close',
    expectedSnapshot: rec.snapshotDigest,
    expectedEventSeq: rec.expectedEventSeq,
    expectedRunControlEpoch: rec.expectedRunControlEpoch,
    expectedExpiresAt: rec.expiresAt,
    actionKey: closeKey,
    authorizedBy: { type: 'driver', id: 'driver-1' },
  });
  assert.equal(applyResult.outcome, 'refuse');
  assert.match(applyResult.reason, new RegExp(expectedReasonSubstring.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')));

  // Now test positive completion parity on a session where all required actors completed
  const completedCoordId = 'coord_rec_quorum_complete';
  openSession(
    {
      coordinationId: completedCoordId,
      objective: 'Test quorum completion parity.',
      provenanceRoot: { writerId: 'driver-1' },
      schemaVersion: SCHEMA_VERSION_2,
      actors: [{ id: 'worker-1', role: 'worker' }],
    },
    { cwd: tempDir },
  );
  const asgn = createSessionAssignment(
    {
      coordinationId: completedCoordId,
      taskKey: 'task-comp',
      actorId: 'worker-1',
      role: 'worker',
      contract: inlineContract(),
      caller: { writerId: 'driver-1' },
    },
    { cwd: tempDir },
  );

  const runDir = path.join(tempDir, '.fgos', 'assignments', asgn.assignmentId, 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  const runId = `run_${asgn.assignmentId}_01`;
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({ runId, assignmentId: asgn.assignmentId, status: 'done', confidence: 'reported' }));
  linkResult(completedCoordId, { assignmentId: asgn.assignmentId, runId }, { cwd: tempDir });

  // Now all required actors completed: observe recommends close
  const recComplete = recoverSessionObserveUseCase({ cwd: tempDir }, { coordinationId: completedCoordId });
  assert.equal(recComplete.action, 'close');
  assert.match(recComplete.reason, /normal completion rules allow closing now/);

  // Real closeSessionByQuorum write door also succeeds on this session
  const closeOutcome = closeSessionByQuorum(completedCoordId, {}, { cwd: tempDir });
  assert.equal(closeOutcome.status, 'completed');
});

