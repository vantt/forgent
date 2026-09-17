import { test } from 'node:test';
import assert from 'node:assert/strict';

import { compileDispatchPlan } from '../../src/runner/dispatch/plan.mjs';
import { resolveAssignmentDispatchPolicy } from '../../src/runner/dispatch/assignment-policy.mjs';
import { assessBwrap } from '../../src/runner/dispatch/confinement/drivers/bwrap.mjs';
import {
  assess,
  resolveFallback,
  ASSESS_OUTCOMES,
  REPEAT_MODE_VALUES,
  RecoveryError,
} from '../../src/runner/dispatch/recovery.mjs';

const REAL_PLAN = Object.freeze({ providerModel: 'claude', executorId: 'claude' });

function fullControls(networkEgress) {
  return {
    hostWrite: 'deny',
    hostRead: 'allow',
    networkEgress,
    process: 'host',
    home: 'host',
    session: 'shared',
    workspace: 'shared',
  };
}

test('ASSESS_OUTCOMES declares exactly the contract\'s four outcomes', () => {
  assert.deepEqual(
    [...ASSESS_OUTCOMES].sort(),
    ['effect-unknown', 'eligible', 'provider-not-allowed', 'undeclared-sink'].sort(),
  );
});

// ─── repeatMode is declared, never inferred from Assignment.mutation ───

test('assess refuses an undeclared or invalid repeatMode outright -- never treats it as a park verdict', () => {
  assert.throws(() => assess(REAL_PLAN, undefined, null, null), RecoveryError);
  assert.throws(() => assess(REAL_PLAN, 'mutating', null, null), RecoveryError);
  assert.throws(() => assess(REAL_PLAN, 'read-only', null, null), RecoveryError);
});

test('resolveAssignmentDispatchPolicy resolves repeatMode from declared policy only -- Assignment.mutation never changes the outcome', () => {
  const base = (mutation, repeatMode) => ({
    operation: 'review-item',
    role: 'reviewer',
    mutation,
    policy: repeatMode !== undefined ? { repeatMode } : {},
    skills: [],
  });

  // Neither assignment declares repeatMode; mutation differs. Both resolve
  // to `null` -- mutation is never consulted as a fallback source.
  const readOnlyUndeclared = resolveAssignmentDispatchPolicy({ assignment: base('read-only', undefined) });
  const mutatingUndeclared = resolveAssignmentDispatchPolicy({ assignment: base('mutating', undefined) });
  assert.equal(readOnlyUndeclared.repeatMode, null);
  assert.equal(mutatingUndeclared.repeatMode, null);

  // Declared repeatMode wins regardless of what mutation says, in both
  // directions -- a 'mutating' assignment does not get bumped to
  // 'post-delivery', and a 'read-only' one does not get bumped down to
  // 'pre-delivery'.
  const mutatingPreDelivery = resolveAssignmentDispatchPolicy({ assignment: base('mutating', 'pre-delivery') });
  assert.equal(mutatingPreDelivery.repeatMode, 'pre-delivery');
  assert.equal(mutatingPreDelivery.provenance.repeatMode.value, 'pre-delivery');

  const readOnlyPostDelivery = resolveAssignmentDispatchPolicy({ assignment: base('read-only', 'post-delivery') });
  assert.equal(readOnlyPostDelivery.repeatMode, 'post-delivery');
});

test('resolveAssignmentDispatchPolicy rejects a repeatMode value outside REPEAT_MODE_VALUES', () => {
  assert.throws(() =>
    resolveAssignmentDispatchPolicy({
      assignment: { operation: 'x', role: 'reviewer', policy: { repeatMode: 'always' }, skills: [] },
    }),
  );
});

// ─── plan validity ───

test('assess parks as effect-unknown when the plan carries no provider endpoint at all', () => {
  assert.equal(assess({}, 'pre-delivery', null, null), 'effect-unknown');
  assert.equal(assess(null, 'post-delivery', null, null), 'effect-unknown');
});

test('a resolveFallback result that never reached "scoped" always parks as effect-unknown ("fallback compiler mismatch")', () => {
  const notGoverned = resolveFallback({ policy: { executorPreference: ['claude'] }, provenance: {} }, 'nope', {
    compilePlan: () => { throw new Error('unreachable'); },
  });
  assert.equal(notGoverned.status, 'candidate-not-governed');
  assert.equal(assess(notGoverned, 'post-delivery', { policy: { controls: fullControls('allow') } }, { outcome: 'enforced' }), 'effect-unknown');

  // Same proof against a REAL compiler-mismatch, chaining the actual
  // compiler's refusal through resolveFallback and into assess.
  const cfg = {
    modelPolicies: { claude: { nano: 'claude-haiku', standard: 'claude-sonnet', advanced: 'claude-sonnet', flagship: 'claude-opus', frontier: 'claude-opus' } },
    executors: { claude: { command: 'claude', args: [] } },
  };
  const assignment = {
    operation: 'review-item',
    role: 'reviewer',
    policy: { preferExecutor: 'claude', fallbackExecutors: ['ghost'] },
    skills: [],
  };
  const originalPlan = compileDispatchPlan(cfg, { assignment });
  const compilerMismatch = resolveFallback(originalPlan, 'ghost', {
    compilePlan: (id) => compileDispatchPlan(cfg, { assignment, cliOverride: { preferExecutor: id } }),
  });
  assert.equal(compilerMismatch.status, 'compiler-mismatch');
  assert.equal(assess(compilerMismatch, 'post-delivery', {}, { outcome: 'enforced' }), 'effect-unknown');
});

// ─── pre-delivery: allowed today, unconditionally ───

