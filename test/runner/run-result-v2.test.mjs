import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  RUN_RESULT_CONTRACT,
  EXECUTION_STATUSES,
  ASSESSMENT_VERDICTS,
  CONFIDENCE_LEVELS,
  FAILURE_FAMILIES,
  POLICY_DISPOSITIONS,
  DELIVERY_MODES,
  PROVENANCE_VALUES,
  projectLegacyStatus,
  projectLegacyConfidence,
  projectLegacyStatusAndConfidence,
  validateRunResultV2,
  normalizeRunResultV2,
  interpretRunResult,
} from '../../src/runner/dispatch/run-result.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-runresult-v2-test-'));
}

test('closed vocabularies are defined and frozen', () => {
  assert.deepEqual(RUN_RESULT_CONTRACT, { id: 'assignment-run-result', version: 2 });
  assert.deepEqual(EXECUTION_STATUSES, ['completed', 'failed', 'cancelled', 'completion-unknown']);
  assert.deepEqual(ASSESSMENT_VERDICTS, ['pass', 'findings', 'blocked', 'inconclusive', 'not-applicable']);
  assert.deepEqual(CONFIDENCE_LEVELS, ['verified', 'reported', 'inferred', 'no-evidence', 'failed']);
  assert.deepEqual(FAILURE_FAMILIES, ['provider', 'resource', 'contract', 'policy', 'external-interference', 'unknown']);
  assert.deepEqual(POLICY_DISPOSITIONS, ['allow', 'refuse', 'needs-input', 'not-applicable']);
  assert.deepEqual(DELIVERY_MODES, ['fresh', 'resumed', 'replayed', 'recovered', 'legacy-derived']);
  assert.deepEqual(PROVENANCE_VALUES, ['native-v2', 'legacy-derived', 'contract-corrupt']);
});

test('normalizeRunResultV2: clean pass produces done status and native-v2 provenance', () => {
  const res = normalizeRunResultV2({
    runId: 'run_clean_001',
    assignmentId: 'asgn_001',
    runtime: { exitCode: 0, stdoutLog: 'stdout.log' },
    agentClaim: { status: 'done', summary: 'Clean pass' },
    confidenceLevel: 'reported',
  });

  assert.equal(res.contract.id, 'assignment-run-result');
  assert.equal(res.contract.version, 2);
  assert.equal(res.status, 'done');
  assert.equal(res.confidence, 'reported');
  assert.equal(res.classification.execution.status, 'completed');
  assert.equal(res.classification.execution.exitCode, 0);
  assert.equal(res.classification.assessment.verdict, 'pass');
  assert.equal(res.classification.failure, null);
  assert.equal(res.classification.policy.disposition, 'allow');
  assert.equal(res.classification.provenance, 'native-v2');

  const validation = validateRunResultV2(res);
  assert.ok(validation.valid, `Validation failed: ${validation.reasons?.join(', ')}`);
});

test('normalizeRunResultV2: reviewer finding is execution.completed plus assessment.findings (not provider failure)', () => {
  const res = normalizeRunResultV2({
    runId: 'run_rev_001',
    assignmentId: 'asgn_rev_001',
    role: 'reviewer',
    operation: 'review-item',
    runtime: { exitCode: 0, stdoutLog: 'stdout.log' },
    agentClaim: {
      status: 'failed',
      summary: 'Found 2 critical issues',
      assessment: { verdict: 'findings', severityFloor: 'high' },
      evidenceRefs: ['review:H-1'],
    },
    confidenceLevel: 'reported',
  });

  // Acceptance requirement: A reviewer finding is execution.completed plus assessment.findings, not a provider crash
  assert.equal(res.classification.execution.status, 'completed');
  assert.equal(res.classification.execution.exitCode, 0);
  assert.equal(res.classification.assessment.verdict, 'findings');
  assert.equal(res.classification.assessment.severityFloor, 'high');
  assert.equal(res.classification.failure, null, 'Reviewer finding must have null failure, not provider crash');
  assert.equal(res.classification.policy.disposition, 'allow');

  // Legacy projection remains status: 'failed' so quorum readers block
  assert.equal(res.status, 'failed');
  assert.equal(res.confidence, 'reported');

  const validation = validateRunResultV2(res);
  assert.ok(validation.valid, `Validation failed: ${validation.reasons?.join(', ')}`);
});

