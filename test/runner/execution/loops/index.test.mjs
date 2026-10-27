import '../../../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  runLoop,
  paramTableOf,
  DEFAULT_MAX_ROUNDS,
  DEFAULT_REBUTTAL,
  VALID_OUTCOMES,
  loopRunsVerify,
  VERIFY_CAPABILITY,
} from '../../../../src/runner/execution/loops/index.mjs';

const PANEL_SEATS = [
  { seat: 'member-1', role: 'producer' },
  { seat: 'member-2', role: 'producer' },
  { seat: 'member-3', role: 'producer' },
  { seat: 'synthesis', role: 'synthesizer' },
];

test('runLoop dispatches solo loop by default or name', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, role: opts.seat.role, outcome: 'pass' };
  };

  const res = await runLoop('solo', { id: 'u-1', objective: 'Solo task' }, {}, { runRole });
  assert.equal(res.outcome, 'pass');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].seat.seat, 'producer');
});

test('runLoop dispatches reviewed loop with parameters', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, role: opts.seat.role, outcome: 'pass' };
  };

  const res = await runLoop(
    { loop: 'reviewed', params: { minCheckers: ['reviewer', 'red-team'] } },
    { id: 'u-2', objective: 'Reviewed task', capability: 'code:implement' },
    {},
    { runRole },
  );

  assert.equal(res.outcome, 'pass');
  assert.ok(calls.some((c) => c.seat.seat === 'producer'));
  assert.ok(calls.some((c) => c.seat.seat === 'reviewer'));
  assert.ok(calls.some((c) => c.seat.seat === 'red-team'));
});

test('runLoop dispatches panel loop with seats', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, role: opts.seat.role, outcome: 'pass' };
  };

  const res = await runLoop({ loop: 'panel' }, { id: 'u-3', objective: 'Panel task', seats: PANEL_SEATS }, {}, { runRole });
  assert.equal(res.outcome, 'pass');
  assert.equal(calls.length, 4); // 3 members + 1 synthesizer
});

test('runLoop dispatches effective parameters and custom seats', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, role: opts.seat.role, outcome: 'pass' };
  };

  const res = await runLoop(
    { loop: 'solo', params: { seats: [{ seat: 'advisor', role: 'producer' }] } },
    { id: 'u-consult', objective: 'Consult' },
    {},
    { runRole },
  );

  assert.equal(res.outcome, 'pass');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].seat.seat, 'advisor');
  assert.equal(calls[0].seat.role, 'producer');
});

test('runLoop rejects unknown loop names', async () => {
  await assert.rejects(
    async () => {
      await runLoop('non-existent-loop', { id: 'u-6' }, {}, {});
    },
    /Unknown collaboration loop: "non-existent-loop"/,
  );
});

test('loopRunsVerify reports verify capability per loop kind', () => {
  assert.equal(VERIFY_CAPABILITY.solo, true);
  assert.equal(VERIFY_CAPABILITY.reviewed, true);
  assert.equal(VERIFY_CAPABILITY.panel, false);
  assert.equal(VERIFY_CAPABILITY.debate, false);

  assert.equal(loopRunsVerify('solo'), true);
  assert.equal(loopRunsVerify('reviewed'), true);
  assert.equal(loopRunsVerify('panel'), false);
  assert.equal(loopRunsVerify('debate'), false);
  assert.equal(loopRunsVerify({ loop: 'solo' }), true);
  assert.equal(loopRunsVerify({ loop: 'panel' }), false);
  assert.equal(loopRunsVerify('unknown'), false);
});

test('VALID_OUTCOMES strictly contains allowed outcomes', () => {
  assert.deepEqual(
    [...VALID_OUTCOMES].sort(),
    ['blocked', 'execution-failure', 'findings', 'pass', 'policy-refusal', 'provider-limit'].sort(),
  );
  assert.ok(!VALID_OUTCOMES.includes('failed'), 'failed must NEVER be an outcome');
});

test('paramTableOf returns the param table for each loop and null for unknown', () => {
  assert.equal(DEFAULT_MAX_ROUNDS, 2);
  assert.equal(DEFAULT_REBUTTAL, true);

  const solo = paramTableOf('solo');
  assert.ok(solo);
  assert.deepEqual(Object.keys(solo), ['seats']);

  const reviewed = paramTableOf('reviewed');
  assert.ok(reviewed);
  assert.deepEqual(Object.keys(reviewed).sort(), ['maxRounds', 'minCheckers', 'roleTasks', 'seats'].sort());

  const panel = paramTableOf('panel');
  assert.ok(panel);
  assert.deepEqual(Object.keys(panel).sort(), ['roleTasks', 'seats'].sort());

  const debate = paramTableOf('debate');
  assert.ok(debate);
  assert.deepEqual(Object.keys(debate).sort(), ['rebuttal', 'roleTasks', 'seats'].sort());

  assert.equal(paramTableOf('nonexistent'), null);
  assert.equal(paramTableOf('toString'), null);
  assert.equal(paramTableOf('constructor'), null);
  assert.equal(paramTableOf('__proto__'), null);
  assert.equal(paramTableOf(null), null);
  assert.equal(paramTableOf(undefined), null);
  assert.equal(paramTableOf(123), null);
  assert.equal(paramTableOf({ loop: 'reviewed' }), reviewed);
});
