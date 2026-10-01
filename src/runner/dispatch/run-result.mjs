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

export const RUN_RESULT_CONTRACT = Object.freeze({ id: 'assignment-run-result', version: 3 });
export const RUN_RESULT_CONTRACT_V2 = Object.freeze({ id: 'assignment-run-result', version: 2 });
export const RUN_RESULT_CONTRACT_V3 = Object.freeze({ id: 'assignment-run-result', version: 3 });
export const EXECUTION_STATUSES = Object.freeze(['completed', 'failed', 'cancelled', 'completion-unknown']);
export const ASSESSMENT_VERDICTS = Object.freeze(['pass', 'findings', 'blocked', 'inconclusive', 'not-applicable']);
export const CONFIDENCE_LEVELS = Object.freeze(['verified', 'reported', 'inferred', 'no-evidence', 'failed']);
export const FAILURE_FAMILIES = Object.freeze(['provider', 'resource', 'contract', 'policy', 'external-interference', 'unknown']);
export const POLICY_DISPOSITIONS = Object.freeze(['allow', 'refuse', 'needs-input', 'not-applicable']);
export const DELIVERY_MODES = Object.freeze(['fresh', 'resumed', 'replayed', 'recovered', 'legacy-derived']);
export const PROVENANCE_VALUES = Object.freeze(['native-v2', 'native-v3', 'legacy-derived', 'contract-corrupt']);
export const RECOGNIZED_LEGACY_STATUSES = Object.freeze(['done', 'failed', 'blocked', 'no-evidence']);

