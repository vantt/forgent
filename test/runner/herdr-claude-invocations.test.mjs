// The committed config's herdr invocations for the claude CLI family: claude itself and the
// OpenRouter-routed glm. These are what a pane runs, so what must be true of them is pinned here.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const runner = JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'config.json'), 'utf8')).runner;
const invocation = (executor) => runner.executors[executor].invocations.find((inv) => inv.adapter === 'herdr-spawn');

for (const executor of ['claude-herdr', 'glm-herdr']) {
  test(`${executor} runs a claude REPL in a pane under the bwrap posture`, () => {
    const inv = invocation(executor);
    assert.ok(inv, `${executor} must have a herdr-spawn invocation`);
    assert.equal(typeof inv.id, 'string', 'bind() can only pick an invocation it can name');
    assert.equal(inv.command, 'claude');
    assert.deepEqual(inv.confinement, { backend: 'bwrap' });
    assert.equal(inv.interactiveMode.kind, 'claude');
    assert.ok(!inv.args.includes('--dangerously-skip-permissions'), 'the posture is the OS sandbox; no bypass flag stands in for it');
    assert.ok(!inv.args.includes('--permission-mode'), 'the permission mode is left to the operator settings');
  });
}

test('glm-herdr turns off the server-side auto-mode notice a gateway session cannot satisfy, and carries no key', () => {
  const inv = invocation('glm-herdr');
  assert.equal(inv.env.CLAUDE_CODE_AUTO_MODE_SERVER, '0');
  assert.equal(inv.env.ANTHROPIC_BASE_URL, 'https://openrouter.ai/api');
  assert.equal(inv.env.ANTHROPIC_AUTH_TOKEN, '${GLM_OPENROUTER_API_KEY}', 'the key is substituted from the environment at launch, never stored in config');
  assert.equal(runner.executors['glm-herdr'].providerModel, 'z-ai');
});

test('claude-herdr reports the claude provider family, so a reviewer on glm-herdr is a different family', () => {
  assert.equal(runner.executors['claude-herdr'].providerModel, 'claude');
  assert.notEqual(runner.executors['claude-herdr'].providerModel, runner.executors['glm-herdr'].providerModel);
});
