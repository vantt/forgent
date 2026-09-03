import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DeliberationError,
  CONTRIBUTION_TYPES,
  validateContributionType,
  validateContributionShape,
  validateOperationDeclaresType,
  validateSessionMembership,
  validateAnchors,
  validateResponseLineage,
  validateContributionLineage,
  validateAssignmentProvenance,
} from '../../src/runner/deliberation/schema.mjs';

const SESSION_ID = 'coord_session_001';

function baseContribution(overrides = {}) {
  return {
    contributionId: 'contrib_001',
    sessionId: SESSION_ID,
    operationRef: 'op-deliberate',
    type: 'proposal',
    assignmentId: 'asg_001',
    runId: 'run_asg_001_01',
    artifactRef: 'artifact://proposal-1.md',
    revision: 'rev_abc123',
    roundKey: 'round-1',
    visibilityWindowRef: 'window://round-1',
    ts: '2026-09-04T00:00:00.000Z',
    ...overrides,
  };
}

function baseContext(overrides = {}) {
  return {
    sessionId: SESSION_ID,
    declaredOperations: {
      'op-deliberate': { allowedTypes: ['proposal', 'objection', 'response', 'clarification', 'rank', 'specialist-request'] },
    },
    knownContributions: new Map(),
    ...overrides,
  };
}

// --- positive case --------------------------------------------------------

test('validateContributionLineage accepts a well-formed proposal with real provenance and no lineage', () => {
  const result = validateContributionLineage(baseContribution(), baseContext());
  assert.deepEqual(result, { ok: true, contributionId: 'contrib_001' });
});

test('validateContributionLineage accepts a well-formed response with a resolvable respondsTo target in-session', () => {
  const known = new Map([['contrib_001', { sessionId: SESSION_ID }]]);
  const response = baseContribution({
    contributionId: 'contrib_002',
    type: 'response',
    respondsTo: 'contrib_001',
    anchors: ['contrib_001'],
  });
  const result = validateContributionLineage(response, baseContext({ knownContributions: known }));
  assert.deepEqual(result, { ok: true, contributionId: 'contrib_002' });
});

// --- undeclared contribution type ------------------------------------------

test('rejects an undeclared contribution type', () => {
  assert.throws(
    () => validateContributionType('mailbox-message'),
    (err) => err instanceof DeliberationError && err.category === 'undeclared-type' && /not one of the closed MVP8 contribution types/.test(err.message),
  );
});

test('validateContributionLineage rejects a contribution carrying an undeclared type end to end', () => {
  assert.throws(
    () => validateContributionLineage(baseContribution({ type: 'note' }), baseContext()),
    (err) => err instanceof DeliberationError && err.category === 'undeclared-type',
  );
});

test('CONTRIBUTION_TYPES is exactly the closed MVP8 enum', () => {
  assert.deepEqual(CONTRIBUTION_TYPES, ['proposal', 'objection', 'response', 'clarification', 'rank', 'specialist-request']);
});

// --- dangling anchor --------------------------------------------------------

test('rejects a dangling anchor that does not resolve to any known contribution', () => {
  const contribution = baseContribution({ anchors: ['contrib_ghost'] });
  assert.throws(
    () => validateAnchors(contribution, new Map(), SESSION_ID),
    (err) => err instanceof DeliberationError && err.category === 'dangling-anchor' && /"contrib_ghost"/.test(err.message),
  );
});

test('validateContributionLineage rejects a dangling anchor end to end', () => {
  const contribution = baseContribution({ contributionId: 'contrib_002', anchors: ['contrib_ghost'] });
  assert.throws(
    () => validateContributionLineage(contribution, baseContext()),
    (err) => err instanceof DeliberationError && err.category === 'dangling-anchor',
  );
});

// --- dangling response -------------------------------------------------------

test('rejects a dangling response target', () => {
  const contribution = baseContribution({ type: 'response', respondsTo: 'contrib_ghost' });
  assert.throws(
    () => validateResponseLineage(contribution, new Map(), SESSION_ID),
    (err) => err instanceof DeliberationError && err.category === 'dangling-response' && /"contrib_ghost"/.test(err.message),
  );
});

test('validateContributionLineage rejects a dangling response end to end', () => {
  const contribution = baseContribution({ contributionId: 'contrib_002', type: 'response', respondsTo: 'contrib_ghost' });
  assert.throws(
    () => validateContributionLineage(contribution, baseContext()),
    (err) => err instanceof DeliberationError && err.category === 'dangling-response',
  );
});

