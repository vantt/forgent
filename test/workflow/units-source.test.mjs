// test/workflow/units-source.test.mjs — A units file becomes a one-off Workflow definition

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { translateUnitsToWorkflow } from '../../src/workflow/units-source.mjs';
import { validateWorkflow } from '../../src/workflow/definition.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';

function unitsFile(name, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-units-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content));
  return file;
}

test('two units with a dependency become two steps in dependency order', () => {
  const file = unitsFile('risks.yaml', [
    'title: Risk review',
    'units:',
    '  - id: risk-b',
    '    objective: Critique B',
    '    capability: architecture:critique',
    '    dependsOn: [risk-a]',
    '  - id: risk-a',
    '    objective: Critique A',
    '    capability: architecture:critique',
    '    rigor: high',
    '    inputs: [docs/a.md]',
  ].join('\n'));

  const wf = translateUnitsToWorkflow(file);

  assert.equal(wf.id, 'units/risks');
  assert.equal(wf.title, 'Risk review');
  assert.deepEqual(wf.steps.map((s) => s.id), ['risk-b', 'risk-a']);
  const b = wf.steps.find((s) => s.id === 'risk-b');
  assert.deepEqual(b.dependsOn, ['risk-a']);
  assert.equal(b.units.length, 1);
  assert.equal(b.units[0].id, 'risk-b');
  assert.equal(b.units[0].template.objective, 'Critique B');
  const a = wf.steps.find((s) => s.id === 'risk-a');
  assert.equal(a.units[0].template.rigor, 'high');
  assert.deepEqual([...a.units[0].template.contextRefs], ['docs/a.md']);
});

test('a bare array of units is accepted, in JSON as well', () => {
  const file = unitsFile('pair.json', [
    { id: 'one', objective: 'First', capability: 'docs:write', writes: ['a.txt'] },
    { id: 'two', objective: 'Second', capability: 'docs:write', dependsOn: ['one'] },
  ]);
  const wf = translateUnitsToWorkflow(file);
  assert.equal(wf.id, 'units/pair');
  assert.deepEqual([...wf.steps[0].units[0].template.writes], ['a.txt']);
  assert.deepEqual(wf.steps[1].dependsOn, ['one']);
});

test('prefer and persona of a unit are kept on its template', () => {
  const file = unitsFile('pref.json', {
    units: [{ id: 'u', objective: 'Do it', capability: 'docs:write', prefer: ['openai', { executor: 'xai', invocation: 'cli' }], persona: 'code-reviewer' }],
  });
  const tpl = translateUnitsToWorkflow(file).steps[0].units[0].template;
  assert.deepEqual(JSON.parse(JSON.stringify(tpl.prefer)), ['openai', { executor: 'xai', invocation: 'cli' }]);
  assert.equal(tpl.persona, 'code-reviewer');
});

test('a unit that breaks the unit contract (G2 field, missing objective) is refused', () => {
  assert.throws(
    () => translateUnitsToWorkflow(unitsFile('g2.json', [{ id: 'u', objective: 'x', capability: 'docs:write', executor: 'openai' }])),
    (err) => err instanceof RunnerConfigError && /G2/.test(err.message),
  );
  assert.throws(
    () => translateUnitsToWorkflow(unitsFile('noobj.json', [{ id: 'u', capability: 'docs:write' }])),
    /objective/,
  );
});

test('a units file with no units, duplicate ids or an unknown dependency is refused', () => {
  assert.throws(() => translateUnitsToWorkflow(unitsFile('empty.json', { units: [] })), /at least one unit/);
  assert.throws(
    () => translateUnitsToWorkflow(unitsFile('dup.json', [
      { id: 'u', objective: 'x', capability: 'docs:write' },
      { id: 'u', objective: 'y', capability: 'docs:write' },
    ])),
    /duplicate/,
  );
  assert.throws(
    () => translateUnitsToWorkflow(unitsFile('dangling.json', [{ id: 'u', objective: 'x', capability: 'docs:write', dependsOn: ['ghost'] }])),
    /undeclared step "ghost"/,
  );
});

test('prefer is accepted only for a units-file source; a preset or plan definition still refuses it', () => {
  const def = {
    id: 'preset/x',
    steps: [{ id: 's', units: [{ id: 'u', template: { capability: 'docs:write', prefer: ['openai'] } }] }],
  };
  assert.throws(() => validateWorkflow(def), /disallowed infrastructure field "prefer"/);
  assert.throws(() => validateWorkflow(def, { source: 'plan' }), /"prefer"/);
  assert.deepEqual([...validateWorkflow(def, { source: 'units-file' }).steps[0].units[0].template.prefer], ['openai']);
  // Prefer stays forbidden outside a unit template even for a units file.
  assert.throws(() => validateWorkflow({ ...def, prefer: ['openai'] }, { source: 'units-file' }), /"prefer"/);
});

test('a source or origin the data declares about itself has no effect', () => {
  const def = {
    id: 'preset/x',
    source: 'units-file',
    origin: 'human-cli',
    steps: [{ id: 's', source: 'units-file', units: [{ id: 'u', template: { capability: 'docs:write', source: 'units-file', prefer: ['openai'] } }] }],
  };
  assert.throws(() => validateWorkflow(def), /"prefer"/);

  // A unit in a units file that names a source/origin gets nothing extra from it.
  const file = unitsFile('self.json', [{ id: 'u', objective: 'x', capability: 'docs:write', source: 'preset', origin: 'human-cli' }]);
  const tpl = translateUnitsToWorkflow(file).steps[0].units[0].template;
  assert.equal(tpl.source, undefined);
  assert.equal(tpl.origin, undefined);
});

test('a unit naming syncBase is refused instead of losing the sync: a workflow unit does not carry it', () => {
  const file = unitsFile('sync.json', [{ id: 'catch-up', objective: 'Catch up', capability: 'code:implement', writes: ['src'], syncBase: 'main' }]);
  assert.throws(() => translateUnitsToWorkflow(file), (e) => e instanceof RunnerConfigError && /syncBase is not carried by a workflow unit/.test(e.message) && /fgos run --unit/.test(e.message));
});