test('normalizeRunResultV2: provider crash maps to failure.family: provider', () => {
  const res = normalizeRunResultV2({
    runId: 'run_err_001',
    assignmentId: 'asgn_err_001',
    runtime: { exitCode: 1, stderrLog: 'stderr.log' },
    agentClaim: { status: 'failed', summary: 'Process crashed' },
    confidenceLevel: 'failed',
  });

  assert.equal(res.classification.execution.status, 'failed');
  assert.equal(res.classification.execution.exitCode, 1);
  assert.equal(res.classification.failure.family, 'provider');
  assert.equal(res.status, 'failed');
  assert.equal(res.confidence, 'failed');

  const validation = validateRunResultV2(res);
  assert.ok(validation.valid, `Validation failed: ${validation.reasons?.join(', ')}`);
});

test('normalizeRunResultV2: timeout maps to failure.family: resource and code: execution-timeout', () => {
  const res = normalizeRunResultV2({
    runId: 'run_to_001',
    assignmentId: 'asgn_to_001',
    runtime: { exitCode: 124, isTimeout: true },
    confidenceLevel: 'failed',
  });

  assert.equal(res.classification.execution.status, 'failed');
  assert.equal(res.classification.failure.family, 'resource');
  assert.equal(res.classification.failure.code, 'execution-timeout');
  assert.equal(res.status, 'failed');
  assert.equal(res.confidence, 'failed');

  const validation = validateRunResultV2(res);
  assert.ok(validation.valid, `Validation failed: ${validation.reasons?.join(', ')}`);
});

test('normalizeRunResultV2: completion-unknown maps to status: no-evidence and confidence: no-evidence', () => {
  const res = normalizeRunResultV2({
    runId: 'run_unk_001',
    assignmentId: 'asgn_unk_001',
    runtime: { exitCode: null },
    agentClaim: null,
  });

  assert.equal(res.classification.execution.status, 'completion-unknown');
  assert.equal(res.classification.assessment.verdict, 'inconclusive');
  assert.equal(res.classification.confidence.level, 'no-evidence');
  assert.equal(res.status, 'no-evidence');
  assert.equal(res.confidence, 'no-evidence');

  const validation = validateRunResultV2(res);
  assert.ok(validation.valid, `Validation failed: ${validation.reasons?.join(', ')}`);
});

test('normalizeRunResultV2: policy refusal preserves execution and assessment facts without erasing artifacts', () => {
  const res = normalizeRunResultV2({
    runId: 'run_pol_001',
    assignmentId: 'asgn_pol_001',
    role: 'reviewer',
    runtime: { exitCode: 0, stdoutLog: 'stdout.log' },
    agentClaim: {
      status: 'failed',
      summary: 'Found substantive issues',
      assessment: { verdict: 'findings' },
      evidenceRefs: ['review:F-1'],
    },
    policyOverride: {
      disposition: 'refuse',
      code: 'outside-workspace-change-correlated',
    },
    evidence: {
      artifacts: ['runs/01/agent-report.md'],
      findingRefs: ['review:F-1'],
    },
    confidenceLevel: 'reported',
  });

  assert.equal(res.classification.execution.status, 'completed');
  assert.equal(res.classification.assessment.verdict, 'findings');
  assert.equal(res.classification.policy.disposition, 'refuse');
  assert.equal(res.classification.policy.code, 'outside-workspace-change-correlated');
  assert.equal(res.status, 'failed');
  assert.equal(res.evidence.artifacts.length, 1);
  assert.equal(res.evidence.findingRefs[0], 'review:F-1');

  const validation = validateRunResultV2(res);
  assert.ok(validation.valid, `Validation failed: ${validation.reasons?.join(', ')}`);
});

