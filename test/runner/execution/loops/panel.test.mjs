import '../../../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runPanel, PARAMS } from '../../../../src/runner/execution/loops/panel.mjs';

const SEATS = [
  { seat: 'member-1', role: 'producer' },
  { seat: 'member-2', role: 'producer' },
  { seat: 'member-3', role: 'producer' },
  { seat: 'synthesis', role: 'synthesizer' },
];
const panelUnit = (extra = {}) => ({ id: 'u-panel', objective: 'Evaluate architecture options', seats: SEATS, ...extra });

test('runPanel runs the member seats in parallel and synthesizes results', async () => {
  const calls = [];
  let inFlight = 0;
  let maxConcurrency = 0;
  const unit = panelUnit();

  const runRole = async (opts) => {
    calls.push(opts);
    if (opts.seat.posture.stance) {
      inFlight++;
      maxConcurrency = Math.max(maxConcurrency, inFlight);
      await new Promise((r) => setTimeout(r, 20));
      inFlight--;
      return { seat: opts.seat.seat, role: opts.seat.role, outcome: 'pass', opinion: `Perspective from ${opts.seat.seat}` };
    }
    return { seat: opts.seat.seat, role: opts.seat.role, outcome: 'pass', summary: 'Synthesized consensus' };
  };

  const res = await runPanel(unit, {}, { runRole });

  assert.equal(calls.length, 4); // 3 members + 1 synthesizer
  assert.equal(maxConcurrency, 3, 'All 3 members executed concurrently in parallel');

  const memberCalls = calls.slice(0, 3);
  for (let i = 0; i < 3; i++) {
    const expected = `member-${i + 1}`;
    assert.equal(memberCalls[i].seat.seat, expected);
    assert.equal(memberCalls[i].seat.role, 'producer');
    // Posture, not the role, says a member never writes, runs out of process and is measured for stance.
    assert.deepEqual(
      { readOnly: memberCalls[i].seat.posture.readOnly, forceOutOfProcess: memberCalls[i].seat.posture.forceOutOfProcess, stance: memberCalls[i].seat.posture.stance },
      { readOnly: true, forceOutOfProcess: true, stance: true },
    );
    // A different family per seat is a soft preference over every other seat, never a hard rule.
    assert.deepEqual(memberCalls[i].preferIndependentOf, ['member-1', 'member-2', 'member-3'].filter((id) => id !== expected));
    assert.equal(memberCalls[i].independentOf, undefined);
  }

  const synthCall = calls[3];
  assert.equal(synthCall.seat.seat, 'synthesis');
  assert.equal(synthCall.seat.role, 'synthesizer');
  // The synthesizer is told its own task, which quotes the panel's task; nothing else about the unit changes.
  assert.notEqual(synthCall.unit, unit);
  assert.match(synthCall.unit.objective, /synthesizer/i);
  assert.ok(synthCall.unit.objective.includes(unit.objective));
  assert.deepEqual({ ...synthCall.unit, objective: unit.objective }, unit);
  assert.equal(synthCall.inputs.length, 3);
  assert.deepEqual(synthCall.preferIndependentOf, ['member-1', 'member-2', 'member-3']);
  assert.equal(synthCall.independentOf, undefined);
  assert.equal(synthCall.inputs[0].seat, 'member-1');

  assert.equal(res.outcome, 'pass');
  assert.equal(res.results.length, 4);
  assert.equal(res.results[3].seat, 'synthesis');
  assert.equal(res.results[3].summary, 'Synthesized consensus');
});

test('the members of a group are handed one bind barrier, so none launches before all are bound', async () => {
  const barriers = new Set();
  await runPanel(panelUnit(), {}, {
    runRole: async (opts) => {
      if (opts.seat.posture.stance) barriers.add(opts.batch);
      return { seat: opts.seat.seat, outcome: 'pass' };
    },
  });
  assert.equal(barriers.size, 1);
  assert.ok([...barriers][0]?.bound instanceof Promise);
});

test('runPanel propagates policy-refusal immediately without running synthesizer', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    if (opts.seat.seat === 'member-2') return { seat: 'member-2', outcome: 'policy-refusal', reason: 'Refused by safety guard' };
    return { seat: opts.seat.seat, outcome: 'pass' };
  };

  const res = await runPanel(panelUnit(), {}, { runRole });

  assert.equal(res.outcome, 'policy-refusal');
  assert.ok(calls.every((c) => c.seat.role !== 'synthesizer'), 'Synthesizer MUST NOT be dispatched on refusal');
  assert.equal(res.results.length, 3);
});

