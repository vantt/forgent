import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAssignment, createAssignmentId } from '../../src/runner/dispatch/assignment.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';

function inlineContract(overrides = {}) {
  return {
    objective: 'Scout the blast radius of renameFoo()',
    contextRefs: ['src/foo.mjs'],
    constraints: ['read-only investigation only'],
    expectedOutputs: ['a written report'],
    mutation: 'read-only',
    evidence: { required: 'reported' },
    role: 'researcher',
    capabilities: ['code-search'],
    budget: { timeoutMs: 60000, maxRuns: 1 },
    ...overrides,
  };
}

function inlineCaller(overrides = {}) {
  return { writerId: 'writer-abc-123', ...overrides };
}

// ─── R1: declared provenance ────────────────────────────────────────────────

test('buildAssignment (declared) stamps provenance.kind="declared" plus provenance.declared', () => {
  const assignment = buildAssignment({
    workId: 'tsk-prov-1',
    stage: 'planning',
    operation: 'validate-plan',
  });

  assert.equal(assignment.provenance.kind, 'declared');
  assert.equal(typeof assignment.provenance.contractPolicyVersion, 'string');
  assert.equal(typeof assignment.provenance.normalizerVersion, 'string');
  assert.ok(Array.isArray(assignment.provenance.validators));
  assert.ok(assignment.provenance.validators.length > 0);
  assert.deepEqual(assignment.provenance.declared, {
    domain: 'coding',
    workflow: 'feature',
    stage: 'planning',
    operation: 'validate-plan',
    taskSpec: 'validate-plan',
  });
  assert.equal(assignment.provenance.inline, undefined);
  assert.ok(Object.isFrozen(assignment.provenance));
  assert.ok(Object.isFrozen(assignment.provenance.declared));
});

test('buildAssignment (declared) stamps mutation/evidence/resultKind/onAdvance for validate-plan', () => {
  const assignment = buildAssignment({ workId: 'tsk-prov-2', stage: 'planning', operation: 'validate-plan' });
  assert.equal(assignment.mutation, 'read-only');
  assert.deepEqual(assignment.evidence, { required: 'reported' });
  assert.equal(assignment.resultKind, 'gate-verdict');
  assert.equal(assignment.onAdvance, 'derive-plan-verdict-from-plan-md');
});

test('buildAssignment (declared) stamps mutation/evidence/resultKind for review-item without onAdvance', () => {
  const assignment = buildAssignment({ workId: 'tsk-prov-3', stage: 'executing', operation: 'review-item' });
  assert.equal(assignment.mutation, 'read-only');
  assert.deepEqual(assignment.evidence, { required: 'reported' });
  assert.equal(assignment.resultKind, 'review-verdict');
  assert.equal(assignment.onAdvance, undefined);
});

// ─── R1: declared negative — undeclared operation still rejected the same way ──

test('buildAssignment (declared) still rejects an undeclared operation with the pre-existing error (unaffected by stamping)', () => {
  assert.throws(
    () => buildAssignment({ stage: 'planning', operation: 'not-a-real-operation' }),
    (err) => err instanceof RunnerConfigError && /unknown operation/i.test(err.message),
  );
});

test('buildAssignment (declared) with workId: null (mission-lite style) is unaffected by the new stamping (R7 heuristic untouched this cell)', () => {
  const assignment = buildAssignment({ workId: null, missionId: 'mission_001', stage: 'planning', operation: 'validate-plan' });
  assert.equal(assignment.workId, null);
  assert.equal(assignment.missionId, 'mission_001');
  // Declared stamping is role/operation-derived only; it does not itself
  // consult workId/missionId (that heuristic still lives solely in
  // isReadOnlyAssignment, R7 is a later cell).
  assert.equal(assignment.mutation, 'read-only');
});

// ─── R4: buildAssignment() dual shape — inline ──────────────────────────────

test('buildAssignment (inline) accepts { provenance: { kind: "inline", contract, caller } } and produces a frozen Assignment', () => {
  const assignment = buildAssignment({
    provenance: { kind: 'inline', contract: inlineContract(), caller: inlineCaller() },
  });

  assert.ok(Object.isFrozen(assignment));
  assert.equal(assignment.provenance.kind, 'inline');
  assert.equal(assignment.provenance.declared, undefined);
  assert.equal(assignment.provenance.inline.caller.writerId, 'writer-abc-123');
  assert.equal(assignment.provenance.inline.contract.objective, inlineContract().objective);
  assert.equal(assignment.role, 'researcher');
  assert.equal(assignment.objective, inlineContract().objective);
  assert.deepEqual(assignment.contextRefs, ['src/foo.mjs']);
  assert.deepEqual(assignment.expectedOutputs, ['a written report']);
  assert.equal(assignment.dispatch, 'assignment');
  assert.equal(assignment.mutation, 'read-only');
  assert.deepEqual(assignment.evidence, { required: 'reported' });
  // Declared-only fields must not leak onto an inline Assignment.
  assert.equal(assignment.stage, undefined);
  assert.equal(assignment.operation, undefined);
  assert.equal(assignment.domain, undefined);
  assert.equal(assignment.taskSpec, undefined);
  assert.ok(Object.isFrozen(assignment.provenance.inline.contract));
  assert.ok(Object.isFrozen(assignment.provenance.inline.caller));
});

