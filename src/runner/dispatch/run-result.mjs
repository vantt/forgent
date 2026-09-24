// dispatch/run-result.mjs — RunResult Version 2 contract, normalization, validation,
// and deterministic legacy-v1 interpretation (Step 08 / DOEA-03 / DOEA-04 / DOEA-09 / DOEA-11).
//
// Rules:
// - RunResult is the only terminal truth for a Run.
// - Normalizer is the single v2 writer.
// - Legacy result files are read deterministically as legacy-derived v1 without rewriting bytes.
// - Compatibility projections preserve legacy top-level status and confidence.

import fs from 'node:fs';
import { isAssessmentRequired } from './agent-result-claim-contract.mjs';

export const RUN_RESULT_CONTRACT = Object.freeze({ id: 'assignment-run-result', version: 2 });

export const EXECUTION_STATUSES = Object.freeze(['completed', 'failed', 'cancelled', 'completion-unknown']);
export const ASSESSMENT_VERDICTS = Object.freeze(['pass', 'findings', 'blocked', 'inconclusive', 'not-applicable']);
export const CONFIDENCE_LEVELS = Object.freeze(['verified', 'reported', 'inferred', 'no-evidence', 'failed']);
export const FAILURE_FAMILIES = Object.freeze(['provider', 'resource', 'contract', 'policy', 'external-interference', 'unknown']);
export const POLICY_DISPOSITIONS = Object.freeze(['allow', 'refuse', 'needs-input', 'not-applicable']);
export const DELIVERY_MODES = Object.freeze(['fresh', 'resumed', 'replayed', 'recovered', 'legacy-derived']);
export const PROVENANCE_VALUES = Object.freeze(['native-v2', 'legacy-derived', 'contract-corrupt']);

/**
 * Project canonical classification to legacy status string.
 *
 * Rules:
 * - execution.completed + assessment.pass + policy allow => 'done' (or 'no-evidence' if confidence is no-evidence)
 * - execution.completed + assessment.findings => 'failed'
 * - execution.completed + assessment.blocked => 'blocked'
 * - execution.failed => 'failed'
 * - execution.cancelled => 'failed'
 * - execution.completion-unknown => 'no-evidence'
 * - any policy refusal => 'failed' unless execution is completion-unknown
 *
 * @param {object} classification
 * @returns {string}
 */
export function projectLegacyStatus(classification) {
  if (!classification || typeof classification !== 'object') return 'no-evidence';
  const execStatus = classification.execution?.status;
  const assessVerdict = classification.assessment?.verdict;
  const policyDisp = classification.policy?.disposition;
  const confLevel = classification.confidence?.level;

  if (execStatus === 'completion-unknown') {
    return 'no-evidence';
  }

  if (policyDisp === 'refuse') {
    return 'failed';
  }

  if (execStatus === 'cancelled') {
    return 'failed';
  }

  if (execStatus === 'failed') {
    return 'failed';
  }

  if (execStatus === 'completed') {
    if (assessVerdict === 'findings') {
      return 'failed';
    }
    if (assessVerdict === 'blocked') {
      return 'blocked';
    }
    if (assessVerdict === 'pass' || assessVerdict === 'not-applicable') {
      if (confLevel === 'no-evidence') return 'no-evidence';
      if (classification.failure) return 'failed';
      return 'done';
    }
    if (assessVerdict === 'inconclusive') {
      if (confLevel === 'no-evidence') return 'no-evidence';
      return classification.failure ? 'failed' : 'done';
    }
    return 'done';
  }

  return 'no-evidence';
}

/**
 * Project canonical classification to legacy confidence string.
 *
 * @param {object} classification
 * @returns {string}
 */
export function projectLegacyConfidence(classification) {
  if (!classification || typeof classification !== 'object') return 'no-evidence';
  const execStatus = classification.execution?.status;
  const confLevel = classification.confidence?.level;

  if (execStatus === 'completion-unknown' || confLevel === 'no-evidence') {
    return 'no-evidence';
  }

  if (execStatus === 'cancelled') {
    return 'failed';
  }

  if (execStatus === 'failed') {
    return confLevel === 'failed' ? 'failed' : (confLevel || 'failed');
  }

  return confLevel || 'reported';
}

/**
 * Project both legacy status and confidence.
 *
 * @param {object} classification
 * @returns {{ status: string, confidence: string }}
 */
