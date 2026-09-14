import { test } from 'node:test';
import assert from 'node:assert/strict';

import { compileDispatchPlan } from '../../src/runner/dispatch/plan.mjs';
import { resolveFallback, FALLBACK_STATUSES, RecoveryError } from '../../src/runner/dispatch/recovery.mjs';

// Real fixtures, real compiler: `cfg` registers two same-provider executors
// (both `command: 'claude'`, so no cross-provider gate gets in the way) and
// `assignment.policy.fallbackExecutors` declares `claude-b` as the ONLY
// governed fallback for `claude`. Every DispatchPlan below is produced by
// the actual `compileDispatchPlan` (dispatch/plan.mjs), never a hand-rolled
// literal standing in for one.
function buildCfg() {
  return {
    modelPolicies: {
      claude: {
        lightweight: 'claude-haiku',
        standard: 'claude-sonnet',
        creative: 'claude-sonnet',
        analytical: 'claude-opus',
        critical: 'claude-opus',
      },
    },
    executors: {
      claude: { command: 'claude', args: [] },
      'claude-b': { command: 'claude', args: ['--alt'] },
    },
  };
}

function buildAssignment(policyOverrides = {}) {
  return {
    operation: 'review-item',
    role: 'reviewer',
    policy: { preferExecutor: 'claude', fallbackExecutors: ['claude-b'], ...policyOverrides },
    skills: [],
  };
}

test('FALLBACK_STATUSES declares exactly the contract\'s three outcomes', () => {
  assert.deepEqual([...FALLBACK_STATUSES].sort(), ['candidate-not-governed', 'compiler-mismatch', 'scoped'].sort());
});

test('resolveFallback requires a real originalPlan object and a non-empty candidateId', () => {
  assert.throws(() => resolveFallback(null, 'claude-b'), RecoveryError);
  assert.throws(() => resolveFallback({}, ''), RecoveryError);
  assert.throws(() => resolveFallback({}, '   '), RecoveryError);
});

test('a candidate absent from the original plan\'s own executorPreference is refused as candidate-not-governed, without ever invoking the compiler', () => {
  const cfg = buildCfg();
  const assignment = buildAssignment();
  const originalPlan = compileDispatchPlan(cfg, { assignment });
  assert.equal(originalPlan.executorId, 'claude');
  assert.deepEqual(originalPlan.policy.executorPreference, ['claude', 'claude-b']);
  assert.equal(originalPlan.provenance.governance.value, 'allowed');

  const compilePlan = () => {
    throw new Error('compilePlan must never be called for an ungoverned candidate');
  };

  const result = resolveFallback(originalPlan, 'some-other-executor', { compilePlan });
  assert.deepEqual(result, { status: 'candidate-not-governed', candidateId: 'some-other-executor' });
});

test('an originalPlan with no policy/provenance at all refuses every candidate as candidate-not-governed', () => {
  const result = resolveFallback({ providerModel: 'claude' }, 'claude-b', {
    compilePlan: () => { throw new Error('must not be called'); },
  });
  assert.equal(result.status, 'candidate-not-governed');
});

test('a governed candidate the real compiler refuses (unregistered executor) resolves as compiler-mismatch, never silently substituted', () => {
  const cfg = buildCfg(); // 'ghost' is declared nowhere in cfg.executors
  const assignment = buildAssignment({ fallbackExecutors: ['ghost'] });
  const originalPlan = compileDispatchPlan(cfg, { assignment });
  assert.deepEqual(originalPlan.policy.executorPreference, ['claude', 'ghost']);

  const compilePlan = (candidateId) =>
    compileDispatchPlan(cfg, { assignment, cliOverride: { preferExecutor: candidateId } });

  const result = resolveFallback(originalPlan, 'ghost', { compilePlan });
  assert.equal(result.status, 'compiler-mismatch');
  assert.match(result.reason, /not a registered executor/);
});

test('resolveFallback requires options.compilePlan once a candidate is actually governed', () => {
  const cfg = buildCfg();
  const assignment = buildAssignment();
  const originalPlan = compileDispatchPlan(cfg, { assignment });
  assert.throws(() => resolveFallback(originalPlan, 'claude-b'), RecoveryError);
  assert.throws(() => resolveFallback(originalPlan, 'claude-b', {}), RecoveryError);
});

test('a governed candidate the real compiler accepts resolves as scoped, carrying the candidate\'s own compiled plan', () => {
  const cfg = buildCfg();
  const assignment = buildAssignment();
  const originalPlan = compileDispatchPlan(cfg, { assignment });

  const compilePlan = (candidateId) =>
    compileDispatchPlan(cfg, { assignment, cliOverride: { preferExecutor: candidateId } });

  const result = resolveFallback(originalPlan, 'claude-b', { compilePlan });
  assert.equal(result.status, 'scoped');
  assert.equal(result.candidateId, 'claude-b');
  assert.equal(result.plan.executorId, 'claude-b');
  assert.equal(result.plan.providerModel, 'claude');
  assert.equal(result.plan.provenance.governance.value, 'allowed');
  // Same governance-relevant floor as the original -- only the executor/
  // provider identity changed.
  assert.equal(result.plan.tier, originalPlan.tier);
  assert.equal(result.plan.provenance.visibility.value, originalPlan.provenance.visibility.value);
  assert.ok(Object.isFrozen(result));
});

test('a candidate that compiles but reports no allowed governance verdict is refused as compiler-mismatch', () => {
  const cfg = buildCfg();
  const assignment = buildAssignment();
  const originalPlan = compileDispatchPlan(cfg, { assignment });

  // Injected compiler stub: proves the classification itself (a compiler
  // that does not throw is not automatically trusted) without needing a
  // second real governance-denial fixture wired end to end.
  const compilePlan = () => ({
    ...originalPlan,
    executorId: 'claude-b',
    provenance: { ...originalPlan.provenance, governance: { value: 'denied', source: { scope: 'governance' } } },
  });

  const result = resolveFallback(originalPlan, 'claude-b', { compilePlan });
  assert.equal(result.status, 'compiler-mismatch');
  assert.match(result.reason, /allowed governance verdict/);
});

test('a candidate that compiles to a different governance-relevant tier/visibility is refused as compiler-mismatch', () => {
  const cfg = buildCfg();
  const assignment = buildAssignment();
  const originalPlan = compileDispatchPlan(cfg, { assignment });

  const compilePlan = () => ({
    ...originalPlan,
    executorId: 'claude-b',
    tier: 'critical', // a different governance floor than the original plan
  });

  const result = resolveFallback(originalPlan, 'claude-b', { compilePlan });
  assert.equal(result.status, 'compiler-mismatch');
  assert.match(result.reason, /same governance-relevant provenance/);
});