test('buildAssignment (inline) with workId omitted leaves Assignment.workId null (no Work attached)', () => {
  const assignment = buildAssignment({
    provenance: { kind: 'inline', contract: inlineContract(), caller: inlineCaller() },
  });
  assert.equal(assignment.workId, null);
});

test('buildAssignment (inline) propagates an optional parentAssignmentId', () => {
  const assignment = buildAssignment({
    provenance: {
      kind: 'inline',
      contract: inlineContract(),
      caller: inlineCaller({ parentAssignmentId: 'asgn_tsk_abc_scout_blast_radius_001' }),
    },
  });
  assert.equal(assignment.provenance.inline.caller.parentAssignmentId, 'asgn_tsk_abc_scout_blast_radius_001');
});

test('buildAssignment (inline) propagates unchanged as declared path continues working (dual-shape dispatch)', () => {
  const declared = buildAssignment({ workId: 'tsk-dual-1', stage: 'planning', operation: 'validate-plan' });
  assert.equal(declared.provenance.kind, 'declared');

  const inline = buildAssignment({ provenance: { kind: 'inline', contract: inlineContract(), caller: inlineCaller() } });
  assert.equal(inline.provenance.kind, 'inline');
});

// ─── R3 fail-closed, exercised through the full buildAssignment() path ─────

test('buildAssignment (inline) throws RunnerConfigError for mutation: "mutating" (ADR-006 §6, exercised end to end)', () => {
  assert.throws(
    () => buildAssignment({ provenance: { kind: 'inline', contract: inlineContract({ mutation: 'mutating' }), caller: inlineCaller() } }),
    (err) => err instanceof RunnerConfigError,
  );
});

test('buildAssignment (inline) throws RunnerConfigError when caller is missing', () => {
  assert.throws(
    () => buildAssignment({ provenance: { kind: 'inline', contract: inlineContract() } }),
    (err) => err instanceof RunnerConfigError,
  );
});

test('buildAssignment throws RunnerConfigError for an ambiguous call carrying both declared fields and provenance.kind: "inline"', () => {
  assert.throws(
    () =>
      buildAssignment({
        workId: 'tsk-1',
        stage: 'planning',
        operation: 'validate-plan',
        provenance: { kind: 'inline', contract: inlineContract(), caller: inlineCaller() },
      }),
    (err) => err instanceof RunnerConfigError && /stage/.test(err.message) && /operation/.test(err.message),
  );
});

test('buildAssignment throws RunnerConfigError naming missionId when it rides alongside inline provenance', () => {
  assert.throws(
    () =>
      buildAssignment({
        missionId: 'mission_007',
        provenance: { kind: 'inline', contract: inlineContract(), caller: inlineCaller() },
      }),
    (err) => err instanceof RunnerConfigError && /missionId/.test(err.message),
  );
});

test('buildAssignment throws RunnerConfigError naming every declared-shape field it finds alongside inline provenance (role, reason, policy, expectedFiles)', () => {
  assert.throws(
    () =>
      buildAssignment({
        role: 'reviewer',
        reason: 'assist',
        policy: { minTier: 'premium' },
        expectedFiles: ['src/foo.mjs'],
        provenance: { kind: 'inline', contract: inlineContract(), caller: inlineCaller() },
      }),
    (err) =>
      err instanceof RunnerConfigError &&
      /role/.test(err.message) &&
      /reason/.test(err.message) &&
      /policy/.test(err.message) &&
      /expectedFiles/.test(err.message),
  );
});

// ─── R4: createAssignmentId uses caller.writerId when no workId is present ──

test('createAssignmentId uses a sanitized caller.writerId token when no workId/missionId is present', () => {
  const id = createAssignmentId({ operation: undefined, caller: { writerId: 'Writer-ABC 123' } });
  assert.equal(id, 'asgn_writer_abc_123_op_001');
});

test('createAssignmentId prefers workId over caller.writerId when both are present (declared path unaffected)', () => {
  const id = createAssignmentId({ workId: 'tsk-abc', operation: 'validate-plan', caller: { writerId: 'writer-xyz' } });
  assert.equal(id, 'asgn_tsk_abc_validate_plan_001');
});

test('createAssignmentId still falls back to "nowork" when neither workId, missionId, nor caller.writerId is present (byte-identical to pre-change behavior)', () => {
  const id = createAssignmentId({ operation: 'resolve-question' });
  assert.equal(id, 'asgn_nowork_resolve_question_001');
});

test('buildAssignment (inline) derives the Assignment id from caller.writerId end to end', () => {
  const assignment = buildAssignment({
    provenance: { kind: 'inline', contract: inlineContract(), caller: inlineCaller({ writerId: 'writer-e2e' }) },
  });
  assert.match(assignment.assignmentId, /^asgn_writer_e2e_op_\d{3}$/);
});
