import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  sharedConfigFilePath,
  readSharedConfig,
  writeSharedConfig,
  readInvariantCheckCommands,
  DEFAULT_INVARIANT_CHECK_COMMANDS,
} from '../../src/config/shared-config-file.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-shared-config-test-'));
}

test('sharedConfigFilePath resolves relative to the given dir', () => {
  const dir = mkTempDir();
  assert.equal(sharedConfigFilePath(dir), path.join(dir, '.fgos', 'config.json'));
});

test('readSharedConfig returns {} when the shared file does not exist', () => {
  const dir = mkTempDir();
  assert.deepEqual(readSharedConfig(dir), {});
});

test('readSharedConfig reads the shared file directly when it exists', () => {
  const dir = mkTempDir();
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.fgos', 'config.json'), JSON.stringify({ runner: { timeoutMs: 5000 }, gateBypass: { level: 'standard' } }));
  assert.deepEqual(readSharedConfig(dir), { runner: { timeoutMs: 5000 }, gateBypass: { level: 'standard' } });
});

test('readSharedConfig throws a clear error on invalid JSON in the shared file', () => {
  const dir = mkTempDir();
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.fgos', 'config.json'), '{ not valid json');
  assert.throws(() => readSharedConfig(dir), /cannot parse shared config/);
});

test('writeSharedConfig creates .fgos/ when missing and writes pretty JSON', () => {
  const dir = mkTempDir();
  assert.equal(fs.existsSync(path.join(dir, '.fgos')), false);
  writeSharedConfig(dir, { runner: { timeoutMs: 42 } });
  const written = fs.readFileSync(path.join(dir, '.fgos', 'config.json'), 'utf8');
  assert.deepEqual(JSON.parse(written), { runner: { timeoutMs: 42 } });
  assert.ok(written.endsWith('\n'));
});

// --- invariant check commands (tsk-516) ------------------------------------
//
// The load-bearing property across all of these: anything that is not a
// genuine list of runnable commands reads as ZERO commands, never as the
// default. A reader that silently substituted DEFAULT_INVARIANT_CHECK_COMMANDS
// would impose this repo's own test layout on every project using fgOS that
// never opted in — and would make a malformed config look configured.

test('readInvariantCheckCommands returns [] when no config file exists at all', () => {
  const dir = mkTempDir();
  assert.deepEqual(readInvariantCheckCommands(dir), []);
});

test('readInvariantCheckCommands returns [] when the invariantChecks section is absent', () => {
  const dir = mkTempDir();
  writeSharedConfig(dir, { runner: { timeoutMs: 42 } });
  assert.deepEqual(readInvariantCheckCommands(dir), []);
});

test('readInvariantCheckCommands returns the configured commands in order', () => {
  const dir = mkTempDir();
  writeSharedConfig(dir, { invariantChecks: { commands: ['first --check', 'second --check'] } });
  assert.deepEqual(readInvariantCheckCommands(dir), ['first --check', 'second --check']);
});

test('readInvariantCheckCommands drops empty and non-string entries instead of running them', () => {
  const dir = mkTempDir();
  writeSharedConfig(dir, { invariantChecks: { commands: ['real --check', '', '   ', 7, null, { cmd: 'x' }] } });
  assert.deepEqual(readInvariantCheckCommands(dir), ['real --check']);
});

test('readInvariantCheckCommands returns [] for a malformed section rather than throwing', () => {
  for (const malformed of ['a string', 42, ['an', 'array'], null, { commands: 'not-a-list' }, {}]) {
    const dir = mkTempDir();
    writeSharedConfig(dir, { invariantChecks: malformed });
    assert.deepEqual(readInvariantCheckCommands(dir), [], `malformed: ${JSON.stringify(malformed)}`);
  }
});

// Never silently substituted by the reader — it is only what `fgos setup`
// WRITES. This test pins that separation: a project with an explicitly empty
// list gets an empty list, not this default.
test('readInvariantCheckCommands never falls back to DEFAULT_INVARIANT_CHECK_COMMANDS', () => {
  const dir = mkTempDir();
  writeSharedConfig(dir, { invariantChecks: { commands: [] } });
  assert.deepEqual(readInvariantCheckCommands(dir), []);
  assert.ok(DEFAULT_INVARIANT_CHECK_COMMANDS.length > 0, 'the default itself is non-empty, so the check above is meaningful');
});
