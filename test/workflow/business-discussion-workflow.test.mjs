// test/workflow/business-discussion-workflow.test.mjs — the shape of the business-discussion workflow: its steps and the one human gate.
// Running it to its end is owned by playbook-observable-order.test.mjs (order, gate) and advisory-m-contracts.test.mjs (findings, failure).

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { loadWorkflow } from '../../src/workflow/loader.mjs';

test('business-discussion.yaml schema validation & discovery', () => {
  const wf = loadWorkflow('business-discussion');
  assert.equal(wf.id, 'business-discussion');
  assert.equal(wf.steps.length, 6);
  assert.deepEqual(wf.steps.map((s) => s.id), [
    'framing',
    'perspectives',
    'critique',
    'synthesis',
    'approval',
    'action-plan',
  ]);
  assert.ok(wf.steps[4].gate);
  assert.equal(wf.steps[4].gate.kind, 'human');
});
