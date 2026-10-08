import { test } from 'node:test';
import assert from 'node:assert/strict';

import { outcomeOfRunResult } from '../../../src/runner/execution/unit-run-history.mjs';

// Settled without an outcome field: the result a refused provider capacity leaves behind.
const refusedCapacity = () => ({
  classification: {
    execution: { status: 'failed', exitCode: null },
    assessment: { verdict: 'not-applicable' },
    failure: { family: 'provider', code: 'provider-capacity-refused', message: 'exhausted-or-quarantined' },
    policy: { disposition: 'needs-input', code: 'provider-capacity-refused' },
    provenance: 'native-v2',
  },
});

test('a seat refused for provider capacity is a provider limit, so its pool moves on, never a pass', () => {
  assert.equal(outcomeOfRunResult(refusedCapacity()), 'provider-limit');
});

test('a failed result with no outcome field is a failure, not a pass', () => {
  const result = refusedCapacity();
  result.classification.failure = { family: 'unknown', code: 'something-else' };
  result.classification.policy = { disposition: 'allow' };
  assert.equal(outcomeOfRunResult(result), 'execution-failure');
});

test('a completed result with no outcome field is still derived from its classification', () => {
  assert.equal(outcomeOfRunResult({
    classification: {
      execution: { status: 'completed', exitCode: 0 },
      assessment: { verdict: 'not-applicable' },
      provenance: 'native-v2',
    },
  }), 'pass');
});

test('an explicit outcome wins over derivation, and a result with no classification keeps counting as done', () => {
  assert.equal(outcomeOfRunResult({ classification: { outcome: { category: 'blocked' } } }), 'blocked');
  assert.equal(outcomeOfRunResult({ classification: { outcome: { category: 'infra' }, failure: { code: 'provider-limit' } } }), 'provider-limit');
  assert.equal(outcomeOfRunResult(undefined), 'pass');
});
