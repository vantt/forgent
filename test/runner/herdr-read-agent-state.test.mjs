// readAgentState: what herdr says the agent is doing, read the cheap way.
//
// herdr's agent status is the agent's status. fgos used to report a state of its own to herdr when it
// launched a confined agent, which froze the status at "working" for good; so it read the screen
// detector's verdict first, two herdr calls per poll. Now nothing is reported, `agent get` is true,
// and the detector is asked only when the status has no answer.

import test from 'node:test';
import assert from 'node:assert/strict';

import { readAgentState, ensureHerdrKnowsAgent } from '../../src/runner/dispatch/herdr-round.mjs';

const slot = ({ status, explain, getThrows = false, explainThrows = false } = {}) => {
  const calls = [];
  return {
    calls,
    state() {
      calls.push('get');
      if (getThrows) throw new Error('herdr unreachable');
      return { agentStatus: status };
    },
    explain() {
      calls.push('explain');
      if (explainThrows) throw new Error('explain failed');
      return { state: explain ?? null };
    },
  };
};

test('a known status is read with one herdr call', () => {
  for (const status of ['idle', 'working', 'blocked', 'done']) {
    const c = slot({ status, explain: 'idle' });
    assert.equal(readAgentState(c), status);
    assert.deepEqual(c.calls, ['get'], `${status}: the detector is not consulted`);
  }
});

test('an unknown status falls back to the detector verdict', () => {
  const c = slot({ status: 'unknown', explain: 'working' });
  assert.equal(readAgentState(c), 'working');
  assert.deepEqual(c.calls, ['get', 'explain']);
});

test('an unknown status stays unknown when the detector has no verdict or fails', () => {
  assert.equal(readAgentState(slot({ status: 'unknown', explain: null })), 'unknown');
  assert.equal(readAgentState(slot({ status: 'unknown', explainThrows: true })), 'unknown');
});

test('an unreachable herdr is not hidden: the caller counts it as blind time', () => {
  assert.throws(() => readAgentState(slot({ getThrows: true })), /unreachable/);
});

// ensureHerdrKnowsAgent: a state is reported only for a process herdr cannot recognise as an agent.

const launchSlot = ({ recogniseAfter = 0 } = {}) => {
  const log = { gets: 0, reports: [] };
  return {
    log,
    state() {
      log.gets += 1;
      return { agentStatus: 'idle', recognised: log.gets > recogniseAfter };
    },
    reportAgent(args) { log.reports.push(args); },
  };
};
const noteRound = () => { const notes = []; return { notes, note: (patch) => notes.push(patch) }; };

test('an agent herdr recognises at once gets no reported state', async () => {
  const io = launchSlot();
  const round = noteRound();
  assert.equal(await ensureHerdrKnowsAgent({ io, round, agentKind: 'codex', label: 'g', graceMs: 200, pollMs: 5 }), 'detected');
  assert.deepEqual(io.log.reports, []);
  assert.deepEqual(round.notes, [{ agentKnownToHerdr: 'detected' }]);
});

test('an agent herdr recognises a few polls later still gets no reported state', async () => {
  const io = launchSlot({ recogniseAfter: 3 });
  assert.equal(await ensureHerdrKnowsAgent({ io, round: noteRound(), agentKind: 'pi', label: 'g', graceMs: 500, pollMs: 5 }), 'detected');
  assert.deepEqual(io.log.reports, []);
  assert.equal(io.log.gets, 4);
});

test('a process herdr never recognises is addressable only through a reported state', async () => {
  const io = launchSlot({ recogniseAfter: 1e9 });
  const round = noteRound();
  assert.equal(await ensureHerdrKnowsAgent({ io, round, agentKind: 'claude', label: 'g9', graceMs: 40, pollMs: 5 }), 'reported');
  assert.deepEqual(io.log.reports, [{ agent: 'claude', label: 'g9', state: 'working' }]);
  assert.deepEqual(round.notes, [{ agentKnownToHerdr: 'reported' }]);
});
