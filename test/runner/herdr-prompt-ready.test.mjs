// When may the brief be typed at a confined agent? herdr says "idle" both for an agent whose prompt is up and,
// for an agent kind it has no screen rule for, for a process that has not drawn its UI yet. A brief typed at the
// second is lost. These tests drive awaitPromptReady against a scripted client.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { awaitPromptReady } from '../../src/runner/dispatch/herdr-round.mjs';

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
