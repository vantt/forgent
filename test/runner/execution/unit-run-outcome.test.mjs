import '../../helpers/process-tmp-root.mjs';
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

test('a seat whose named account could not be leased is a provider limit under its own failure code', () => {
  const conflict = refusedCapacity();
  conflict.classification.failure = { family: 'provider', code: 'provider-capacity-lease-conflict', message: 'provider capacity refused for "claude": provider-capacity.lease-conflict' };
  conflict.classification.policy = { disposition: 'needs-input', code: 'provider-capacity-lease-conflict' };
  assert.equal(outcomeOfRunResult(conflict), 'provider-limit');
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

test('an explicit outcome wins over derivation', () => {
  assert.equal(outcomeOfRunResult({ classification: { outcome: { category: 'blocked' } } }), 'blocked');
  assert.equal(outcomeOfRunResult({ classification: { outcome: { category: 'infra' }, failure: { code: 'provider-limit' } } }), 'provider-limit');
});

test('a result with no classification is judged from its legacy record, and one that cannot be read is a failure', () => {
  assert.equal(outcomeOfRunResult({ status: 'failed' }), 'execution-failure');
  assert.equal(outcomeOfRunResult({ status: 'done', confidence: 'verified' }), 'pass');
  assert.equal(outcomeOfRunResult({}), 'execution-failure');
  assert.equal(outcomeOfRunResult(undefined), 'execution-failure');
});
