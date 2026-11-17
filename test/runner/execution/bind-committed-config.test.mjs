// The committed project config (.fgos/config.json) bound headless: every unit either
// binds to a confined cli invocation that can keep its agent state, or is refused with
// a structured reason. Never an invocation that would be wrapped in a sandbox with no
// writable home for an agent that needs one.

import '../../helpers/process-tmp-root.mjs';
import { committedRunnerConfig } from '../../helpers/committed-config.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { bind } from '../../../src/runner/execution/bind.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';
import { seedStubAgentClis } from '../../helpers/agent-clis.mjs';

seedFileLocalBwrapRegistry();
seedStubAgentClis('claude', 'codex', 'omp', 'pi', 'agy');

// The project config names the pools its tier cells use; the account inventory that pays for
// them lives in the machine-global config, so the test declares the one pool the cells name.
const committed = committedRunnerConfig();
const runnerConfig = {
  ...committed,
  llmAccounts: { ...committed.llmAccounts, openrouter: { openrouter: { credentialStore: { pi: '/home/test/.pi/accounts/openrouter' } } } },
};
const executors = runnerConfig.executors;

// claude keeps its login in files the sandbox may read; codex, pi and agy write a state
// directory, so they need a private home.
const NEEDS_PRIVATE_HOME = new Set(['openai', 'gemini', 'xai', 'deepseek']);

const headless = { headless: true };
const ask = (capability, writes = []) => ({ unit: { id: 'u', capability, writes }, role: 'producer' });

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
      inv.credentialStore !== undefined,
      `${label}: ${binding.executor}/${binding.invocation} needs a private home for the login store it reads`,
    );
  }
}

test('each executor bound by override gets a confined, home-provisioned cli invocation', () => {
  // Governance may take an executor out of dispatch (xai is disallowed); its invocations stay
  // configured and must still be well formed for the day it is allowed again, so they are checked
  // without that filter.
  const ungoverned = { ...runnerConfig, governance: undefined };
  for (const executor of ['claude', 'openai', 'gemini', 'xai', 'deepseek']) {
    for (const writes of [[], ['x.txt']]) {
      const result = bind(
        { ...ask('docs:probe', writes), overrides: [{ executor, origin: 'human-cli' }] },
        { runnerConfig: ungoverned, session: headless },
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
      bound += 1;
      assertRunnable(result, `${capability} writes=${writes.length}`);
    }
  }
  // Only capabilities whose pool names no invocation are counted here; the pools that pin one
  // (the five-family pools) bind to pane invocations and are covered by their own tests.
  assert.ok(bound > 5, 'the committed config binds a real set of capabilities');
});

test('Workflow capabilities with no row of their own (labels) bind headless', () => {
  for (const capability of ['coding:plan', 'group-cognition:critique', 'group-cognition:synthesize', 'delphi:synthesize']) {
    const result = bind(ask(capability), { runnerConfig, session: headless });
    assert.ok(!result.refused, `${capability}: ${JSON.stringify(result.refused)}`);
    assertRunnable(result, capability);
  }
});

test('every invocation that declares a login store reads the store its command logs in', () => {
  for (const [executorId, entry] of Object.entries(executors)) {
    for (const inv of entry.invocations ?? []) {
      const store = inv.credentialStore;
      if (!store) continue;
      const label = `${executorId}/${inv.id}`;
      assert.equal(inv.confinement?.backend, 'bwrap', `${label}: only a confined invocation reads a store through a private home`);
      assert.equal(store.use, path.basename(inv.command), `${label}: the store key is the command's CLI`);
      assert.equal(inv.env?.[store.homeEnv], undefined, `${label}: the driver sets ${store.homeEnv}; env does not point at the real store`);
    }
  }
});

test('every confined invocation with a login account declares its store, and the id of one names no account', () => {
  const named = /-(fgovn|tetnu|tetcu72|vantt|openrouter|gemini-tetcu72)$/;
  for (const [executorId, entry] of Object.entries(executors)) {
    for (const inv of entry.invocations ?? []) {
      if (inv.credentialStore) assert.doesNotMatch(inv.id, named, `${executorId}/${inv.id}: an account is leased at launch, so the id does not carry its name`);
    }
  }
});
