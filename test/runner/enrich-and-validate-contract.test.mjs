import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  enrichAndValidateContract,
  mergeHarnessPolicy,
} from '../../domains/coding/harness/enrich-and-validate-contract.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';

function validContract(overrides = {}) {
  return {
    objective: 'Validate the plan for tsk-abc',
    contextRefs: ['src/foo.mjs'],
    constraints: ['read-only investigation only'],
    expectedOutputs: ['a written verdict'],
    mutation: 'read-only',
    evidence: { required: 'reported' },
    role: 'reviewer',
    budget: { timeoutMs: 60000, maxRuns: 1 },
    supports: 'validate-plan',
    ...overrides,
  };
}

function planningWork(overrides = {}) {
  return { id: 'tsk-harness-1', stage: 'planning', domain: 'coding', workflow: 'feature', ...overrides };
}

// ─── R1: rejects a contract with no/illegal supports for the Work's stage ──

test('enrichAndValidateContract rejects a contract.supports naming an operation illegal for the Work\'s stage (ADR-007 §3)', () => {
  assert.throws(
    () =>
      enrichAndValidateContract(validContract({ supports: 'implement-item' }), {
        domain: 'coding',
        work: planningWork(),
      }),
    (err) =>
      err instanceof RunnerConfigError &&
      /not a legal operation for stage "planning"/.test(err.message) &&
      /ADR-007 §3/.test(err.message),
  );
});

test('enrichAndValidateContract rejects a missing contract.supports the same way as an illegal one', () => {
  const contract = validContract();
  delete contract.supports;
  assert.throws(
    () => enrichAndValidateContract(contract, { domain: 'coding', work: planningWork() }),
    (err) => err instanceof RunnerConfigError && /not a legal operation/.test(err.message),
  );
});

test('enrichAndValidateContract rejects when the Work has no declared stage', () => {
  assert.throws(
    () => enrichAndValidateContract(validContract(), { domain: 'coding', work: { id: 'tsk-no-stage', domain: 'coding' } }),
    (err) => err instanceof RunnerConfigError && /no declared stage/.test(err.message),
  );
});

test('enrichAndValidateContract rejects when no work is supplied at all', () => {
  assert.throws(
    () => enrichAndValidateContract(validContract(), { domain: 'coding' }),
    (err) => err instanceof RunnerConfigError && /work is required/.test(err.message),
  );
});

test('enrichAndValidateContract accepts contract.supports naming a legal operation for the Work\'s stage', () => {
  assert.doesNotThrow(() => enrichAndValidateContract(validContract(), { domain: 'coding', work: planningWork() }));
});

// ─── R1: adds contextRefs / constraint / evidence guidance ─────────────────

test('enrichAndValidateContract appends CONTEXT.md/plan.md context refs under work.docsRef, de-duplicated', () => {
  const work = planningWork({ docsRef: 'docs/history/harness-cell' });
  const { contract } = enrichAndValidateContract(validContract({ contextRefs: ['src/foo.mjs'] }), { domain: 'coding', work });

  assert.deepEqual(contract.contextRefs, [
    'src/foo.mjs',
    'docs/history/harness-cell',
    'docs/history/harness-cell/plan.md',
    'docs/history/harness-cell/CONTEXT.md',
  ]);
});

test('enrichAndValidateContract does not duplicate a docsRef-derived context ref the agent already proposed', () => {
  const work = planningWork({ docsRef: 'docs/history/harness-cell' });
  const { contract } = enrichAndValidateContract(
    validContract({ contextRefs: ['docs/history/harness-cell/plan.md'] }),
    { domain: 'coding', work },
  );

  assert.deepEqual(contract.contextRefs, [
    'docs/history/harness-cell/plan.md',
    'docs/history/harness-cell',
    'docs/history/harness-cell/CONTEXT.md',
  ]);
});

test('enrichAndValidateContract adds no docsRef-derived context refs when the Work carries no docsRef', () => {
  const work = planningWork();
  const { contract } = enrichAndValidateContract(validContract({ contextRefs: ['src/foo.mjs'] }), { domain: 'coding', work });
  assert.deepEqual(contract.contextRefs, ['src/foo.mjs']);
});

test('enrichAndValidateContract appends the repository read-only scope constraint (ADR-006 §6 still applies to inline)', () => {
  const { contract } = enrichAndValidateContract(validContract({ constraints: ['no external network calls'] }), {
    domain: 'coding',
    work: planningWork(),
  });
  assert.deepEqual(contract.constraints, ['no external network calls', 'scope: repository (read-only)']);
});

test('enrichAndValidateContract appends the agent-report.md expected-output instruction when evidence.required is "reported"', () => {
  const { contract } = enrichAndValidateContract(validContract({ evidence: { required: 'reported' } }), {
    domain: 'coding',
    work: planningWork(),
  });
  assert.ok(contract.expectedOutputs.includes('agent-report.md (reviewer findings and evaluation)'));
});

