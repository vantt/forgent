import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exitCodeOf } from '../../src/cli/verb-exit.mjs';

// Why no existing test proves it: execution-outcome-exit-codes.test.mjs owns the outcome table, and the CLI cases
// only see the exit code of a whole spawned call; this owns which verb result asks for which code.
test('a verb result maps to its exit code and every other verb exits 0', () => {
  assert.equal(exitCodeOf('run', { outcome: 'blocked' }, {}), 13);
  assert.equal(exitCodeOf('run', { outcome: 'pass' }, {}), 0);
  assert.equal(exitCodeOf('run', {}, {}), 0);
  assert.equal(exitCodeOf('plan-lint', { ok: false }, {}), 1);
  assert.equal(exitCodeOf('plan-lint', { ok: true }, {}), 0);
  assert.equal(exitCodeOf('wire-agents', { failed: ['x'] }, {}), 1);
  assert.equal(exitCodeOf('wire-agents', { failed: [] }, {}), 0);
  assert.equal(exitCodeOf('doctor', { ok: false }, { flags: { strict: true } }), 1);
  assert.equal(exitCodeOf('doctor', { ok: false }, { flags: {} }), 0);
  assert.equal(exitCodeOf('list', [], { positional: [], flags: {} }), 0);
});

test('workflow exits with its outcome only for a settled foreground call or a gate settle, and 1 for a proposal that is not ok', () => {
  const call = (data, positional, flags = {}) => exitCodeOf('workflow', data, { positional, flags });
  assert.equal(call({ outcome: 'findings' }, ['start'], { foreground: true }), 14);
  assert.equal(call({ outcome: 'findings', status: 'running' }, ['start'], { foreground: true }), 0);
  assert.equal(call({ outcome: 'findings' }, ['start']), 0);
  assert.equal(call({ outcome: 'blocked' }, ['gate']), 13);
  assert.equal(call({ ok: false }, ['propose']), 1);
  assert.equal(call({ ok: true }, ['propose']), 0);
});
