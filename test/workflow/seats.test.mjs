// test/workflow/seats.test.mjs — rebuilding a registered base with one panel seat per lens

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { loadWorkflow } from '../../src/workflow/loader.mjs';
import { validateWorkflow } from '../../src/workflow/definition.mjs';
import { expandWorkflowSeats, normalizeSeats, seatTask } from '../../src/workflow/seats.mjs';

const ROOT = path.resolve('.');
const base = (id) => loadWorkflow(id, { packageRoot: ROOT });
const LENSES = ['cash flow and payback', 'delivery capacity and lock-in', 'renewal leverage'];
const GENERIC_BASES = ['group-cognition', 'business-discussion', 'nominal-group', 'delphi'];

/** A definition with the fields a seat expansion is allowed to change put back to the base's own. */
function withoutSeatFields(definition) {
  const plain = JSON.parse(JSON.stringify(definition));
  for (const step of plain.steps) {
    for (const unit of step.units) {
      const { template } = unit;
      if (template.pattern === 'panel') {
        delete template.params?.members;
        for (const role of Object.keys(template.params?.roleTasks ?? {})) if (/^panelist-\d+$/.test(role)) delete template.params.roleTasks[role];
        if (template.params && Object.keys(template.params.roleTasks ?? {}).length === 0) delete template.params.roleTasks;
        if (template.params && Object.keys(template.params).length === 0) delete template.params;
      }
      if (step.dependsOn.length > 0) template.contextRefs = [];
    }
  }
  return plain;
}

test('every generic base keeps its topology, gates, blind flags and checker and synthesizer text; only seat fields differ', () => {
  for (const id of GENERIC_BASES) {
    const source = base(id);
    const { workflow } = expandWorkflowSeats(source, LENSES, { contextRefs: ['docs/note.md'] });
    assert.deepEqual(withoutSeatFields(workflow), withoutSeatFields(source), `${id}: only seat fields and ref copies may differ`);
    assert.equal(workflow.id, id, 'the workflow id stays the base id');
    const panels = workflow.steps.flatMap((step) => step.units).filter((unit) => unit.template.pattern === 'panel');
    assert.ok(panels.length >= 1);
    for (const { template } of panels) {
      assert.equal(template.params.members, 3);
      LENSES.forEach((lens, i) => {
        const task = template.params.roleTasks[`panelist-${i + 1}`];
        assert.equal(task, seatTask(lens));
        assert.ok(task.includes(lens) && task.endsWith('{objective}'));
      });
      assert.deepEqual(Object.keys(template.params.roleTasks).filter((r) => r.startsWith('panelist-')), ['panelist-1', 'panelist-2', 'panelist-3']);
    }
  }
});

test('expansion is deterministic and never mutates the registered definition', () => {
  const source = base('group-cognition');
  const before = JSON.stringify(source);
  const first = expandWorkflowSeats(source, LENSES, { contextRefs: ['docs/a.md', 'docs/b.md'] });
  const second = expandWorkflowSeats(base('group-cognition'), [...LENSES], { contextRefs: ['docs/a.md', 'docs/b.md'] });
  assert.equal(JSON.stringify(first.workflow), JSON.stringify(second.workflow));
  assert.deepEqual(first.provenance, second.provenance);
  assert.equal(JSON.stringify(source), before);
  assert.deepEqual(Object.keys(first.provenance), ['seats', 'baseId', 'baseDigest', 'refs']);
  assert.equal(first.provenance.baseId, 'group-cognition');
  assert.match(first.provenance.baseDigest, /^[0-9a-f]{64}$/);
  assert.deepEqual(first.provenance.seats, LENSES);
  assert.deepEqual(first.provenance.refs, ['docs/a.md', 'docs/b.md']);
  // The expanded result is itself a valid definition.
  assert.doesNotThrow(() => validateWorkflow(JSON.parse(JSON.stringify(first.workflow))));
});

test('lens order sets the seat mapping and trimmed lenses are stored verbatim', () => {
  const { workflow, provenance } = expandWorkflowSeats(base('group-cognition'), ['  second angle  ', 'first angle'], {});
  const [panel] = workflow.steps[0].units;
  assert.equal(panel.template.params.roleTasks['panelist-1'], seatTask('second angle'));
  assert.equal(panel.template.params.roleTasks['panelist-2'], seatTask('first angle'));
  assert.deepEqual(provenance.seats, ['second angle', 'first angle']);
});

