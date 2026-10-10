// When may the brief be typed at a confined agent? herdr says "idle" both for an agent whose prompt is up and,
// for an agent kind it has no screen rule for, for a process that has not drawn its UI yet. A brief typed at the
// second is lost. These tests drive awaitPromptReady against a scripted client.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { awaitPromptReady, cleanupAndKeepScreen, refuseBriefIntoUnreadyPane } from '../../src/runner/dispatch/herdr-round.mjs';

const idle = { state: 'idle', visibleBlocker: false, visibleIdle: false, visibleWorking: false, matchedRule: null, promptText: '' };

/** A client whose explain answers come from `verdicts` (the last one repeats) and whose screen from `screens`. */
function scriptedClient({ verdicts, screens = [] }) {
  const calls = { explain: 0, read: [] };
  return {
    calls,
    agentExplain() {
      const v = verdicts[Math.min(calls.explain, verdicts.length - 1)];
      calls.explain += 1;
      if (v instanceof Error) throw v;
      return v;
    },
    agentRead(_target, opts) {
      const screen = screens[Math.min(calls.read.length, screens.length - 1)];
      calls.read.push(opts);
      if (screen instanceof Error) throw screen;
      return screen;
    },
  };
}

const fast = { settleMs: 5, pollMs: 2 };

test('an agent herdr has a screen rule for is ready as soon as the rule says idle', async () => {
  const client = scriptedClient({ verdicts: [{ ...idle, matchedRule: 'live_prompt_box', visibleIdle: true }] });
  assert.equal(await awaitPromptReady({ client, target: 'p', readyMs: 1000, ...fast }), 'ready');
  assert.equal(client.calls.read.length, 0, 'the screen is not read when a rule already vouches for it');
});

test('an agent with no screen rule is not ready until its screen has changed from the launch and held still', async () => {
  const launch = 'design-lap% bash launcher.sh';
  const client = scriptedClient({
    verdicts: [idle],
    screens: [launch, launch, launch, 'banner drawing', 'banner drawing\n> prompt', 'banner drawing\n> prompt', 'banner drawing\n> prompt'],
  });
  assert.equal(await awaitPromptReady({ client, target: 'p', readyMs: 5000, ...fast }), 'ready');
  assert.ok(client.calls.read.length >= 6, `it kept looking while the screen was still the launch echo or still changing (${client.calls.read.length} reads)`);
  assert.deepEqual(client.calls.read[0], { source: 'visible' }, 'the visible source is the one herdr serves while the agent is drawing');
});

test('a process that never draws anything is typed at after a bounded wait rather than waited on forever', async () => {
  const client = scriptedClient({ verdicts: [idle], screens: ['same'] });
  const started = Date.now();
  // readyMs bounds the wait here (the production cap is longer than any test wants to sit through).
  assert.equal(await awaitPromptReady({ client, target: 'p', readyMs: 60, ...fast }), 'unverified');
  assert.ok(Date.now() - started < 2000);
});

test('a screen that cannot be read falls back to the settle delay, as before', async () => {
  const client = scriptedClient({ verdicts: [idle], screens: [new Error('read failed')] });
  assert.equal(await awaitPromptReady({ client, target: 'p', readyMs: 1000, ...fast }), 'ready');
});

test('a blocking dialog stops the wait at once, and a missing detector ends it without waiting', async () => {
  const blocked = scriptedClient({ verdicts: [{ ...idle, visibleBlocker: true }] });
  assert.equal(await awaitPromptReady({ client: blocked, target: 'p', readyMs: 1000, ...fast }), 'blocked');
  const none = scriptedClient({ verdicts: [{ ...idle, state: null }] });
  assert.equal(await awaitPromptReady({ client: none, target: 'p', readyMs: 1000, ...fast }), 'no-detector');
  const failing = scriptedClient({ verdicts: [new Error('herdr down')] });
  assert.equal(await awaitPromptReady({ client: failing, target: 'p', readyMs: 1000, ...fast }), 'no-detector');
});

test('an agent that is still working is waited on until the deadline', async () => {
  const working = scriptedClient({ verdicts: [{ ...idle, state: 'working', visibleWorking: true }] });
  assert.equal(await awaitPromptReady({ client: working, target: 'p', readyMs: 40, ...fast }), 'timeout');
});

// --- A pane that is not ready is never typed at ------------------------------

function roundStub() {
  return {
    workId: 'w1', agentName: 'a', paneId: 'p-1', targetName: 'p-1',
    fail(errorClass, reason, message, extra = {}) { return Object.assign(new Error(message), { errorClass, reason, ...extra }); },
  };
}

test('a blocked pane fails the round with the dialog line and nothing is typed', () => {
  const typed = [];
  const client = {
    agentRead: () => 'header\nDo you trust the files in this folder? (y/n)\n',
    paneProcessInfo: () => ({ foregroundProcesses: [] }),
    agentPrompt: (...a) => typed.push(a),
  };
  assert.throws(
    () => refuseBriefIntoUnreadyPane({ client, round: roundStub(), readiness: 'blocked' }),
    (err) => err.errorClass === 'worker-spawn-fail' && err.reason === 'agent_blocked' && /trust the files/.test(err.message) && err.screen.includes('trust'),
  );
  assert.deepEqual(typed, []);
});

test('a pane that never reached its prompt fails the round the same way', () => {
  const client = { agentRead: () => 'starting...', paneProcessInfo: () => ({ foregroundProcesses: [] }) };
  assert.throws(
    () => refuseBriefIntoUnreadyPane({ client, round: roundStub(), readiness: 'timeout' }),
    (err) => err.errorClass === 'worker-spawn-fail' && err.reason === 'agent_not_ready',
  );
});

test('ready, unverified and no-detector panes are briefed as before', () => {
  for (const readiness of ['ready', 'unverified', 'no-detector']) {
    assert.doesNotThrow(() => refuseBriefIntoUnreadyPane({ client: {}, round: roundStub(), readiness }));
  }
});

// A pid no process can have, so the kill the close path attempts is a harmless no-op.
const LIVE_WORKER = { shellPid: 1, foregroundProcesses: [{ pid: 2147483646 }] };

test('a failure that closes the pane keeps the last screen lines in the failure record', () => {
  const closed = [];
  const client = {
    agentRead: () => 'header\nrate limit reached\n\n',
    paneProcessInfo: () => LIVE_WORKER,
    paneClose: (id) => closed.push(id),
  };
  const err = new Error('brief failed');
  cleanupAndKeepScreen(client, roundStub(), err);
  assert.deepEqual(closed, ['p-1']);
  assert.equal(err.screen, 'rate limit reached');
});

test('a screen that cannot be read does not change how the pane is closed or the failure', () => {
  const closed = [];
  const client = {
    agentRead: () => { throw new Error('herdr gone'); },
    paneProcessInfo: () => LIVE_WORKER,
    paneClose: (id) => closed.push(id),
  };
  const err = new Error('brief failed');
  cleanupAndKeepScreen(client, roundStub(), err);
  assert.deepEqual(closed, ['p-1']);
  assert.equal(err.screen, undefined);
  assert.equal(err.message, 'brief failed');
});