test('runPanel reuses passed members from history and only runs missing seats', async () => {
  const calls = [];
  const history = () => [
    { seat: 'member-1', outcome: 'pass', opinion: 'Cached opinion 1' },
    { seat: 'member-2', outcome: 'pass', opinion: 'Cached opinion 2' },
  ];
  const runRole = async (opts) => {
    calls.push(opts);
    if (opts.seat.seat === 'member-3') return { seat: 'member-3', outcome: 'pass', opinion: 'Live opinion 3' };
    if (opts.seat.seat === 'synthesis') return { seat: 'synthesis', outcome: 'pass', summary: 'Combined' };
    throw new Error(`Unexpected call: ${opts.seat.seat}`);
  };

  const res = await runPanel(panelUnit(), {}, { runRole, history });

  assert.equal(calls.length, 2);
  assert.equal(calls[0].seat.seat, 'member-3');
  assert.equal(calls[1].seat.seat, 'synthesis');
  assert.equal(res.outcome, 'pass');
  assert.equal(res.results.length, 4);
  assert.equal(res.results[0].opinion, 'Cached opinion 1');
  assert.equal(res.results[2].opinion, 'Live opinion 3');
});

test('a panel unit must declare its seats; roles and counts come from them, not from params', async () => {
  const runRole = async () => assert.fail('no seat may run');
  await assert.rejects(runPanel({ id: 'u', objective: 'x' }, {}, { runRole }), /must declare its seats/);
  const noSynth = { id: 'u', objective: 'x', seats: SEATS.slice(0, 3) };
  await assert.rejects(runPanel(noSynth, {}, { runRole }), /role "synthesizer"/);
});

test('three producer seats are three seats: none collapses into another', async () => {
  const calls = [];
  const unit = {
    id: 'u-research', objective: 'Research options',
    seats: [
      { seat: 'researcher-1', role: 'producer' },
      { seat: 'researcher-2', role: 'producer' },
      { seat: 'researcher-3', role: 'producer' },
      { seat: 'synthesizer', role: 'synthesizer' },
    ],
  };
  const res = await runPanel(unit, {}, { runRole: async (opts) => { calls.push(opts.seat.seat); return { seat: opts.seat.seat, outcome: 'pass' }; } });
  assert.deepEqual(calls, ['researcher-1', 'researcher-2', 'researcher-3', 'synthesizer']);
  assert.equal(res.results.length, 4);
});

test('a thrown member waits for the other seat to settle before the unit can be summarized', async () => {
  let release;
  const barrier = new Promise((resolve) => { release = resolve; });
  let otherSettled = false;
  let finished = false;
  const failure = new Error('seat dispatch failed');
  const unit = { id: 'throwing-panel', objective: 'Answer question', seats: [
    { seat: 'member-1', role: 'producer' }, { seat: 'member-2', role: 'producer' }, { seat: 'synthesis', role: 'synthesizer' },
  ] };
  const panel = runPanel(unit, {}, {
    runRole: async ({ seat }) => {
      if (seat.seat === 'member-1') throw failure;
      if (seat.seat === 'member-2') {
        await barrier;
        otherSettled = true;
        return { seat: seat.seat, outcome: 'pass' };
      }
      assert.fail('synthesizer must not run after a seat throws');
    },
  });
  const rejection = assert.rejects(panel, (error) => {
    finished = true;
    assert.equal(error, failure);
    assert.equal(otherSettled, true);
    return true;
  });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(finished, false);
  release();
  await rejection;
});

test('panel.mjs declares seat intent only: no executor, family or tier names', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile(new URL('../../../../src/runner/execution/loops/panel.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(claude|openai|codex|gemini|xai|glm|nano|flagship|frontier)\b/i);
});

test('panel module exports its param table declaring seats and roleTasks', () => {
  assert.ok(PARAMS);
  assert.deepEqual(Object.keys(PARAMS).sort(), ['roleTasks', 'seats'].sort());
  assert.equal(PARAMS.seats.type, 'seats');
  assert.equal(PARAMS.seats.scalar, false);
  assert.equal(PARAMS.seats.requestable, true);
  assert.equal(PARAMS.roleTasks.type, 'role-tasks');
  assert.equal(PARAMS.roleTasks.scalar, false);
  assert.equal(PARAMS.roleTasks.requestable, false);
});

test('runPanel accepts params in loop-name shape', async () => {
  const calls = [];
  const unit = panelUnit();
  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, outcome: 'pass', output: 'ok' };
  };
  const params = { roleTasks: { 'member-1': 'Special perspective' } };
  const res = await runPanel(unit, {}, { runRole }, params);
  assert.equal(res.outcome, 'pass');
  const member1 = calls.find((c) => c.seat.seat === 'member-1');
  assert.ok(member1.unit.objective.includes('Special perspective'));
});
