import '../../../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runDebate, debateHistoryOutcome, debateSeatLaunches } from '../../../../src/runner/execution/patterns/debate.mjs';
import { runPattern } from '../../../../src/runner/execution/patterns/index.mjs';

const unit = { id: 'u-debate', objective: 'Should the cache be write-through?' };

function recorder(overrides = {}) {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    if (overrides[opts.role]) return overrides[opts.role](opts);
    return { role: opts.role, round: opts.round ?? 1, outcome: 'pass' };
  };
  return { calls, runRole };
}

const seatKey = (c) => `${c.role}/${c.round ?? 1}`;

test('round 1 runs both sides in parallel, read-only, with no inputs and a soft family spread', async () => {
  let inFlight = 0;
  let maxInFlight = 0;
  const side = async (opts) => {
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((r) => setTimeout(r, 15));
    inFlight--;
    return { role: opts.role, round: opts.round, outcome: 'pass' };
  };
  const { calls, runRole } = recorder({ thesis: side, antithesis: side });
  await runDebate(unit, {}, { runRole }, { rebuttal: false });
  assert.equal(maxInFlight, 2);
  const [thesis, antithesis] = calls;
  for (const [call, role, other] of [[thesis, 'thesis', 'antithesis'], [antithesis, 'antithesis', 'thesis']]) {
    assert.equal(call.role, role);
    assert.equal(call.round, 1);
    assert.equal(call.readOnly, true);
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
  const thesis2 = calls.find((c) => c.role === 'thesis' && c.round === 2);
  const antithesis2 = calls.find((c) => c.role === 'antithesis' && c.round === 2);
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
  assert.equal(judge.role, 'judge');
  assert.equal(judge.readOnly, true);
  assert.deepEqual(judge.independentOf, ['thesis', 'antithesis']);
  assert.equal(judge.preferIndependentOf, undefined);
  assert.deepEqual(judge.inputs.map(seatKey), ['thesis/1', 'antithesis/1', 'thesis/2', 'antithesis/2']);
  assert.match(judge.unit.objective, /judge of a debate/);
  assert.equal(res.results.at(-1).role, 'judge');
});

test('a pool that cannot seat an independent judge ends the debate with the named refusal', async () => {
  const refused = { reason: 'independence', detail: 'Candidate "x" violates independence requirement against [thesis, antithesis]' };
  const { runRole } = recorder({ judge: async () => ({ role: 'judge', outcome: 'policy-refusal', refused }) });
  const res = await runDebate(unit, {}, { runRole });
  assert.equal(res.outcome, 'policy-refusal');
  assert.equal(res.results.at(-1).refused, refused);
});

test('a side that fails ends the debate before the next round and before the judge', async () => {
  const { calls, runRole } = recorder({ antithesis: async () => ({ role: 'antithesis', round: 1, outcome: 'provider-limit' }) });
  const res = await runDebate(unit, {}, { runRole });
  assert.equal(res.outcome, 'provider-limit');
  assert.equal(res.rounds, 1);
  assert.deepEqual(calls.map((c) => c.role), ['thesis', 'antithesis']);
});

test('a throwing side is propagated after its sibling settled', async () => {
  let siblingSettled = false;
  const { runRole } = recorder({
    thesis: async () => { throw new Error('boom'); },
    antithesis: async () => { await new Promise((r) => setTimeout(r, 15)); siblingSettled = true; return { role: 'antithesis', round: 1, outcome: 'pass' }; },
  });
  await assert.rejects(() => runDebate(unit, {}, { runRole }), /boom/);
  assert.equal(siblingSettled, true);
});

test('resume reuses passed seats of the right round and retries the rest', async () => {
  const history = [
    { role: 'thesis', round: 1, outcome: 'pass' },
    { role: 'antithesis', round: 1, outcome: 'pass' },
    { role: 'thesis', round: 2, outcome: 'pass' },
    { role: 'antithesis', round: 2, outcome: 'provider-limit' },
  ];
  const { calls, runRole } = recorder();
  const res = await runDebate(unit, {}, { runRole, history });
  assert.deepEqual(calls.map(seatKey), ['antithesis/2', 'judge/1']);
  assert.deepEqual(calls[0].inputs.map(seatKey), ['thesis/1'], 'a reused round-1 result still feeds the rebuttal');
  assert.equal(res.outcome, 'pass');
});

test('resume reuses a passed judge too', async () => {
  const history = [
    { role: 'thesis', round: 1, outcome: 'pass' },
    { role: 'antithesis', round: 1, outcome: 'pass' },
    { role: 'judge', round: 1, outcome: 'pass' },
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
  assert.deepEqual(calls.map((c) => c.role), ['thesis', 'antithesis', 'judge']);
  assert.equal(debateSeatLaunches({ rebuttal: false }), 3);
  assert.equal(debateSeatLaunches({}), 5);
});

test('roleTasks override each seat, including the rebuttals and the judge', async () => {
  const roleTasks = { thesis: 'T: {objective}', antithesis: 'A: {objective}', 'thesis-rebuttal': 'TR: {objective}', 'antithesis-rebuttal': 'AR: {objective}', judge: 'J: {objective}' };
  const { calls, runRole } = recorder();
  await runDebate(unit, {}, { runRole }, { roleTasks });
  assert.deepEqual(calls.map((c) => c.unit.objective.split(':')[0]), ['T', 'A', 'TR', 'AR', 'J']);
});

test('history outcome: unknown until every seat reported, then the judge\'s', () => {
  const full = [
    { role: 'thesis', round: 1, outcome: 'pass' }, { role: 'antithesis', round: 1, outcome: 'pass' },
    { role: 'thesis', round: 2, outcome: 'pass' }, { role: 'antithesis', round: 2, outcome: 'pass' },
  ];
  assert.equal(debateHistoryOutcome({}, full), null);
  assert.equal(debateHistoryOutcome({}, [...full, { role: 'judge', round: 1, outcome: 'policy-refusal' }]), 'policy-refusal');
  assert.equal(debateHistoryOutcome({}, full.slice(0, 2)), null);
  assert.equal(debateHistoryOutcome({}, [{ role: 'thesis', round: 1, outcome: 'blocked' }]), 'blocked');
  assert.equal(debateHistoryOutcome({ rebuttal: false }, [...full.slice(0, 2), { role: 'judge', round: 1, outcome: 'pass' }]), 'pass');
});

test('runPattern dispatches the debate pattern by name and as a pattern object', async () => {
  const { calls, runRole } = recorder();
  await runPattern('debate', unit, {}, { runRole });
  assert.equal(calls.length, 5);
  const second = recorder();
  await runPattern({ pattern: 'debate', params: { rebuttal: false } }, unit, {}, { runRole: second.runRole });
  assert.equal(second.calls.length, 3);
});
