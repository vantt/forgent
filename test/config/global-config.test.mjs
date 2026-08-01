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

// Regression: the default globalConfigPath must resolve os.homedir() fresh
// on every call, never a value frozen at module-load time -- a caller that
// overrides process.env.HOME after this module already loaded (any test in
// the same process, since Node modules load once) must see the override
// take effect on the DEFAULT path, not just when an explicit path is passed.
test('describeConfigAwareness: default globalConfigPath honors process.env.HOME set after module load, not a frozen value', () => {
  const homeDir = mkTempDir('global-config-home-override-');
  fs.mkdirSync(path.join(homeDir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(homeDir, '.fgos', 'config.json'), '{}');
  const projectDir = mkTempDir('global-config-home-override-project-');

  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  let result;
  try {
    result = describeConfigAwareness(projectDir);
  } finally {
    process.env.HOME = prevHome;
  }

  assert.equal(result.globalConfigPath, path.join(homeDir, '.fgos', 'config.json'));
  assert.equal(result.globalPresent, true);
  assert.equal(result.active, 'global');
  fs.rmSync(homeDir, { recursive: true, force: true });
  fs.rmSync(projectDir, { recursive: true, force: true });
});

// tsk-5vf D2: an install with only the legacy .fgos-runner.json (has not
// re-run `fgos setup` since the move) must still read as "project active",
// never "none" -- describeConfigAwareness's default projectConfigPath names
// the NEW location, but presence-detection treats the legacy file as
// equally real.
test('describeConfigAwareness: default projectConfigPath treats a legacy-only .fgos-runner.json as project-active, still naming the new location', () => {
  const dir = mkTempDir('global-config-awareness-legacy-only-');
  fs.writeFileSync(path.join(dir, '.fgos-runner.json'), '{}');

  const result = describeConfigAwareness(dir, { globalConfigPath: path.join(dir, 'no-such-global.json') });

  assert.equal(result.active, 'project');
  assert.equal(result.projectPresent, true);
  assert.equal(result.projectConfigPath, path.join(dir, '.fgos', 'config.json'));
  fs.rmSync(dir, { recursive: true, force: true });
});