export function projectLegacyStatusAndConfidence(classification) {
  return {
    status: projectLegacyStatus(classification),
    confidence: projectLegacyConfidence(classification),
  };
}

/**
 * Validate a RunResult v2 object against its contract and invariants.
 *
 * @param {unknown} result
 * @returns {{ valid: boolean, corrupt: boolean, reasons: string[] }}
 */
export function validateRunResultV2(result) {
  const reasons = [];
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    return { valid: false, corrupt: true, reasons: ['RunResult must be an object'] };
  }

  if (!result.contract || typeof result.contract !== 'object') {
    reasons.push('contract field is required');
  } else if (result.contract.id !== RUN_RESULT_CONTRACT.id || result.contract.version !== RUN_RESULT_CONTRACT.version) {
    reasons.push(`contract must be {id: "${RUN_RESULT_CONTRACT.id}", version: ${RUN_RESULT_CONTRACT.version}}`);
  }

  if (typeof result.runId !== 'string' || !result.runId.trim()) {
    reasons.push('runId must be a non-empty string');
  }

  const c = result.classification;
  if (!c || typeof c !== 'object' || Array.isArray(c)) {
    return { valid: false, corrupt: true, reasons: ['classification is required and must be an object'] };
  }

  // execution
  if (!c.execution || typeof c.execution !== 'object') {
    reasons.push('classification.execution must be an object');
  } else {
    if (!EXECUTION_STATUSES.includes(c.execution.status)) {
      reasons.push(`classification.execution.status must be one of [${EXECUTION_STATUSES.join(', ')}]`);
    }
    if (c.execution.exitCode !== null && typeof c.execution.exitCode !== 'number') {
      reasons.push('classification.execution.exitCode must be a number or null');
    }
  }

  // assessment
  if (!c.assessment || typeof c.assessment !== 'object') {
    reasons.push('classification.assessment must be an object');
  } else {
    if (!ASSESSMENT_VERDICTS.includes(c.assessment.verdict)) {
      reasons.push(`classification.assessment.verdict must be one of [${ASSESSMENT_VERDICTS.join(', ')}]`);
    }
  }

  // confidence
  if (!c.confidence || typeof c.confidence !== 'object') {
    reasons.push('classification.confidence must be an object');
  } else {
    if (!CONFIDENCE_LEVELS.includes(c.confidence.level)) {
      reasons.push(`classification.confidence.level must be one of [${CONFIDENCE_LEVELS.join(', ')}]`);
    }
    if (!Array.isArray(c.confidence.basis)) {
      reasons.push('classification.confidence.basis must be an array');
    }
  }

  // failure
  if (c.failure !== null && c.failure !== undefined) {
    if (typeof c.failure !== 'object' || Array.isArray(c.failure)) {
      reasons.push('classification.failure must be null or an object');
    } else {
      if (!FAILURE_FAMILIES.includes(c.failure.family)) {
        reasons.push(`classification.failure.family must be one of [${FAILURE_FAMILIES.join(', ')}]`);
      }
      if (typeof c.failure.code !== 'string' || !c.failure.code.trim()) {
        reasons.push('classification.failure.code must be a non-empty string');
      }
    }
  }

  // policy
  if (!c.policy || typeof c.policy !== 'object') {
    reasons.push('classification.policy must be an object');
  } else {
    if (!POLICY_DISPOSITIONS.includes(c.policy.disposition)) {
      reasons.push(`classification.policy.disposition must be one of [${POLICY_DISPOSITIONS.join(', ')}]`);
    }
    if (c.policy.disposition === 'refuse' && (!c.policy.code || typeof c.policy.code !== 'string')) {
      reasons.push('classification.policy.refuse requires a non-empty policy code');
    }
  }

  // delivery
  if (!c.delivery || typeof c.delivery !== 'object') {
    reasons.push('classification.delivery must be an object');
  } else {
    if (!DELIVERY_MODES.includes(c.delivery.mode)) {
      reasons.push(`classification.delivery.mode must be one of [${DELIVERY_MODES.join(', ')}]`);
    }
    if (c.delivery.mode === 'replayed' && (!c.delivery.sourceRunId || typeof c.delivery.sourceRunId !== 'string')) {
      reasons.push('classification.delivery.replayed requires sourceRunId');
    }
  }

  // provenance
  if (!PROVENANCE_VALUES.includes(c.provenance)) {
    reasons.push(`classification.provenance must be one of [${PROVENANCE_VALUES.join(', ')}]`);
  }

  // Invariant: execution.completed with non-null provider failure is contract-corrupt
  if (c.execution?.status === 'completed' && c.failure && c.failure.family === 'provider') {
    reasons.push('execution.completed with provider failure is forbidden (contract-corrupt)');
  }

  // Invariant: assessment.findings without evidence refs or summary
  if (c.assessment?.verdict === 'findings') {
    const hasEvidence =
      (Array.isArray(result.evidence?.findingRefs) && result.evidence.findingRefs.length > 0) ||
      (Array.isArray(result.agentClaim?.evidenceRefs) && result.agentClaim.evidenceRefs.length > 0) ||
      (typeof result.agentClaim?.summary === 'string' && result.agentClaim.summary.trim().length > 0) ||
      (typeof c.assessment?.severityFloor === 'string');
    if (!hasEvidence) {
      reasons.push('assessment.findings requires evidence refs or findings summary');
    }
  }

  // Invariant: stored legacy status and confidence must match projection
  const expectedStatus = projectLegacyStatus(c);
  const expectedConfidence = projectLegacyConfidence(c);
  if (result.status !== expectedStatus) {
    reasons.push(`stored status "${result.status}" does not match projected status "${expectedStatus}"`);
  }
  if (result.confidence !== expectedConfidence) {
    reasons.push(`stored confidence "${result.confidence}" does not match projected confidence "${expectedConfidence}"`);
  }

  const isValid = reasons.length === 0;
  return {
    valid: isValid,
    corrupt: !isValid,
    reasons,
  };
}

