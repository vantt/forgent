// Every shipped panel and debate unit declares explicit seats, loads, and dry-binds through the one seat resolver.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { parseYaml } from '../../src/util/yaml.mjs';
import { validateWorkflowChecked } from '../../src/workflow/checked.mjs';
import { translateUnitsToWorkflow } from '../../src/workflow/units-source.mjs';
import { expandWorkflowSeats } from '../../src/workflow/seats.mjs';
import { simulateUnitBindings } from '../../src/runner/execution/dry-bind.mjs';
import { resolveSeats } from '../../src/runner/execution/seat-resolver.mjs';
import { loopOf } from '../../src/runner/execution/patterns/catalog.mjs';
import { shippedCatalog } from '../../src/runner/dispatch/shipped-catalog.mjs';

const dir = new URL('../../core/workflows/', import.meta.url);
const workflows = fs.readdirSync(dir).filter((name) => name.endsWith('.yaml')).map((name) => {
  const raw = parseYaml(fs.readFileSync(new URL(name, dir), 'utf8'), { filename: name });
  return validateWorkflowChecked(raw);
});

// Native-agent executors need no process or confinement registry, so the dry bind depends only on this fixture.
const FAMILIES = { alpha: 'claude', beta: 'xai', gamma: 'z-ai', delta: 'deepseek' };
function runnerConfigFor(capabilities) {
  return {
    executors: Object.fromEntries(Object.entries(FAMILIES).map(([id, family]) => [id, { agentType: id, providerModel: family }])),
    modelPolicies: Object.fromEntries(Object.values(FAMILIES).map((family) => [family, { nano: 'm', mini: 'm', standard: 'm', advanced: 'm', flagship: 'm', frontier: 'm' }])),
    capabilities: Object.fromEntries(capabilities.map((cap) => [cap, { prefer: Object.keys(FAMILIES).map((executor) => ({ executor })) }])),
  };
}

const unitsOf = (workflow) => workflow.steps.flatMap((step) => step.units.map((u) => ({ step, u })));
const isMultiSeat = (u) => {
  const loop = loopOf(u.template.pattern, shippedCatalog()) ?? u.template.pattern;
  return ['panel', 'debate'].includes(loop);
};

test('every panel and debate unit of every core workflow declares explicit seats', () => {
  let seen = 0;
  for (const workflow of workflows) {
    for (const { u } of unitsOf(workflow)) {
      if (!isMultiSeat(u)) continue;
      seen += 1;
      assert.ok(Array.isArray(u.template.seats) && u.template.seats.length >= 3, `${workflow.id}/${u.id} declares seats`);
      assert.equal(u.template.params?.members, undefined, `${workflow.id}/${u.id} no longer counts members`);
      assert.equal(u.template.params?.role, undefined);
      assert.equal(u.template.params?.synthesizeRole, undefined);
    }
  }
  assert.equal(seen, 8, 'architecture-advisory, nominal-group, group-cognition (panel and debate), council-lite, business-discussion, delphi twice');
});

test('roleTasks of a core workflow are keyed by seats the unit declares', () => {
  for (const workflow of workflows) {
    for (const { u } of unitsOf(workflow)) {
      const tasks = u.template.params?.roleTasks;
      if (!tasks || !u.template.seats) continue;
      const known = new Set([...u.template.seats.map((s) => s.seat), 'synthesizer']);
      for (const key of Object.keys(tasks)) assert.ok(known.has(key), `${workflow.id}/${u.id} roleTasks.${key} names a declared seat`);
    }
  }
});

test('architecture-advisory seats its lenses as seats and asks for a frontier system seat', () => {
  const workflow = workflows.find((w) => w.id === 'architecture-advisory');
  const shape = unitsOf(workflow).find(({ u }) => u.id === 'shape-proposals').u;
  assert.deepEqual(shape.template.seats.map((s) => [s.seat, s.role, s.tier ?? null]), [
    ['system', 'producer', 'frontier'], ['alternative', 'producer', null], ['constraint', 'producer', null], ['synthesis', 'synthesizer', null],
  ]);
  assert.deepEqual(Object.keys(shape.template.params.roleTasks), ['system', 'alternative', 'constraint']);
});