test('normalizeRunResultV2: same-task replay records delivery.mode: replayed and sourceRunId', () => {
  const res = normalizeRunResultV2({
    runId: 'run_rep_002',
    assignmentId: 'asgn_rep_001',
    deliveryMode: 'replayed',
    sourceRunId: 'run_original_001',
    runtime: { exitCode: 1 },
    confidenceLevel: 'failed',
  });

  assert.equal(res.classification.delivery.mode, 'replayed');
  assert.equal(res.classification.delivery.sourceRunId, 'run_original_001');

  const validation = validateRunResultV2(res);
  assert.ok(validation.valid, `Validation failed: ${validation.reasons?.join(', ')}`);
});

test('validateRunResultV2 detects contract corruption', () => {
  // 1. Missing classification
  const corrupt1 = { contract: { id: 'assignment-run-result', version: 2 }, runId: 'r1' };
  assert.ok(validateRunResultV2(corrupt1).corrupt);

  // 2. Projection mismatch
  const corrupt2 = normalizeRunResultV2({
    runId: 'r2',
    runtime: { exitCode: 0 },
    agentClaim: { status: 'done', summary: 'ok' },
  });
  corrupt2.status = 'corrupted-status';
  assert.ok(validateRunResultV2(corrupt2).corrupt);

  // 3. execution.completed with non-null provider failure
  const corrupt3 = normalizeRunResultV2({
    runId: 'r3',
    runtime: { exitCode: 0 },
    agentClaim: { status: 'done', summary: 'ok' },
  });
  corrupt3.classification.failure = { family: 'provider', code: 'fake' };
  assert.ok(validateRunResultV2(corrupt3).corrupt);

  // 4. policy.refuse with no policy code
  const corrupt4 = normalizeRunResultV2({
    runId: 'r4',
    runtime: { exitCode: 0 },
    agentClaim: { status: 'done', summary: 'ok' },
  });
  corrupt4.classification.policy = { disposition: 'refuse', code: null };
  assert.ok(validateRunResultV2(corrupt4).corrupt);

  // 5. delivery.replayed without sourceRunId
  const corrupt5 = normalizeRunResultV2({
    runId: 'r5',
    runtime: { exitCode: 0 },
    agentClaim: { status: 'done', summary: 'ok' },
  });
  corrupt5.classification.delivery = { mode: 'replayed' };
  assert.ok(validateRunResultV2(corrupt5).corrupt);
});

test('interpretRunResult interprets legacy v1 deterministically and preserves file bytes exactly', () => {
  const tempDir = mkTempDir();
  const legacyFilePath = path.join(tempDir, 'legacy-result.json');

  const legacyV1Content = JSON.stringify(
    {
      runId: 'run_legacy_42',
      assignmentId: 'asgn_legacy_42',
      status: 'done',
      confidence: 'reported',
      runtime: { exitCode: 0, stdoutLog: 'stdout.log', stderrLog: 'stderr.log' },
      agentClaim: { status: 'done', summary: 'Legacy run succeeded' },
      evidence: { gitBefore: 'sha1', gitAfter: 'sha2', changedFiles: ['file.txt'], artifacts: [] },
    },
    null,
    2,
  ) + '\n';

  fs.writeFileSync(legacyFilePath, legacyV1Content, 'utf8');
  const bytesBefore = fs.readFileSync(legacyFilePath);

  // Interpret legacy result
  const interpreted = interpretRunResult(legacyFilePath);

  // Assert byte preservation on disk
  const bytesAfter = fs.readFileSync(legacyFilePath);
  assert.equal(
    bytesBefore.compare(bytesAfter),
    0,
    'Reading and interpreting legacy result MUST NOT rewrite its bytes on disk (byte preservation invariant)',
  );

  // Assert deterministic interpretation
  assert.equal(interpreted.contract.id, 'assignment-run-result');
  assert.equal(interpreted.contract.version, 2);
  assert.equal(interpreted.runId, 'run_legacy_42');
  assert.equal(interpreted.status, 'done');
  assert.equal(interpreted.confidence, 'reported');
  assert.equal(interpreted.classification.provenance, 'legacy-derived');
  assert.equal(interpreted.classification.delivery.mode, 'legacy-derived');
  assert.equal(interpreted.classification.execution.status, 'completed');
  assert.equal(interpreted.classification.confidence.level, 'reported');
  assert.deepEqual(interpreted.classification.confidence.basis, ['v1-status']);
  assert.equal(interpreted.evidence.sourceVersion, 'v1');
  assert.equal(interpreted.evidence.bytesRewritten, false);
});