/**
 * Construct and normalize a RunResult v2 object.
 *
 * @param {object} params
 * @returns {object} Canonical RunResult v2
 */
export function normalizeRunResultV2({
  runId,
  assignmentId = null,
  workId,
  controlEpoch,
  controlToken,
  executorId = 'cli-spawn',
  executorRedirected,
  policy: dispatchPolicy,
  settledAt,
  durationMs,
  planContentHash,
  claimSha256,
  settleReports = [],
  runtime = {},
  agentClaim = null,
  claimInvalid = false,
  evidence = {},
  role,
  operation,
  isReadOnlyOperation = false,
  deliveryMode = 'fresh',
  sourceRunId = null,
  policyOverride = null,
  failureOverride = null,
  confidenceLevel = null,
  assessmentOverride = null,
} = {}) {
  const exitCode = typeof runtime.exitCode === 'number' ? runtime.exitCode : null;
  const isTimeout = runtime.isTimeout === true;
  const isCancelled = runtime.isCancelled === true;
  const executionError = runtime.executionError || null;

  // 1. Execution status
  let execStatus = 'completed';
  if (isCancelled) {
    execStatus = 'cancelled';
  } else if (isTimeout) {
    execStatus = 'failed';
  } else if (executionError) {
    execStatus = 'failed';
  } else if (exitCode !== null && exitCode !== 0) {
    execStatus = 'failed';
  } else if (exitCode === null && !runtime.stdoutLog && !runtime.stderrLog && !runtime.settledAt) {
    execStatus = 'completion-unknown';
  } else if (exitCode === 0) {
    execStatus = 'completed';
  } else if (exitCode === null) {
    execStatus = 'completion-unknown';
  }

  // 2. Failure classification
  let failure = null;
  if (failureOverride) {
    failure = failureOverride;
  } else if (execStatus === 'completed') {
    failure = null;
  } else if (isTimeout) {
    failure = { family: 'resource', code: 'execution-timeout' };
  } else if (exitCode === 124) {
    failure = { family: 'resource', code: 'execution-timeout' };
  } else if (exitCode === 137) {
    failure = { family: 'resource', code: 'oom-killed' };
  } else if (executionError) {
    failure = {
      family: 'provider',
      code: executionError.code || 'provider-spawn-error',
      message: executionError.message || String(executionError),
    };
  } else if (execStatus === 'cancelled') {
    failure = { family: 'policy', code: 'cancelled' };
  } else if (execStatus === 'completion-unknown') {
    failure = { family: 'unknown', code: 'lost-supervisor' };
  } else if (execStatus === 'failed') {
    failure = { family: 'provider', code: 'nonzero-process-exit' };
  }

  // 3. Assessment classification
  let assessment = { verdict: 'not-applicable' };
  if (assessmentOverride) {
    assessment = assessmentOverride;
  } else if (execStatus === 'failed' || execStatus === 'cancelled') {
    assessment = { verdict: 'not-applicable' };
  } else if (execStatus === 'completion-unknown') {
    assessment = { verdict: 'inconclusive' };
  } else {
    // execStatus === 'completed'
    const isAssessmentRole = isAssessmentRequired({ role, operation }) || role === 'reviewer' || role === 'red-team';
    if (isAssessmentRole) {
      if (agentClaim?.assessment?.verdict && ASSESSMENT_VERDICTS.includes(agentClaim.assessment.verdict)) {
        assessment = {
          verdict: agentClaim.assessment.verdict,
          ...(agentClaim.assessment.severityFloor ? { severityFloor: agentClaim.assessment.severityFloor } : {}),
        };
      } else if (agentClaim?.status === 'failed') {
        assessment = { verdict: 'findings' };
      } else if (agentClaim?.status === 'done') {
        assessment = { verdict: 'pass' };
      } else if (agentClaim?.status === 'blocked') {
        assessment = { verdict: 'blocked' };
      } else {
        assessment = { verdict: 'inconclusive' };
      }
    } else {
      if (agentClaim?.status === 'done') {
        assessment = { verdict: 'pass' };
      } else if (agentClaim?.status === 'blocked') {
        assessment = { verdict: 'blocked' };
      } else if (agentClaim?.status === 'failed') {
        assessment = { verdict: 'not-applicable' };
      } else if (confidenceLevel === 'verified' || confidenceLevel === 'reported' || confidenceLevel === 'inferred') {
        assessment = { verdict: 'pass' };
      } else {
        assessment = { verdict: 'inconclusive' };
      }
    }
  }

  // 4. Confidence classification
  let confLvl = confidenceLevel;
  const basis = [];
  if (agentClaim && !claimInvalid) {
    basis.push('valid-agent-result-claim');
  }
  if (claimInvalid) {
    basis.push('invalid-agent-result-claim');
  }
  if (runtime.stdoutLog) {
    basis.push('captured-stdout');
  }
  if (evidence?.changedFiles && evidence.changedFiles.length > 0) {
    basis.push('workspace-git-diff');
  }
  if (isTimeout) {
    basis.push('timeout');
  }

  if (execStatus === 'completion-unknown') {
    confLvl = 'no-evidence';
    if (!basis.includes('missing-agent-result')) basis.push('missing-agent-result');
  } else if (execStatus === 'cancelled') {
    confLvl = 'failed';
    basis.push('cancelled');
  } else if (execStatus === 'failed') {
    confLvl = 'failed';
    basis.push('failed-exit');
  } else if (claimInvalid) {
    // A malformed/schema-invalid worker claim is a fail-closed signal on its
    // own, independent of whether the process itself exited 0 (Step 04 §5.2
    // "fails closed on malformed/invalid agent-result.json"). `basis` already
    // records 'invalid-agent-result-claim' above; this makes the compat
    // confidence projection agree with it instead of silently falling
    // through to a 'reported'/'verified' guess from process exit alone.
    confLvl = 'failed';
  } else if (!confLvl) {
    if (agentClaim?.status === 'done') {
      confLvl = isReadOnlyOperation ? 'reported' : (evidence.changedFiles?.length > 0 ? 'verified' : 'reported');
    } else {
      confLvl = 'reported';
    }
  }

  // 5. Policy classification
  let policy = { disposition: 'allow', code: null };
  if (policyOverride) {
    policy = policyOverride;
  } else if (claimInvalid) {
    policy = { disposition: 'refuse', code: 'invalid-agent-result-claim' };
  } else if (Array.isArray(evidence?.mutatedDirtyBeforeFiles) && evidence.mutatedDirtyBeforeFiles.length > 0) {
    policy = { disposition: 'refuse', code: 'mutated-dirty-before-files' };
  } else if (isReadOnlyOperation && Array.isArray(evidence?.changedFiles) && evidence.changedFiles.length > 0) {
    policy = { disposition: 'refuse', code: 'read-only-mutation' };
  } else if (execStatus === 'completion-unknown') {
    policy = { disposition: 'needs-input', code: 'completion-unknown' };
  } else if (failure && (failure.family === 'provider' || failure.family === 'resource')) {
    policy = { disposition: 'needs-input', code: failure.code };
  } else if (execStatus === 'failed') {
    policy = { disposition: 'not-applicable', code: null };
  }

  // 6. Delivery classification
  const delivery = {
    mode: deliveryMode || 'fresh',
    ...(deliveryMode === 'replayed' && sourceRunId ? { sourceRunId } : {}),
  };

  const classification = {
    execution: {
      status: execStatus,
      exitCode,
    },
    assessment,
    confidence: {
      level: confLvl,
      basis,
    },
    failure,
    policy,
    delivery,
    provenance: 'native-v2',
  };

  const projectedStatus = projectLegacyStatus(classification);
  const projectedConfidence = projectLegacyConfidence(classification);

  const finalRunResult = {
    contract: { ...RUN_RESULT_CONTRACT },
    runId,
    assignmentId: assignmentId ?? null,
    ...(workId !== undefined ? { workId } : {}),
    ...(controlEpoch !== undefined ? { controlEpoch } : {}),
    ...(controlToken !== undefined ? { controlToken } : {}),
    ...(executorId !== undefined ? { executorId } : {}),
    ...(executorRedirected !== undefined ? { executorRedirected } : {}),
    ...(dispatchPolicy !== undefined ? { policy: dispatchPolicy } : {}),
    // Phase 02 (executor-policy-dispatch-seams, design.md §3.4): derived
    // entirely from `dispatchPolicy` (no new caller-supplied param) --
    // `renderAssignmentPrompt` renders persona as a `# Persona` section
    // whenever `dispatchPolicy.persona` resolved non-null (assignment-runner.mjs's
    // call site threads that exact same value through), so delivery here is
    // deterministically `section`/`applied: true` for this phase. `null`
    // when no persona resolved, additive/absent for any caller that never
    // passes a `policy` object at all.
    ...(dispatchPolicy?.persona
      ? {
          promptEnvelope: {
            persona: {
              ref: dispatchPolicy.persona,
              delivery: 'section',
              applied: true,
              source: dispatchPolicy.provenance?.persona?.source ?? null,
            },
          },
        }
      : {}),
    ...(settledAt !== undefined ? { settledAt } : {}),
    ...(durationMs !== undefined ? { durationMs } : {}),
    ...(planContentHash ? { planContentHash } : {}),
    ...(claimSha256 ? { claimSha256 } : {}),
    settleReports: settleReports ?? [],
    classification,
    status: projectedStatus,
    confidence: projectedConfidence,
    runtime: {
      exitCode,
      ...(runtime.stdoutLog ? { stdoutLog: runtime.stdoutLog } : {}),
      ...(runtime.stderrLog ? { stderrLog: runtime.stderrLog } : {}),
      ...(runtime.settledAt ? { settledAt: runtime.settledAt } : {}),
    },
    // M4 (dispatch-execution-engine architecture review 260920): a
    // synthesized {status,summary} object here used to be indistinguishable
    // from a real worker-written claim to every downstream reader -- the
    // Addendum's own rule is "agent-result.json ... never independent
    // proof", and a normalizer that manufactures one violates that on the
    // worker's behalf. `agentClaim` is emitted only when a real claim was
    // parsed; `runnerNote` (below) carries the same human-readable text
    // under a name that cannot be mistaken for worker attestation, so no
    // information is lost, and the confidence `basis` (computed above from
    // the real input `agentClaim` parameter, not this projection) already
    // omits `'valid-agent-result-claim'` whenever there was none.
    ...(agentClaim ? { agentClaim } : {}),
    runnerNote: {
      status: projectedStatus,
      summary: claimInvalid
        ? 'agent-result.json was present but failed schema validation'
        : (executionError ? executionError.message : (isTimeout ? 'Execution timed out' : 'Settled')),
    },
    evidence: {
      ...evidence,
      gitBefore: evidence?.gitBefore ?? null,
      gitAfter: evidence?.gitAfter ?? null,
      gitBeforeSource: evidence?.gitBeforeSource ?? 'pre-launch',
      changedFiles: evidence?.changedFiles ?? [],
      mutatedDirtyBeforeFiles: evidence?.mutatedDirtyBeforeFiles ?? [],
      artifacts: evidence?.artifacts ?? [],
      tests: evidence?.tests ?? [],
      ...(evidence?.attribution ? { attribution: evidence.attribution } : {}),
      ...(evidence?.findingRefs ? { findingRefs: evidence.findingRefs } : (agentClaim?.evidenceRefs ? { findingRefs: agentClaim.evidenceRefs } : {})),
    },
  };

  return finalRunResult;
}