test('rejects a "response" contribution that omits respondsTo entirely', () => {
  assert.throws(
    () => validateContributionShape(baseContribution({ type: 'response', respondsTo: undefined })),
    (err) => err instanceof DeliberationError && /"response" contribution must set respondsTo/.test(err.message),
  );
});

// --- cycle -------------------------------------------------------------------

test('rejects a response chain that loops back on itself', () => {
  // contrib_a -> contrib_b -> contrib_c -> contrib_a (already-known cycle)
  const known = new Map([
    ['contrib_a', { sessionId: SESSION_ID, respondsTo: 'contrib_c' }],
    ['contrib_b', { sessionId: SESSION_ID, respondsTo: 'contrib_a' }],
    ['contrib_c', { sessionId: SESSION_ID, respondsTo: 'contrib_b' }],
  ]);
  const contribution = baseContribution({ contributionId: 'contrib_new', type: 'response', respondsTo: 'contrib_a' });
  assert.throws(
    () => validateResponseLineage(contribution, known, SESSION_ID),
    (err) => err instanceof DeliberationError && err.category === 'cycle',
  );
});

test('validateContributionLineage rejects a self-referential response chain end to end', () => {
  const known = new Map([['contrib_a', { sessionId: SESSION_ID, respondsTo: 'contrib_a' }]]);
  const contribution = baseContribution({ contributionId: 'contrib_new', type: 'response', respondsTo: 'contrib_a' });
  assert.throws(
    () => validateContributionLineage(contribution, baseContext({ knownContributions: known })),
    (err) => err instanceof DeliberationError && err.category === 'cycle',
  );
});

// --- foreign-session ref -------------------------------------------------------

test('rejects a contribution whose own sessionId does not match the ledger session', () => {
  assert.throws(
    () => validateSessionMembership(baseContribution({ sessionId: 'other_session' }), SESSION_ID),
    (err) => err instanceof DeliberationError && err.category === 'foreign-session-ref',
  );
});

test('rejects an anchor that resolves to a contribution from a different session', () => {
  const known = new Map([['contrib_foreign', { sessionId: 'other_session' }]]);
  const contribution = baseContribution({ anchors: ['contrib_foreign'] });
  assert.throws(
    () => validateAnchors(contribution, known, SESSION_ID),
    (err) => err instanceof DeliberationError && err.category === 'foreign-session-ref',
  );
});

test('rejects a respondsTo target that resolves to a contribution from a different session', () => {
  const known = new Map([['contrib_foreign', { sessionId: 'other_session' }]]);
  const contribution = baseContribution({ type: 'response', respondsTo: 'contrib_foreign' });
  assert.throws(
    () => validateResponseLineage(contribution, known, SESSION_ID),
    (err) => err instanceof DeliberationError && err.category === 'foreign-session-ref',
  );
});

test('validateContributionLineage rejects a foreign-session contribution end to end', () => {
  assert.throws(
    () => validateContributionLineage(baseContribution({ sessionId: 'other_session' }), baseContext()),
    (err) => err instanceof DeliberationError && err.category === 'foreign-session-ref',
  );
});

// --- operation/type mismatch --------------------------------------------------

test('rejects a type not declared in that operation\'s contributions.allowedTypes[]', () => {
  assert.throws(
    () => validateOperationDeclaresType('op-narrow', 'rank', { 'op-narrow': { allowedTypes: ['proposal', 'objection'] } }),
    (err) => err instanceof DeliberationError && err.category === 'operation-type-mismatch',
  );
});

test('rejects a type for an operationRef with no declared allowedTypes at all', () => {
  assert.throws(
    () => validateOperationDeclaresType('op-unknown', 'proposal', {}),
    (err) => err instanceof DeliberationError && err.category === 'operation-type-mismatch',
  );
});

test('validateContributionLineage rejects an operation/type mismatch end to end', () => {
  const context = baseContext({ declaredOperations: { 'op-deliberate': { allowedTypes: ['objection'] } } });
  assert.throws(
    () => validateContributionLineage(baseContribution({ type: 'proposal' }), context),
    (err) => err instanceof DeliberationError && err.category === 'operation-type-mismatch',
  );
});

// --- immutable artifact backing / real provenance (shape) ----------------------

test('rejects a contribution missing the revision immutability pin', () => {
  const contribution = baseContribution();
  delete contribution.revision;
  assert.throws(
    () => validateContributionShape(contribution),
    (err) => err instanceof DeliberationError && /revision must be a non-empty string/.test(err.message),
  );
});

