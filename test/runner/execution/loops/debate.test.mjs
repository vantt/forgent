import '../../../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runDebate, PARAMS, DEFAULT_REBUTTAL } from '../../../../src/runner/execution/loops/debate.mjs';
import { patternHistoryOutcome } from '../../../../src/runner/execution/loops/history-outcome.mjs';
import { resolveSeats, seatLaunchesOf } from '../../../../src/runner/execution/seat-resolver.mjs';

const seats = [
  { seat: 'thesis', role: 'producer' },
  { seat: 'antithesis', role: 'producer' },
  { seat: 'judge', role: 'judge' },
];
const unit = { id: 'u-debate', objective: 'Should the cache be write-through?', seats };
const resolved = (params) => resolveSeats({ loop: 'debate', params, unit, runnerConfig: {} });
const historyOutcome = (params, history) => patternHistoryOutcome({ loop: 'debate', params, unit, cfg: {}, seats: resolved(params), history });

function recorder(overrides = {}) {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    if (overrides[opts.seat.seat]) return overrides[opts.seat.seat](opts);
    return { seat: opts.seat.seat, round: opts.round ?? 1, outcome: 'pass' };
  };
  return { calls, runRole };
}

// A call carries the seat object, a result its id.
const seatKey = (c) => `${c.seat?.seat ?? c.seat}/${c.round ?? 1}`;

test('round 1 runs both sides in parallel, read-only, with no inputs and a soft family spread', async () => {
  let inFlight = 0;
  let maxInFlight = 0;
  const side = async (opts) => {
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((r) => setTimeout(r, 15));
    inFlight--;
    return { seat: opts.seat.seat, round: opts.round, outcome: 'pass' };
  };
  const { calls, runRole } = recorder({ thesis: side, antithesis: side });
  await runDebate(unit, {}, { runRole }, { rebuttal: false });
  assert.equal(maxInFlight, 2);
  const [thesis, antithesis] = calls;
  for (const [call, id, other] of [[thesis, 'thesis', 'antithesis'], [antithesis, 'antithesis', 'thesis']]) {
    assert.equal(call.seat.seat, id);
    assert.equal(call.seat.role, 'producer');
    assert.equal(call.round, 1);
    assert.equal(call.seat.posture.readOnly, true);
    assert.equal(call.seat.posture.forceOutOfProcess, true);
    assert.equal(call.inputs, undefined, 'round 1 is blind: no peer output is handed over');
    assert.deepEqual(call.preferIndependentOf, [other]);
    assert.equal(call.independentOf, undefined, 'a different family per side is a preference, never a rule');
    assert.ok(call.unit.objective.includes(unit.objective));
  }
  assert.match(thesis.unit.objective, /Argue the position/);
  assert.match(antithesis.unit.objective, /reverse them/);
});

test('rebuttal round hands each side only the other side\'s round-1 argument', async () => {
  const { calls, runRole } = recorder();
  const res = await runDebate(unit, {}, { runRole });
  assert.deepEqual(calls.map(seatKey), ['thesis/1', 'antithesis/1', 'thesis/2', 'antithesis/2', 'judge/1']);
  const thesis2 = calls.find((c) => c.seat.seat === 'thesis' && c.round === 2);
  const antithesis2 = calls.find((c) => c.seat.seat === 'antithesis' && c.round === 2);
  assert.deepEqual(thesis2.inputs.map(seatKey), ['antithesis/1']);
  assert.deepEqual(antithesis2.inputs.map(seatKey), ['thesis/1']);
  assert.match(thesis2.unit.objective, /answer the other side/);
  assert.match(antithesis2.unit.objective, /answer the original position/);
  assert.equal(res.outcome, 'pass');
  assert.equal(res.rounds, 2);
});

test('the judge reads every argument and must differ in family from both sides', async () => {
  const { calls, runRole } = recorder();
  const res = await runDebate(unit, {}, { runRole });
  const judge = calls.at(-1);
  assert.equal(judge.seat.seat, 'judge');
  assert.equal(judge.seat.role, 'judge');
  assert.equal(judge.seat.posture.readOnly, true);
  assert.deepEqual(judge.independentOf, ['thesis', 'antithesis']);
  assert.equal(judge.preferIndependentOf, undefined);
  assert.deepEqual(judge.inputs.map(seatKey), ['thesis/1', 'antithesis/1', 'thesis/2', 'antithesis/2']);
  assert.match(judge.unit.objective, /judge of a debate/);
  assert.equal(res.results.at(-1).seat, 'judge');
});

test('a pool that cannot seat an independent judge ends the debate with the named refusal', async () => {
  const refused = { reason: 'independence', detail: 'Candidate "x" violates independence requirement against [thesis, antithesis]' };
  const { runRole } = recorder({ judge: async () => ({ seat: 'judge', outcome: 'policy-refusal', refused }) });
  const res = await runDebate(unit, {}, { runRole });
  assert.equal(res.outcome, 'policy-refusal');
  assert.equal(res.results.at(-1).refused, refused);
});

test('a side that fails ends the debate before the next round and before the judge', async () => {
  const { calls, runRole } = recorder({ antithesis: async () => ({ seat: 'antithesis', round: 1, outcome: 'provider-limit' }) });
  const res = await runDebate(unit, {}, { runRole });
  assert.equal(res.outcome, 'provider-limit');
  assert.equal(res.rounds, 1);
  assert.deepEqual(calls.map((c) => c.seat.seat), ['thesis', 'antithesis']);
});

