// readAgentState: what herdr says the agent is doing, read the cheap way.
//
// herdr's `agent get` is the agent's status. fgos used to report a state of its own to herdr when it
// launched a confined agent, which froze `agent get` at "working" for good; so it read the screen
// detector's verdict first, two herdr calls per poll. Now nothing is reported, `agent get` is true,
// and the detector is asked only when `agent get` has no answer.

import test from 'node:test';
import assert from 'node:assert/strict';

import { readAgentState, ensureHerdrKnowsAgent } from '../../src/runner/dispatch/herdr-round.mjs';

const client = ({ status, explain, getThrows = false, explainThrows = false } = {}) => {
  const calls = [];
  return {
    calls,
    agentGet() {
      calls.push('get');
      if (getThrows) throw new Error('herdr unreachable');
      return { agentStatus: status };
    },
    agentExplain() {
      calls.push('explain');
      if (explainThrows) throw new Error('explain failed');
      return { state: explain ?? null };
    },
  };
};

test('a known status is read with one herdr call', () => {
  for (const status of ['idle', 'working', 'blocked', 'done']) {
    const c = client({ status, explain: 'idle' });
    assert.equal(readAgentState(c, 'pane-1'), status);
    assert.deepEqual(c.calls, ['get'], `${status}: the detector is not consulted`);
  }
});

test('an unknown status falls back to the detector verdict', () => {
  const c = client({ status: 'unknown', explain: 'working' });
  assert.equal(readAgentState(c, 'pane-1'), 'working');
  assert.deepEqual(c.calls, ['get', 'explain']);
});

test('an unknown status stays unknown when the detector has no verdict or fails', () => {
  assert.equal(readAgentState(client({ status: 'unknown', explain: null }), 'p'), 'unknown');
  assert.equal(readAgentState(client({ status: 'unknown', explainThrows: true }), 'p'), 'unknown');
});

test('an unreachable herdr is not hidden: the caller counts it as blind time', () => {
  assert.throws(() => readAgentState(client({ getThrows: true }), 'pane-1'), /unreachable/);
});

// ensureHerdrKnowsAgent: a state is reported only for a process herdr cannot recognise as an agent.

const launchClient = ({ recogniseAfter = 0 } = {}) => {
  const log = { gets: 0, reports: [] };
  return {
    log,
    agentGet() {
      log.gets += 1;
      if (log.gets <= recogniseAfter) throw new Error('agent target not found');
      return { agentStatus: 'idle' };
    },
    reportAgent(pane, args) { log.reports.push([pane, args]); },
  };
};
const noteRound = () => { const notes = []; return { notes, note: (patch) => notes.push(patch) }; };

test('an agent herdr recognises at once gets no reported state', async () => {
  const client = launchClient();
  const round = noteRound();
  assert.equal(await ensureHerdrKnowsAgent({ client, round, paneId: 'p1', agentKind: 'codex', graceMs: 200, pollMs: 5 }), 'detected');
  assert.deepEqual(client.log.reports, []);
  assert.deepEqual(round.notes, [{ agentKnownToHerdr: 'detected' }]);
});

test('an agent herdr recognises a few polls later still gets no reported state', async () => {
  const client = launchClient({ recogniseAfter: 3 });
  assert.equal(await ensureHerdrKnowsAgent({ client, round: noteRound(), paneId: 'p1', agentKind: 'pi', graceMs: 500, pollMs: 5 }), 'detected');
  assert.deepEqual(client.log.reports, []);
  assert.equal(client.log.gets, 4);
});

test('a process herdr never recognises is addressable only through a reported state', async () => {
  const client = launchClient({ recogniseAfter: 1e9 });
  const round = noteRound();
  assert.equal(await ensureHerdrKnowsAgent({ client, round, paneId: 'p9', agentKind: 'claude', graceMs: 40, pollMs: 5 }), 'reported');
  assert.deepEqual(client.log.reports, [['p9', { source: 'fgos', agent: 'claude', state: 'working' }]]);
  assert.deepEqual(round.notes, [{ agentKnownToHerdr: 'reported' }]);
});