export const CORRUPT_CLASSIFICATION = Object.freeze({
  execution: Object.freeze({ status: 'completion-unknown', exitCode: null }),
  assessment: Object.freeze({ verdict: 'inconclusive' }),
  confidence: Object.freeze({ level: 'failed', basis: Object.freeze(['contract-corrupt']) }),
  failure: Object.freeze({ family: 'contract', code: 'contract-corrupt' }),
  policy: Object.freeze({ disposition: 'refuse', code: 'corrupt-result' }),
  delivery: Object.freeze({ mode: 'legacy-derived' }),
  provenance: 'contract-corrupt',
});

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
function projectLegacyStatus(classification) {
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
function projectLegacyConfidence(classification) {
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
function projectLegacyStatusAndConfidence(classification) {
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
export function validateRunResultV2(result, { expectedRunId } = {}) {
  const reasons = [];
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    return { valid: false, corrupt: true, reasons: ['RunResult must be an object'] };
  }

  if (!result.contract || typeof result.contract !== 'object') {
    reasons.push('contract field is required');
  } else if (result.contract.id !== RUN_RESULT_CONTRACT_V2.id || result.contract.version !== 2) {
    reasons.push(`contract must be {id: "${RUN_RESULT_CONTRACT_V2.id}", version: 2}`);
  }

  if (typeof result.runId !== 'string' || !result.runId.trim()) {
    reasons.push('runId must be a non-empty string');
  } else if (expectedRunId && result.runId !== expectedRunId) {
    reasons.push(`runId "${result.runId}" does not match expectedRunId "${expectedRunId}"`);
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
 * Validate a RunResult v3 object against v3 schema and invariants.
 *
 * @param {object} result
 * @param {object} [options]
 * @param {string} [options.expectedRunId]
 * @returns {{ valid: boolean, corrupt: boolean, reasons: string[] }}
 */
export function validateRunResultV3(result, { expectedRunId } = {}) {
  const reasons = [];
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    return { valid: false, corrupt: true, reasons: ['RunResult must be an object'] };
  }

  if (!result.contract || typeof result.contract !== 'object') {
    reasons.push('contract field is required');
  } else if (result.contract.id !== RUN_RESULT_CONTRACT.id || result.contract.version !== 3) {
    reasons.push(`contract must be {id: "${RUN_RESULT_CONTRACT.id}", version: 3}`);
  }

  if (typeof result.runId !== 'string' || !result.runId.trim()) {
    reasons.push('runId must be a non-empty string');
  } else if (expectedRunId && result.runId !== expectedRunId) {
    reasons.push(`runId "${result.runId}" does not match expectedRunId "${expectedRunId}"`);
  }

  const c = result.classification;
  if (!c || typeof c !== 'object' || Array.isArray(c)) {
    return { valid: false, corrupt: true, reasons: ['classification is required and must be an object'] };
  }

  // execution
  if (!c.execution || typeof c.execution !== 'object') {
    reasons.push('classification.execution must be an object');
  } else if (!EXECUTION_STATUSES.includes(c.execution.status)) {
    reasons.push(`classification.execution.status must be one of [${EXECUTION_STATUSES.join(', ')}]`);
  }

  // assessment
  if (!c.assessment || typeof c.assessment !== 'object') {
    reasons.push('classification.assessment must be an object');
  } else if (!ASSESSMENT_VERDICTS.includes(c.assessment.verdict)) {
    reasons.push(`classification.assessment.verdict must be one of [${ASSESSMENT_VERDICTS.join(', ')}]`);
  }

  // confidence
  if (!c.confidence || typeof c.confidence !== 'object') {
    reasons.push('classification.confidence must be an object');
  } else if (!CONFIDENCE_LEVELS.includes(c.confidence.level)) {
    reasons.push(`classification.confidence.level must be one of [${CONFIDENCE_LEVELS.join(', ')}]`);
  }

  // Invariant (Red Team #2): category is a checked cache:
  // validateRunResultV3 rejects record where classification.outcome.category !== deriveOutcome(classification).category
  const derivedOutcome = deriveOutcome(c);
  if (!c.outcome || typeof c.outcome !== 'object') {
    reasons.push('classification.outcome must be an object in contract v3');
  } else if (c.outcome.category !== derivedOutcome.category) {
    reasons.push(`classification.outcome.category "${c.outcome.category}" does not match deriveOutcome "${derivedOutcome.category}"`);
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
export function normalizeRunResult({
  contractVersion = 3,
  runId,
  assignmentId = null,
  workId,
  controlEpoch,
  controlToken,
  executorId = null,
  adapter = 'cli-spawn',
  confinement = null,
  role = null,
  executorRedirected,
  policy: dispatchPolicy,
  settledAt,
  durationMs = null,
  planContentHash,
  claimSha256,
  settleReports = [],
  runtime = {},
  agentClaim = null,
  claimInvalid = false,
  evidence = {},
  operation,
  isReadOnlyOperation = false,
  deliveryMode = 'fresh',
  sourceRunId = null,
  policyOverride = null,
  failureOverride = null,
  confidenceLevel = null,
  assessmentOverride = null,
  execStatusOverride = null,
  runnerNote = null,
  usage = null,
} = {}) {
  const isV2 = contractVersion === 2;
  const exitCode = typeof runtime.exitCode === 'number' ? runtime.exitCode : null;
  const isTimeout = runtime.isTimeout === true;
  const isCancelled = runtime.isCancelled === true;
  const executionError = runtime.executionError || null;

  // 1. Execution status
  let execStatus = execStatusOverride || 'completed';
  if (!execStatusOverride) {
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
    provenance: isV2 ? 'native-v2' : 'native-v3',
  };
  const contract = isV2 ? { ...RUN_RESULT_CONTRACT_V2 } : { ...RUN_RESULT_CONTRACT_V3 };

  if (!isV2) {
    classification.outcome = deriveOutcome(classification);
  }

  const finalRunResult = {
    contract,
    runId,
    assignmentId: assignmentId ?? null,
    ...(workId !== undefined ? { workId } : {}),
    ...(controlEpoch !== undefined ? { controlEpoch } : {}),
    ...(controlToken !== undefined ? { controlToken } : {}),
    ...(executorId !== undefined && executorId !== null ? { executorId } : {}),
    ...(isV2 ? {} : {
      adapter: adapter ?? 'cli-spawn',
      confinement: confinement ?? null,
      role: role ?? null,
    }),
    ...(executorRedirected !== undefined ? { executorRedirected } : {}),
    ...(dispatchPolicy !== undefined ? { policy: dispatchPolicy } : {}),
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
    settledAt: settledAt || new Date().toISOString(),
    durationMs: typeof durationMs === 'number' ? durationMs : null,
    ...(planContentHash ? { planContentHash } : {}),
    ...(claimSha256 ? { claimSha256 } : {}),
    settleReports: settleReports ?? [],
    classification,
    ...(isV2 ? {
      status: projectLegacyStatus(classification),
      confidence: projectLegacyConfidence(classification),
    } : {}),
    runtime: {
      exitCode,
      ...(runtime.stdoutLog ? { stdoutLog: runtime.stdoutLog } : {}),
      ...(runtime.stderrLog ? { stderrLog: runtime.stderrLog } : {}),
      ...(runtime.settledAt ? { settledAt: runtime.settledAt } : {}),
    },
    ...(agentClaim ? { agentClaim } : {}),
    runnerNote: runnerNote
      ? (typeof runnerNote === 'string' ? { summary: runnerNote } : runnerNote)
      : {
          summary: claimInvalid
            ? 'agent-result.json was present but failed schema validation'
            : (executionError ? executionError.message : (isTimeout ? 'Execution timed out' : 'Settled')),
        },
    usage: usage ?? null,
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

  if (!isV2) {
    Object.defineProperty(finalRunResult, 'status', {
      get() {
        if (this.classification?.outcome?.category === 'ok') return 'done';
        if (this.classification?.outcome?.category === 'blocked') return 'blocked';
        if (this.classification?.confidence?.level === 'no-evidence') return 'no-evidence';
        return 'failed';
      },
      set(v) {
        Object.defineProperty(this, 'status', { value: v, writable: true, configurable: true, enumerable: true });
      },
      enumerable: false,
      configurable: true,
    });
    Object.defineProperty(finalRunResult, 'confidence', {
      get() {
        return this.classification?.confidence?.level ?? null;
      },
      set(v) {
        Object.defineProperty(this, 'confidence', { value: v, writable: true, configurable: true, enumerable: true });
      },
      enumerable: false,
      configurable: true,
    });
  }
  return finalRunResult;
}

export function normalizeRunResultV2(params) {
  return normalizeRunResult({ ...params, contractVersion: 2 });
}

export function normalizeRunResultV3(params) {
  return normalizeRunResult({ ...params, contractVersion: 3 });
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
  const expectedRunId = typeof options === 'string' ? options : options?.expectedRunId;
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
      resultCorrupt: true,
      corrupt: true,
      corruptionReasons: ['Input is not an object'],
      runtime: {},
      evidence: {},
    });
  }

  if (expectedRunId) {
    if (!rawObj.runId) {
      return Object.freeze({
        contract: { ...RUN_RESULT_CONTRACT },
        runId: null,
        assignmentId: rawObj.assignmentId ?? null,
        classification: {
          execution: { status: 'completion-unknown', exitCode: null },
          assessment: { verdict: 'inconclusive' },
          confidence: { level: 'failed', basis: ['run-id-missing'] },
          failure: { family: 'contract', code: 'run-id-missing' },
          policy: { disposition: 'refuse', code: 'corrupt-result' },
          delivery: { mode: 'legacy-derived' },
          provenance: 'contract-corrupt',
        },
        status: 'no-evidence',
        confidence: 'failed',
        contractCorrupt: true,
        resultCorrupt: true,
        corrupt: true,
        corruptionReasons: [`runId is missing but expectedRunId was specified ("${expectedRunId}")`],
        runtime: rawObj.runtime ?? {},
        evidence: rawObj.evidence ?? {},
      });
    }
    if (rawObj.runId !== expectedRunId) {
      return Object.freeze({
        contract: { ...RUN_RESULT_CONTRACT },
        runId: rawObj.runId,
        assignmentId: rawObj.assignmentId ?? null,
        classification: {
          execution: { status: 'completion-unknown', exitCode: null },
          assessment: { verdict: 'inconclusive' },
          confidence: { level: 'failed', basis: ['run-id-mismatch'] },
          failure: { family: 'contract', code: 'run-id-mismatch' },
          policy: { disposition: 'refuse', code: 'corrupt-result' },
          delivery: { mode: 'legacy-derived' },
          provenance: 'contract-corrupt',
        },
        status: 'no-evidence',
        confidence: 'failed',
        contractCorrupt: true,
        resultCorrupt: true,
        corrupt: true,
        corruptionReasons: [`runId "${rawObj.runId}" does not match expectedRunId "${expectedRunId}"`],
        runtime: rawObj.runtime ?? {},
        evidence: rawObj.evidence ?? {},
      });
    }
  }

  // A present contract is an explicit claim of a versioned format. Only the
  // complete absence of that field is historical v1; a partial, unknown, or
  // mismatched contract must never demote itself into attacker-controlled v1
  // projections.
  if (rawObj.contract?.version === 3 && rawObj.contract?.id === RUN_RESULT_CONTRACT.id) {
    const validation = validateRunResultV3(rawObj, { expectedRunId });
    if (!validation.valid) {
      return {
        ...rawObj,
        contract: { id: RUN_RESULT_CONTRACT.id, version: 3 },
        classification: { ...CORRUPT_CLASSIFICATION },
        status: 'no-evidence',
        confidence: 'failed',
        contractCorrupt: true,
        resultCorrupt: true,
        corrupt: true,
        corruptionReasons: validation.reasons,
      };
    }
    const resultObj = { ...rawObj };
    Object.defineProperty(resultObj, 'status', {
      get() {
        if (this.classification?.outcome?.category === 'ok') return 'done';
        if (this.classification?.outcome?.category === 'blocked') return 'blocked';
        if (this.classification?.confidence?.level === 'no-evidence') return 'no-evidence';
        return 'failed';
      },
      set(v) {
        Object.defineProperty(this, 'status', { value: v, writable: true, configurable: true, enumerable: true });
      },
      enumerable: false,
      configurable: true,
    });
    Object.defineProperty(resultObj, 'confidence', {
      get() {
        return this.classification?.confidence?.level ?? null;
      },
      set(v) {
        Object.defineProperty(this, 'confidence', { value: v, writable: true, configurable: true, enumerable: true });
      },
      enumerable: false,
      configurable: true,
    });
    return resultObj;
  }

  if (rawObj.contract?.version === 2 && rawObj.contract?.id === RUN_RESULT_CONTRACT.id) {
    const validation = validateRunResultV2(rawObj, { expectedRunId });
    if (!validation.valid) {
      return {
        ...rawObj,
        contract: { ...RUN_RESULT_CONTRACT_V2 },
        classification: { ...CORRUPT_CLASSIFICATION },
        status: 'no-evidence',
        confidence: 'failed',
        contractCorrupt: true,
        resultCorrupt: true,
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
        classification: { ...CORRUPT_CLASSIFICATION },
      status: 'no-evidence',
      confidence: 'failed',
      contractCorrupt: true,
      resultCorrupt: true,
      corrupt: true,
      corruptionReasons: [
        `contract must be {id: "${RUN_RESULT_CONTRACT.id}", version: 2|3}`,
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
      resultCorrupt: true,
      corrupt: true,
      corruptionReasons: ['Legacy result must have at least runId or status'],
      runtime: {},
      evidence: {},
    });
  }

  // For legacy results, an explicit status must be one of the recognized legacy statuses.
  if (rawObj.status !== undefined && rawObj.status !== null && !RECOGNIZED_LEGACY_STATUSES.includes(rawObj.status)) {
    return Object.freeze({
      contract: { ...RUN_RESULT_CONTRACT },
      runId: rawObj.runId ?? null,
      assignmentId: rawObj.assignmentId ?? null,
      classification: {
        execution: { status: 'completion-unknown', exitCode: null },
        assessment: { verdict: 'inconclusive' },
        confidence: { level: 'failed', basis: ['invalid-status'] },
        failure: { family: 'contract', code: 'non-standard-status' },
        policy: { disposition: 'refuse', code: 'corrupt-result' },
        delivery: { mode: 'legacy-derived' },
        provenance: 'contract-corrupt',
      },
      status: 'no-evidence',
      confidence: 'failed',
      contractCorrupt: true,
      resultCorrupt: true,
      corrupt: true,
      corruptionReasons: [
        `status "${rawObj.status}" is not a recognized status (must be one of [${RECOGNIZED_LEGACY_STATUSES.join(', ')}])`,
      ],
      runtime: rawObj.runtime ?? {},
      evidence: rawObj.evidence ?? {},
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
    assessVerdict = 'pass';
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
    contract: { ...RUN_RESULT_CONTRACT_V2 },
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

/**
 * Outcome categories ordered from highest to lowest confidence/precedence.
 */
export const OUTCOME_CATEGORIES = Object.freeze(['ok', 'verdict', 'blocked', 'policy', 'infra', 'corrupt']);

/**
 * Derive high-level outcome from RunResult classification.
 * Rules evaluated in strict order (Red Team finding #1):
 * 1. execution.status in {failed, cancelled, completion-unknown} and failure.family in {provider, resource, unknown} (or no failure) -> infra
 * 2. policy.disposition === 'refuse' OR failure.family in {contract, policy} -> policy
 * 3. policy.disposition === 'needs-input' -> infra
 * 4. verdict === 'findings' -> verdict
 * 5. verdict === 'blocked' -> blocked
 * 6. execution.status === 'completed' and verdict in {pass, not-applicable} -> ok
 * 7. remaining (e.g. inconclusive) -> verdict
 *
 * @param {object} classification
 * @returns {Readonly<{category: 'ok'|'infra'|'verdict'|'policy'|'blocked'|'corrupt', reason: string}>}
 */
export function deriveOutcome(classification) {
  if (!classification || typeof classification !== 'object') {
    return Object.freeze({
      category: 'corrupt',
      reason: 'classification must be a non-null object',
    });
  }

  if (classification.provenance === 'contract-corrupt') {
    return Object.freeze({
      category: 'corrupt',
      reason: 'classification provenance is contract-corrupt',
    });
  }

  const execStatus = classification.execution?.status;
  const failureFamily = classification.failure?.family;
  const policyDisp = classification.policy?.disposition;
  const verdict = classification.assessment?.verdict;

  // Rule 1: execution failed/cancelled/unknown with provider/resource/unknown failure (or no failure)
  const isFailedExec = execStatus === 'failed' || execStatus === 'cancelled' || execStatus === 'completion-unknown';
  const isInfraFailure = failureFamily === 'provider' || failureFamily === 'resource' || failureFamily === 'unknown' || !failureFamily;
  if (isFailedExec && isInfraFailure) {
    return Object.freeze({
      category: 'infra',
      reason: classification.failure?.code ?? (execStatus || 'execution-failed'),
    });
  }

  // Rule 2: policy refusal or contract/policy failure family
  if (policyDisp === 'refuse' || failureFamily === 'contract' || failureFamily === 'policy') {
    return Object.freeze({
      category: 'policy',
      reason: classification.policy?.code ?? classification.failure?.code ?? 'policy-refused',
    });
  }

  // Rule 3: policy disposition needs-input -> infra (provider/resource requires human)
  if (policyDisp === 'needs-input') {
    return Object.freeze({
      category: 'infra',
      reason: classification.policy?.code ?? 'needs-input',
    });
  }

  // Rule 4: reviewer findings
  if (verdict === 'findings') {
    return Object.freeze({
      category: 'verdict',
      reason: 'reviewer-findings',
    });
  }

  // Rule 5: blocked verdict
  if (verdict === 'blocked') {
    return Object.freeze({
      category: 'blocked',
      reason: 'verdict-blocked',
    });
  }

  // Rule 6: completed execution with pass or not-applicable verdict
  if (execStatus === 'completed' && (verdict === 'pass' || verdict === 'not-applicable')) {
    return Object.freeze({
      category: 'ok',
      reason: 'completed-pass',
    });
  }

  // Rule 7: remaining (e.g. inconclusive) -> verdict
  return Object.freeze({
    category: 'verdict',
    reason: `verdict-${verdict ?? 'inconclusive'}`,
  });
}

/**
 * Derive outcome for legacy v1 RunResult.
 *
 * @param {object} recordV1
 * @returns {Readonly<{category: 'ok'|'infra'|'verdict'|'policy'|'blocked'|'corrupt', reason: string}>}
 */
export function deriveLegacyOutcome(recordV1) {
  const interpreted = interpretRunResult(recordV1);
  return deriveOutcome(interpreted.classification);
}

function deriveEvidenceFloor(evidenceFloor) {
  if (!evidenceFloor || typeof evidenceFloor !== 'object') return null;
  if (evidenceFloor.status !== undefined && evidenceFloor.confidence !== undefined) {
    return evidenceFloor;
  }
  const exitCode = typeof evidenceFloor.exitCode === 'number' ? evidenceFloor.exitCode : null;
  const signal = typeof evidenceFloor.signal === 'string' ? evidenceFloor.signal : null;
  const isTimeout = evidenceFloor.isTimeout === true;
  const agentClaim = evidenceFloor.agentClaim ?? null;
  const claimInvalid = evidenceFloor.claimInvalid === true;
  const workerArtifacts = Array.isArray(evidenceFloor.workerArtifacts) ? evidenceFloor.workerArtifacts : [];
  const changedFiles = Array.isArray(evidenceFloor.changedFiles) ? evidenceFloor.changedFiles : [];
  const hasDirtyBeforeMutation = evidenceFloor.hasDirtyBeforeMutation === true;
  const isReadOnlyOperation = evidenceFloor.isReadOnlyOperation === true;

  if (isTimeout || (exitCode !== null && exitCode !== undefined && exitCode !== 0) || signal) {
    return { status: 'failed', confidence: 'failed' };
  }
  if (claimInvalid) {
    return { status: 'failed', confidence: 'failed' };
  }
  const companionReportArtifacts = workerArtifacts.filter(
    (p) => typeof p === 'string' && !p.endsWith('agent-result.json') && !/[/\\]outbox[/\\]result-\d+\.json$/.test(p),
  );
  const hasWorkerReport = companionReportArtifacts.length > 0;

  if (agentClaim?.status === 'failed') {
    const isFindingVerdict = agentClaim?.assessment?.verdict === 'findings';
    if (isFindingVerdict && hasWorkerReport && exitCode === 0 && !isTimeout) {
      return { status: 'failed', confidence: 'reported' };
    }
    return { status: 'failed', confidence: 'failed' };
  }

  const hasExternalEvidence = changedFiles.length > 0 || hasDirtyBeforeMutation;
  if (isReadOnlyOperation && hasExternalEvidence) {
    return { status: 'failed', confidence: 'failed' };
  }
  if (agentClaim?.status === 'blocked') {
    return { status: 'blocked', confidence: 'reported' };
  }
  if (agentClaim && agentClaim.status === 'done') {
    if (isReadOnlyOperation) {
      return hasWorkerReport ? { status: 'done', confidence: 'reported' } : { status: 'no-evidence', confidence: 'no-evidence' };
    }
    return hasExternalEvidence ? { status: 'done', confidence: 'verified' } : { status: 'no-evidence', confidence: 'no-evidence' };
  }
  if (!isReadOnlyOperation && hasExternalEvidence) {
    return { status: 'done', confidence: 'inferred' };
  }
  return { status: 'no-evidence', confidence: 'no-evidence' };
}
/**
 * Unified helper for reading RunResult outcome.
 * Single path for all dispatch, coordination, loop, show, and legality decisions.
 *
 * @param {object|string} resultOrPath
 * @param {object} [options]
 * @param {object} [options.evidenceFloor]
 * @returns {Readonly<{
 *   category: 'ok'|'infra'|'verdict'|'policy'|'blocked'|'corrupt',
 *   executed: 'completed'|'failed'|'cancelled'|'unknown',
 *   verdict: 'pass'|'findings'|'blocked'|'inconclusive'|'not-applicable',
 *   refused: boolean,
 *   evidence: 'verified'|'reported'|'inferred'|'none'|'failed',
 *   satisfied: boolean,
 *   infraFailure: boolean,
 *   failure: object|null
 * }>}
 */
export function runOutcome(resultOrPath, { evidenceFloor } = {}) {
  const derivedFloor = evidenceFloor && typeof evidenceFloor === 'object' ? deriveEvidenceFloor(evidenceFloor) : null;
  const result = typeof resultOrPath === 'string'
    ? interpretRunResult(resultOrPath)
    : (resultOrPath?.classification !== undefined || resultOrPath?.contract !== undefined
      ? interpretRunResult(resultOrPath)
      : interpretRunResult(resultOrPath));

  // Fail-closed with corrupt records
  if (
    !result ||
    result.corrupt ||
    result.contractCorrupt ||
    result.resultCorrupt ||
    result.classification?.provenance === 'contract-corrupt'
  ) {
    const evidenceLevel = (derivedFloor?.confidence === 'no-evidence' || derivedFloor?.status === 'no-evidence')
      ? 'no-evidence'
      : 'failed';
    return Object.freeze({
      category: 'corrupt',
      executed: 'unknown',
      verdict: 'inconclusive',
      refused: true,
      evidence: evidenceLevel,
      satisfied: false,
      infraFailure: true,
      failure: result?.classification?.failure ?? { family: 'contract', code: 'corrupt-record' },
    });
  }

  // Extract / derive outcome
  let outcome = result.classification?.outcome?.category
    ? result.classification.outcome
    : deriveOutcome(result.classification);

  let category = outcome.category;
  let evidence = result.classification?.confidence?.level ?? 'none';

  // Apply evidenceFloor downgrade if provided
  if (derivedFloor) {
    const settlesAdvance = category === 'ok' && (evidence === 'reported' || evidence === 'verified');
    const derivedAdvances = derivedFloor.status === 'done' && (derivedFloor.confidence === 'reported' || derivedFloor.confidence === 'verified');

    if (!derivedAdvances || settlesAdvance) {
      if (derivedFloor.status === 'failed') {
        category = 'infra';
        evidence = derivedFloor.confidence ?? 'failed';
      } else if (derivedFloor.status === 'no-evidence') {
        category = 'infra';
        evidence = derivedFloor.confidence ?? 'no-evidence';
      }
    }
  }

  const executed = result.classification?.execution?.status ?? 'unknown';
  const verdict = result.classification?.assessment?.verdict ?? 'inconclusive';
  const refused = category === 'policy' || result.classification?.policy?.disposition === 'refuse';
  const satisfied = category === 'ok';
  const infraFailure = category === 'infra' || category === 'corrupt';
  const failure = result.classification?.failure ?? null;

  return Object.freeze({
    category,
    executed,
    verdict,
    refused,
    evidence,
    satisfied,
    infraFailure,
    failure,
  });
}
