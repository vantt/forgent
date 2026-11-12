import test from 'node:test';
import assert from 'node:assert/strict';
import { legacyInfrastructureOf, legacyStepOutcomeOf } from '../../src/workflow/legacy-ledger-read.mjs';

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

test('an old unit.complete entry holding a refused seat reads as terminal, with no infrastructure fact of its own', () => {
  const refused = { seat: 'producer', outcome: 'execution-failure', refused: { reason: 'policy', detail: 'x' } };
  assert.equal(legacyInfrastructureOf({ outcome: 'execution-failure', results: [refused] }), false);
  assert.equal(legacyInfrastructureOf({ outcome: 'not-started', results: [{ ...refused, outcome: 'policy-refusal' }] }), false);
});

test('an old step.fail or workflow.fail outcome `refused` reads under its new name, and every other outcome is unchanged', () => {
  assert.equal(legacyStepOutcomeOf('refused'), 'admission-refused');
  for (const outcome of ['admission-refused', 'findings', 'execution-failure', 'failed', undefined]) assert.equal(legacyStepOutcomeOf(outcome), outcome);
});
