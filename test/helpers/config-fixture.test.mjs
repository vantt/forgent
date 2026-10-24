import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { readConfig, readMachineConfig } from '../../src/config/facade.mjs';
import {
  capabilityServedBy,
  existingProjectConfigPaths,
  gatewayTokenPath,
  legacyProjectConfigPath,
  projectConfigExists,
  readGatewayToken,
  readRawGlobalConfig,
  readRawProjectConfig,
  statGatewayToken,
  writeRawLegacyProjectConfig,
  globalConfigPath,
  plainConfig,
  projectConfigPath,
  readGlobalConfig,
  readProjectConfig,
  writeGlobalConfig,
  writeProjectConfig,
  writeRawGlobalConfig,
  writeRawProjectConfig,
} from './config-fixture.mjs';

const mkTemp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-config-fixture-'));
const mkRepo = () => {
  const dir = mkTemp();
  execFileSync('git', ['init', '-q'], { cwd: dir });
  return dir;
};

// There is no list of tests allowed to write a config file by hand: byte-exact and malformed
// content goes through the raw writers, and test/architecture.test.mjs fails any other write.

test('a config written by the helper is read back equal by the helper readers and accepted by the product facade, for both scopes', () => {
  const value = { runner: { timeoutMs: 120000 } };
  const dir = mkRepo();
  const home = mkTemp();
  writeProjectConfig(dir, value);
  writeGlobalConfig(home, { runner: { timeoutMs: 180000 } });
  assert.deepEqual(readProjectConfig(dir), value);
  assert.deepEqual(readGlobalConfig(home), { runner: { timeoutMs: 180000 } });
  assert.equal(projectConfigPath(dir), path.join(dir, '.fgos', 'config.yaml'));
  assert.equal(globalConfigPath(home), path.join(home, '.fgos', 'config.yaml'));
  assert.equal(readConfig({ projectRoot: dir, globalDir: path.join(home, '.fgos') }).value.runner.timeoutMs, 120000);
  assert.equal(readMachineConfig({ globalDir: path.join(home, '.fgos') }).value.runner.timeoutMs, 180000);
});

test('a raw write lands byte for byte, and the readers return an empty config for an absent file', () => {
  const dir = mkTemp();
  const home = mkTemp();
  assert.deepEqual(readProjectConfig(dir), {});
  writeRawProjectConfig(dir, '{ not yaml');
  writeRawGlobalConfig(home, '# @fgos:v1\n');
  assert.equal(fs.readFileSync(projectConfigPath(dir), 'utf8'), '{ not yaml');
  assert.equal(fs.readFileSync(globalConfigPath(home), 'utf8'), '# @fgos:v1\n');
  assert.deepEqual(readGlobalConfig(home), {});
});

test('plainConfig turns a null-prototype tree into ordinary objects that deepEqual a literal', () => {
  const tree = Object.assign(Object.create(null), { a: Object.assign(Object.create(null), { b: [1] }) });
  assert.deepEqual(plainConfig(tree), { a: { b: [1] } });
  assert.equal(Object.getPrototypeOf(plainConfig(tree)), Object.prototype);
});

test('a capability entry served by a fixture executor restates every seat, role and persona scope the standard declares for it', () => {
  const entry = capabilityServedBy(['alpha', 'beta'], 'architecture:critique');
  assert.deepEqual(entry.prefer, [{ executor: 'alpha' }, { executor: 'beta' }]);
  assert.equal(entry.tier, 'standard');
  assert.deepEqual(entry.seats.producer, { prefer: entry.prefer, tier: 'standard' }, 'the standard names real CLIs for this seat; the fixture executor replaces them');
  const wildcard = capabilityServedBy('alpha', 'code:implement');
  assert.deepEqual(wildcard.roles['red-team'], { prefer: [{ executor: 'alpha' }], tier: 'standard' }, 'a <family>:* scope of the standard applies too');
});

test('the raw readers, the existence check and the gateway token helpers name the files the writers write', () => {
  const dir = mkTemp();
  assert.equal(projectConfigExists(dir), false);
  writeRawProjectConfig(dir, 'text');
  assert.equal(projectConfigExists(dir), true);
  assert.equal(readRawProjectConfig(dir), 'text');
  assert.deepEqual(existingProjectConfigPaths(dir), [projectConfigPath(dir)]);
  writeRawLegacyProjectConfig(dir, '{}');
  assert.deepEqual(existingProjectConfigPaths(dir), [projectConfigPath(dir), legacyProjectConfigPath(dir)]);
  writeRawGlobalConfig(dir, 'global');
  assert.equal(readRawGlobalConfig(dir), 'global');
  fs.mkdirSync(path.dirname(gatewayTokenPath(path.join(dir, '.fgos'))), { recursive: true });
  fs.writeFileSync(gatewayTokenPath(path.join(dir, '.fgos')), 'tok\n', { mode: 0o600 });
  assert.equal(readGatewayToken(path.join(dir, '.fgos')), 'tok\n');
  assert.equal(statGatewayToken(path.join(dir, '.fgos')).mode & 0o777, 0o600);
});