test('enrichAndValidateContract does not append the agent-report.md instruction when evidence.required is "verified"', () => {
  const { contract } = enrichAndValidateContract(validContract({ evidence: { required: 'verified' } }), {
    domain: 'coding',
    work: planningWork(),
  });
  assert.ok(!contract.expectedOutputs.includes('agent-report.md (reviewer findings and evaluation)'));
});

test('enrichAndValidateContract preserves contract.supports on the returned (enriched) contract', () => {
  const { contract } = enrichAndValidateContract(validContract({ supports: 'validate-plan' }), {
    domain: 'coding',
    work: planningWork(),
  });
  assert.equal(contract.supports, 'validate-plan');
});

// ─── R1: policy hints (matched operation's declared policy) ────────────────

test('enrichAndValidateContract writes the matched operation\'s own declared policy hints (validate-plan: reviewer/code-reviewer/claude/standard)', () => {
  const { policy } = enrichAndValidateContract(validContract(), { domain: 'coding', work: planningWork() });
  assert.deepEqual(policy, {
    minTier: 'standard',
    preferPersona: 'code-reviewer',
    preferExecutor: 'claude',
  });
  assert.ok(Object.isFrozen(policy));
  assert.ok(Object.isFrozen(policy.fallbackExecutors));
});

test('enrichAndValidateContract omits policy entirely when the matched operation declares none', () => {
  // scout-blast-radius (planning stage) declares no `policy` block in
  // domains/coding/workflows/feature.yaml.
  const { policy } = enrichAndValidateContract(validContract({ supports: 'scout-blast-radius', role: 'researcher' }), {
    domain: 'coding',
    work: planningWork(),
  });
  assert.equal(policy, undefined);
});

// ─── R1: never sets an executor id, never dispatches ────────────────────────

test('enrichAndValidateContract never adds an executor/provider/tier-selection field, only contract enrichment and policy hints', () => {
  const result = enrichAndValidateContract(validContract(), { domain: 'coding', work: planningWork() });
  assert.deepEqual(Object.keys(result).sort(), ['contract', 'policy']);
  for (const forbiddenKey of ['executor', 'executorId', 'provider', 'dispatch', 'workId', 'onAdvance']) {
    assert.equal(result[forbiddenKey], undefined, `must not set "${forbiddenKey}"`);
    assert.equal(result.contract[forbiddenKey], undefined, `contract must not carry "${forbiddenKey}"`);
  }
});

// ─── R1: purity -- identical output for identical input ────────────────────

test('enrichAndValidateContract is pure: identical input produces deep-equal output across repeated calls', () => {
  const work = planningWork({ docsRef: 'docs/history/harness-purity' });
  const first = enrichAndValidateContract(validContract(), { domain: 'coding', work });
  const second = enrichAndValidateContract(validContract(), { domain: 'coding', work });
  assert.deepEqual(first, second);
});

test('enrichAndValidateContract never mutates the input contract or work objects', () => {
  const work = planningWork({ docsRef: 'docs/history/harness-no-mutate' });
  const contract = validContract({ contextRefs: ['src/foo.mjs'] });
  const contractSnapshot = JSON.parse(JSON.stringify(contract));
  const workSnapshot = JSON.parse(JSON.stringify(work));

  enrichAndValidateContract(contract, { domain: 'coding', work });

  assert.deepEqual(contract, contractSnapshot);
  assert.deepEqual(work, workSnapshot);
});

// ─── mergeHarnessPolicy: the same merge shape as buildDeclaredAssignment's mergedPolicy ──

test('mergeHarnessPolicy returns undefined when neither side has anything to contribute', () => {
  assert.equal(mergeHarnessPolicy(undefined, undefined), undefined);
});

test('mergeHarnessPolicy merges opPolicy and callerPolicy, caller wins on overlapping keys', () => {
  const merged = mergeHarnessPolicy({ minTier: 'standard', preferExecutor: 'claude' }, { preferExecutor: 'pi' });
  assert.deepEqual(merged, { minTier: 'standard', preferExecutor: 'pi' });
  assert.ok(Object.isFrozen(merged));
});

test('mergeHarnessPolicy stamps _fromYaml when opPolicy declares a model and the caller does not override it', () => {
  const merged = mergeHarnessPolicy({ model: 'pinned-yaml-model' }, undefined);
  assert.equal(merged.model, 'pinned-yaml-model');
  assert.equal(merged._fromYaml, true);
});

test('mergeHarnessPolicy does not stamp _fromYaml when the caller overrides the model itself', () => {
  const merged = mergeHarnessPolicy({ model: 'pinned-yaml-model' }, { model: 'caller-chosen-model' });
  assert.equal(merged.model, 'caller-chosen-model');
  assert.equal(merged._fromYaml, undefined);
});

test('mergeHarnessPolicy freezes a fallbackExecutors array when present', () => {
  const merged = mergeHarnessPolicy({ fallbackExecutors: ['pi', 'codex'] }, undefined);
  assert.deepEqual(merged.fallbackExecutors, ['pi', 'codex']);
  assert.ok(Object.isFrozen(merged.fallbackExecutors));
});
