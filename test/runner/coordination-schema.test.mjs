import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCHEMA_VERSION,
  DEFAULT_AGGREGATE_BOUNDS,
  validateManifest,
  validateEventPayload,
  applyAggregateBoundDefaults,
  assertAssignmentIsSessionBlind,
  CoordinationError,
} from '../../src/runner/coordination/schema.mjs';

function baseManifest(overrides = {}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    coordinationId: 'coord_test_001',
    objective: 'Probe schema validation.',
    status: 'active',
    createdAt: new Date().toISOString(),
    provenanceRoot: { writerId: 'writer-1' },
    definitionRef: null,
    workRef: null,
    aggregateBounds: { ...DEFAULT_AGGREGATE_BOUNDS },
    assignmentRefs: [],
    completedAt: null,
    ...overrides,
  };
}

test('validateManifest accepts a minimal well-formed manifest', () => {
  assert.doesNotThrow(() => validateManifest(baseManifest()));
});

test('validateManifest rejects an unknown top-level field (whitelist)', () => {
  assert.throws(
    () => validateManifest(baseManifest({ extraField: 'nope' })),
    (err) => err instanceof CoordinationError && /unknown field "extraField"/.test(err.message),
  );
});

test('validateManifest rejects missionId at the top level (ADR-008 Decision 5)', () => {
  assert.throws(
    () => validateManifest(baseManifest({ missionId: 'mission_001' })),
    (err) => err instanceof CoordinationError && /unknown field "missionId"/.test(err.message),
  );
});

test('validateManifest rejects missionId nested inside provenanceRoot (any nesting level)', () => {
  const manifest = baseManifest();
  manifest.provenanceRoot = { writerId: 'writer-1', missionId: 'mission_001' };
  assert.throws(
    () => validateManifest(manifest),
    (err) => err instanceof CoordinationError && /forbidden field "missionId"/.test(err.message),
  );
});

test('validateManifest rejects missionId nested inside an actors[] entry (any nesting level)', () => {
  const manifest = baseManifest({ actors: [{ id: 'primary', role: 'researcher', policy: { missionId: 'mission_x' } }] });
  assert.throws(
    () => validateManifest(manifest),
    (err) => err instanceof CoordinationError && /forbidden field "missionId"/.test(err.message),
  );
});

test('validateManifest rejects sessionId/threadId/coordinationRef anywhere in the tree', () => {
  for (const field of ['sessionId', 'threadId', 'coordinationRef']) {
    const manifest = baseManifest();
    manifest.provenanceRoot = { writerId: 'writer-1', [field]: 'x' };
    assert.throws(
      () => validateManifest(manifest),
      (err) => err instanceof CoordinationError && new RegExp(`forbidden field "${field}"`).test(err.message),
      `expected ${field} to be rejected`,
    );
  }
});

test('validateManifest rejects a bad status value', () => {
  assert.throws(
    () => validateManifest(baseManifest({ status: 'waiting-on-human' })),
    (err) => err instanceof CoordinationError && /status must be one of/.test(err.message),
  );
});

test('validateManifest requires completedAt to be null while status is active', () => {
  assert.throws(
    () => validateManifest(baseManifest({ completedAt: new Date().toISOString() })),
    (err) => err instanceof CoordinationError && /completedAt must be null while status is "active"/.test(err.message),
  );
});

test('validateManifest requires completedAt to be set once status leaves active', () => {
  assert.throws(
    () => validateManifest(baseManifest({ status: 'completed' })),
    (err) => err instanceof CoordinationError && /completedAt must be set once status leaves/.test(err.message),
  );
});

test('validateManifest rejects duplicate assignmentRefs entries', () => {
  assert.throws(
    () => validateManifest(baseManifest({ assignmentRefs: ['asgn_a_001', 'asgn_a_001'] })),
    (err) => err instanceof CoordinationError && /duplicate entry/.test(err.message),
  );
});

test('validateManifest rejects duplicate actor ids', () => {
  const manifest = baseManifest({ actors: [{ id: 'primary', role: 'researcher' }, { id: 'primary', role: 'reviewer' }] });
  assert.throws(
    () => validateManifest(manifest),
    (err) => err instanceof CoordinationError && /duplicate actor id/.test(err.message),
  );
});

test('validateManifest rejects a non-positive-integer aggregateBounds field', () => {
  const manifest = baseManifest({ aggregateBounds: { ...DEFAULT_AGGREGATE_BOUNDS, maxRounds: 0 } });
  assert.throws(
    () => validateManifest(manifest),
    (err) => err instanceof CoordinationError && /aggregateBounds.maxRounds must be a positive integer/.test(err.message),
  );
});

