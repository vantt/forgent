import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createAssignmentId, buildAssignment as buildAssignmentInDispatch } from '../../src/runner/dispatch/assignment.mjs';
import { buildAssignment } from '../helpers/declared-assignment.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { domainHarnessFor, loadHarnessModule } from '../../src/runner/work-dispatch.mjs';
import os from 'node:os';

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
    // The legal operations of the step the Assignment was built against, from its Workflow.
    legalOperations: ['shape-plan', 'validate-plan', 'scout-blast-radius', 'resolve-question'],
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

test('buildAssignment (declared) with workId: null (no-Work-attached style) is unaffected by the new stamping (R7 heuristic untouched this cell)', () => {
  const assignment = buildAssignment({ workId: null, stage: 'planning', operation: 'validate-plan' });
  assert.equal(assignment.workId, null);
  // Step 08 Phase 01 R4: the prototype `missionId` field/param is retired
  // from Assignment construction entirely (ADR-008 Decision 5).
  assert.equal(assignment.missionId, undefined);
  // Declared stamping is role/operation-derived only; it does not itself
  // consult workId (that heuristic still lives solely in
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
        policy: { tier: 'premium' },
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

// ─── ADR-007 §1: the domain harness seam, called from buildInlineAssignment ──

function planningWorkFor(overrides = {}) {
  return { id: 'tsk-harness-wiring', workflowStep: 'planning', domain: 'coding', workflow: 'feature', ...overrides };
}

// The Work layer resolves the domain's harness for an item and hands it in; dispatch only runs it.
async function inlineFor(work, contract, { domain, ...rest } = {}) {
  const domainHarness = await domainHarnessFor(work, { domain });
  return buildAssignment({
    provenance: { kind: 'inline', contract, caller: inlineCaller() },
    ...rest,
    options: domainHarness ? { domainHarness } : {},
  });
}

test('buildAssignment (inline) fires the domain harness seam the Work layer resolved for a Work with a domain and declared Stage', async () => {
  const assignment = await inlineFor(
    planningWorkFor({ docsRef: 'docs/history/harness-wiring' }),
    inlineContract({ role: 'reviewer', supports: 'validate-plan' }),
  );

  assert.deepEqual(assignment.contextRefs, [
    'src/foo.mjs',
    'docs/history/harness-wiring',
    'docs/history/harness-wiring/plan.md',
    'docs/history/harness-wiring/CONTEXT.md',
  ]);
  assert.ok(assignment.provenance.inline.contract.constraints.includes('scope: repository (read-only)'));
  assert.equal(assignment.provenance.inline.contract.supports, 'validate-plan');
  assert.deepEqual(assignment.policy, { rigor: 'standard' });
  assert.deepEqual(assignment.provenance.validators, ['execution-contract-schema', 'domain-harness-seam']);
});

test('buildAssignment (inline) rejects a contract.supports illegal for the attached Work\'s stage (ADR-007 §3, exercised end to end)', async () => {
  await assert.rejects(
    () => inlineFor(planningWorkFor(), inlineContract({ role: 'reviewer', supports: 'implement-item' })),
    (err) => err instanceof RunnerConfigError && /not a legal operation for step "planning"/.test(err.message),
  );
});

test('domainHarnessFor gives no harness when no domain is resolvable (Work attached but no domain, no domain option) -- ADR-007 §2', async () => {
  const work = { id: 'tsk-no-domain', workflowStep: 'planning' };
  assert.equal(await domainHarnessFor(work), undefined);
  const assignment = await inlineFor(work, inlineContract());
  assert.deepEqual(assignment.provenance.validators, ['execution-contract-schema']);
  assert.equal(assignment.policy, undefined);
  // contextRefs/constraints are the agent-proposed contract's own, untouched.
  assert.deepEqual(assignment.contextRefs, ['src/foo.mjs']);
});

test('domainHarnessFor gives no harness when the Work has no declared stage yet, even with a domain present', async () => {
  assert.equal(await domainHarnessFor({ id: 'tsk-no-stage-yet', domain: 'coding' }), undefined);
});

test('domainHarnessFor gives no harness for a domain name that is not a registered domain', async () => {
  assert.equal(await domainHarnessFor({ id: 'tsk-traversal', workflowStep: 'planning', domain: '../coding' }), undefined);
  assert.equal(await domainHarnessFor({ id: 'tsk-unknown', workflowStep: 'planning', domain: 'no-such-domain' }), undefined);
});

test('domainHarnessFor resolves domain from the domain option when the Work carries no domain field of its own', async () => {
  const assignment = await inlineFor(
    { id: 'tsk-options-domain', workflowStep: 'planning', workflow: 'feature' },
    inlineContract({ role: 'reviewer', supports: 'validate-plan' }),
    { domain: 'coding' },
  );
  assert.deepEqual(assignment.provenance.validators, ['execution-contract-schema', 'domain-harness-seam']);
});

test('buildAssignment (inline) with no work attached at all never fires the harness seam (mission-lite\'s own call shape)', () => {
  const assignment = buildAssignment({
    provenance: { kind: 'inline', contract: inlineContract(), caller: inlineCaller() },
  });
  assert.deepEqual(assignment.provenance.validators, ['execution-contract-schema']);
  assert.equal(assignment.policy, undefined);
});

test('buildAssignment refuses a Work item instead of ignoring it, on both shapes', () => {
  assert.throws(
    () => buildAssignment({ provenance: { kind: 'inline', contract: inlineContract(), caller: inlineCaller() }, work: planningWorkFor() }),
    (err) => err instanceof RunnerConfigError && /takes no Work item \(work\)/.test(err.message),
  );
  assert.throws(
    () => buildAssignmentInDispatch({ domain: 'coding', operations: [], stage: 'planning', operation: 'validate-plan', work: planningWorkFor({ docsRef: 'docs/x' }) }),
    (err) => err instanceof RunnerConfigError && /takes no Work item \(work\)/.test(err.message),
  );
});

// ─── Inline contract explicit tier policy ───────────────────────────────────

test('buildAssignment (inline) with contract.policy = {tier: "nano"} stamps assignment.policy = {tier: "nano"}', () => {
  const assignment = buildAssignment({
    provenance: {
      kind: 'inline',
      contract: inlineContract({ policy: { tier: 'nano' } }),
      caller: inlineCaller(),
    },
  });

  assert.deepEqual(assignment.policy, { tier: 'nano' });
  assert.deepEqual(assignment.provenance.inline.contract.policy, { tier: 'nano' });
  assert.ok(Object.isFrozen(assignment.provenance.inline.contract.policy));
});

test('buildAssignment (inline) with no contract.policy leaves assignment.policy undefined (byte-identical default behavior)', () => {
  const assignment = buildAssignment({
    provenance: { kind: 'inline', contract: inlineContract(), caller: inlineCaller() },
  });
  assert.equal(assignment.policy, undefined);
  assert.equal(assignment.provenance.inline.contract.policy, undefined);
});

test('buildAssignment (inline) rejects contract.policy = {preferExecutor: "x"} end to end (the whitelist accepts tier only)', () => {
  assert.throws(
    () =>
      buildAssignment({
        provenance: {
          kind: 'inline',
          contract: inlineContract({ policy: { preferExecutor: 'agy-cli' } }),
          caller: inlineCaller(),
        },
      }),
    (err) => err instanceof RunnerConfigError && /unknown field "preferExecutor"/.test(err.message),
  );
});

test('buildAssignment (inline) preserves an explicit tier alongside a domain harness rigor policy', async () => {
  const assignment = buildAssignment({
    provenance: {
      kind: 'inline',
      contract: inlineContract({ role: 'reviewer', supports: 'validate-plan', policy: { tier: 'frontier' } }),
      caller: inlineCaller(),
    },
    options: { domainHarness: await domainHarnessFor({ id: 'tsk-harness-tier', workflowStep: 'planning', domain: 'coding', workflow: 'feature' }) },
  });

  assert.equal(assignment.policy.rigor, 'standard');
  assert.equal(assignment.policy.tier, 'frontier');
});

test('loadHarnessModule isolates a broken domain harness module: it counts as no harness, it does not throw', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-harness-probe-'));
  try {
    const broken = path.join(dir, 'broken.mjs');
    fs.writeFileSync(broken, "throw new Error('probe: broken harness module');\n");
    assert.equal(await loadHarnessModule(broken), undefined);
    const noExport = path.join(dir, 'no-export.mjs');
    fs.writeFileSync(noExport, 'export const other = 1;\n');
    assert.equal(await loadHarnessModule(noExport), undefined);
    assert.equal(await loadHarnessModule(path.join(dir, 'missing.mjs')), undefined);
    const good = path.join(dir, 'good.mjs');
    fs.writeFileSync(good, 'export function enrichAndValidateContract(contract) { return { contract }; }\n');
    assert.equal(typeof (await loadHarnessModule(good)), 'function');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('buildAssignment (inline) re-validates the harness-enriched contract: an adversarial harness returning role/budget/capabilities values validateExecutionContract would reject pre-seam is caught, not smuggled through to the frozen Assignment', () => {
  // A harness that runs cleanly but returns a contract with fields outside its own stated remit
  // (role/budget/capabilities) tampered to values validateExecutionContract would already
  // reject if a caller sent them directly, pre-seam.
  const domainHarness = (contract) => ({ contract: { ...contract, role: '', budget: { timeoutMs: -999, maxRuns: -5 }, capabilities: [123, null, {}] } });
  assert.throws(
    () => buildAssignment({
      provenance: {
        kind: 'inline',
        contract: {
          objective: 'probe', contextRefs: [], constraints: [], expectedOutputs: ['agent-report.md'],
          mutation: 'read-only', evidence: { required: 'reported' }, role: 'researcher',
          capabilities: [], budget: { timeoutMs: 1000, maxRuns: 1 },
        },
        caller: { writerId: 'writer-probe' },
      },
      options: { domainHarness },
    }),
    (err) => err instanceof RunnerConfigError,
  );
});
