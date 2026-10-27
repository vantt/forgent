import '../../../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runSolo, PARAMS, VALID_OUTCOMES } from '../../../../src/runner/execution/loops/solo.mjs';

test('runSolo dispatches the producer seat and returns outcome', async () => {
  const calls = [];
  const unit = {
    id: 'u1',
    objective: 'Implement solo feature',
    capability: 'code:implement',
    writes: ['src/feature.mjs'],
  };
  const cfg = {};

  const runRole = async (opts) => {
    calls.push(opts);
    return {
      seat: opts.seat.seat,
      outcome: 'pass',
      output: 'done',
    };
  };

  const result = await runSolo(unit, cfg, { runRole });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].seat.seat, 'producer');
  assert.equal(calls[0].seat.role, 'producer');
  assert.equal(calls[0].unit, unit);
  assert.equal(calls[0].seat.posture.readOnly, false); // writes has paths
  assert.equal(calls[0].seat.posture.writer, true);

  assert.equal(result.outcome, 'pass');
  assert.equal(result.rounds, 1);
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].outcome, 'pass');
});

test('runSolo sets readOnly: true when writes is empty or omitted', async () => {
  const calls = [];
  const unit = {
    id: 'u2',
    objective: 'Read-only analysis',
    capability: 'research',
    writes: [],
  };

  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, outcome: 'pass' };
  };

  const result = await runSolo(unit, {}, { runRole });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].seat.posture.readOnly, true);
  assert.equal(result.outcome, 'pass');
});

test('runSolo reuses producer result from history if already settled', async () => {
  const calls = [];
  const unit = { id: 'u3', objective: 'Resume solo', capability: 'docs:write' };
  const history = () => [
    { seat: 'producer', outcome: 'pass', output: 'from-history' },
  ];

  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, outcome: 'pass' };
  };

  const result = await runSolo(unit, {}, { runRole, history });
  assert.equal(calls.length, 0); // Not dispatched again
  assert.equal(result.outcome, 'pass');
  assert.equal(result.results[0].output, 'from-history');
});

test('runSolo preserves non-pass outcomes strictly from valid set', async () => {
  for (const outcome of ['execution-failure', 'policy-refusal', 'provider-limit', 'blocked', 'findings']) {
    assert.ok(VALID_OUTCOMES.includes(outcome));
    const runRole = async (opts) => ({ seat: opts.seat.seat, outcome });
    const result = await runSolo({ id: 'u4', objective: 'Error case' }, {}, { runRole });
    assert.equal(result.outcome, outcome);
  }
});

test('a solo unit may declare its one seat', async () => {
  const calls = [];
  const unit = { id: 'u-consult', objective: 'Consult advisor', seats: [{ seat: 'advisor', role: 'producer' }] };
  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, outcome: 'pass', output: 'advice' };
  };

  const result = await runSolo(unit, {}, { runRole });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].seat.seat, 'advisor');
  assert.equal(result.results[0].seat, 'advisor');

  await assert.rejects(runSolo({ ...unit, seats: [{ seat: 'a', role: 'producer' }, { seat: 'b', role: 'producer' }] }, {}, { runRole }), /exactly one seat/);
});

test('solo module exports its param table declaring seats', () => {
  assert.ok(PARAMS);
  assert.deepEqual(Object.keys(PARAMS), ['seats']);
  assert.equal(PARAMS.seats.type, 'seats');
  assert.equal(PARAMS.seats.scalar, false);
  assert.equal(PARAMS.seats.requestable, true);
});

test('runSolo honors declared seats passed through params', async () => {
  const calls = [];
  const unit = { id: 'u-param-seats', objective: 'Custom seat task' };
  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, outcome: 'pass' };
  };
  const params = { seats: [{ seat: 'custom-producer', role: 'producer' }] };
  const result = await runSolo(unit, {}, { runRole }, params);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].seat.seat, 'custom-producer');
  assert.equal(result.results[0].seat, 'custom-producer');
});
