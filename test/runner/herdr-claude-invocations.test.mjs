// The committed config's herdr invocations for claude itself and for glm, which runs through the
// pi CLI and OpenRouter (the claude CLI behind an OpenRouter gateway stopped at a /login prompt
// with a 401). These are what a pane runs, so what must be true of them is pinned here.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const runner = JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'config.json'), 'utf8')).runner;
const invocation = (executor) => runner.executors[executor].invocations.find((inv) => inv.adapter === 'herdr-spawn');

test('claude-herdr runs a claude REPL in a pane under the bwrap posture', () => {
  const inv = invocation('claude-herdr');
  assert.ok(inv, 'claude-herdr must have a herdr-spawn invocation');
  assert.equal(typeof inv.id, 'string', 'bind() can only pick an invocation it can name');
  assert.equal(inv.command, 'claude');
  assert.deepEqual(inv.confinement, { backend: 'bwrap' });
  assert.equal(inv.interactiveMode.kind, 'claude');
  assert.ok(!inv.args.includes('--dangerously-skip-permissions'), 'the posture is the OS sandbox; no bypass flag stands in for it');
  assert.ok(!inv.args.includes('--permission-mode'), 'the permission mode is left to the operator settings');
});

test('glm-herdr runs pi in a pane under the bwrap posture and carries no key', () => {
  const inv = invocation('glm-herdr');
  assert.ok(inv, 'glm-herdr must have a herdr-spawn invocation');
  assert.equal(typeof inv.id, 'string', 'bind() can only pick an invocation it can name');
  assert.equal(inv.command, 'pi');
  assert.deepEqual(inv.confinement, { backend: 'bwrap' });
  assert.ok(inv.args.includes('{model}'), 'the model comes from the z-ai model policy, not from the invocation');
  assert.ok(!inv.args.includes('--dangerously-skip-permissions'), 'the posture is the OS sandbox; no bypass flag stands in for it');
  assert.equal(inv.env.OPENROUTER_API_KEY, '${GLM_OPENROUTER_API_KEY}', 'the key is substituted from the environment at launch, never stored in config');
  assert.equal(runner.executors['glm-herdr'].providerModel, 'z-ai');
  assert.equal(runner.modelPolicies['z-ai'].standard, 'z-ai/glm-5.2');
});

test('glm is headless pi through OpenRouter with the same key variable and no claude gateway variables', () => {
  const glm = runner.executors.glm;
  assert.equal(glm.providerModel, 'z-ai');
  assert.ok(glm.invocations.length > 0 && glm.invocations.every((inv) => inv.command === 'pi'));
  for (const inv of glm.invocations) {
    assert.equal(inv.env.OPENROUTER_API_KEY, '${GLM_OPENROUTER_API_KEY}');
    assert.equal(inv.env.ANTHROPIC_BASE_URL, undefined);
    assert.equal(inv.env.ANTHROPIC_AUTH_TOKEN, undefined);
  }
});

test('claude-herdr reports the claude provider family, so a reviewer on glm-herdr is a different family', () => {
  assert.equal(runner.executors['claude-herdr'].providerModel, 'claude');
  assert.notEqual(runner.executors['claude-herdr'].providerModel, runner.executors['glm-herdr'].providerModel);
});

test('a herdr round has an idle limit even when the runner config sets none, so a stalled agent is noticed', async () => {
  const { groupDeadlines, DEFAULT_IDLE_TIMEOUT_MS } = await import('../../src/runner/dispatch/herdr-round.mjs');
  assert.ok(DEFAULT_IDLE_TIMEOUT_MS > 0);
  assert.equal(groupDeadlines({ timeoutMs: 1000 }).round.idleMs, DEFAULT_IDLE_TIMEOUT_MS);
  assert.equal(groupDeadlines({ timeoutMs: 1000, idleTimeoutMs: 1500 }).round.idleMs, 1500, 'a configured value wins');
});