test('a throwing side is propagated after its sibling settled', async () => {
  let siblingSettled = false;
  const { runRole } = recorder({
    thesis: async () => { throw new Error('boom'); },
    antithesis: async () => { await new Promise((r) => setTimeout(r, 15)); siblingSettled = true; return { seat: 'antithesis', round: 1, outcome: 'pass' }; },
  });
  await assert.rejects(() => runDebate(unit, {}, { runRole }), /boom/);
  assert.equal(siblingSettled, true);
});

test('resume reuses passed seats of the right round and retries the rest', async () => {
  const history = [
    { seat: 'thesis', round: 1, outcome: 'pass' },
    { seat: 'antithesis', round: 1, outcome: 'pass' },
    { seat: 'thesis', round: 2, outcome: 'pass' },
    { seat: 'antithesis', round: 2, outcome: 'provider-limit' },
  ];
  const { calls, runRole } = recorder();
  const res = await runDebate(unit, {}, { runRole, history });
  assert.deepEqual(calls.map(seatKey), ['antithesis/2', 'judge/1']);
  assert.deepEqual(calls[0].inputs.map(seatKey), ['thesis/1'], 'a reused round-1 result still feeds the rebuttal');
  assert.equal(res.outcome, 'pass');
});

test('resume reuses a passed judge too', async () => {
  const history = [
    { seat: 'thesis', round: 1, outcome: 'pass' },
    { seat: 'antithesis', round: 1, outcome: 'pass' },
    { seat: 'judge', round: 1, outcome: 'pass' },
  ];
  const { calls, runRole } = recorder();
  const res = await runDebate(unit, {}, { runRole, history: () => history }, { rebuttal: false });
  assert.deepEqual(calls, []);
  assert.equal(res.outcome, 'pass');
  assert.equal(res.rounds, 1);
});

test('rebuttal: false skips round 2', async () => {
  const { calls, runRole } = recorder();
  await runDebate(unit, {}, { runRole }, { rebuttal: false });
  assert.deepEqual(calls.map((c) => c.seat.seat), ['thesis', 'antithesis', 'judge']);
  assert.equal(seatLaunchesOf({ pattern: { pattern: 'debate', params: { rebuttal: false } }, unit, runnerConfig: {} }), 3);
  assert.equal(seatLaunchesOf({ pattern: 'debate', unit, runnerConfig: {} }), 5);
});

test('roleTasks override each seat, including the rebuttals and the judge', async () => {
  const roleTasks = { thesis: 'T: {objective}', antithesis: 'A: {objective}', 'thesis-rebuttal': 'TR: {objective}', 'antithesis-rebuttal': 'AR: {objective}', judge: 'J: {objective}' };
  const { calls, runRole } = recorder();
  await runDebate(unit, {}, { runRole }, { roleTasks });
  assert.deepEqual(calls.map((c) => c.unit.objective.split(':')[0]), ['T', 'A', 'TR', 'AR', 'J']);
});

test('history outcome: unknown until every seat reported, then the judge\'s', () => {
  const full = [
    { seat: 'thesis', round: 1, outcome: 'pass' }, { seat: 'antithesis', round: 1, outcome: 'pass' },
    { seat: 'thesis', round: 2, outcome: 'pass' }, { seat: 'antithesis', round: 2, outcome: 'pass' },
  ];
  assert.equal(historyOutcome({}, full), null);
  assert.equal(historyOutcome({}, [...full, { seat: 'judge', round: 1, outcome: 'policy-refusal' }]), 'policy-refusal');
  assert.equal(historyOutcome({}, full.slice(0, 2)), null);
  assert.equal(historyOutcome({}, [{ seat: 'thesis', round: 1, outcome: 'blocked' }]), 'blocked');
  assert.equal(historyOutcome({ rebuttal: false }, [...full.slice(0, 2), { seat: 'judge', round: 1, outcome: 'pass' }]), 'pass');
});


test('debate module exports its param table and default rebuttal', () => {
  assert.equal(DEFAULT_REBUTTAL, true);
  assert.ok(PARAMS);
  assert.deepEqual(Object.keys(PARAMS).sort(), ['rebuttal', 'roleTasks', 'seats'].sort());
  assert.equal(PARAMS.seats.type, 'seats');
  assert.equal(PARAMS.seats.scalar, false);
  assert.equal(PARAMS.seats.requestable, true);
  assert.equal(PARAMS.roleTasks.type, 'role-tasks');
  assert.equal(PARAMS.roleTasks.scalar, false);
  assert.equal(PARAMS.roleTasks.requestable, false);
  assert.equal(PARAMS.rebuttal.type, 'boolean');
  assert.equal(PARAMS.rebuttal.scalar, true);
  assert.equal(PARAMS.rebuttal.requestable, true);
});

test('runDebate defaults rebuttal to DEFAULT_REBUTTAL when omitted', async () => {
  const { calls, runRole } = recorder();
  // params without rebuttal -> rebuttal is true (round 1 sides, round 2 sides, judge = 5 calls)
  await runDebate(unit, {}, { runRole }, {});
  assert.equal(calls.length, 5);
  const round2Calls = calls.filter((c) => c.round === 2);
  assert.equal(round2Calls.length, 2);
});
