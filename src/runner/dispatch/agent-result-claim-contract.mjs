// Worker-authored agent-result claims are untrusted input.  This module owns
// their v2 shape and the worker instructions derived from that same shape; it
// deliberately does not create proof, evidence, or a RunResult.

export const AGENT_RESULT_CLAIM_CONTRACT = Object.freeze({ id: 'agent-result-claim', version: 2 });
export const ALLOWED_AGENT_CLAIM_STATUSES = Object.freeze(['done', 'blocked', 'failed', 'no-evidence']);
export const ASSESSMENT_VERDICTS = Object.freeze(['pass', 'findings', 'blocked', 'inconclusive', 'not-applicable']);

export const CLAIM_FIELD_RULES = Object.freeze([
  Object.freeze({ path: 'status', description: `exactly one of: ${ALLOWED_AGENT_CLAIM_STATUSES.join(' | ')}`, required: true }),
  Object.freeze({ path: 'summary', description: 'a required non-empty string', required: true }),
  Object.freeze({ path: 'blocker', description: 'a non-empty string when status is "blocked"', requiredWhen: 'blocked' }),
  Object.freeze({ path: 'error', description: 'a non-empty string or object when status is "failed"', requiredWhen: 'failed' }),
  Object.freeze({ path: 'evidenceRefs', description: 'an array of non-empty strings if provided' }),
]);

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

export function isAssessmentRequired(context = {}) {
  const role = context.role ?? context.assignment?.role;
  const operation = context.operation ?? context.assignment?.operation;
  return role === 'reviewer' || role === 'red-team' || (typeof operation === 'string' && operation.includes('recheck'));
}

export function assessmentRequirement(context = {}) {
  return isAssessmentRequired(context)
    ? Object.freeze({ required: true, path: 'assessment.verdict', allowed: ASSESSMENT_VERDICTS })
    : Object.freeze({ required: false, path: 'assessment.verdict', allowed: ASSESSMENT_VERDICTS });
}

/** Render only claim instructions. Callers own artifact paths and surrounding prose. */
export function renderAgentResultClaimInstructions(context = {}) {
  const lines = [
    `- "contract" may be omitted only for legacy claim input; for v2 use {"id":"${AGENT_RESULT_CLAIM_CONTRACT.id}","version":${AGENT_RESULT_CLAIM_CONTRACT.version}}`,
    ...CLAIM_FIELD_RULES.map((field) => `- "${field.path}" must be ${field.description}`),
    '- Nothing in this claim is proof; evidenceRefs remain untrusted until independently validated',
  ];
  if (assessmentRequirement(context).required) {
    lines.push(`- "assessment.verdict" is required for this assessment role and must be one of: ${ASSESSMENT_VERDICTS.join(' | ')}`);
  }
  return lines.join('\n');
}

/**
 * Validate an untrusted claim. Missing `contract` is interpreted as a legacy
 * claim and checked only against the legacy fields; it is never upgraded to a
 * v2 claim or proof. A present contract must be exactly this v2 contract.
 */
export function validateAgentResultClaimContract(value, context = {}) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { valid: false, reason: 'agent-result.json must be a JSON object' };
  }
  const legacy = value.contract === undefined;
  if (!legacy) {
    if (value.contract === null || typeof value.contract !== 'object' || Array.isArray(value.contract)
      || value.contract.id !== AGENT_RESULT_CLAIM_CONTRACT.id || value.contract.version !== AGENT_RESULT_CLAIM_CONTRACT.version) {
      return { valid: false, reason: `agent-result.json contract must be {id:"${AGENT_RESULT_CLAIM_CONTRACT.id}",version:${AGENT_RESULT_CLAIM_CONTRACT.version}}` };
    }
  }
  const summaryRule = CLAIM_FIELD_RULES.find((field) => field.path === 'summary');
  const blockerRule = CLAIM_FIELD_RULES.find((field) => field.path === 'blocker');
  const errorRule = CLAIM_FIELD_RULES.find((field) => field.path === 'error');
  const evidenceRefsRule = CLAIM_FIELD_RULES.find((field) => field.path === 'evidenceRefs');
  if (!ALLOWED_AGENT_CLAIM_STATUSES.includes(value.status)) {
    return { valid: false, reason: `agent-result.json status must be one of [${ALLOWED_AGENT_CLAIM_STATUSES.join(', ')}]; got: ${JSON.stringify(value.status)}` };
  }
  if (!nonEmptyString(value.summary)) return { valid: false, reason: `agent-result.json requires non-empty summary (${summaryRule.description})` };
  if (value.status === blockerRule.requiredWhen && !nonEmptyString(value.blocker)) return { valid: false, reason: `agent-result.json with status "blocked" requires blocker: ${blockerRule.description}` };
  const validError = legacy
    ? nonEmptyString(value.error)
    : (nonEmptyString(value.error) || (value.error !== null && typeof value.error === 'object' && !Array.isArray(value.error)));
  if (value.status === errorRule.requiredWhen && !validError) {
    return { valid: false, reason: `agent-result.json with status "failed" requires error: ${errorRule.description}` };
  }
  if (value.evidenceRefs !== undefined && (!Array.isArray(value.evidenceRefs) || value.evidenceRefs.some((ref) => !nonEmptyString(ref)))) {
    return { valid: false, reason: `agent-result.json evidenceRefs must be ${evidenceRefsRule.description}` };
  }
  if (!legacy && isAssessmentRequired(context)) {
    if (value.assessment === null || typeof value.assessment !== 'object' || Array.isArray(value.assessment)
      || !ASSESSMENT_VERDICTS.includes(value.assessment.verdict)) {
      return { valid: false, reason: `agent-result.json for this assessment role requires assessment.verdict one of [${ASSESSMENT_VERDICTS.join(', ')}]` };
    }
  }
  // Keep the validator's historical success shape byte-compatible. The
  // missing-contract branch above is an interpretation rule only: callers
  // receive accepted input, never an upgraded v2 proof marker.
  return { valid: true };
}
