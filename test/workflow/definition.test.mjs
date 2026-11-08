// test/workflow/definition.test.mjs — the Workflow definition contract: what validateWorkflow refuses and how it reads a step

import test from 'node:test';
import assert from 'node:assert/strict';

import { validateWorkflow, WorkflowDefinitionError, normalizeContextRefs } from '../../src/workflow/definition.mjs';
import { dependencyOrder } from '../../src/workflow/steps.mjs';

// Two producers and a synthesizer.
const memberSeats = (n = 3) => [...Array.from({ length: n }, (_, i) => ({ seat: `member-${i + 1}`, role: 'producer' })), { seat: 'synthesizer', role: 'synthesizer' }];

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
  refuses({ id: 'wf', executor: 'claude', steps: [{ id: 's' }] }, /Workflow definition "wf" contains disallowed infrastructure field "executor" \(G2 constraint/);
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

test('validateWorkflow: unit writes use the shared canonical form and keep the unit label on refusal', () => {
  const wf = (writes) => ({ id: 'test/writes', title: 'W', steps: [{ id: 's1', units: [{ id: 'u1', template: { capability: 'docs:write', writes } }] }] });
  assert.deepEqual(validateWorkflow(wf(['./docs', 'docs//', 'app/[slug]/page.tsx'])).steps[0].units[0].template.writes, ['docs', 'app/[slug]/page.tsx']);
  for (const bad of ['.', '/etc', 'a/../b', ':!x', 'a**', 3]) {
    assert.throws(
      () => validateWorkflow(wf([bad])),
      (err) => err instanceof WorkflowDefinitionError && err.message.includes('Workflow "test/writes" steps[0].units[0].writes'),
      `bad=${JSON.stringify(bad)}`,
    );
  }
});

test('validateWorkflow checks a unit template\'s inputs: known earlier steps only, with a clear error', () => {
  const wf = (inputs, extraStep = {}) => ({
    id: 'test/inputs',
    steps: [
      { id: 'a', units: [{ id: 'ua', template: { capability: 'docs:write' } }] },
      { id: 'b', dependsOn: ['a'], units: [{ id: 'ub', template: { capability: 'docs:write' } }] },
      { id: 'c', dependsOn: ['b'], units: [{ id: 'uc', template: { capability: 'docs:write', inputs } }] },
      { id: 'side', ...extraStep, units: [{ id: 'us', template: { capability: 'docs:write' } }] },
    ],
  });
  const ok = validateWorkflow(wf([{ step: 'a', sameSeat: true, label: 'mine' }, { step: 'b' }]));
  assert.deepEqual(ok.steps[2].units[0].template.inputs, [{ step: 'a', sameSeat: true, label: 'mine' }, { step: 'b' }]);
  assert.equal(ok.steps[1].units[0].template.inputs, undefined);

  assert.throws(() => validateWorkflow(wf([{ step: 'nope' }])), /step "c" unit "uc" inputs\[0\] names undeclared step "nope"/);
  assert.throws(() => validateWorkflow(wf([{ step: 'side' }])), /inputs\[0\] names step "side", which this step does not depend on/);
  assert.throws(() => validateWorkflow(wf([{ step: 'c' }])), /names step "c", which this step does not depend on/);
  assert.throws(() => validateWorkflow(wf('a')), /inputs must be an array/);
  assert.throws(() => validateWorkflow(wf(['a'])), /inputs\[0\] must be an object/);
  assert.throws(() => validateWorkflow(wf([{}])), /requires "step"/);
  assert.throws(() => validateWorkflow(wf([{ step: 'a', 'same-seat': true }])), /unknown key "same-seat"/);
  assert.throws(() => validateWorkflow(wf([{ step: 'a', sameSeat: 'yes' }])), /sameSeat must be true or false/);
});

test('a Playbook step of kind integrate, or a step target, is refused by name and points to the approve door', () => {
  const base = { id: 'test/target', title: 'T' };
  const unit = { id: 'u', template: { capability: 'docs:write', writes: ['a.txt'] } };
  assert.throws(
    () => validateWorkflow({ ...base, steps: [{ id: 's1', units: [unit] }, { id: 'i', kind: 'integrate', dependsOn: ['s1'] }] }),
    /steps\[1\].*kind "integrate".*approve door/,
  );
  assert.throws(
    () => validateWorkflow({ ...base, steps: [{ id: 's1', target: 'release', units: [unit] }] }),
    /"target".*approve door/,
  );
});

test('validateWorkflow keeps a unit template persona and params and rejects params that are not an object', () => {
  const base = { id: 'test/persona-params', steps: [{ id: 's1', units: [{ id: 'u1', template: { capability: 'docs:write', pattern: 'panel', persona: ' panelist ', seats: memberSeats(2), params: { roleTasks: { x: 'y' } } } }] }] };
  const template = validateWorkflow(base).steps[0].units[0].template;
  assert.equal(template.persona, 'panelist');
  assert.deepEqual(template.params, { roleTasks: { x: 'y' } });
  assert.equal(template.seats.length, 3, 'two members and the synthesizer');

  for (const bad of ['x', ['a'], 3]) {
    const workflow = { ...base, steps: [{ id: 's1', units: [{ id: 'u1', template: { capability: 'docs:write', params: bad } }] }] };
    assert.throws(() => validateWorkflow(workflow), /params must be an object/);
  }
});

test('validateWorkflow keeps anonymizeInputs only when true and rejects a non-boolean', () => {
  const withFlag = (anonymizeInputs) => ({ id: 'test/anon', steps: [{ id: 's1', units: [{ id: 'u1', template: { capability: 'docs:write', anonymizeInputs } }] }] });
  assert.equal(validateWorkflow(withFlag(true)).steps[0].units[0].template.anonymizeInputs, true);
  assert.equal(validateWorkflow(withFlag(undefined)).steps[0].units[0].template.anonymizeInputs, undefined);
  assert.throws(() => validateWorkflow(withFlag('yes')), /anonymizeInputs must be true or false/);
});

test('validateWorkflow keeps blind only when true and rejects a non-boolean', () => {
  const withFlag = (blind) => ({ id: 'test/blind', steps: [{ id: 's1', units: [{ id: 'u1', template: { capability: 'docs:write', blind } }] }] });
  assert.equal(validateWorkflow(withFlag(true)).steps[0].units[0].template.blind, true);
  assert.equal(validateWorkflow(withFlag(undefined)).steps[0].units[0].template.blind, undefined);
  assert.equal(validateWorkflow(withFlag(false)).steps[0].units[0].template.blind, undefined);
  assert.throws(() => validateWorkflow(withFlag('yes')), /blind must be true or false/);
});

test('workflow template option labels normalize without accepting malformed sets', () => {
  const make = (stanceOptions) => ({ id: 'options', steps: [{ id: 's', units: [{ id: 'u', template: { capability: 'docs:write', stanceOptions } }] }] });
  assert.deepEqual(validateWorkflow(make([' a ', 'b'])).steps[0].units[0].template.stanceOptions, ['a', 'b']);
  for (const value of ['a|b', [''], ['a', 'a'], ['other']]) assert.throws(() => validateWorkflow(make(value)), /stanceOptions/);
});

test('workflow context refs and reviewed outcome contracts refuse unsafe inputs', () => {
  const make = (template) => ({ id: 'contract', steps: [{ id: 'root', units: [{ template: { capability: 'docs:write', ...template } }] }] });
  for (const contextRefs of [null, 'notes.md', [true], ['../notes'], ['/tmp/notes'], ['a\\b'], ['unit-run:../producer'], ['gate-answer:wf/..']]) {
    assert.throws(() => validateWorkflow(make({ contextRefs })), /contextRefs/);
    assert.throws(() => normalizeContextRefs(contextRefs), /contextRefs/);
  }
  const refs = ['notes.md', 'unit-run:unit-1/producer', 'gate-answer:wf-1/approve'];
  assert.deepEqual(validateWorkflow(make({ contextRefs: refs })).steps[0].units[0].template.contextRefs, refs);
  for (const pattern of ['solo', 'panel', 'reviewed']) {
    const normalized = validateWorkflow(make({ pattern }));
    assert.deepEqual(validateWorkflow(normalized), normalized, 'a loader-normalized workflow remains valid when started');
  }
  assert.deepEqual(validateWorkflow(make({ pattern: 'reviewed', acceptOutcomes: ['pass', 'findings'] })).steps[0].units[0].template.acceptOutcomes, ['pass', 'findings']);
  assert.deepEqual(validateWorkflow(make({ pattern: 'solo', acceptOutcomes: ['pass'] })).steps[0].units[0].template.acceptOutcomes, ['pass']);
  for (const acceptOutcomes of [[], ['execution-failure'], ['pass', 'pass'], 'pass', null]) {
    assert.throws(() => validateWorkflow(make({ pattern: 'reviewed', acceptOutcomes })), /acceptOutcomes/);
  }
});

test('a minimal workflow normalizes with its id and steps, and a unit timeout above the ceiling is refused', () => {
  const normalized = validateWorkflow({ id: 'test/simple', title: 'Simple workflow', steps: [{ id: 'step-1', units: [{ template: { capability: 'docs:write' } }] }] });
  assert.equal(normalized.id, 'test/simple');
  assert.equal(normalized.steps.length, 1);

  refuses({ id: 'too-long', steps: [{ id: 's', units: [{ id: 'u', template: { capability: 'docs:write', objective: 'Read', writes: [], timeoutMs: 99 * 3600000 } }] }] }, /timeoutMs must be at most 4h/);
});
