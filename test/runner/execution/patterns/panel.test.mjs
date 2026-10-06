import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runPanel } from '../../../../src/runner/execution/patterns/panel.mjs';

test('runPanel runs N panel members in parallel and synthesizes results', async () => {
  const calls = [];
  let inFlight = 0;
  let maxConcurrency = 0;

  const unit = { id: 'u-panel', objective: 'Evaluate architecture options' };
  const cfg = {};

  const runRole = async (opts) => {
    calls.push(opts);
    if (opts.role.startsWith('panelist-')) {
      inFlight++;
      maxConcurrency = Math.max(maxConcurrency, inFlight);
      await new Promise((r) => setTimeout(r, 20));
      inFlight--;
      return {
        role: opts.role,
        outcome: 'pass',
        opinion: `Perspective from ${opts.role}`,
      };
    }
    if (opts.role === 'synthesizer') {
      return {
        role: 'synthesizer',
        outcome: 'pass',
        summary: 'Synthesized consensus',
      };
    }
    throw new Error(`Unexpected role: ${opts.role}`);
  };

  const res = await runPanel(unit, cfg, { runRole, members: 3 });

  assert.equal(calls.length, 4); // 3 panelists + 1 synthesizer
  assert.equal(maxConcurrency, 3, 'All 3 panelists executed concurrently in parallel');

  // Verify panelist calls
  const panelistCalls = calls.slice(0, 3);
  for (let i = 0; i < 3; i++) {
    const expectedRole = `panelist-${i + 1}`;
    assert.equal(panelistCalls[i].role, expectedRole);
    assert.equal(panelistCalls[i].readOnly, true);
    assert.equal(panelistCalls[i].unit, unit);
    // independentOf should contain all other panelists
    const expectedIndependentOf = ['panelist-1', 'panelist-2', 'panelist-3'].filter((r) => r !== expectedRole);
    assert.deepEqual(panelistCalls[i].independentOf, expectedIndependentOf);
  }

  // Verify synthesizer call
  const synthCall = calls[3];
  assert.equal(synthCall.role, 'synthesizer');
  // The synthesizer is told its own task, which quotes the panel's task; nothing else about the unit changes.
  assert.notEqual(synthCall.unit, unit);
  assert.match(synthCall.unit.objective, /synthesizer/i);
  assert.ok(synthCall.unit.objective.includes(unit.objective));
  assert.deepEqual({ ...synthCall.unit, objective: unit.objective }, unit);
  assert.equal(synthCall.inputs.length, 3);
  assert.deepEqual(synthCall.independentOf, ['panelist-1', 'panelist-2', 'panelist-3']);
  assert.equal(synthCall.inputs[0].role, 'panelist-1');

  // Verify returned result shape
  assert.equal(res.outcome, 'pass');
  assert.equal(res.results.length, 4);
  assert.equal(res.results[3].role, 'synthesizer');
  assert.equal(res.results[3].summary, 'Synthesized consensus');
});

test('runPanel propagates policy-refusal immediately without running synthesizer', async () => {
  const calls = [];
  const unit = { id: 'u-panel-refusal', objective: 'Sensitive topic' };

  const runRole = async (opts) => {
    calls.push(opts);
    if (opts.role === 'panelist-2') {
      return { role: opts.role, outcome: 'policy-refusal', reason: 'Refused by safety guard' };
    }
    if (opts.role.startsWith('panelist-')) {
      return { role: opts.role, outcome: 'pass' };
    }
    return { role: opts.role, outcome: 'pass' };
  };

  const res = await runPanel(unit, {}, { runRole, members: 3 });

  assert.equal(res.outcome, 'policy-refusal');
  assert.ok(calls.every((c) => c.role !== 'synthesizer'), 'Synthesizer MUST NOT be dispatched on refusal');
  assert.equal(res.results.length, 3);
});

test('runPanel reuses passed members from history and only runs missing roles', async () => {
  const calls = [];
  const unit = { id: 'u-panel-history', objective: 'Resume panel' };

  const history = () => [
    { role: 'panelist-1', outcome: 'pass', opinion: 'Cached opinion 1' },
    { role: 'panelist-2', outcome: 'pass', opinion: 'Cached opinion 2' },
  ];

  const runRole = async (opts) => {
    calls.push(opts);
    if (opts.role === 'panelist-3') {
      return { role: opts.role, outcome: 'pass', opinion: 'Live opinion 3' };
    }
    if (opts.role === 'synthesizer') {
      return { role: 'synthesizer', outcome: 'pass', summary: 'Combined' };
    }
    throw new Error(`Unexpected call: ${opts.role}`);
  };

  const res = await runPanel(unit, {}, { runRole, history, members: 3 });

  // Only panelist-3 and synthesizer should have been dispatched
  assert.equal(calls.length, 2);
  assert.equal(calls[0].role, 'panelist-3');
  assert.equal(calls[1].role, 'synthesizer');

  assert.equal(res.outcome, 'pass');
  assert.equal(res.results.length, 4);
  assert.equal(res.results[0].opinion, 'Cached opinion 1');
  assert.equal(res.results[1].opinion, 'Cached opinion 2');
  assert.equal(res.results[2].opinion, 'Live opinion 3');
});

test('runPanel supports members, role, and synthesizeRole overrides in params', async () => {
  const calls = [];
  const unit = { id: 'u-research', objective: 'Research options' };
  const runRole = async (opts) => {
    calls.push(opts);
    return { role: opts.role, outcome: 'pass' };
  };

  const res = await runPanel(
    unit,
    {},
    { runRole },
    { members: 2, role: 'researcher', synthesizeRole: 'synthesizer' },
  );

  assert.equal(calls.length, 3); // 2 researchers + 1 synthesizer
  assert.equal(calls[0].role, 'researcher-1');
  assert.equal(calls[1].role, 'researcher-2');
  assert.equal(calls[2].role, 'synthesizer');
  assert.deepEqual(calls[0].independentOf, ['researcher-2']);
  assert.deepEqual(calls[1].independentOf, ['researcher-1']);
  assert.equal(res.outcome, 'pass');
  assert.equal(res.results.length, 3);
});

test('a thrown panelist waits for the other seat to settle before the unit can be summarized', async () => {
  let release;
  const barrier = new Promise((resolve) => { release = resolve; });
  let otherSettled = false;
  let finished = false;
  const failure = new Error('seat dispatch failed');
  const panel = runPanel({ id: 'throwing-panel', objective: 'Answer question' }, {}, {
    members: 2,
    runRole: async ({ role }) => {
      if (role === 'panelist-1') throw failure;
      if (role === 'panelist-2') {
        await barrier;
        otherSettled = true;
        return { role, outcome: 'pass' };
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
