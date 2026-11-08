// test/workflow/definition.test.mjs — the Workflow definition contract: what validateWorkflow refuses and how it reads a step

import test from 'node:test';
import assert from 'node:assert/strict';

import { validateWorkflow, WorkflowDefinitionError } from '../../src/workflow/definition.mjs';
import { dependencyOrder } from '../../src/workflow/steps.mjs';

const refuses = (raw, pattern, options) => assert.throws(() => validateWorkflow(raw, options), (err) => {
  assert.ok(err instanceof WorkflowDefinitionError, String(err));
  assert.match(err.message, pattern);
  return true;
});

test('a dependsOn cycle between steps is refused at load, naming the steps that wait on each other', () => {
  refuses({ id: 'loop', steps: [{ id: 'a', dependsOn: ['b'] }, { id: 'b', dependsOn: ['a'] }] }, /Workflow "loop" steps "a", "b" wait on each other/);
  refuses({ id: 'loop', steps: [{ id: 'a' }, { id: 'b', dependsOn: ['a', 'c'] }, { id: 'c', dependsOn: ['b'] }] }, /steps "b", "c" wait on each other/);
});

test('dependencyOrder keeps the list order where dependsOn allows and reports what is stuck', () => {
  const nodes = [{ id: 'c', dependsOn: ['a'] }, { id: 'a', dependsOn: [] }, { id: 'b', dependsOn: ['c'] }];
  assert.deepEqual(dependencyOrder(nodes).ordered.map((n) => n.id), ['a', 'c', 'b']);
  assert.deepEqual(dependencyOrder(nodes).stuck, []);
  const cyclic = dependencyOrder([{ id: 'x', dependsOn: ['y'] }, { id: 'y', dependsOn: ['x'] }, { id: 'z', dependsOn: [] }]);
  assert.deepEqual(cyclic.ordered.map((n) => n.id), ['z']);
  assert.deepEqual(cyclic.stuck.map((n) => n.id), ['x', 'y']);
});

test('infrastructure fields are refused on the workflow, a step, a unit, its template and an operation, with the one message per place', () => {
  const step = (extra) => ({ id: 'wf', steps: [{ id: 's', ...extra }] });
  refuses({ id: 'wf', provider: 'x', steps: [{ id: 's' }] }, /Workflow definition "wf" contains disallowed infrastructure field "provider" \(G2 constraint: Workflow is non-infrastructure\)/);
  refuses(step({ model: 'x' }), /steps\[0\] \(id: "s"\) contains disallowed infrastructure field "model" \(G2 constraint\)/);
  refuses(step({ units: [{ tier: 'x', template: { capability: 'c' } }] }), /units\[0\] contains disallowed infrastructure field "tier"/);
  refuses(step({ units: [{ template: { capability: 'c', executor: 'x' } }] }), /units\[0\]\.template contains disallowed infrastructure field "executor"/);
  refuses(step({ operations: [{ id: 'o', invocation: 'x' }] }), /operations\[0\] contains disallowed infrastructure field "invocation"/);
  refuses(step({ operations: [{ id: 'o', policy: { overrides: 'x' } }] }), /operations\[0\]\.policy contains disallowed infrastructure field "overrides"/);
});

test('only a units file may give a unit template a soft prefer', () => {
  const raw = { id: 'wf', steps: [{ id: 's', units: [{ template: { capability: 'c', prefer: { executor: 'e' } } }] }] };
  refuses(raw, /template contains disallowed infrastructure field "prefer"/);
  assert.deepEqual(validateWorkflow(raw, { source: 'units-file' }).steps[0].units[0].template.prefer, { executor: 'e' });
});

test('a unit rigor and a gate mode outside the vocabulary are refused naming the allowed values', () => {
  refuses({ id: 'wf', steps: [{ id: 's', units: [{ template: { capability: 'c', rigor: 'extreme' } }] }] }, /invalid rigor "extreme", must be one of \[low, standard, high, critical\]/);
  refuses({ id: 'wf', steps: [{ id: 's', gate: { mode: 'maybe' } }] }, /gate\.mode must be "consent" or "input", got "maybe"/);
});
