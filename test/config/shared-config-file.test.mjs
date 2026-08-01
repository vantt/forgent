import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  sharedConfigFilePath,
  legacyRunnerConfigPath,
  readSharedConfig,
  writeSharedConfig,
} from '../../src/config/shared-config-file.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-shared-config-test-'));
}

test('sharedConfigFilePath/legacyRunnerConfigPath resolve relative to the given dir', () => {
  const dir = mkTempDir();
  assert.equal(sharedConfigFilePath(dir), path.join(dir, '.fgos', 'config.json'));
  assert.equal(legacyRunnerConfigPath(dir), path.join(dir, '.fgos-runner.json'));
});

test('readSharedConfig returns {} when neither the shared file nor the legacy file exists', () => {
  const dir = mkTempDir();
  assert.deepEqual(readSharedConfig(dir), {});
});

test('readSharedConfig reads the shared file directly when it exists', () => {
  const dir = mkTempDir();
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.fgos', 'config.json'), JSON.stringify({ runner: { timeoutMs: 5000 }, gateBypass: { level: 'standard' } }));
  assert.deepEqual(readSharedConfig(dir), { runner: { timeoutMs: 5000 }, gateBypass: { level: 'standard' } });
});

test('readSharedConfig falls back to the legacy .fgos-runner.json, wrapped as the runner section, when the shared file is absent', () => {
  const dir = mkTempDir();
  fs.writeFileSync(path.join(dir, '.fgos-runner.json'), JSON.stringify({ timeoutMs: 9000 }));
  assert.deepEqual(readSharedConfig(dir), { runner: { timeoutMs: 9000 } });
});

test('readSharedConfig prefers the shared file over the legacy file when both exist', () => {
  const dir = mkTempDir();
  fs.writeFileSync(path.join(dir, '.fgos-runner.json'), JSON.stringify({ timeoutMs: 9000 }));
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.fgos', 'config.json'), JSON.stringify({ runner: { timeoutMs: 1000 } }));
  assert.deepEqual(readSharedConfig(dir), { runner: { timeoutMs: 1000 } });
});

test('readSharedConfig throws a clear error on invalid JSON in the shared file', () => {
  const dir = mkTempDir();
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.fgos', 'config.json'), '{ not valid json');
  assert.throws(() => readSharedConfig(dir), /cannot parse shared config/);
});

test('readSharedConfig throws a clear error on invalid JSON in the legacy fallback file', () => {
  const dir = mkTempDir();
  fs.writeFileSync(path.join(dir, '.fgos-runner.json'), '{ not valid json');
  assert.throws(() => readSharedConfig(dir), /cannot parse legacy runner config/);
});

test('writeSharedConfig creates .fgos/ when missing and writes pretty JSON', () => {
  const dir = mkTempDir();
  assert.equal(fs.existsSync(path.join(dir, '.fgos')), false);
  writeSharedConfig(dir, { runner: { timeoutMs: 42 } });
  const written = fs.readFileSync(path.join(dir, '.fgos', 'config.json'), 'utf8');
  assert.deepEqual(JSON.parse(written), { runner: { timeoutMs: 42 } });
  assert.ok(written.endsWith('\n'));
});

test('writeSharedConfig never deletes the legacy .fgos-runner.json', () => {
  const dir = mkTempDir();
  fs.writeFileSync(path.join(dir, '.fgos-runner.json'), JSON.stringify({ timeoutMs: 9000 }));
  writeSharedConfig(dir, { runner: { timeoutMs: 1000 } });
  assert.equal(fs.existsSync(path.join(dir, '.fgos-runner.json')), true);
});
