import '../../../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  runLoop,
  paramTableOf,
  VALID_OUTCOMES,
  loopRunsVerify,
  VERIFY_CAPABILITY,
} from '../../../../src/runner/execution/loops/index.mjs';
import { PARAMS as SOLO_PARAMS } from '../../../../src/runner/execution/loops/solo.mjs';
import { PARAMS as REVIEWED_PARAMS } from '../../../../src/runner/execution/loops/reviewed.mjs';
import { PARAMS as PANEL_PARAMS } from '../../../../src/runner/execution/loops/panel.mjs';
import { PARAMS as DEBATE_PARAMS } from '../../../../src/runner/execution/loops/debate.mjs';

const PANEL_SEATS = [
  { seat: 'member-1', role: 'producer' },
  { seat: 'member-2', role: 'producer' },
  { seat: 'member-3', role: 'producer' },
  { seat: 'synthesis', role: 'synthesizer' },
];

const DEBATE_SEATS = [
  { seat: 'thesis', role: 'producer' },
  { seat: 'antithesis', role: 'producer' },
  { seat: 'judge', role: 'judge' },
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

test('runLoop dispatches debate loop by name and as effective object', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, round: opts.round ?? 1, outcome: 'pass' };
  };
  const unit = { id: 'u-debate', objective: 'Should the cache be write-through?', seats: DEBATE_SEATS };
  await runLoop('debate', unit, {}, { runRole });
  assert.equal(calls.length, 5);
  const secondCalls = [];
  const secondRunRole = async (opts) => {
    secondCalls.push(opts);
    return { seat: opts.seat.seat, round: opts.round ?? 1, outcome: 'pass' };
  };
  await runLoop({ loop: 'debate', params: { rebuttal: false } }, unit, {}, { runRole: secondRunRole });
  assert.equal(secondCalls.length, 3);
});
test('runLoop uses pin effective seats over recomputed config', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts.seat.seat);
    return { seat: opts.seat.seat, role: opts.seat.role, outcome: 'pass' };
  };
  const effective = {
    loop: 'reviewed',
    params: { maxRounds: 1 },
    seats: [
      { seat: 'producer', role: 'producer', posture: { writer: true } },
      { seat: 'reviewer', role: 'reviewer', posture: { readOnly: true, verdict: true } },
      { seat: 'red-team', role: 'red-team', posture: { readOnly: true, verdict: true } },
    ],
  };
  const cfg = {
    loops: {
      reviewed: {
        checkersByRigor: { standard: ['reviewer'] },
      },
    },
  };
  const res = await runLoop(effective, { id: 'u-pinned-roster', capability: 'docs:write' }, cfg, { runRole });
  assert.equal(res.outcome, 'pass');
  assert.deepEqual(calls, ['producer', 'reviewer', 'red-team']);
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
  assert.equal(paramTableOf('nonexistent'), null);
  assert.equal(paramTableOf('toString'), null);
  assert.equal(paramTableOf('constructor'), null);
  assert.equal(paramTableOf('__proto__'), null);
  assert.equal(paramTableOf(null), null);
  assert.equal(paramTableOf(undefined), null);
  assert.equal(paramTableOf(123), null);

  assert.strictEqual(paramTableOf('solo'), SOLO_PARAMS);
  assert.strictEqual(paramTableOf({ loop: 'solo' }), SOLO_PARAMS);
  assert.strictEqual(paramTableOf('reviewed'), REVIEWED_PARAMS);
  assert.strictEqual(paramTableOf({ loop: 'reviewed' }), REVIEWED_PARAMS);
  assert.strictEqual(paramTableOf('panel'), PANEL_PARAMS);
  assert.strictEqual(paramTableOf({ loop: 'panel' }), PANEL_PARAMS);
  assert.strictEqual(paramTableOf('debate'), DEBATE_PARAMS);
  assert.strictEqual(paramTableOf({ loop: 'debate' }), DEBATE_PARAMS);
});
