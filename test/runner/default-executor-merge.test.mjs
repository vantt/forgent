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

test('the default executor keeps a registered executor\'s invocations', () => {
  const cfg = withDefaultExecutor({ executor: defaultExec, executors: { claude: registered } });
  assert.deepEqual(cfg.executors.claude.invocations, registered.invocations);
  assert.deepEqual(cfg.executors.claude.identity, registered.identity);
  assert.deepEqual(cfg.executors.claude.args, defaultExec.args);
  assert.equal(cfg.executors.claude.command, 'claude');
});

test('the default executor fills the entry named by its command without dropping fields', () => {
  const cfg = withDefaultExecutor({ executor: { command: 'codex', args: ['exec'] }, executors: { codex: registered } });
  assert.deepEqual(cfg.executors.codex.invocations, registered.invocations);
  assert.equal(cfg.executors.codex.command, 'codex');
  // `claude` gets the default too, but codex is another program: no claude fields carried over.
  assert.equal(cfg.executors.claude.command, 'codex');
  assert.equal(cfg.executors.claude.invocations, undefined);
});

test('without a default executor the registry is unchanged', () => {
  const raw = { executors: { claude: registered } };
  const cfg = withDefaultExecutor(raw);
  assert.equal(cfg.executors, raw.executors);
  assert.equal(cfg.executor, undefined);
});

test('the input config is not mutated', () => {
  const raw = { executor: defaultExec, executors: { claude: registered } };
  withDefaultExecutor(raw);
  assert.equal(raw.executors.claude, registered);
  assert.equal(raw.executors.claude.command, undefined);
});

test('a default executor that runs another program replaces the entry, invocations included', () => {
  const cfg = withDefaultExecutor({ executor: { command: '/usr/bin/node', args: ['fake.mjs'] }, executors: { claude: registered } });
  assert.equal(cfg.executors.claude.invocations, undefined);
  assert.equal(cfg.executors.claude.command, '/usr/bin/node');
});

test('a default executor given by absolute path to the same program keeps the entry', () => {
  const cfg = withDefaultExecutor({ executor: { command: '/usr/local/bin/claude', args: [] }, executors: { claude: registered } });
  assert.deepEqual(cfg.executors.claude.invocations, registered.invocations);
});
