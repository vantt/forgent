import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  sharedConfigFilePath,
  readSharedConfig,
  writeSharedConfig,
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