test('delphi seats the same lenses on both proposal rounds so same-seat inputs stay aligned', () => {
  const { workflow } = expandWorkflowSeats(base('delphi'), LENSES, {});
  const rounds = workflow.steps.flatMap((step) => step.units).filter((unit) => unit.template.pattern === 'panel');
  assert.deepEqual(rounds.map((unit) => unit.id), ['propose-round-1', 'propose-round-2']);
  assert.deepEqual(rounds[0].template.params, rounds[1].template.params);
  assert.equal(rounds[1].template.inputs.some((entry) => entry.sameSeat), true, 'the round-2 same-seat input is untouched');
  assert.equal(rounds[1].template.blind, true);
});

test('no seat maximum: many seats expand, the synthesizer text is untouched', () => {
  const many = Array.from({ length: 12 }, (_, i) => `perspective number ${i + 1}`);
  const { workflow } = expandWorkflowSeats(base('nominal-group'), many, {});
  assert.equal(workflow.steps[0].units[0].template.params.members, 12);
  assert.equal(Object.keys(workflow.steps[0].units[0].template.params.roleTasks).length, 12);
  assert.equal(workflow.steps[0].units[0].template.params.roleTasks.synthesizer, undefined);
});

test('shared context refs are copied to units the run-level refs cannot reach; without seats nothing changes', () => {
  const source = base('business-discussion');
  const { workflow } = expandWorkflowSeats(source, LENSES, { contextRefs: ['docs/policy.md'] });
  for (const step of workflow.steps) {
    for (const unit of step.units) {
      const has = unit.template.contextRefs.includes('docs/policy.md');
      assert.equal(has, step.dependsOn.length > 0, `${step.id}/${unit.id}: copied exactly when the step depends on another step`);
    }
  }
  const { workflow: noRefs } = expandWorkflowSeats(source, LENSES, {});
  assert.ok(noRefs.steps.every((step) => step.units.every((unit) => unit.template.contextRefs.length === 0)));
  // A ref a template already lists is not duplicated.
  const seeded = JSON.parse(JSON.stringify(source));
  seeded.steps[1].units[0].template.contextRefs = ['docs/policy.md'];
  const { workflow: deduped } = expandWorkflowSeats(validateWorkflow(seeded), LENSES, { contextRefs: ['docs/policy.md'] });
  assert.deepEqual(deduped.steps[1].units[0].template.contextRefs, ['docs/policy.md']);
});

test('invalid seat lists are refused with the reason', () => {
  const cases = [
    [['only one'], /at least 2 lenses/],
    [[], /at least 2 lenses/],
    [['fine lens', ''], /seat 2 is empty/],
    [['fine lens', '   '], /seat 2 is empty/],
    [['Same Lens', 'same lens'], /seat 2 repeats seat 1/],
    [['fine lens', 'x'.repeat(161)], /seat 2 must be 3-160 characters, got 161/],
    [['fine lens', 'ab'], /seat 2 must be 3-160 characters, got 2/],
    [['fine lens', 'two\nlines'], /single line/],
    [['fine lens', 'tab\tinside'], /single line/],
    [['fine lens', 'has {objective} brace'], /braces/],
    [['fine lens', 'has } brace'], /braces/],
    [['fine lens', 'has | pipe'], /must not contain "\|"/],
    [['fine lens', '@'], /names a persona \("@"\)/],
    [['fine lens', '@Finance'], /names a persona \("@Finance"\)/],
    [['fine lens', '@9lives'], /names a persona/],
    [['fine lens', '@two words'], /names a persona/],
    [['fine lens', `@a${'b'.repeat(64)}`], /names a persona/],
    [['@finance-controller', '@Finance-Controller'], /names a persona/],
    [['@finance-controller', '@finance-controller'], /seat 2 repeats seat 1/],
    [['fine lens', 42], /must be text/],
  ];
  for (const [seats, pattern] of cases) assert.throws(() => normalizeSeats(seats), pattern, JSON.stringify(seats));
  assert.throws(() => normalizeSeats('a|b'), /ordered list/);
  assert.equal(normalizeSeats(['x'.repeat(160), 'abc']).length, 2, '3 and 160 characters are allowed');
  assert.deepEqual(normalizeSeats([' @finance-controller ', `@a${'b'.repeat(63)}`]), ['@finance-controller', `@a${'b'.repeat(63)}`]);
});