test('applyAggregateBoundDefaults fills every omitted bound from DEFAULT_AGGREGATE_BOUNDS -- never unbounded by omission', () => {
  const resolved = applyAggregateBoundDefaults({ maxRounds: 2 });
  assert.equal(resolved.maxRounds, 2);
  assert.equal(resolved.wallTimeMs, DEFAULT_AGGREGATE_BOUNDS.wallTimeMs);
  assert.equal(resolved.maxAssignments, DEFAULT_AGGREGATE_BOUNDS.maxAssignments);
  assert.equal(resolved.maxConcurrency, DEFAULT_AGGREGATE_BOUNDS.maxConcurrency);
  assert.equal(resolved.maxTaskDepth, DEFAULT_AGGREGATE_BOUNDS.maxTaskDepth);
});

test('applyAggregateBoundDefaults with no argument returns the full default set', () => {
  assert.deepEqual(applyAggregateBoundDefaults(undefined), DEFAULT_AGGREGATE_BOUNDS);
});

// ─── Event payload validation ───────────────────────────────────────────────

test('validateEventPayload accepts every documented event kind with its exact required fields', () => {
  assert.doesNotThrow(() => validateEventPayload('session-opened', { coordinationId: 'coord_1', provenanceRoot: { writerId: 'w' } }));
  assert.doesNotThrow(() => validateEventPayload('actor-bound', { actorId: 'primary', role: 'researcher' }));
  assert.doesNotThrow(() => validateEventPayload('assignment-created', { assignmentId: 'asgn_a_001' }));
  assert.doesNotThrow(() => validateEventPayload('assignment-created', { assignmentId: 'asgn_a_001', actorId: 'primary' }));
  assert.doesNotThrow(() => validateEventPayload('result-linked', { assignmentId: 'asgn_a_001', runId: 'run_001' }));
  assert.doesNotThrow(() => validateEventPayload('session-completed', {}));
  assert.doesNotThrow(() => validateEventPayload('session-partial', { missingActors: ['specialist'] }));
  assert.doesNotThrow(() => validateEventPayload('session-failed', { reason: 'aggregate bounds exhausted' }));
});

test('validateEventPayload rejects an unknown event kind', () => {
  assert.throws(
    () => validateEventPayload('assignment-adopted', { assignmentId: 'asgn_a_001' }),
    (err) => err instanceof CoordinationError && /unknown event kind/.test(err.message),
  );
});

test('validateEventPayload rejects a missing required field', () => {
  assert.throws(
    () => validateEventPayload('result-linked', { assignmentId: 'asgn_a_001' }),
    (err) => err instanceof CoordinationError && /payload.runId must be a non-empty string/.test(err.message),
  );
});

test('validateEventPayload rejects an unlisted field on a payload', () => {
  assert.throws(
    () => validateEventPayload('assignment-created', { assignmentId: 'asgn_a_001', missionId: 'mission_001' }),
    (err) => err instanceof CoordinationError,
  );
});

test('validateEventPayload rejects a session-partial payload with an empty missingActors array', () => {
  assert.throws(
    () => validateEventPayload('session-partial', { missingActors: [] }),
    (err) => err instanceof CoordinationError && /missingActors must be a non-empty array/.test(err.message),
  );
});

// ─── operation-authorized (driver-authorized optional operations) ──────────

function authorizationPayload(overrides = {}) {
  return {
    authorizationId: 'auth_001',
    operationId: 'reviewer-recheck',
    nodeId: 'phase-recheck',
    targetActorId: 'reviewer',
    invocationKey: 'recheck:rev-2',
    authorizedBy: { type: 'driver', id: 'coordinator-1' },
    reason: 'Candidate was revised; a recheck against revision 2 is warranted.',
    grantedContextRefs: ['asgn_a_001'],
    ...overrides,
  };
}

test('validateEventPayload accepts a full operation-authorized payload, with and without targetArtifactRef', () => {
  assert.doesNotThrow(() => validateEventPayload('operation-authorized', authorizationPayload()));
  assert.doesNotThrow(() => validateEventPayload('operation-authorized', authorizationPayload({ targetArtifactRef: 'artifact:candidate@2' })));
  assert.doesNotThrow(() => validateEventPayload('operation-authorized', authorizationPayload({ grantedContextRefs: [] })));
});

for (const field of ['authorizationId', 'operationId', 'nodeId', 'targetActorId', 'invocationKey', 'authorizedBy', 'reason', 'grantedContextRefs']) {
  test(`validateEventPayload rejects an operation-authorized payload missing "${field}"`, () => {
    const payload = authorizationPayload();
    delete payload[field];
    assert.throws(
      () => validateEventPayload('operation-authorized', payload),
      (err) => err instanceof CoordinationError && new RegExp(`payload\\.${field}`).test(err.message),
    );
  });
}