test('pre-delivery repeat is always eligible -- nothing has reached an external sink yet', () => {
  assert.equal(assess(REAL_PLAN, 'pre-delivery', null, null), 'eligible');
  assert.equal(assess(REAL_PLAN, 'pre-delivery', { policy: { controls: fullControls('allow') } }, { outcome: 'unknown' }), 'eligible');
});

// ─── post-delivery: unknown delivery/effect -> park, no retry ───

test('post-delivery repeat parks as effect-unknown when the attestation itself is unknown/absent/refused/failed', () => {
  const confinement = { policy: { controls: fullControls('filtered') } };
  assert.equal(assess(REAL_PLAN, 'post-delivery', confinement, null), 'effect-unknown');
  assert.equal(assess(REAL_PLAN, 'post-delivery', confinement, { outcome: 'unknown' }), 'effect-unknown');
  assert.equal(assess(REAL_PLAN, 'post-delivery', confinement, { outcome: 'refused' }), 'effect-unknown');
  assert.equal(assess(REAL_PLAN, 'post-delivery', confinement, { outcome: 'failed' }), 'effect-unknown');
});

// ─── Acceptance Matrix (post-delivery) ───

test('Acceptance Matrix: network allow -> provider-not-allowed (never eligible for automatic repeat)', () => {
  const confinement = { policy: { controls: fullControls('allow') } };
  const attestation = { outcome: 'enforced', coverage: { 'control:networkEgress': 'satisfied' } };
  assert.equal(assess(REAL_PLAN, 'post-delivery', confinement, attestation), 'provider-not-allowed');
});

test('Acceptance Matrix: filtered requested but adapter coverage unsupported -> provider-not-allowed (real local-bwrap-v1 proof)', () => {
  // Real driver, not a stub: local-bwrap-v1's own assessBwrap never marks
  // networkEgress "filtered" as satisfied -- this is the concrete evidence
  // for why post-delivery repeat always parks under it today.
  const request = {
    requirement: {
      mode: 'required',
      policy: {
        controls: fullControls('filtered'),
        networkFilter: { defaultAction: 'deny', allow: [] },
        grants: [],
      },
    },
  };
  const backend = { id: 'test-bwrap', type: 'bwrap', config: { type: 'bwrap' } };
  const assessment = assessBwrap(request, backend);
  assert.equal(assessment.coverage['control:networkEgress'], 'unsatisfied');

  const confinement = { policy: { controls: fullControls('filtered') } };
  const attestation = { outcome: 'enforced', coverage: assessment.coverage };
  assert.equal(assess(REAL_PLAN, 'post-delivery', confinement, attestation), 'provider-not-allowed');
});

test('Acceptance Matrix: filtered provider + undeclared sink -> undeclared-sink', () => {
  const confinement = {
    policy: { controls: fullControls('filtered') },
    sinks: { declared: [{ id: 'telemetry-a', duplicable: true }], observed: [{ id: 'telemetry-a' }, { id: 'unlisted-sink' }] },
  };
  const attestation = { outcome: 'enforced', coverage: { 'control:networkEgress': 'satisfied' } };
  assert.equal(assess(REAL_PLAN, 'post-delivery', confinement, attestation), 'undeclared-sink');
});

test('Acceptance Matrix: filtered provider-only + duplicable telemetry + adapter proof -> eligible', () => {
  const confinement = {
    policy: { controls: fullControls('filtered') },
    sinks: {
      declared: [
        { id: 'telemetry-a', duplicable: true },
        { id: 'outcome-sink', duplicable: true, outcomeAffecting: true, dedupIdentity: 'dedupe-123' },
      ],
      observed: [{ id: 'telemetry-a' }, { id: 'outcome-sink' }],
    },
  };
  const attestation = { outcome: 'enforced', coverage: { 'control:networkEgress': 'satisfied' } };
  assert.equal(assess(REAL_PLAN, 'post-delivery', confinement, attestation), 'eligible');
});

test('Acceptance Matrix extra proof: a declared but non-duplicable sink still parks (Effect Rule 4)', () => {
  const confinement = {
    policy: { controls: fullControls('filtered') },
    sinks: { declared: [{ id: 'telemetry-a', duplicable: false }], observed: [{ id: 'telemetry-a' }] },
  };
  const attestation = { outcome: 'enforced', coverage: { 'control:networkEgress': 'satisfied' } };
  assert.equal(assess(REAL_PLAN, 'post-delivery', confinement, attestation), 'undeclared-sink');
});

test('Acceptance Matrix extra proof: an outcome-affecting sink with no dedup identity still parks (Effect Rule 4)', () => {
  const confinement = {
    policy: { controls: fullControls('filtered') },
    sinks: {
      declared: [{ id: 'outcome-sink', duplicable: true, outcomeAffecting: true }],
      observed: [{ id: 'outcome-sink' }],
    },
  };
  const attestation = { outcome: 'enforced', coverage: { 'control:networkEgress': 'satisfied' } };
  assert.equal(assess(REAL_PLAN, 'post-delivery', confinement, attestation), 'undeclared-sink');
});

test('post-delivery repeat with zero observed sinks and proven filtered coverage is eligible', () => {
  const confinement = { policy: { controls: fullControls('filtered') }, sinks: { declared: [], observed: [] } };
  const attestation = { outcome: 'enforced', coverage: { 'control:networkEgress': 'satisfied' } };
  assert.equal(assess(REAL_PLAN, 'post-delivery', confinement, attestation), 'eligible');
});

test('REPEAT_MODE_VALUES is re-exported for callers that need to validate a declared value themselves', () => {
  assert.deepEqual([...REPEAT_MODE_VALUES].sort(), ['post-delivery', 'pre-delivery']);
});
