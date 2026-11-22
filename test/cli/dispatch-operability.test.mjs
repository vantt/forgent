import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('dispatch entry in command-registry declares touchesState: true and externalEffect: true, which the help labels [write+external] (F2)', async () => {
  const { COMMAND_REGISTRY } = await import('../../src/cli/command-registry.mjs');
  const entry = COMMAND_REGISTRY.find((e) => e.name === 'dispatch');
  assert.ok(entry, 'dispatch entry must exist in COMMAND_REGISTRY');
  assert.equal(entry.touchesState, true, 'dispatch touchesState must be true');
  assert.equal(entry.externalEffect, true, 'dispatch externalEffect must be true');
});
