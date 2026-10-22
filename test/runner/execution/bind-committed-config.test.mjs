// The committed project config (.fgos/config.json) bound headless: every unit either
// binds to a confined cli invocation that can keep its agent state, or is refused with
// a structured reason. Never an invocation that would be wrapped in a sandbox with no
// writable home for an agent that needs one.

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { bind } from '../../../src/runner/execution/bind.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
// The project config names the pools its tier cells use; the account inventory that pays for
// them lives in the machine-global config, so the test declares the one pool the cells name.
const committed = JSON.parse(fs.readFileSync(path.join(root, '.fgos', 'config.json'), 'utf8')).runner;
const runnerConfig = {
  ...committed,
  llmAccounts: { ...committed.llmAccounts, openrouter: { openrouter: { credentialStore: { pi: '/home/test/.pi/accounts/openrouter' } } } },
};
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
      if (result.mechanism === 'inline') continue;
      bound += 1;
      assertRunnable(result, `${capability} writes=${writes.length}`);
    }
  }
  // Only capabilities whose pool names no invocation are counted here; the pools that pin one
  // (the five-family pools) bind to pane invocations and are covered by their own tests.
  assert.ok(bound > 5, 'the committed config binds a real set of capabilities');
});

test('Workflow capabilities that name a same-verb pool bind headless', () => {
  for (const capability of ['coding:plan', 'group-cognition:critique', 'group-cognition:synthesize', 'delphi:synthesize']) {
    const result = bind(ask(capability), { runnerConfig, session: headless });
    assert.ok(!result.refused, `${capability}: ${JSON.stringify(result.refused)}`);
    assertRunnable(result, capability);
  }
});

test('a Workflow capability with no prefer pool takes the families the tier lists, the last line of the prefer column', () => {
  // A name the committed config does not declare, so no pool added to the config later can
  // turn this into a bind.
  const capability = 'coding:no-pool-declared';
  assert.equal(runnerConfig.capabilities[capability], undefined);
  assert.equal(runnerConfig.capabilities['no-pool-declared'], undefined);
  const result = bind(ask(capability), { runnerConfig, session: headless });
  assert.ok(!result.refused, JSON.stringify(result.refused));
  assert.equal(result.tier, 'advanced', 'the coding:* default tier');
  assert.equal(result.provenance.executor.source, 'tierFallback.advanced');
  assert.equal(result.executor, 'gemini', 'the first family of tierFallback.advanced that can serve the seat');
});

test('with no tier list either, a capability with no prefer pool is refused with a structured reason, never guessed', () => {
  const capability = 'coding:no-pool-declared';
  const result = bind(ask(capability), { runnerConfig: { ...runnerConfig, tierFallback: undefined }, session: headless });
  assert.equal(result.refused.reason, 'headless-no-executor');
  assert.match(result.refused.detail, /coding:no-pool-declared/);
});

test('a capability gets the same family and model inside herdr and headless; only the transport differs', () => {
  // claude used to be split into a cli executor and a pane-only one, so a pool that named the
  // pane one ran claude inside herdr and fell to the next family headless.
  for (const capability of ['architecture:explain', 'business:frame', 'architecture:synthesize']) {
    for (const rigor of ['low', 'standard', 'high', 'critical']) {
      const unitAsk = { unit: { id: 'u', capability, writes: [], rigor }, role: 'reviewer' };
      const pane = bind(unitAsk, { runnerConfig, session: { herdrPresent: true } });
      const cli = bind(unitAsk, { runnerConfig, session: headless });
      assert.ok(!pane.refused && !cli.refused, `${capability}/${rigor}: ${JSON.stringify(pane.refused ?? cli.refused)}`);
      assert.equal(pane.executor, 'claude', `${capability}/${rigor}`);
      assert.equal(cli.executor, pane.executor, `${capability}/${rigor}`);
      assert.equal(cli.model, pane.model, `${capability}/${rigor}`);
      assert.equal(pane.invocation, 'claude-herdr-bwrap', `${capability}/${rigor}`);
      assertRunnable(cli, `${capability}/${rigor} headless`);
    }
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
      assert.equal(inv.resourceBindings, undefined, `${label}: the store replaces the older private-home binding`);
      assert.equal(inv.env?.[store.homeEnv], undefined, `${label}: the driver sets ${store.homeEnv}; env does not point at the real store`);
    }
  }
});

test('every confined invocation with a login account declares its store, and the id of one names no account', () => {
  for (const [executorId, entry] of Object.entries(executors)) {
    for (const inv of entry.invocations ?? []) {
      if (inv.resourceBindings === undefined) continue;
      assert.fail(`${executorId}/${inv.id} keeps the older private-home binding; declare credentialStore instead`);
    }
  }
  const named = /-(fgovn|tetnu|tetcu72|vantt|openrouter|gemini-tetcu72)$/;
  for (const [executorId, entry] of Object.entries(executors)) {
    for (const inv of entry.invocations ?? []) {
      if (inv.credentialStore) assert.doesNotMatch(inv.id, named, `${executorId}/${inv.id}: an account is leased at launch, so the id does not carry its name`);
    }
  }
});
