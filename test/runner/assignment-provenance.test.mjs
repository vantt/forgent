import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
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

// ─── ADR-007 §1: the domain harness seam, called from buildInlineAssignment ──

function planningWorkFor(overrides = {}) {
  return { id: 'tsk-harness-wiring', stage: 'planning', domain: 'coding', workflow: 'feature', ...overrides };
}

test('buildAssignment (inline) fires the domain harness seam when a Work with a domain and declared Stage is attached', () => {
  const assignment = buildAssignment({
    provenance: {
      kind: 'inline',
      contract: inlineContract({ role: 'reviewer', supports: 'validate-plan' }),
      caller: inlineCaller(),
    },
    work: planningWorkFor({ docsRef: 'docs/history/harness-wiring' }),
  });

  assert.deepEqual(assignment.contextRefs, [
    'src/foo.mjs',
    'docs/history/harness-wiring',
    'docs/history/harness-wiring/plan.md',
    'docs/history/harness-wiring/CONTEXT.md',
  ]);
  assert.ok(assignment.provenance.inline.contract.constraints.includes('scope: repository (read-only)'));
  assert.equal(assignment.provenance.inline.contract.supports, 'validate-plan');
  assert.deepEqual(assignment.policy, {
    minTier: 'standard',
    preferPersona: 'code-reviewer',
    preferExecutor: 'claude',
  });
  assert.deepEqual(assignment.provenance.validators, ['execution-contract-schema', 'domain-harness-seam']);
});

test('buildAssignment (inline) rejects a contract.supports illegal for the attached Work\'s stage (ADR-007 §3, exercised end to end)', () => {
  assert.throws(
    () =>
      buildAssignment({
        provenance: {
          kind: 'inline',
          contract: inlineContract({ role: 'reviewer', supports: 'implement-item' }),
          caller: inlineCaller(),
        },
        work: planningWorkFor(),
      }),
    (err) => err instanceof RunnerConfigError && /not a legal operation for stage "planning"/.test(err.message),
  );
});

test('buildAssignment (inline) skips the harness seam entirely when no domain is resolvable (Work attached but no domain, no options.domain) -- ADR-007 §2', () => {
  const assignment = buildAssignment({
    provenance: { kind: 'inline', contract: inlineContract(), caller: inlineCaller() },
    work: { id: 'tsk-no-domain', stage: 'planning' },
  });
  assert.deepEqual(assignment.provenance.validators, ['execution-contract-schema']);
  assert.equal(assignment.policy, undefined);
  // contextRefs/constraints are the agent-proposed contract's own, untouched.
  assert.deepEqual(assignment.contextRefs, ['src/foo.mjs']);
});

test('buildAssignment (inline) skips the harness seam when the Work has no declared stage yet, even with a domain present', () => {
  const assignment = buildAssignment({
    provenance: { kind: 'inline', contract: inlineContract(), caller: inlineCaller() },
    work: { id: 'tsk-no-stage-yet', domain: 'coding' },
  });
  assert.deepEqual(assignment.provenance.validators, ['execution-contract-schema']);
});

test('buildAssignment (inline) resolves domain from options.domain when the Work carries no domain field of its own', () => {
  const assignment = buildAssignment({
    provenance: {
      kind: 'inline',
      contract: inlineContract({ role: 'reviewer', supports: 'validate-plan' }),
      caller: inlineCaller(),
    },
    work: { id: 'tsk-options-domain', stage: 'planning', workflow: 'feature' },
    options: { domain: 'coding' },
  });
  assert.deepEqual(assignment.provenance.validators, ['execution-contract-schema', 'domain-harness-seam']);
});

test('buildAssignment (inline) with no work attached at all never fires the harness seam (mission-lite\'s own call shape)', () => {
  const assignment = buildAssignment({
    provenance: { kind: 'inline', contract: inlineContract(), caller: inlineCaller() },
  });
  assert.deepEqual(assignment.provenance.validators, ['execution-contract-schema']);
  assert.equal(assignment.policy, undefined);
});

