import test from 'node:test';
import assert from 'node:assert/strict';
import { legacyInfrastructureOf } from '../../src/workflow/legacy-ledger-read.mjs';

// The one reader of unit.complete entries written before Execution handed up `infrastructure`: they hold an
// outcome string, seat results and, when non-empty, `outOfScope`. Each answer is the one Workflow gave before.
test('an old unit.complete entry that ended on infrastructure with no verdict, refusal-free and in scope reads as infrastructure', () => {
  for (const outcome of ['execution-failure', 'not-started']) {
    assert.equal(legacyInfrastructureOf({ outcome, results: [{ seat: 'producer', outcome, runResult: {} }] }), true, outcome);
  }
});

test('an old unit.complete entry that passed, wrote out of scope or holds a seat verdict never reads as infrastructure', () => {
  assert.equal(legacyInfrastructureOf({ outcome: 'pass', results: [] }), false, 'a pass is not read as infrastructure');
  assert.equal(legacyInfrastructureOf({ outcome: 'findings', results: [] }), false);
  assert.equal(legacyInfrastructureOf({ outcome: 'execution-failure', outOfScope: ['a.txt'], results: [] }), false);
  assert.equal(legacyInfrastructureOf({ outcome: 'execution-failure', results: [{ seat: 'reviewer', posture: { verdict: true }, outcome: 'findings' }] }), false);
});
