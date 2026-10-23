import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createSeatLedger, createBindBarrier } from '../../../src/runner/execution/seat-ledger.mjs';
import { simulateUnitBindings } from '../../../src/runner/execution/dry-bind.mjs';

const tick = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('the ledger resolves a seat to the executors that filled it and keeps an unbound seat as its id', () => {
  const ledger = createSeatLedger();
  ledger.note('producer', 'claude');
  ledger.note('producer', 'claude');
  assert.deepEqual(ledger.resolve(['producer', 'reviewer']), ['claude', 'reviewer']);
  assert.deepEqual(ledger.seats(['producer', 'reviewer']), [{ seat: 'producer', executor: 'claude' }]);
});

test('serialized steps run in the order they were queued however long each takes, and a throw does not stall the queue', async () => {
  const ledger = createSeatLedger();
  const order = [];
  const delays = [30, 5, 15];
  const runs = delays.map((ms, i) => ledger.serialize(async () => {
    order.push(`start-${i}`);
    await tick(ms);
    order.push(`end-${i}`);
    return i;
  }));
  const failing = ledger.serialize(() => { throw new Error('boom'); });
  const after = ledger.serialize(() => 'after');
  assert.deepEqual(await Promise.all(runs), [0, 1, 2]);
  await assert.rejects(failing, /boom/);
  assert.equal(await after, 'after');
  assert.deepEqual(order, ['start-0', 'end-0', 'start-1', 'end-1', 'start-2', 'end-2']);
});

test('two seats whose providers fail at once never both rebind from the same view of each other', async () => {
  const ledger = createSeatLedger();
  ledger.note('reviewer', 'claude');
  ledger.note('red-team', 'claude');
  const families = ['openai', 'xai'];
  const chosen = [];
  // Each seat reads the ledger, picks the first family no peer holds, and publishes it, as one step.
  const rebind = (seat) => ledger.serialize(async () => {
    const held = new Set(ledger.seats(['reviewer', 'red-team']).filter((s) => s.seat !== seat).map((s) => s.executor));
    await tick(seat === 'reviewer' ? 20 : 1);
    const pick = families.find((f) => !held.has(f));
    ledger.note(seat, pick);
    chosen.push([seat, pick]);
    return pick;
  });
  const [a, b] = await Promise.all([rebind('reviewer'), rebind('red-team')]);
  assert.notEqual(a, b, 'a view read before the sibling published would have given both seats the same family');
  assert.deepEqual(chosen.map(([seat]) => seat), ['reviewer', 'red-team']);
});

test('a bind barrier releases once every seat of the group has arrived', async () => {
  const barrier = createBindBarrier(3);
  assert.equal(barrier.size, 3, "a seat reads how many seats launch with it from the barrier");
  let released = false;
  barrier.bound.then(() => { released = true; });
  barrier.arrive();
  barrier.arrive();
  await tick(1);
  assert.equal(released, false);
  barrier.arrive();
  await barrier.bound;
  assert.equal(released, true);
  await createBindBarrier(0).bound;
});

// Native-agent executors need no process or confinement registry, so the simulation depends only on this fixture.
const FAMILIES = { alpha: 'claude', beta: 'xai', gamma: 'z-ai' };
const runnerConfig = {
  executors: Object.fromEntries(Object.entries(FAMILIES).map(([id, family]) => [id, { agentType: id, providerModel: family }])),
  modelPolicies: Object.fromEntries(Object.values(FAMILIES).map((family) => [family, { nano: 'm', mini: 'm', standard: 'm', advanced: 'm', flagship: 'm', frontier: 'm' }])),
  capabilities: { 'fixture:ideas': { prefer: Object.keys(FAMILIES).map((executor) => ({ executor })) } },
};

test('ordered concurrent bind with soft spread: each panel seat sees the seats listed before it', async () => {
  const unit = {
    id: 'u', capability: 'fixture:ideas', objective: 'x', writes: [], pattern: 'panel',
    seats: [{ seat: 'one', role: 'producer' }, { seat: 'two', role: 'producer' }, { seat: 'three', role: 'producer' }, { seat: 'chair', role: 'synthesizer' }],
  };
  const { outcome, seats } = await simulateUnitBindings(unit, runnerConfig);
  assert.equal(outcome, 'pass');
  assert.deepEqual(seats.map((s) => [s.seat, s.role, s.executor]), [
    ['one', 'producer', 'alpha'], ['two', 'producer', 'beta'], ['three', 'producer', 'gamma'], ['chair', 'synthesizer', 'alpha'],
  ]);
  assert.deepEqual(seats[3].sharesFamilyWith, ['one'], 'the synthesizer reuses the least used family, and says which seat shares it');
});
