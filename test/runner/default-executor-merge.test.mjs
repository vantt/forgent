import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { withDefaultExecutor } from '../../src/runner/dispatch/config.mjs';

const defaultExec = { command: 'claude', args: ['-p', '{prompt}'] };
const registered = {
  kind: 'agent',
  identity: { family: 'anthropic' },
  invocations: [{ id: 'claude-herdr-bwrap', transport: 'herdr' }],
  supports: { tiers: true },
};

test('the input config is not mutated', () => {
  const raw = { executor: defaultExec, executors: { claude: registered } };
  withDefaultExecutor(raw);
  assert.equal(raw.executors.claude, registered);
  assert.equal(raw.executors.claude.command, undefined);
});

