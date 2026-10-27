import '../../../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  runPattern,
  paramTableOf,
  DEFAULT_MAX_ROUNDS,
  DEFAULT_REBUTTAL,
  VALID_OUTCOMES,
} from '../../../../src/runner/execution/loops/index.mjs';

const PANEL_SEATS = [
  { seat: 'member-1', role: 'producer' },
  { seat: 'member-2', role: 'producer' },
  { seat: 'member-3', role: 'producer' },
  { seat: 'synthesis', role: 'synthesizer' },
];

test('runPattern dispatches solo pattern by default or name', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, role: opts.seat.role, outcome: 'pass' };
  };

  const res = await runPattern('solo', { id: 'u-1', objective: 'Solo task' }, {}, { runRole });
  assert.equal(res.outcome, 'pass');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].seat.seat, 'producer');
});

test('runPattern dispatches reviewed pattern with parameters', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, role: opts.seat.role, outcome: 'pass' };
  };

  const res = await runPattern(
    'reviewed',
    { id: 'u-2', objective: 'Reviewed task', capability: 'code:implement' },
    {},
    { runRole },
  );

  assert.equal(res.outcome, 'pass');
  assert.ok(calls.some((c) => c.seat.seat === 'producer'));
  assert.ok(calls.some((c) => c.seat.seat === 'reviewer'));
  assert.ok(calls.some((c) => c.seat.seat === 'red-team'));
});

test('runPattern dispatches panel pattern', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, role: opts.seat.role, outcome: 'pass' };
  };

  const res = await runPattern('panel', { id: 'u-3', objective: 'Panel task', seats: PANEL_SEATS }, {}, { runRole });
  assert.equal(res.outcome, 'pass');
  assert.equal(calls.length, 4); // 3 members + 1 synthesizer
});

test('runPattern dispatches named preset "code-change"', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, role: opts.seat.role, outcome: 'pass' };
  };
  const verify = async () => ({ pass: true });

  const res = await runPattern(
    'code-change',
    { id: 'u-4', objective: 'Change code' },
    {},
    { runRole, verify },
  );

  assert.equal(res.outcome, 'pass');
  assert.ok(calls.some((c) => c.seat.seat === 'producer'));
  assert.ok(calls.some((c) => c.seat.seat === 'reviewer'));
  assert.ok(calls.some((c) => c.seat.seat === 'red-team'));
});

test('runPattern dispatches named preset "consult" with its advisor seat', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, role: opts.seat.role, outcome: 'pass' };
  };

  const res = await runPattern(
    'consult',
    { id: 'u-consult', objective: 'Consult' },
    {},
    { runRole },
  );

  assert.equal(res.outcome, 'pass');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].seat.seat, 'advisor');
  assert.equal(calls[0].seat.role, 'producer');
});

test('runPattern dispatches named preset "research-fan-out" with researcher seats', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, role: opts.seat.role, outcome: 'pass' };
  };

  const res = await runPattern(
    'research-fan-out',
    { id: 'u-research', objective: 'Research' },
    {},
    { runRole },
  );

  assert.equal(res.outcome, 'pass');
  assert.equal(calls.length, 4);
  assert.equal(calls[0].seat.seat, 'researcher-1');
  assert.equal(calls[1].seat.seat, 'researcher-2');
  assert.equal(calls[2].seat.seat, 'researcher-3');
  assert.equal(calls[3].seat.seat, 'synthesizer');
});

test('runPattern dispatches named preset "rfc" with reviewer and red-team checkers', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, role: opts.seat.role, outcome: 'pass' };
  };

  const res = await runPattern(
    'rfc',
    { id: 'u-rfc', objective: 'RFC review', capability: 'docs:write' },
    {},
    { runRole },
  );

  assert.equal(res.outcome, 'pass');
  assert.equal(res.rounds, 1);
  assert.ok(calls.some((c) => c.seat.seat === 'producer'));
  assert.ok(calls.some((c) => c.seat.seat === 'reviewer'));
  assert.ok(calls.some((c) => c.seat.seat === 'red-team'));
});

test('runPattern uses unit.pattern when nameOrPreset is omitted', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, role: opts.seat.role, outcome: 'pass' };
  };

  const res = await runPattern(
    null,
    { id: 'u-5', objective: 'From unit pattern', pattern: 'panel', seats: PANEL_SEATS },
    {},
    { runRole },
  );

  assert.equal(res.outcome, 'pass');
  assert.equal(calls.length, 4);
});

test('runPattern rejects unknown pattern names', async () => {
  await assert.rejects(
    async () => {
      await runPattern('non-existent-pattern', { id: 'u-6' }, {}, {});
    },
    /Unknown collaboration pattern: "non-existent-pattern"/,
  );
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
  assert.equal(paramTableOf(null), null);
  assert.equal(paramTableOf({ loop: 'reviewed' }), reviewed);
});