test('rejects a contribution with an unknown field (no free-form body/status/recipient slips in)', () => {
  assert.throws(
    () => validateContributionShape(baseContribution({ body: 'hello' })),
    (err) => err instanceof DeliberationError && /unknown field "body"/.test(err.message),
  );
});

test('rejects a contribution missing any one of the assignmentId/runId/artifactRef provenance fields', () => {
  for (const field of ['assignmentId', 'runId', 'artifactRef']) {
    const contribution = baseContribution();
    delete contribution[field];
    assert.throws(
      () => validateContributionShape(contribution),
      (err) => err instanceof DeliberationError && new RegExp(`${field} must be a non-empty string`).test(err.message),
      `expected a missing ${field} to be rejected`,
    );
  }
});

// --- runId bound to its own Assignment ----------------------------------------

test('rejects a runId that does not have the shape of a Run of the claimed Assignment', () => {
  for (const runId of ['not-even-a-runid-shape', 'run_asg_other_01', 'run_asg_001_../../../../tmp/evil-marker']) {
    assert.throws(
      () => validateContributionShape(baseContribution({ runId })),
      (err) => err instanceof DeliberationError && err.category === 'foreign-provenance' && /does not match the expected shape/.test(err.message),
      `expected runId "${runId}" to be rejected`,
    );
  }
});

// --- knownAssignments: provenance checked for reality, not just presence -------

function knownAssignments(overrides = {}) {
  return new Map([['asg_001', { sessionId: SESSION_ID, operationRef: 'op-deliberate', ...overrides }]]);
}

test('knownAssignments is optional -- omitting it leaves provenance presence-checked only', () => {
  assert.doesNotThrow(() => validateAssignmentProvenance(baseContribution(), undefined, SESSION_ID));
});

test('validateContributionLineage accepts a contribution whose Assignment resolves, is in-session, and answered the claimed operation', () => {
  const result = validateContributionLineage(baseContribution(), baseContext({ knownAssignments: knownAssignments() }));
  assert.deepEqual(result, { ok: true, contributionId: 'contrib_001' });
});

test('validateContributionLineage rejects a fabricated Assignment once knownAssignments is supplied', () => {
  const contribution = baseContribution({ assignmentId: 'asg_totally_made_up', runId: 'run_asg_totally_made_up_01' });
  assert.throws(
    () => validateContributionLineage(contribution, baseContext({ knownAssignments: knownAssignments() })),
    (err) => err instanceof DeliberationError && err.category === 'foreign-provenance' && /does not resolve to a known Assignment/.test(err.message),
  );
});

test('validateContributionLineage rejects an Assignment belonging to a different coordination session', () => {
  assert.throws(
    () => validateContributionLineage(baseContribution(), baseContext({ knownAssignments: knownAssignments({ sessionId: 'coord_session_BRAVO' }) })),
    (err) => err instanceof DeliberationError && err.category === 'foreign-session-ref' && /Assignment of a different session/.test(err.message),
  );
});

test('validateContributionLineage rejects "right type, wrong operation" -- the Assignment answered another operation', () => {
  assert.throws(
    () => validateContributionLineage(baseContribution(), baseContext({ knownAssignments: knownAssignments({ operationRef: 'op-proposal-round' }) })),
    (err) => err instanceof DeliberationError && err.category === 'foreign-provenance' && /answered operation "op-proposal-round", not the claimed "op-deliberate"/.test(err.message),
  );
});

test('knownAssignments must be a Map when supplied', () => {
  assert.throws(
    () => validateContributionLineage(baseContribution(), baseContext({ knownAssignments: { asg_001: {} } })),
    (err) => err instanceof DeliberationError && /knownAssignments must be a Map when provided/.test(err.message),
  );
});

// --- allowedTypes may not be inherited ----------------------------------------

test('an allowedTypes declaration reachable only through the prototype chain does not legalize a type', () => {
  const declaredOperations = Object.create({ 'op-deliberate': { allowedTypes: ['proposal'] } });
  assert.throws(
    () => validateOperationDeclaresType('op-deliberate', 'proposal', declaredOperations),
    (err) => err instanceof DeliberationError && err.category === 'operation-type-mismatch',
  );
});

test('rejects a contribution with no backing artifact ref (immutable-artifact-backing acceptance criterion)', () => {
  const contribution = baseContribution();
  delete contribution.artifactRef;
  assert.throws(
    () => validateContributionShape(contribution),
    (err) => err instanceof DeliberationError && /artifactRef must be a non-empty string/.test(err.message),
  );
});
