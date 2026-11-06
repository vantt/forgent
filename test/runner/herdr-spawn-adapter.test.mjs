// What is left of the herdr-spawn adapter after the interactive agent moved under the run supervisor:
// the adapter stays registered (executor config, the planner and the confinement authority know what a
// herdr seat is) but is never executed. How an interactive agent is described is the runner schema's.
// The controller half of a seat is tested in test/run-supervisor/terminal-*.test.mjs.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXECUTOR_ADAPTERS, DispatchError } from '../../src/runner/dispatch/transport.mjs';

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
