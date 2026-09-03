import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateExecutionContract, CONTRACT_POLICY_VERSION } from '../../src/runner/dispatch/execution-contract.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';

function validContract(overrides = {}) {
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

function validCaller(overrides = {}) {
  return { writerId: 'writer-abc-123', ...overrides };
}

test('CONTRACT_POLICY_VERSION is a non-empty string', () => {
  assert.equal(typeof CONTRACT_POLICY_VERSION, 'string');
  assert.ok(CONTRACT_POLICY_VERSION.length > 0);
});

test('validateExecutionContract accepts a minimal, well-formed read-only contract', () => {
  assert.doesNotThrow(() => validateExecutionContract({ contract: validContract(), caller: validCaller() }));
});

test('validateExecutionContract accepts a contract with an optional parentAssignmentId and budget.tokens telemetry field', () => {
  assert.doesNotThrow(() =>
    validateExecutionContract({
      contract: validContract({ budget: { timeoutMs: 5000, maxRuns: 2, tokens: 12000 } }),
      caller: validCaller({ parentAssignmentId: 'asgn_tsk_abc_scout_blast_radius_001' }),
    }),
  );
});

// ─── The single most safety-critical negative test in this cell ────────────
// ADR-006 §6: an inline contract with mutation: 'mutating' MUST be rejected
// fail-closed. First slice is read-only only.
test('validateExecutionContract rejects mutation: "mutating" (ADR-006 §6 first-slice read-only-only rule)', () => {
  assert.throws(
    () => validateExecutionContract({ contract: validContract({ mutation: 'mutating' }), caller: validCaller() }),
    (err) => err instanceof RunnerConfigError && /mutating/i.test(err.message) && /read-only/i.test(err.message),
  );
});

test('validateExecutionContract rejects a missing "mutation" field', () => {
  const contract = validContract();
  delete contract.mutation;
  assert.throws(
    () => validateExecutionContract({ contract, caller: validCaller() }),
    (err) => err instanceof RunnerConfigError && /mutation/i.test(err.message),
  );
});

test('validateExecutionContract rejects any coordinationId/session field (ADR-006 §6: no session reference this slice)', () => {
  for (const field of ['coordinationId', 'sessionId', 'threadId', 'coordinationRef']) {
    assert.throws(
      () => validateExecutionContract({ contract: validContract({ [field]: 'x' }), caller: validCaller() }),
      (err) => err instanceof RunnerConfigError && /session\/coordination/i.test(err.message),
      `expected rejection for forbidden field "${field}"`,
    );
  }
});

test('validateExecutionContract rejects an unknown contract field', () => {
  assert.throws(
    () => validateExecutionContract({ contract: validContract({ someUnknownField: 'x' }), caller: validCaller() }),
    (err) => err instanceof RunnerConfigError && /unknown field "someUnknownField"/.test(err.message),
  );
});

test('validateExecutionContract rejects a missing "evidence.required" field', () => {
  assert.throws(
    () => validateExecutionContract({ contract: validContract({ evidence: {} }), caller: validCaller() }),
    (err) => err instanceof RunnerConfigError && /evidence\.required/.test(err.message),
  );
});

test('validateExecutionContract rejects a missing caller entirely', () => {
  assert.throws(
    () => validateExecutionContract({ contract: validContract() }),
    (err) => err instanceof RunnerConfigError && /caller/i.test(err.message),
  );
});

test('validateExecutionContract rejects a caller missing writerId', () => {
  assert.throws(
    () => validateExecutionContract({ contract: validContract(), caller: {} }),
    (err) => err instanceof RunnerConfigError && /writerId/.test(err.message),
  );
});

test('validateExecutionContract rejects a caller.writerId with an embedded space', () => {
  assert.throws(
    () => validateExecutionContract({ contract: validContract(), caller: validCaller({ writerId: 'has spaces' }) }),
    (err) => err instanceof RunnerConfigError && /writerId/.test(err.message),
  );
});

test('validateExecutionContract rejects a caller.writerId with a disallowed character', () => {
  assert.throws(
    () => validateExecutionContract({ contract: validContract(), caller: validCaller({ writerId: 'has/slash' }) }),
    (err) => err instanceof RunnerConfigError && /writerId/.test(err.message),
  );
});

test('validateExecutionContract rejects an unknown caller field', () => {
  assert.throws(
    () => validateExecutionContract({ contract: validContract(), caller: validCaller({ extra: 'x' }) }),
    (err) => err instanceof RunnerConfigError && /unknown field "extra"/.test(err.message),
  );
});

test('validateExecutionContract rejects missing objective/contextRefs/constraints/expectedOutputs', () => {
  for (const field of ['objective', 'contextRefs', 'constraints', 'expectedOutputs']) {
    const contract = validContract();
    delete contract[field];
    assert.throws(
      () => validateExecutionContract({ contract, caller: validCaller() }),
      (err) => err instanceof RunnerConfigError,
      `expected rejection for missing "${field}"`,
    );
  }
});

test('validateExecutionContract rejects an empty expectedOutputs array (must declare at least one)', () => {
  assert.throws(
    () => validateExecutionContract({ contract: validContract({ expectedOutputs: [] }), caller: validCaller() }),
    (err) => err instanceof RunnerConfigError,
  );
});

test('validateExecutionContract rejects a missing role hint', () => {
  const contract = validContract();
  delete contract.role;
  assert.throws(
    () => validateExecutionContract({ contract, caller: validCaller() }),
    (err) => err instanceof RunnerConfigError && /role/.test(err.message),
  );
});

test('validateExecutionContract rejects non-string capabilities when provided', () => {
  assert.throws(
    () => validateExecutionContract({ contract: validContract({ capabilities: [1, 2] }), caller: validCaller() }),
    (err) => err instanceof RunnerConfigError,
  );
});

test('validateExecutionContract rejects a missing budget object', () => {
  const contract = validContract();
  delete contract.budget;
  assert.throws(
    () => validateExecutionContract({ contract, caller: validCaller() }),
    (err) => err instanceof RunnerConfigError && /budget/.test(err.message),
  );
});

test('validateExecutionContract rejects non-positive-integer timeoutMs/maxRuns', () => {
  assert.throws(
    () => validateExecutionContract({ contract: validContract({ budget: { timeoutMs: 0, maxRuns: 1 } }), caller: validCaller() }),
    (err) => err instanceof RunnerConfigError && /timeoutMs/.test(err.message),
  );
  assert.throws(
    () => validateExecutionContract({ contract: validContract({ budget: { timeoutMs: 1000, maxRuns: 0 } }), caller: validCaller() }),
    (err) => err instanceof RunnerConfigError && /maxRuns/.test(err.message),
  );
  assert.throws(
    () => validateExecutionContract({ contract: validContract({ budget: { timeoutMs: 1000.5, maxRuns: 1 } }), caller: validCaller() }),
    (err) => err instanceof RunnerConfigError,
  );
});

test('validateExecutionContract rejects an unknown budget field (token limit enforcement is out of scope: telemetry only)', () => {
  assert.throws(
    () => validateExecutionContract({ contract: validContract({ budget: { timeoutMs: 1000, maxRuns: 1, maxTokens: 500 } }), caller: validCaller() }),
    (err) => err instanceof RunnerConfigError && /unknown field "maxTokens"/.test(err.message),
  );
});

test('validateExecutionContract rejects a negative or non-finite budget.tokens telemetry value', () => {
  assert.throws(
    () => validateExecutionContract({ contract: validContract({ budget: { timeoutMs: 1000, maxRuns: 1, tokens: -1 } }), caller: validCaller() }),
    (err) => err instanceof RunnerConfigError,
  );
});

// ─── ADR-007 §1: the optional "supports" field -- format check only ────────
// This generic, domain-ignorant validator never knows what a legal
// operation id is; that semantic legality check belongs solely to the
// domain harness seam (domains/coding/harness/enrich-and-validate-contract.mjs).

test('validateExecutionContract accepts a contract with no "supports" field at all (optional)', () => {
  const contract = validContract();
  assert.equal(contract.supports, undefined);
  assert.doesNotThrow(() => validateExecutionContract({ contract, caller: validCaller() }));
});

test('validateExecutionContract accepts a contract with a non-empty "supports" string, regardless of whether it names a real operation', () => {
  assert.doesNotThrow(() =>
    validateExecutionContract({ contract: validContract({ supports: 'validate-plan' }), caller: validCaller() }),
  );
  // Format check only -- this validator has no domain/stage context to
  // check legality against, so a nonsense value still passes here.
  assert.doesNotThrow(() =>
    validateExecutionContract({ contract: validContract({ supports: 'not-a-real-operation-id' }), caller: validCaller() }),
  );
});

test('validateExecutionContract rejects an empty-string "supports" field', () => {
  assert.throws(
    () => validateExecutionContract({ contract: validContract({ supports: '' }), caller: validCaller() }),
    (err) => err instanceof RunnerConfigError && /supports/.test(err.message),
  );
});

test('validateExecutionContract rejects a non-string "supports" field', () => {
  assert.throws(
    () => validateExecutionContract({ contract: validContract({ supports: 42 }), caller: validCaller() }),
    (err) => err instanceof RunnerConfigError && /supports/.test(err.message),
  );
});

// ─── Step 08 P04.2b: the narrow "contract.policy = {minTier}" exception ────
// Explicitly authorized, exactly-one-field-wide addition to the wire
// contract -- see execution-contract.mjs's own ACCEPTED_CONTRACT_FIELDS doc
// comment for the full "why" (the tier-floor stop gate this closes).

test('validateExecutionContract accepts a contract with no "policy" field at all (optional)', () => {
  const contract = validContract();
  assert.equal(contract.policy, undefined);
  assert.doesNotThrow(() => validateExecutionContract({ contract, caller: validCaller() }));
});

test('validateExecutionContract accepts contract.policy = {minTier: "lightweight"} (the exact shape this cell exists to legalize)', () => {
  assert.doesNotThrow(() =>
    validateExecutionContract({ contract: validContract({ policy: { minTier: 'lightweight' } }), caller: validCaller() }),
  );
});

test('validateExecutionContract accepts every legal MODEL_POLICY_TIERS value for contract.policy.minTier', () => {
  for (const tier of ['lightweight', 'standard', 'creative', 'analytical', 'critical']) {
    assert.doesNotThrow(
      () => validateExecutionContract({ contract: validContract({ policy: { minTier: tier } }), caller: validCaller() }),
      `expected contract.policy.minTier "${tier}" to be accepted`,
    );
  }
});

test('validateExecutionContract rejects contract.policy that is not an object', () => {
  assert.throws(
    () => validateExecutionContract({ contract: validContract({ policy: 'lightweight' }), caller: validCaller() }),
    (err) => err instanceof RunnerConfigError && /contract\.policy must be an object/.test(err.message),
  );
});

test('validateExecutionContract rejects contract.policy with a missing minTier', () => {
  assert.throws(
    () => validateExecutionContract({ contract: validContract({ policy: {} }), caller: validCaller() }),
    (err) => err instanceof RunnerConfigError && /contract\.policy\.minTier must be one of/.test(err.message),
  );
});

test('validateExecutionContract rejects contract.policy.minTier with an unrecognized tier value', () => {
  assert.throws(
    () => validateExecutionContract({ contract: validContract({ policy: { minTier: 'premium' } }), caller: validCaller() }),
    (err) => err instanceof RunnerConfigError && /contract\.policy\.minTier must be one of/.test(err.message),
  );
});

// ─── The exactly-one-field-wide guarantee: every OTHER PolicyPatch-shaped ──
// field is rejected on contract.policy, never silently accepted -- this is
// not a general PolicyPatch passthrough.
test('validateExecutionContract rejects any field on contract.policy other than "minTier" (not a general PolicyPatch passthrough)', () => {
  for (const [field, value] of [
    ['preferExecutor', 'agy-cli'],
    ['preferPersona', 'code-reviewer'],
    ['model', 'gpt-5.5'],
    ['visibility', 'visible'],
    ['fallbackExecutors', ['codex-cli']],
  ]) {
    assert.throws(
      () =>
        validateExecutionContract({
          contract: validContract({ policy: { minTier: 'lightweight', [field]: value } }),
          caller: validCaller(),
        }),
      (err) => err instanceof RunnerConfigError && new RegExp(`unknown field "${field}"`).test(err.message),
      `expected contract.policy.${field} to be rejected as an unknown field`,
    );
  }
});
