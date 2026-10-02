// The committed config's herdr invocations for the non-claude providers (codex/openai, agy/gemini, pi/xai).
// Each runs an interactive agent in a pane under the bwrap posture, so the home the agent writes its own
// state into has to be a private one, with the account's login provisioned by the provider account inventory.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const runner = JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'config.json'), 'utf8')).runner;
const find = (executor, id) => runner.executors[executor].invocations.find((inv) => inv.id === id);

const providers = [
  { executor: 'openai', id: 'codex-herdr-fgovn', command: 'codex', homeVar: 'CODEX_HOME', kind: 'codex', trust: 'codex-toml' },
  { executor: 'gemini', id: 'agy-herdr-mucdong', command: 'agy', homeVar: 'HOME', kind: 'agy', trust: 'agy' },
  { executor: 'xai', id: 'pi-herdr-vantt', command: 'pi', homeVar: 'PI_CODING_AGENT_DIR', kind: 'pi', trust: undefined },
];

for (const p of providers) {
  test(`${p.id} runs ${p.command} in a pane under the bwrap posture with a private account home`, () => {
    const inv = find(p.executor, p.id);
    assert.ok(inv, `${p.id} must exist`);
    assert.equal(inv.adapter, 'herdr-spawn');
    assert.equal(inv.command, p.command);
    assert.deepEqual(inv.confinement, { backend: 'bwrap' });
    assert.equal(inv.interactiveMode.kind, p.kind);
    assert.equal(inv.interactiveMode.trustStore?.kind, p.trust);
    assert.deepEqual(
      inv.resourceBindings,
      [{ resource: 'private-home', target: { kind: 'env', name: p.homeVar } }],
      'the agent state lives in the private home the confinement allocates, not in the real account directory',
    );
  });
}

test('no herdr invocation passes the prompt as an argument: the round types the brief pointer once the agent is up', () => {
  for (const [name, executor] of Object.entries(runner.executors)) {
    for (const inv of executor.invocations ?? []) {
      if (inv.adapter !== 'herdr-spawn') continue;
      assert.ok(!(inv.args ?? []).some((arg) => arg.includes('{prompt}')), `${name}/${inv.id} must not carry {prompt} in its args`);
    }
  }
});

test('no herdr invocation relies on a bypass flag in place of the sandbox', () => {
  for (const [name, executor] of Object.entries(runner.executors)) {
    for (const inv of executor.invocations ?? []) {
      if (inv.adapter !== 'herdr-spawn') continue;
      assert.deepEqual(inv.confinement, { backend: 'bwrap' }, `${name}/${inv.id} is confined`);
      for (const arg of inv.args ?? []) {
        assert.ok(!/dangerously|bypass/i.test(arg), `${name}/${inv.id} passes ${arg}`);
      }
    }
  }
  // codex keeps its own sandbox off only because bwrap encloses it, and never asks for approval nobody can give.
  const codex = find('openai', 'codex-herdr-fgovn');
  assert.deepEqual(codex.args.slice(0, 4), ['-s', 'danger-full-access', '-a', 'never']);
});

test('the account inventory that provisions these homes is machine-global, never declared in the project config', () => {
  assert.equal(runner.providers, undefined, 'credential paths belong to ~/.fgos/config.json');
});
