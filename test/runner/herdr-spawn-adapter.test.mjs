// What is left of the herdr-spawn adapter after the interactive agent moved under the run supervisor:
// the adapter stays registered (executor config, the planner and the confinement authority know what a
// herdr seat is) but is never executed; the executor config still validates how an interactive agent is
// described. The controller half of a seat is tested in test/run-supervisor/terminal-*.test.mjs.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EXECUTOR_ADAPTERS, DispatchError } from '../../src/runner/dispatch/transport.mjs';
import { loadRunnerConfig } from '../../src/runner/dispatch/config.mjs';

test('herdr-spawn is a registered adapter that refuses to be executed directly, by name', async () => {
  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  assert.equal(herdrSpawn.locus, 'herdr-pane');
  await assert.rejects(
    () => herdrSpawn(
      { command: 'node', args: ['-v'], env: {}, interactiveMode: { exitCommand: '/exit' } },
      { cwd: process.cwd(), workId: 'direct-herdr-item', tier: 'standard', model: 'sonnet' },
    ),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.errorClass, 'herdr-spawn-supervised-only');
      assert.match(err.message, /run supervisor/);
      return true;
    },
  );
});

test('herdr-spawn adapter validates interactiveMode config shape', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-interactive-cfg-test-'));
  const cfgPath = path.join(tmpDir, '.fgos', 'config.json');
  fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
  const withInteractiveMode = (interactiveMode) => JSON.stringify({
    executor: { command: 'node', args: ['{prompt}'] },
    modelPolicies: { claude: { standard: 'sonnet' } },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    timeoutMs: 60000,
    executors: {
      agyHerdr: { kind: 'agent', command: 'agy', args: ['-i', '{prompt}'], adapter: 'herdr-spawn', interactiveMode },
    },
  });

  fs.writeFileSync(cfgPath, withInteractiveMode({ exitCommand: '/exit', kind: 'agy', trustStore: { kind: 'codex-toml' } }));
  const loaded = loadRunnerConfig(cfgPath);
  assert.equal(loaded.executors.agyHerdr.interactiveMode.exitCommand, '/exit');
  // `codex-toml` is a real store: codex keeps trust in a config.toml block.
  // It was live in this repo's own config while the only validator that named
  // trust kinds still refused it -- because that validator guarded a field at
  // the executor level and the adapter read a different one here.
  assert.equal(loaded.executors.agyHerdr.interactiveMode.trustStore.kind, 'codex-toml');
  assert.equal(loaded.executors.agyHerdr.interactiveMode.kind, 'agy');

  fs.writeFileSync(cfgPath, withInteractiveMode({ exitCommand: '' }));
  assert.throws(() => loadRunnerConfig(cfgPath), /exitCommand/);

  fs.writeFileSync(cfgPath, withInteractiveMode({ exitCommand: '/exit', kind: 'Claude' }));
  assert.throws(() => loadRunnerConfig(cfgPath), /kind/);

  // Shorter than herdr's own 5000ms stall detector means this side always wins
  // the race and the caller never learns why the brief did not land.
  fs.writeFileSync(cfgPath, withInteractiveMode({ exitCommand: '/exit', trustStore: { kind: 'nonesuch' } }));
  assert.throws(() => loadRunnerConfig(cfgPath), /trustStore/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
