// The committed config's herdr invocation for claude, and glm, which runs through the pi CLI and
// OpenRouter headless only (the claude CLI behind an OpenRouter gateway stopped at a /login prompt
// with a 401, and GLM loops on one tool call in a pane). What must be true of them is pinned here.

import '../helpers/process-tmp-root.mjs';
import { committedRunnerConfig } from '../helpers/committed-config.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

const runner = committedRunnerConfig();
const invocation = (executor) => runner.executors[executor].invocations.find((inv) => inv.adapter === 'herdr-spawn');

test('claude runs a claude REPL in a pane under the bwrap posture', () => {
  const inv = invocation('claude');
  assert.ok(inv, 'claude must have a herdr-spawn invocation');
  assert.equal(typeof inv.id, 'string', 'bind() can only pick an invocation it can name');
  assert.equal(inv.command, 'claude');
  assert.deepEqual(inv.confinement, { backend: 'bwrap' });
  assert.equal(inv.interactiveMode.kind, 'claude');
  assert.ok(!inv.args.includes('--dangerously-skip-permissions'), 'the posture is the OS sandbox; no bypass flag stands in for it');
  assert.ok(!inv.args.includes('--permission-mode'), 'the permission mode is left to the operator settings');
});

test('glm has no pane invocation: in a herdr pane GLM loops on one tool call, so it runs headless only', () => {
  assert.equal(invocation('glm'), undefined);
  assert.equal(runner.executors.glm.providerModel, 'z-ai');
  assert.deepEqual(runner.modelPolicies['z-ai'].standard, ['thehive/zai-org/glm-5.3-flash@thehive', 'z-ai/glm-5.3-flash@openrouter']);
});

test('glm is headless pi through OpenRouter, its key read from its login store, with no claude gateway variables', () => {
  const glm = runner.executors.glm;
  assert.equal(glm.providerModel, 'z-ai');
  assert.ok(glm.invocations.length > 0 && glm.invocations.every((inv) => inv.command === 'pi'));
  for (const inv of glm.invocations) {
    assert.equal(inv.credentialStore.use, 'pi');
    assert.ok(inv.credentialStore.files.includes('auth.json'), 'the OpenRouter key is in the auth.json of the store');
    assert.equal(inv.env?.OPENROUTER_API_KEY, undefined, 'no key variable: the store carries it');
    assert.equal(inv.env?.ANTHROPIC_BASE_URL, undefined);
    assert.equal(inv.env?.ANTHROPIC_AUTH_TOKEN, undefined);
  }
});

test('claude reports the claude provider family, so a reviewer on glm is a different family', () => {
  assert.equal(runner.executors.claude.providerModel, 'claude');
  assert.notEqual(runner.executors.claude.providerModel, runner.executors.glm.providerModel);
});

test('each agent family has exactly one executor', () => {
  const byFamily = new Map();
  for (const [id, entry] of Object.entries(runner.executors)) {
    if (entry.kind !== 'agent') continue;
    assert.ok(entry.providerModel, `${id} declares its family`);
    byFamily.set(entry.providerModel, [...(byFamily.get(entry.providerModel) ?? []), id]);
  }
  for (const [family, ids] of byFamily) assert.equal(ids.length, 1, `${family} is served by ${ids.join(', ')}`);
});

test('a terminal attempt has an idle limit even when the runner config sets none, so a stalled agent is noticed', async () => {
  const { DEFAULT_IDLE_TIMEOUT_MS } = await import('../../src/runner/dispatch/herdr-round.mjs');
  assert.ok(DEFAULT_IDLE_TIMEOUT_MS > 0);
});