test('DOMAIN_HARNESS_SEAMS discovery isolates a broken domain harness module: it is skipped, not fatal to loading assignment.mjs for every other domain', () => {
  // assignment.mjs resolves domainsRoot relative to its own on-disk location
  // (path.resolve(thisDir, '../../../domains')), so the probe has to live
  // under the real repo's domains/ directory -- there is no override for
  // this. ESM caches a module by resolved path, so re-importing
  // assignment.mjs from *this* process would just return the already-loaded
  // (already-evaluated-without-the-probe) module; a fresh child process is
  // the only way to force a fresh, uncached module evaluation that actually
  // walks the discovery loop with the probe present (mirrors this repo's
  // own precedent of exercising module/process behavior via
  // execFileSync(process.execPath, [...]), e.g. test/runner/dispatch.test.mjs).
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const probeDomain = 'zzz-test-broken-harness-probe';
  const probeHarnessDir = path.join(repoRoot, 'domains', probeDomain, 'harness');
  const probeHarnessFile = path.join(probeHarnessDir, 'enrich-and-validate-contract.mjs');
  try {
    fs.mkdirSync(probeHarnessDir, { recursive: true });
    fs.writeFileSync(probeHarnessFile, "throw new Error('probe: broken harness module');\n");

    const assignmentUrl = pathToFileURL(path.join(repoRoot, 'src/runner/dispatch/assignment.mjs')).href;
    const script = `import(${JSON.stringify(assignmentUrl)})` +
      `.then(() => { console.log('OK'); })` +
      `.catch((e) => { console.error('FAILED:' + e.message); process.exitCode = 1; });`;
    const out = execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' });
    assert.match(out, /OK/);
  } finally {
    fs.rmSync(path.join(repoRoot, 'domains', probeDomain), { recursive: true, force: true });
  }
});

test('buildAssignment (inline) re-validates the harness-enriched contract: an adversarial harness returning role/budget/capabilities values validateExecutionContract would reject pre-seam is caught, not smuggled through to the frozen Assignment', () => {
  // Same fresh-child-process rationale as the broken-harness-module test
  // above: DOMAIN_HARNESS_SEAMS is populated once, at module load time, so
  // a probe domain added to domains/ after this test file's own top-level
  // `buildAssignment` import would never be discovered by the already-
  // evaluated module in this process.
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const probeDomain = 'zzz-test-adversarial-harness-probe';
  const probeHarnessDir = path.join(repoRoot, 'domains', probeDomain, 'harness');
  const probeHarnessFile = path.join(probeHarnessDir, 'enrich-and-validate-contract.mjs');
  try {
    fs.mkdirSync(probeHarnessDir, { recursive: true });
    // A harness that imports cleanly but returns a contract with fields
    // outside its own stated remit (role/budget/capabilities) tampered to
    // values validateExecutionContract would already reject if a caller
    // sent them directly, pre-seam.
    fs.writeFileSync(
      probeHarnessFile,
      "export function enrichAndValidateContract(contract) {\n" +
      "  return { contract: { ...contract, role: '', budget: { timeoutMs: -999, maxRuns: -5 }, capabilities: [123, null, {}] } };\n" +
      "}\n",
    );

    const assignmentUrl = pathToFileURL(path.join(repoRoot, 'src/runner/dispatch/assignment.mjs')).href;
    const script = `import(${JSON.stringify(assignmentUrl)}).then(async (mod) => {` +
      `const work = { id: 'tsk-adversarial-probe', stage: 'planning', domain: ${JSON.stringify(probeDomain)}, workflow: 'feature' };` +
      `try {` +
      `  mod.buildAssignment({ work, provenance: { kind: 'inline', contract: {` +
      `    objective: 'probe', contextRefs: [], constraints: [], expectedOutputs: ['agent-report.md'],` +
      `    mutation: 'read-only', evidence: { required: 'reported' }, role: 'researcher',` +
      `    capabilities: [], budget: { timeoutMs: 1000, maxRuns: 1 } },` +
      `    caller: { writerId: 'writer-probe' } } });` +
      `  console.log('SUCCEEDED');` +
      `} catch (e) { console.log('THREW:' + e.constructor.name + ':' + e.message); }` +
      `}).catch((e) => { console.error('LOAD-FAILED:' + e.message); process.exitCode = 1; });`;
    const out = execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' });
    assert.match(out, /^THREW:RunnerConfigError:/m);
    assert.doesNotMatch(out, /SUCCEEDED/);
  } finally {
    fs.rmSync(path.join(repoRoot, 'domains', probeDomain), { recursive: true, force: true });
  }
});
