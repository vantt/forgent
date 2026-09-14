import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENT_RESULT_CLAIM_CONTRACT,
  ALLOWED_AGENT_CLAIM_STATUSES,
  ASSESSMENT_VERDICTS,
  CLAIM_FIELD_RULES,
  isAssessmentRequired,
  renderAgentResultClaimInstructions,
  validateAgentResultClaimContract,
} from '../../src/runner/dispatch/agent-result-claim-contract.mjs';

test('v2 contract validates status-dependent fields while preserving missing-contract claims as legacy input', () => {
  assert.deepEqual(AGENT_RESULT_CLAIM_CONTRACT, { id: 'agent-result-claim', version: 2 });
  assert.deepEqual(validateAgentResultClaimContract({ status: 'done', summary: 'legacy input' }), { valid: true });
  assert.deepEqual(validateAgentResultClaimContract({ contract: AGENT_RESULT_CLAIM_CONTRACT, status: 'failed', summary: 'failed', error: { code: 'EFAIL' } }), { valid: true });
  assert.equal(validateAgentResultClaimContract({ contract: { id: 'agent-result-claim', version: 1 }, status: 'done', summary: 'old contract' }).valid, false);
  assert.equal(validateAgentResultClaimContract({ status: 'blocked', summary: 'stuck' }).valid, false);
  assert.equal(validateAgentResultClaimContract({ status: 'failed', summary: 'bad' }).valid, false);
});

test('assessment requirements cover reviewer, red-team, and recheck contexts', () => {
  for (const context of [{ role: 'reviewer' }, { role: 'red-team' }, { operation: 'reviewer-recheck' }]) {
    assert.equal(isAssessmentRequired(context), true);
    assert.equal(validateAgentResultClaimContract({ status: 'done', summary: 'finished' }, context).valid, false);
    assert.deepEqual(validateAgentResultClaimContract({ status: 'done', summary: 'finished', assessment: { verdict: 'pass' } }, context), { valid: true });
  }
});

test('prompt and validator derive every required field and vocabulary from the same contract source', () => {
  const prompt = renderAgentResultClaimInstructions({ role: 'reviewer' });
  for (const status of ALLOWED_AGENT_CLAIM_STATUSES) assert.ok(prompt.includes(status), `prompt missing status ${status}`);
  for (const field of CLAIM_FIELD_RULES.filter((rule) => rule.required || rule.requiredWhen)) {
    assert.ok(prompt.includes(field.path), `prompt missing validator-required field ${field.path}`);
    assert.ok(prompt.includes(field.description), `prompt missing validator-required rule for ${field.path}`);
  }
  assert.ok(prompt.includes('assessment.verdict'), 'prompt missing assessment requirement');
  for (const verdict of ASSESSMENT_VERDICTS) assert.ok(prompt.includes(verdict), `prompt missing assessment verdict ${verdict}`);
});
