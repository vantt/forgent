// bin-discovery.test.mjs — 3-tier fgos bin resolution + tier-3 config-cache
// (tsk-2qc-1, D2/D4 of docs/history/install-setup-external-project-
// reliability/CONTEXT.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  resolveWorkspaceInstallationBin,
  resolveDevCheckoutBin,
  resolveProjectLocalBin,
  cachedGlobalBin,
  refreshGlobalBinCache,
  resolveFgosBin,
} from '../../src/setup/bin-discovery.mjs';
import { loadGlobalConfig } from '../../src/config/global-config.mjs';

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeStub(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, '#!/usr/bin/env node\n');
}

test('resolveDevCheckoutBin finds bin/fgos.mjs directly under cwd', () => {
  const dir = mkTempDir('bin-discovery-tier1-');
  writeStub(path.join(dir, 'bin', 'fgos.mjs'));
  assert.equal(resolveDevCheckoutBin(dir), path.join(dir, 'bin', 'fgos.mjs'));
});

test('resolveDevCheckoutBin returns null when bin/fgos.mjs does not exist', () => {
  const dir = mkTempDir('bin-discovery-tier1-none-');
  assert.equal(resolveDevCheckoutBin(dir), null);
});

test('resolveProjectLocalBin finds node_modules/.bin/fgos directly under startDir', () => {
  const dir = mkTempDir('bin-discovery-tier2-');
  writeStub(path.join(dir, 'node_modules', '.bin', 'fgos'));
  assert.equal(resolveProjectLocalBin(dir), path.join(dir, 'node_modules', '.bin', 'fgos'));
});

test('resolveProjectLocalBin walks up from a nested dir to find node_modules/.bin/fgos at an ancestor', () => {
  const dir = mkTempDir('bin-discovery-tier2-nested-');
  writeStub(path.join(dir, 'node_modules', '.bin', 'fgos'));
  const nested = path.join(dir, 'a', 'b', 'c');
  fs.mkdirSync(nested, { recursive: true });
  assert.equal(resolveProjectLocalBin(nested), path.join(dir, 'node_modules', '.bin', 'fgos'));
});

test('resolveProjectLocalBin returns null when no ancestor has node_modules/.bin/fgos', () => {
  const dir = mkTempDir('bin-discovery-tier2-none-');
  assert.equal(resolveProjectLocalBin(dir), null);
});

test('cachedGlobalBin returns null when the global config has no bin.globalFgosPath', () => {
  const globalConfigPath = path.join(mkTempDir('bin-discovery-cache-'), 'config.json');
  assert.equal(cachedGlobalBin(globalConfigPath), null);
});

test('cachedGlobalBin returns the cached path when it still exists on disk', () => {
  const dir = mkTempDir('bin-discovery-cache-hit-');
  const globalConfigPath = path.join(dir, 'config.json');
  const binPath = path.join(dir, 'fgos');
  writeStub(binPath);
  fs.writeFileSync(globalConfigPath, JSON.stringify({ bin: { globalFgosPath: binPath } }));
  assert.equal(cachedGlobalBin(globalConfigPath), binPath);
});

test('cachedGlobalBin self-heals: returns null when the cached path no longer exists on disk', () => {
  const dir = mkTempDir('bin-discovery-cache-stale-');
  const globalConfigPath = path.join(dir, 'config.json');
  fs.writeFileSync(globalConfigPath, JSON.stringify({ bin: { globalFgosPath: path.join(dir, 'gone') } }));
  assert.equal(cachedGlobalBin(globalConfigPath), null);
});

test('refreshGlobalBinCache writes the resolved PATH bin and reports changed:true on first populate', () => {
  const dir = mkTempDir('bin-discovery-refresh-');
  const globalConfigPath = path.join(dir, 'config.json');
  const binDir = mkTempDir('bin-discovery-refresh-pathstub-');
  const binPath = path.join(binDir, 'fgos');
  writeStub(binPath);
  fs.chmodSync(binPath, 0o755);
  const originalPath = process.env.PATH;
  process.env.PATH = `${binDir}${path.delimiter}${originalPath}`;
  try {
    const { resolved, changed } = refreshGlobalBinCache(globalConfigPath);
    assert.equal(resolved, binPath);
    assert.equal(changed, true);
    assert.equal(loadGlobalConfig(globalConfigPath).bin.globalFgosPath, binPath);
  } finally {
    process.env.PATH = originalPath;
  }
});

test('refreshGlobalBinCache is a no-op write when the resolved value already matches the cache (fgos setup idempotency)', () => {
  const dir = mkTempDir('bin-discovery-refresh-idempotent-');
  const globalConfigPath = path.join(dir, 'config.json');
  const binDir = mkTempDir('bin-discovery-refresh-idempotent-pathstub-');
  const binPath = path.join(binDir, 'fgos');
  writeStub(binPath);
  fs.chmodSync(binPath, 0o755);
  const originalPath = process.env.PATH;
  process.env.PATH = `${binDir}${path.delimiter}${originalPath}`;
  try {
    refreshGlobalBinCache(globalConfigPath);
    const mtimeBefore = fs.statSync(globalConfigPath).mtimeMs;
    const second = refreshGlobalBinCache(globalConfigPath);
    assert.equal(second.changed, false);
    assert.equal(fs.statSync(globalConfigPath).mtimeMs, mtimeBefore, 'must not rewrite when nothing changed');
  } finally {
    process.env.PATH = originalPath;
  }
});

