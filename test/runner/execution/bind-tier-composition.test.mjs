// The tier a seat runs at is composed by the crate (docs/specs/seat-binding.md sections 5.4 and 6.3); the golden
// vectors own those cases, `bind.test` the facade carrying the answer. What stays Node's is the name of a
// workflow seat's recommendation.

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { workflowTierOf } from '../../../src/runner/execution/seat-resolver.mjs';

test('a workflow seat recommendation names the workflow, the unit and the seat, and drops the workflow when the run does not know it', () => {
  const seat = { seat: 'system', tier: 'frontier' };
  assert.deepEqual(workflowTierOf(seat, { id: 'shape-proposals' }, 'architecture-advisory'), { tier: 'frontier', source: 'workflow:architecture-advisory/shape-proposals/system' });
  assert.deepEqual(workflowTierOf(seat, { id: 'shape-proposals' }), { tier: 'frontier', source: 'workflow:shape-proposals/system' });
  assert.equal(workflowTierOf({ seat: 'system' }, { id: 'shape-proposals' }, 'architecture-advisory'), undefined);
});