test('validateEventPayload rejects an unlisted field on an operation-authorized payload', () => {
  assert.throws(
    () => validateEventPayload('operation-authorized', authorizationPayload({ grantedRoundBudget: 3 })),
    (err) => err instanceof CoordinationError && /unknown field "grantedRoundBudget"/.test(err.message),
  );
});

test('validateEventPayload requires operation-authorized authorizedBy to be a driver identity', () => {
  for (const bad of [{ type: 'actor', id: 'reviewer' }, { type: 'driver' }, { id: 'coordinator-1' }, 'coordinator-1']) {
    assert.throws(
      () => validateEventPayload('operation-authorized', authorizationPayload({ authorizedBy: bad })),
      (err) => err instanceof CoordinationError && /authorizedBy/.test(err.message),
      `expected authorizedBy ${JSON.stringify(bad)} to be rejected`,
    );
  }
});

test('validateEventPayload requires operation-authorized grantedContextRefs to be an array of non-empty strings', () => {
  for (const bad of ['asgn_a_001', [''], [1], {}]) {
    assert.throws(
      () => validateEventPayload('operation-authorized', authorizationPayload({ grantedContextRefs: bad })),
      (err) => err instanceof CoordinationError && /grantedContextRefs/.test(err.message),
      `expected grantedContextRefs ${JSON.stringify(bad)} to be rejected`,
    );
  }
});

test('validateEventPayload accepts driver-authorization provenance on assignment-created without changing the existing agent-led shape', () => {
  // Existing agent-led shape, unchanged.
  assert.doesNotThrow(() => validateEventPayload('assignment-created', { assignmentId: 'asgn_a_001' }));
  assert.doesNotThrow(() => validateEventPayload('assignment-created', { assignmentId: 'asgn_a_001', actorId: 'primary' }));
  // Additive driver-authorized provenance.
  assert.doesNotThrow(() =>
    validateEventPayload('assignment-created', {
      assignmentId: 'asgn_a_001',
      actorId: 'reviewer',
      operationId: 'reviewer-recheck',
      nodeId: 'phase-recheck',
      authorizationId: 'auth_001',
      invocationKey: 'recheck:rev-2',
      contextGrant: { refs: ['asgn_a_000'] },
    }),
  );
});

test('validateEventPayload rejects a malformed contextGrant on assignment-created', () => {
  for (const bad of [{ refs: 'asgn_a_000' }, { refs: [''] }, { refs: [], extra: 1 }, 'asgn_a_000']) {
    assert.throws(
      () => validateEventPayload('assignment-created', { assignmentId: 'asgn_a_001', contextGrant: bad }),
      (err) => err instanceof CoordinationError && /contextGrant/.test(err.message),
      `expected contextGrant ${JSON.stringify(bad)} to be rejected`,
    );
  }
});

test('validateEventPayload rejects assignment-created provenance that omits authorizationId -- the group travels together', () => {
  for (const orphan of [
    { operationId: 'reviewer-recheck' },
    { nodeId: 'phase-recheck' },
    { invocationKey: 'recheck:rev-2' },
    { contextGrant: { refs: ['asgn_a_000'] } },
    { operationId: 'reviewer-recheck', nodeId: 'phase-recheck', invocationKey: 'recheck:rev-2', contextGrant: { refs: [] } },
  ]) {
    assert.throws(
      () => validateEventPayload('assignment-created', { assignmentId: 'asgn_a_001', actorId: 'reviewer', ...orphan }),
      (err) => err instanceof CoordinationError && /without "authorizationId"/.test(err.message),
      `expected ${JSON.stringify(orphan)} without authorizationId to be rejected`,
    );
    // The SAME shape is accepted the moment it names an authorization.
    assert.doesNotThrow(() =>
      validateEventPayload('assignment-created', { assignmentId: 'asgn_a_001', actorId: 'reviewer', authorizationId: 'auth_001', ...orphan }),
    );
  }
});

// ─── Assignment session-blindness (ADR-008 Decision 2) ─────────────────────

test('assertAssignmentIsSessionBlind accepts a clean Assignment record', () => {
  assert.doesNotThrow(() => assertAssignmentIsSessionBlind({ assignmentId: 'asgn_a_001', role: 'researcher' }, 'asgn_a_001'));
});

for (const field of ['sessionId', 'coordinationId', 'threadId', 'coordinationRef']) {
  test(`assertAssignmentIsSessionBlind rejects an Assignment record carrying "${field}"`, () => {
    assert.throws(
      () => assertAssignmentIsSessionBlind({ assignmentId: 'asgn_a_001', [field]: 'x' }, 'asgn_a_001'),
      (err) => err instanceof CoordinationError && new RegExp(`forbidden session/coordination field "${field}"`).test(err.message),
    );
  });
}