const persona = (name, text = `name: ${name}\ndescription: ${name} posture\n`) => ({
  name, tier: 'workspace', source: `fgos/agents/${name}.yaml`, text, digest: `digest-of-${name}`,
});

test('a named persona seat keeps its order, gets no lens task and is recorded with the pinned text', () => {
  const finance = persona('finance-controller', 'name: finance-controller\ndescription: weigh {objective} literally\n');
  const { workflow, provenance } = expandWorkflowSeats(base('group-cognition'), ['first angle', '@finance-controller', 'third angle'], {
    personas: { 'finance-controller': finance },
  });
  const [panel] = workflow.steps[0].units;
  assert.equal(panel.template.params.members, 3);
  assert.equal(panel.template.params.roleTasks['panelist-1'], seatTask('first angle'));
  assert.equal(panel.template.params.roleTasks['panelist-2'], undefined, 'the persona carries the posture; the seat keeps the unit objective');
  assert.equal(panel.template.params.roleTasks['panelist-3'], seatTask('third angle'));
  assert.deepEqual(provenance.seats, ['first angle', '@finance-controller', 'third angle']);
  assert.deepEqual(provenance.personas, [{
    seat: 'panelist-2', name: 'finance-controller', tier: 'workspace', source: 'fgos/agents/finance-controller.yaml',
    digest: 'digest-of-finance-controller', text: finance.text,
  }]);
  assert.ok(!JSON.stringify(workflow).includes('weigh {objective} literally'), 'persona text is never copied into the definition');
  assert.doesNotThrow(() => validateWorkflow(JSON.parse(JSON.stringify(workflow))));
});

test('delphi binds a persona to the same seat in both rounds and the list may be all personas', () => {
  const personas = { 'a-one': persona('a-one'), 'b-two': persona('b-two') };
  const { workflow, provenance } = expandWorkflowSeats(base('delphi'), ['@b-two', '@a-one'], { personas });
  const rounds = workflow.steps.flatMap((step) => step.units).filter((unit) => unit.template.pattern === 'panel');
  assert.deepEqual(rounds[0].template.params, rounds[1].template.params);
  assert.deepEqual(provenance.personas.map((p) => [p.seat, p.name]), [['panelist-1', 'b-two'], ['panelist-2', 'a-one']]);
  assert.equal(Object.keys(rounds[0].template.params.roleTasks).filter((r) => r.startsWith('panelist-')).length, 0);
});

test('a persona entry that was not resolved is refused, and an inline-only list records no personas', () => {
  assert.throws(() => expandWorkflowSeats(base('group-cognition'), ['fine lens', '@missing-one'], {}), /names persona "missing-one" but it was not resolved/);
  assert.equal(expandWorkflowSeats(base('group-cognition'), LENSES, { personas: { unused: persona('unused') } }).provenance.personas, undefined);
});

test('bases with curated seats or no generic panel are refused with a reason', () => {
  assert.throws(() => expandWorkflowSeats(base('council-lite'), LENSES, {}), /workflow "council-lite" fixes its own seats \(unit "deliberate"/);
  assert.throws(() => expandWorkflowSeats(base('architecture-advisory'), LENSES, {}), /workflow "architecture-advisory" fixes its own seats/);
  assert.throws(() => expandWorkflowSeats(base('architecture-advisory-reopen'), LENSES, {}), /has no panel unit that accepts --seats/);
  const solo = validateWorkflow({ id: 'solo-only', steps: [{ id: 's', units: [{ id: 'u', template: { capability: 'docs:write', pattern: 'solo' } }] }] });
  assert.throws(() => expandWorkflowSeats(solo, LENSES, {}), /has no panel unit that accepts --seats/);
  const customRoles = validateWorkflow({ id: 'custom-roles', steps: [{ id: 's', units: [{ id: 'u', template: { capability: 'docs:write', pattern: 'panel', params: { role: ['a', 'b'] } } }] }] });
  assert.throws(() => expandWorkflowSeats(customRoles, LENSES, {}), /custom role names/);
  // A base that mixes a generic panel with a curated one is refused whole.
  const mixed = validateWorkflow({
    id: 'mixed',
    steps: [{ id: 's', units: [
      { id: 'generic', template: { capability: 'docs:write', pattern: 'panel' } },
      { id: 'curated', template: { capability: 'docs:write', pattern: 'panel', params: { roleTasks: { 'panelist-1': 'x {objective}' } } } },
    ] }],
  });
  assert.throws(() => expandWorkflowSeats(mixed, LENSES, {}), /unit "curated"/);
});