test('group-cognition seats its debate with a flagship judge', () => {
  const workflow = workflows.find((w) => w.id === 'group-cognition');
  const debate = unitsOf(workflow).find(({ u }) => u.template.pattern === 'debate').u;
  assert.deepEqual(debate.template.seats, [
    { seat: 'thesis', role: 'producer' }, { seat: 'antithesis', role: 'producer' }, { seat: 'judge', role: 'judge', tier: 'flagship' },
  ]);
});

test('every core workflow loads and dry-binds each of its units through the resolver', async () => {
  for (const workflow of workflows) {
    const capabilities = unitsOf(workflow).map(({ u }) => u.template.capability).filter(Boolean);
    const runnerConfig = runnerConfigFor(capabilities);
    for (const { u } of unitsOf(workflow)) {
      if (!isMultiSeat(u)) continue;
      const template = u.template;
      const unit = {
        id: u.id, objective: template.objective ?? 'x', capability: template.capability, rigor: template.rigor, writes: template.writes ?? [],
        pattern: template.params ? { pattern: template.pattern, params: template.params } : template.pattern, seats: template.seats, blind: template.blind,
      };
      const planned = resolveSeats({ pattern: unit.pattern, unit, runnerConfig });
      const { seats } = await simulateUnitBindings(unit, runnerConfig);
      assert.deepEqual([...new Set(seats.map((s) => s.seat))], planned.map((s) => s.seat), `${workflow.id}/${u.id} binds exactly the seats the resolver lists`);
      for (const seat of seats) assert.equal(seat.refused, undefined, `${workflow.id}/${u.id}/${seat.seat} binds`);
    }
  }
});

test('--seats re-seats only generic member seats and leaves curated lenses alone', () => {
  const generic = workflows.find((w) => w.id === 'group-cognition');
  const loopFn = (name) => loopOf(name, { effective: shippedCatalog() });
  const { workflow, provenance } = expandWorkflowSeats(generic, ['first lens', 'second lens', 'third lens', 'fourth lens'], { loopOf: loopFn });
  const panel = unitsOf(workflow).find(({ u }) => u.template.pattern === 'panel').u;
  assert.deepEqual(panel.template.seats.map((s) => s.seat), ['member-1', 'member-2', 'member-3', 'member-4', 'synthesis']);
  assert.match(panel.template.params.roleTasks['member-4'], /fourth lens/);
  assert.equal(provenance.seats.length, 4);
  const curated = workflows.find((w) => w.id === 'architecture-advisory');
  assert.throws(() => expandWorkflowSeats(curated, ['a lens', 'b lens'], { loopOf: loopFn }), /fixes its own seats/);
});

test('a units file may declare seats but never a seat tier', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-units-seats-'));
  const write = (seats) => {
    const file = path.join(root, 'units.json');
    fs.writeFileSync(file, JSON.stringify({ units: [{ id: 'u1', capability: 'fixture:x', objective: 'Do it', pattern: 'panel', seats }] }));
    return file;
  };
  const ok = translateUnitsToWorkflow(write([{ seat: 'a', role: 'producer' }, { seat: 'b', role: 'producer' }, { seat: 'chair', role: 'synthesizer' }]));
  assert.equal(ok.steps[0].units[0].template.seats.length, 3);
  assert.throws(
    () => translateUnitsToWorkflow(write([{ seat: 'a', role: 'producer', tier: 'frontier' }, { seat: 'chair', role: 'synthesizer' }])),
    /cannot carry seats\[\]\.tier/,
  );
});

test('a workflow definition refuses prefer, executor and overrides on a seat', () => {
  const base = { id: 'x', title: 'x', steps: [{ id: 's', title: 's', units: [{ id: 'u', template: { capability: 'a:b', objective: 'x', pattern: 'panel', seats: [] } }] }] };
  for (const key of ['prefer', 'executor', 'overrides']) {
    const bad = structuredClone(base);
    bad.steps[0].units[0].template.seats = [{ seat: 'a', role: 'producer', [key]: ['claude'] }, { seat: 'c', role: 'synthesizer' }];
    assert.throws(() => validateWorkflowChecked(bad), new RegExp(`unknown key "${key}"`));
  }
});
