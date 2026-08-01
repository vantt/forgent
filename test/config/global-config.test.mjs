import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  loadGlobalConfig,
  mergeWithGlobalConfig,
  describeConfigAwareness,
} from '../../src/config/global-config.mjs';

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('loadGlobalConfig returns {} when the global config file does not exist', () => {
  const dir = mkTempDir('global-config-missing-');
  const result = loadGlobalConfig(path.join(dir, 'config.json'));
  assert.deepEqual(result, {});
  fs.rmSync(dir, { recursive: true, force: true });
});

test('loadGlobalConfig parses an existing global config file', () => {
  const dir = mkTempDir('global-config-present-');
  const configPath = path.join(dir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify({ model: 'global-model' }));
  const result = loadGlobalConfig(configPath);
  assert.deepEqual(result, { model: 'global-model' });
  fs.rmSync(dir, { recursive: true, force: true });
});

test('loadGlobalConfig throws a clear error on invalid JSON, never silently returns {}', () => {
  const dir = mkTempDir('global-config-invalid-');
  const configPath = path.join(dir, 'config.json');
  fs.writeFileSync(configPath, '{ not valid json');
  assert.throws(() => loadGlobalConfig(configPath), /cannot parse global config/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('mergeWithGlobalConfig: project value wins over global value for the same key', () => {
  const dir = mkTempDir('global-config-precedence-');
  const globalConfigPath = path.join(dir, 'config.json');
  fs.writeFileSync(globalConfigPath, JSON.stringify({ model: 'global-model', timeoutMs: 1000 }));

  const merged = mergeWithGlobalConfig({ model: 'project-model' }, globalConfigPath);

  assert.equal(merged.model, 'project-model');
  assert.equal(merged.timeoutMs, 1000);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('mergeWithGlobalConfig: global fills a key the project config never set, never invents new project keys', () => {
  const dir = mkTempDir('global-config-fill-');
  const globalConfigPath = path.join(dir, 'config.json');
  fs.writeFileSync(globalConfigPath, JSON.stringify({ retries: 3 }));

  const merged = mergeWithGlobalConfig({}, globalConfigPath);

  assert.equal(merged.retries, 3);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('mergeWithGlobalConfig: no global config file means the project config passes through unchanged', () => {
  const dir = mkTempDir('global-config-none-');
  const globalConfigPath = path.join(dir, 'config.json');

  const projectConfig = { model: 'project-model' };
  const merged = mergeWithGlobalConfig(projectConfig, globalConfigPath);

  assert.deepEqual(merged, { model: 'project-model' });
  fs.rmSync(dir, { recursive: true, force: true });
});

test('describeConfigAwareness: project wins as active when both project and global config exist', () => {
  const dir = mkTempDir('global-config-awareness-both-');
  const globalConfigPath = path.join(dir, 'global.json');
  const projectConfigPath = path.join(dir, 'project.json');
  fs.writeFileSync(globalConfigPath, '{}');
  fs.writeFileSync(projectConfigPath, '{}');

  const result = describeConfigAwareness(dir, { globalConfigPath, projectConfigPath });

  assert.equal(result.active, 'project');
  assert.equal(result.globalPresent, true);
  assert.equal(result.projectPresent, true);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('describeConfigAwareness: falls back to global as active when only global config exists', () => {
  const dir = mkTempDir('global-config-awareness-global-only-');
  const globalConfigPath = path.join(dir, 'global.json');
  const projectConfigPath = path.join(dir, 'project.json');
  fs.writeFileSync(globalConfigPath, '{}');

  const result = describeConfigAwareness(dir, { globalConfigPath, projectConfigPath });

  assert.equal(result.active, 'global');
  assert.equal(result.globalPresent, true);
  assert.equal(result.projectPresent, false);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('describeConfigAwareness: active is "none" when neither project nor global config exists', () => {
  const dir = mkTempDir('global-config-awareness-neither-');
  const globalConfigPath = path.join(dir, 'global.json');
  const projectConfigPath = path.join(dir, 'project.json');

  const result = describeConfigAwareness(dir, { globalConfigPath, projectConfigPath });

  assert.equal(result.active, 'none');
  assert.equal(result.globalPresent, false);
  assert.equal(result.projectPresent, false);
  fs.rmSync(dir, { recursive: true, force: true });
});