test('interpretRunResult treats a present unsupported contract as corrupt, never as legacy v1', () => {
  const nativeV2 = normalizeRunResultV2({
    runId: 'run_contract_demoted',
    assignmentId: 'asgn_contract_demoted',
    runtime: { exitCode: 0, stdoutLog: 'stdout.log' },
    agentClaim: { status: 'done', summary: 'Worker supplied a forged legacy-looking projection.' },
    confidenceLevel: 'reported',
  });

  for (const contract of [
    { id: 'assignment-run-result', version: 1 },
    { id: 'assignment-run-result', version: 3 },
    { id: 'other-run-result', version: 2 },
  ]) {
    const interpreted = interpretRunResult({ ...nativeV2, contract });
    assert.equal(interpreted.contractCorrupt, true);
    assert.equal(interpreted.corrupt, true);
    assert.equal(interpreted.status, 'no-evidence');
    assert.equal(interpreted.confidence, 'failed');
    assert.equal(interpreted.classification.provenance, 'contract-corrupt');
  }
});

// ─── Phase 02 (executor-policy-dispatch-seams): PromptEnvelope evidence ────

test('normalizeRunResultV2: promptEnvelope.persona is derived from policy.persona/provenance.persona, delivery "section", applied true', () => {
  const res = normalizeRunResultV2({
    runId: 'run_persona_001',
    assignmentId: 'asgn_persona_001',
    policy: {
      persona: 'code-reviewer',
      provenance: { persona: { value: 'code-reviewer', source: { scope: 'default', id: 'reviewer' } } },
    },
    runtime: { exitCode: 0, stdoutLog: 'stdout.log' },
    agentClaim: { status: 'done', summary: 'Clean pass' },
    confidenceLevel: 'reported',
  });

  assert.deepEqual(res.promptEnvelope, {
    persona: {
      ref: 'code-reviewer',
      delivery: 'section',
      applied: true,
      source: { scope: 'default', id: 'reviewer' },
    },
  });
});

test('normalizeRunResultV2: promptEnvelope is absent when no persona resolved (additive no-op)', () => {
  const withNoPolicy = normalizeRunResultV2({
    runId: 'run_persona_002',
    assignmentId: 'asgn_persona_002',
    runtime: { exitCode: 0, stdoutLog: 'stdout.log' },
    agentClaim: { status: 'done', summary: 'Clean pass' },
    confidenceLevel: 'reported',
  });
  const withPolicyNoPersona = normalizeRunResultV2({
    runId: 'run_persona_003',
    assignmentId: 'asgn_persona_003',
    policy: { tier: 'standard', persona: undefined },
    runtime: { exitCode: 0, stdoutLog: 'stdout.log' },
    agentClaim: { status: 'done', summary: 'Clean pass' },
    confidenceLevel: 'reported',
  });

  assert.equal('promptEnvelope' in withNoPolicy, false);
  assert.equal('promptEnvelope' in withPolicyNoPersona, false);
});