test('refreshGlobalBinCache clears a stale cached key when nothing resolves on PATH anymore', () => {
  const dir = mkTempDir('bin-discovery-refresh-clear-');
  const globalConfigPath = path.join(dir, 'config.json');
  fs.writeFileSync(globalConfigPath, JSON.stringify({ bin: { globalFgosPath: '/some/stale/path' } }));
  const originalPath = process.env.PATH;
  process.env.PATH = '';
  try {
    const { resolved, changed } = refreshGlobalBinCache(globalConfigPath);
    assert.equal(resolved, null);
    assert.equal(changed, true);
    assert.equal(loadGlobalConfig(globalConfigPath).bin.globalFgosPath, undefined);
  } finally {
    process.env.PATH = originalPath;
  }
});

test('resolveFgosBin prefers tier 1 (dev-checkout) over tier 2 and tier 3', () => {
  const dir = mkTempDir('bin-discovery-priority-1-');
  writeStub(path.join(dir, 'bin', 'fgos.mjs'));
  writeStub(path.join(dir, 'node_modules', '.bin', 'fgos'));
  const result = resolveFgosBin(dir);
  assert.equal(result.tier, 1);
  assert.equal(result.path, path.join(dir, 'bin', 'fgos.mjs'));
});

test('resolveFgosBin prefers tier 2 (project-local) over tier 3 when tier 1 is absent', () => {
  const dir = mkTempDir('bin-discovery-priority-2-');
  writeStub(path.join(dir, 'node_modules', '.bin', 'fgos'));
  const result = resolveFgosBin(dir);
  assert.equal(result.tier, 2);
  assert.equal(result.path, path.join(dir, 'node_modules', '.bin', 'fgos'));
});

test('resolveFgosBin returns null when no tier resolves', () => {
  const dir = mkTempDir('bin-discovery-priority-none-');
  const globalConfigPath = path.join(mkTempDir('bin-discovery-priority-none-cfg-'), 'config.json');
  const originalPath = process.env.PATH;
  process.env.PATH = '';
  try {
    assert.equal(resolveFgosBin(dir, { globalConfigPath }), null);
  } finally {
    process.env.PATH = originalPath;
  }
});

test('resolveWorkspaceInstallationBin resolves when activation.json references a release with manifest.json', () => {
  const dir = mkTempDir('bin-discovery-tier0-rel-');
  const releaseDir = mkTempDir('bin-discovery-release-');
  const binPath = path.join(releaseDir, 'bin', 'fgos');
  writeStub(binPath);

  const manifest = {
    schemaVersion: 1,
    entries: { fgos: 'bin/fgos' },
  };
  fs.writeFileSync(path.join(releaseDir, 'manifest.json'), JSON.stringify(manifest));

  const installDir = path.join(dir, '.fgos', 'installation');
  fs.mkdirSync(installDir, { recursive: true });
  const activation = {
    schemaVersion: 1,
    status: 'ready',
    releasePath: releaseDir,
  };
  fs.writeFileSync(path.join(installDir, 'activation.json'), JSON.stringify(activation));

  assert.equal(resolveWorkspaceInstallationBin(dir), binPath);
});

test('resolveWorkspaceInstallationBin resolves when manifest.json is directly inside .fgos/installation', () => {
  const dir = mkTempDir('bin-discovery-tier0-direct-');
  const installDir = path.join(dir, '.fgos', 'installation');
  const binPath = path.join(installDir, 'bin', 'fgos');
  writeStub(binPath);

  const manifest = {
    schemaVersion: 1,
    entries: { fgos: 'bin/fgos' },
  };
  fs.writeFileSync(path.join(installDir, 'manifest.json'), JSON.stringify(manifest));

  const activation = {
    schemaVersion: 1,
    status: 'ready',
  };
  fs.writeFileSync(path.join(installDir, 'activation.json'), JSON.stringify(activation));

  assert.equal(resolveWorkspaceInstallationBin(dir), binPath);
});

test('resolveWorkspaceInstallationBin returns null when activation.json is absent or manifest missing', () => {
  const dir = mkTempDir('bin-discovery-tier0-absent-');
  assert.equal(resolveWorkspaceInstallationBin(dir), null);

  const installDir = path.join(dir, '.fgos', 'installation');
  fs.mkdirSync(installDir, { recursive: true });
  fs.writeFileSync(path.join(installDir, 'activation.json'), '{ "invalid" json');
  assert.equal(resolveWorkspaceInstallationBin(dir), null);
});

test('resolveWorkspaceInstallationBin returns null when manifest entries.fgos escapes release root', () => {
  const dir = mkTempDir('bin-discovery-tier0-escape-');
  const installDir = path.join(dir, '.fgos', 'installation');
  fs.mkdirSync(installDir, { recursive: true });

  const manifest = {
    schemaVersion: 1,
    entries: { fgos: '../../etc/passwd' },
  };
  fs.writeFileSync(path.join(installDir, 'manifest.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(installDir, 'activation.json'), JSON.stringify({ status: 'ready' }));

  assert.equal(resolveWorkspaceInstallationBin(dir), null);
});

test('resolveFgosBin prefers tier 0 (workspace installation) over tier 1, tier 2, and tier 3', () => {
  const dir = mkTempDir('bin-discovery-priority-0-');
  const installDir = path.join(dir, '.fgos', 'installation');
  const tier0Bin = path.join(installDir, 'bin', 'fgos');
  writeStub(tier0Bin);

  const manifest = {
    schemaVersion: 1,
    entries: { fgos: 'bin/fgos' },
  };
  fs.writeFileSync(path.join(installDir, 'manifest.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(installDir, 'activation.json'), JSON.stringify({ status: 'ready' }));

  // Also stage tier 1 and tier 2
  writeStub(path.join(dir, 'bin', 'fgos.mjs'));
  writeStub(path.join(dir, 'node_modules', '.bin', 'fgos'));

  const result = resolveFgosBin(dir);
  assert.equal(result.tier, 0);
  assert.equal(result.path, tier0Bin);
});

