// What is left of the herdr-spawn adapter after the interactive agent moved under the run supervisor:
// the adapter stays registered (executor config, the planner and the confinement authority know what a
// herdr seat is) but is never executed. How an interactive agent is described is the runner schema's.
// The controller half of a seat is tested in test/run-supervisor/terminal-*.test.mjs.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXECUTOR_ADAPTERS, DispatchError } from '../../src/runner/dispatch/transport.mjs';

// paseo-spawn is the same kind of adapter: its attempt runs in the `external` mode (test/runner/paseo-launch.test.mjs).
test('herdr-spawn and paseo-spawn are registered adapters that refuse to be executed directly, by name', async () => {
  for (const [name, locus] of [['herdr-spawn', 'herdr-pane'], ['paseo-spawn', 'external-host']]) {
    const adapter = EXECUTOR_ADAPTERS[name];
    assert.equal(adapter.locus, locus);
    await assert.rejects(
      () => adapter(
        { command: 'node', args: ['-v'], env: {}, interactiveMode: { exitCommand: '/exit' } },
        { cwd: process.cwd(), workId: 'direct-item', tier: 'standard', model: 'sonnet' },
      ),
      (err) => {
        assert.ok(err instanceof DispatchError);
        assert.equal(err.errorClass, `${name}-supervised-only`);
        assert.match(err.message, /run supervisor/);
        return true;
      },
    );
  }
});
