// The committed project config (.fgos/config.json) bound headless: every unit either
// binds to a confined cli invocation that can keep its agent state, or is refused with
// a structured reason. Never an invocation that would be wrapped in a sandbox with no
// writable home for an agent that needs one.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { bind } from '../../../src/runner/execution/bind.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const runnerConfig = JSON.parse(fs.readFileSync(path.join(root, '.fgos', 'config.json'), 'utf8')).runner;
const executors = runnerConfig.executors;

// claude keeps its login in files the sandbox may read; codex, pi and agy write a state
// directory, so they need a private home.
const NEEDS_PRIVATE_HOME = new Set(['openai', 'gemini', 'xai', 'deepseek']);

const headless = { headless: true };
const ask = (capability, writes = []) => ({ unit: { id: 'u', capability, writes }, role: writes.length ? 'producer' : 'reviewer' });

function invocationOf(binding) {
  return executors[binding.executor].invocations.find((inv) => inv.id === binding.invocation);
}

function assertRunnable(binding, label) {
  assert.equal(binding.transport, 'cli', label);
  const inv = invocationOf(binding);
  assert.ok(inv, `${label}: the recorded invocation "${binding.invocation}" must exist on ${binding.executor}`);
  assert.equal(inv.via, 'cli', label);
  assert.notEqual(inv.adapter, 'herdr-spawn', `${label}: a pane invocation cannot run on the cli transport`);
  assert.equal(inv.confinement?.backend, 'bwrap', `${label}: the run is confined`);
  if (NEEDS_PRIVATE_HOME.has(binding.executor)) {
    assert.ok(
      (inv.resourceBindings ?? []).some((b) => b.resource === 'private-home'),
      `${label}: ${binding.executor}/${binding.invocation} needs a private home`,
    );
  }
}

test('each executor bound by override gets a confined, home-provisioned cli invocation', () => {
  for (const executor of ['claude', 'openai', 'gemini', 'xai', 'deepseek']) {
    for (const writes of [[], ['x.txt']]) {
      const result = bind(
        { ...ask('docs:probe', writes), overrides: [{ executor, origin: 'human-cli' }] },
        { runnerConfig, session: headless },
      );
      assert.ok(!result.refused, `${executor}: ${JSON.stringify(result.refused)}`);
      assertRunnable(result, `${executor} writes=${writes.length}`);
    }
  }
});

test('every capability of the committed config binds headless to a runnable invocation or is refused with a reason', () => {
  let bound = 0;
  for (const [capability, entry] of Object.entries(runnerConfig.capabilities)) {
    // An entry that names its invocation keeps exactly that choice.
    const prefer = Array.isArray(entry.prefer) ? entry.prefer : [];
    if (prefer.some((candidate) => candidate && typeof candidate === 'object' && candidate.invocation)) continue;
    for (const writes of [[], ['x.txt']]) {
      const result = bind(ask(capability, writes), { runnerConfig, session: headless });
      if (result.refused) {
        assert.equal(typeof result.refused.reason, 'string', capability);
        continue;
      }
      if (result.mechanism === 'inline') continue;
      bound += 1;
      assertRunnable(result, `${capability} writes=${writes.length}`);
    }
  }
  assert.ok(bound > 10, 'the committed config binds a real set of capabilities');
});

test('Workflow capabilities that name a same-verb pool bind headless', () => {
  for (const capability of ['coding:plan', 'group-cognition:critique', 'group-cognition:synthesize', 'delphi:synthesize']) {
    const result = bind(ask(capability), { runnerConfig, session: headless });
    assert.ok(!result.refused, `${capability}: ${JSON.stringify(result.refused)}`);
    assertRunnable(result, capability);
  }
});

test('a Workflow capability with no prefer pool is refused with a structured reason, never guessed', () => {
  const result = bind(ask('coding:discover'), { runnerConfig, session: headless });
  assert.equal(result.refused.reason, 'headless-no-executor');
  assert.match(result.refused.detail, /coding:discover/);
});
