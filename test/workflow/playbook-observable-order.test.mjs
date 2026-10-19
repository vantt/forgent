// test/workflow/playbook-observable-order.test.mjs — the order every registered playbook runs in is
// the one committed in the baseline: steps, units, pattern, blind, roles per round, gates, last word.
//
// The baseline was produced from the runner before the case ledger and admission work began; a later
// change that moves any of it fails here. Regenerating the baseline is a reviewed act of its own.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PLAYBOOKS, observableOrder, runEveryPlaybook } from '../helpers/playbook-observable-order.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();

const BASELINE = JSON.parse(fs.readFileSync(path.resolve('test/fixtures/workflow/playbook-observable-order.json'), 'utf8'));

test('the baseline names every registered playbook and the units wave', () => {
  const registered = fs.readdirSync(path.resolve('core/workflows')).filter((f) => f.endsWith('.yaml')).map((f) => f.replace(/\.yaml$/, ''));
  for (const id of registered) assert.ok(PLAYBOOKS.includes(id), `playbook ${id} is registered but not in the order guard`);
  assert.deepEqual(Object.keys(BASELINE).sort(), [...PLAYBOOKS, 'units/order-guard'].sort());
});

test('the projection ignores event kinds it does not know and anything that is not order', () => {
  const start = { seq: 1, ts: 'a', type: 'workflow.start', payload: { workflow: { steps: [{ id: 's', units: [{ id: 'u', template: { pattern: 'panel', blind: true } }] }] } } };
  const events = [
    start,
    { seq: 2, ts: 'b', type: 'step.start', payload: { stepId: 's' } },
    { seq: 3, ts: 'c', type: 'case.opened', payload: { caseId: 'x' } },
    { seq: 4, ts: 'd', type: 'unit.scheduled', payload: { stepId: 's', unitId: 'u' } },
    { seq: 5, ts: 'e', type: 'unit.complete', payload: { stepId: 's', unitId: 'u', outcome: 'pass', results: [{ role: 'synthesizer', round: 1 }, { role: 'panelist-1', round: 1 }] } },
    { seq: 6, ts: 'f', type: 'step.complete', payload: { stepId: 's', outcome: 'pass' } },
    { seq: 7, ts: 'g', type: 'workflow.complete', payload: { outcome: 'pass' } },
  ];
  const withoutUnknown = events.filter((e) => e.type !== 'case.opened');
  assert.deepEqual(observableOrder(events), observableOrder(withoutUnknown));
  assert.deepEqual(observableOrder(events).steps[0].units[0].roles, [['panelist-1', 'synthesizer']]);
});

test('every playbook and a units wave run in the order of the committed baseline', async () => {
  assert.deepEqual(await runEveryPlaybook(), BASELINE);
});