/**
 * Pure interpreter: reads and interprets RunResult deterministically.
 *
 * For v2 files:
 * Validates against v2 contract and invariants; returns contract-corrupt projection if invalid.
 *
 * For legacy v1 files (contract entirely absent):
 * Deterministically derives classification with provenance: "legacy-derived" WITHOUT rewriting bytes.
 *
 * @param {object|string} input Object or file path
 * @param {object} [options]
 * @returns {object} Interpreted RunResult
 */
export function interpretRunResult(input, options = {}) {
  let rawObj = input;
  let filePath = null;

  if (typeof input === 'string') {
    filePath = input;
    const content = fs.readFileSync(filePath, 'utf8');
    rawObj = JSON.parse(content);
  }

  if (!rawObj || typeof rawObj !== 'object' || Array.isArray(rawObj)) {
    return Object.freeze({
      contract: { ...RUN_RESULT_CONTRACT },
      runId: null,
      assignmentId: null,
      classification: {
        execution: { status: 'completion-unknown', exitCode: null },
        assessment: { verdict: 'inconclusive' },
        confidence: { level: 'failed', basis: ['invalid-json'] },
        failure: { family: 'contract', code: 'invalid-run-result-structure' },
        policy: { disposition: 'refuse', code: 'corrupt-result' },
        delivery: { mode: 'legacy-derived' },
        provenance: 'contract-corrupt',
      },
      status: 'no-evidence',
      confidence: 'failed',
      contractCorrupt: true,
      corrupt: true,
      corruptionReasons: ['Input is not an object'],
      runtime: {},
      evidence: {},
    });
  }

  // A present contract is an explicit claim of a versioned format. Only the
  // complete absence of that field is historical v1; a partial, unknown, or
  // mismatched contract must never demote itself into attacker-controlled v1
  // projections.
  if (rawObj.contract?.version === 2 && rawObj.contract?.id === RUN_RESULT_CONTRACT.id) {
    const validation = validateRunResultV2(rawObj);
    if (!validation.valid) {
      return {
        ...rawObj,
        contract: { ...RUN_RESULT_CONTRACT },
        classification: {
          ...(rawObj.classification || {}),
          provenance: 'contract-corrupt',
        },
        status: 'no-evidence',
        confidence: 'failed',
        contractCorrupt: true,
        corrupt: true,
        corruptionReasons: validation.reasons,
      };
    }
    return { ...rawObj };
  }

  if (rawObj.contract !== undefined) {
    return {
      ...rawObj,
      contract: { ...RUN_RESULT_CONTRACT },
      classification: {
        ...(rawObj.classification || {}),
        provenance: 'contract-corrupt',
      },
      status: 'no-evidence',
      confidence: 'failed',
      contractCorrupt: true,
      corrupt: true,
      corruptionReasons: [
        `contract must be {id: "${RUN_RESULT_CONTRACT.id}", version: ${RUN_RESULT_CONTRACT.version}}`,
      ],
    };
  }

  // An object with no contract, no status, and no runId is not a valid result structure.
  if (!rawObj.contract && !rawObj.status && !rawObj.runId) {
    return Object.freeze({
      contract: { ...RUN_RESULT_CONTRACT },
      runId: null,
      assignmentId: null,
      classification: {
        execution: { status: 'completion-unknown', exitCode: null },
        assessment: { verdict: 'inconclusive' },
        confidence: { level: 'failed', basis: ['invalid-json'] },
        failure: { family: 'contract', code: 'invalid-run-result-structure' },
        policy: { disposition: 'refuse', code: 'corrupt-result' },
        delivery: { mode: 'legacy-derived' },
        provenance: 'contract-corrupt',
      },
      status: 'no-evidence',
      confidence: 'failed',
      contractCorrupt: true,
      corrupt: true,
      corruptionReasons: ['Legacy result must have at least runId or status'],
      runtime: {},
      evidence: {},
    });
  }

  // Historical legacy v1 interpretation
  // Deterministic mapping of legacy status/confidence to classification:
  const legacyStatus = rawObj.status || 'no-evidence';
  const legacyConfidence = rawObj.confidence || (legacyStatus === 'done' ? 'reported' : 'failed');

  let execStatus = 'completed';
  let exitCode = rawObj.runtime?.exitCode ?? null;
  let assessVerdict = 'inconclusive';
  let failure = null;

  if (legacyStatus === 'no-evidence' || legacyConfidence === 'no-evidence') {
    execStatus = 'completion-unknown';
    assessVerdict = 'inconclusive';
    failure = { family: 'unknown', code: 'no-evidence' };
  } else if (legacyStatus === 'failed' && (legacyConfidence === 'failed' || rawObj.runtime?.isTimeout)) {
    execStatus = 'failed';
    assessVerdict = 'not-applicable';
    failure = { family: 'unknown', code: 'legacy-failure' };
    if (exitCode === null) exitCode = 1;
  } else if (legacyStatus === 'failed' && rawObj.agentClaim?.assessment?.verdict === 'findings') {
    // Reviewer finding preserved in legacy result
    execStatus = 'completed';
    exitCode = exitCode ?? 0;
    assessVerdict = 'findings';
    failure = null;
  } else if (legacyStatus === 'blocked') {
    execStatus = 'completed';
    exitCode = exitCode ?? 0;
    assessVerdict = 'blocked';
    failure = null;
  } else if (legacyStatus === 'done') {
    execStatus = 'completed';
    exitCode = exitCode ?? 0;
    assessVerdict = legacyConfidence === 'verified' ? 'pass' : 'inconclusive';
    failure = null;
  } else {
    execStatus = 'completed';
    exitCode = exitCode ?? 0;
    assessVerdict = 'not-applicable';
    failure = null;
  }

  const derivedClassification = {
    execution: {
      status: execStatus,
      ...(exitCode !== null ? { exitCode } : {}),
    },
    assessment: {
      verdict: assessVerdict,
      ...(rawObj.agentClaim?.assessment?.severityFloor ? { severityFloor: rawObj.agentClaim.assessment.severityFloor } : {}),
    },
    confidence: {
      level: legacyConfidence,
      basis: ['v1-status'],
    },
    failure,
    policy: {
      disposition: 'not-applicable',
      code: null,
    },
    delivery: {
      mode: 'legacy-derived',
    },
    provenance: 'legacy-derived',
  };

  const derivedView = {
    contract: { ...RUN_RESULT_CONTRACT },
    runId: rawObj.runId ?? null,
    assignmentId: rawObj.assignmentId ?? null,
    ...(rawObj.workId !== undefined ? { workId: rawObj.workId } : {}),
    ...(rawObj.controlEpoch !== undefined ? { controlEpoch: rawObj.controlEpoch } : {}),
    ...(rawObj.controlToken !== undefined ? { controlToken: rawObj.controlToken } : {}),
    ...(rawObj.executorId !== undefined ? { executorId: rawObj.executorId } : {}),
    ...(rawObj.executorRedirected !== undefined ? { executorRedirected: rawObj.executorRedirected } : {}),
    ...(rawObj.policy !== undefined ? { policy: rawObj.policy } : {}),
    ...(rawObj.settledAt !== undefined ? { settledAt: rawObj.settledAt } : {}),
    ...(rawObj.durationMs !== undefined ? { durationMs: rawObj.durationMs } : {}),
    ...(rawObj.planContentHash ? { planContentHash: rawObj.planContentHash } : {}),
    ...(rawObj.claimSha256 ? { claimSha256: rawObj.claimSha256 } : {}),
    settleReports: rawObj.settleReports ?? [],
    classification: derivedClassification,
    status: legacyStatus,
    confidence: legacyConfidence,
    runtime: rawObj.runtime ?? {},
    agentClaim: rawObj.agentClaim,
    evidence: {
      ...(rawObj.evidence ?? {}),
      sourceVersion: 'v1',
      bytesRewritten: false,
    },
  };

  return derivedView;
}
