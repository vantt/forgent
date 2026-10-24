// bin-discovery.test.mjs — 3-tier fgos bin resolution + tier-3 bin cache
// (tsk-2qc-1, D2/D4 of docs/history/install-setup-external-project-
// reliability/CONTEXT.md).
import '../helpers/process-tmp-root.mjs';
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
import { globalConfigPath } from '../helpers/config-fixture.mjs';

const cacheFile = (globalDir) => path.join(globalDir, 'runtime', 'bin-cache.json');
const writeCache = (globalDir, globalFgosPath) => {
  fs.mkdirSync(path.dirname(cacheFile(globalDir)), { recursive: true });
  fs.writeFileSync(cacheFile(globalDir), JSON.stringify({ globalFgosPath }));
};
const readCache = (globalDir) => JSON.parse(fs.readFileSync(cacheFile(globalDir), 'utf8'));

function mkTempDir(prefix) {
  return fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

function writeStub(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  // Executable by default: a real fgos binary at any tier is executable,
  // and tier 0's resolver requires X_OK.
  fs.writeFileSync(filePath, '#!/usr/bin/env node\n', { mode: 0o755 });
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

test('cachedGlobalBin returns null when there is no bin cache file', () => {
  const globalDir = mkTempDir('bin-discovery-cache-');
  assert.equal(cachedGlobalBin({ globalDir }), null);
});

test('cachedGlobalBin returns the cached path when it still exists on disk', () => {
  const dir = mkTempDir('bin-discovery-cache-hit-');
  const binPath = path.join(dir, 'fgos');
  writeStub(binPath);
  writeCache(dir, binPath);
  assert.equal(cachedGlobalBin({ globalDir: dir }), binPath);
});

test('cachedGlobalBin self-heals: returns null when the cached path no longer exists on disk', () => {
  const dir = mkTempDir('bin-discovery-cache-stale-');
  writeCache(dir, path.join(dir, 'gone'));
  assert.equal(cachedGlobalBin({ globalDir: dir }), null);
});

test('refreshGlobalBinCache writes the resolved PATH bin and reports changed:true on first populate', () => {
  const dir = mkTempDir('bin-discovery-refresh-');
  const binDir = mkTempDir('bin-discovery-refresh-pathstub-');
  const binPath = path.join(binDir, 'fgos');
  writeStub(binPath);
  fs.chmodSync(binPath, 0o755);
  const originalPath = process.env.PATH;
  process.env.PATH = `${binDir}${path.delimiter}${originalPath}`;
  try {
    const { resolved, changed } = refreshGlobalBinCache({ globalDir: dir });
    assert.equal(resolved, binPath);
    assert.equal(changed, true);
    assert.deepEqual(readCache(dir), { globalFgosPath: binPath });
    assert.equal(fs.statSync(cacheFile(dir)).mode & 0o777, 0o600);
    assert.equal(fs.existsSync(globalConfigPath(path.dirname(dir))), false, 'the cache never lands in config');
  } finally {
    process.env.PATH = originalPath;
  }
});

test('refreshGlobalBinCache is a no-op write when the resolved value already matches the cache (fgos setup idempotency)', () => {
  const dir = mkTempDir('bin-discovery-refresh-idempotent-');
  const binDir = mkTempDir('bin-discovery-refresh-idempotent-pathstub-');
  const binPath = path.join(binDir, 'fgos');
  writeStub(binPath);
  fs.chmodSync(binPath, 0o755);
  const originalPath = process.env.PATH;
  process.env.PATH = `${binDir}${path.delimiter}${originalPath}`;
  try {
    refreshGlobalBinCache({ globalDir: dir });
    const mtimeBefore = fs.statSync(cacheFile(dir)).mtimeMs;
    const second = refreshGlobalBinCache({ globalDir: dir });
    assert.equal(second.changed, false);
    assert.equal(fs.statSync(cacheFile(dir)).mtimeMs, mtimeBefore, 'must not rewrite when nothing changed');
  } finally {
    process.env.PATH = originalPath;
  }
});

test('refreshGlobalBinCache deletes the cache file when nothing resolves on PATH anymore', () => {
  const dir = mkTempDir('bin-discovery-refresh-clear-');
  writeCache(dir, '/some/stale/path');
  const originalPath = process.env.PATH;
  process.env.PATH = '';
  try {
    const { resolved, changed } = refreshGlobalBinCache({ globalDir: dir });
    assert.equal(resolved, null);
    assert.equal(changed, true);
    assert.equal(fs.existsSync(cacheFile(dir)), false);
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
  const globalDir = mkTempDir('bin-discovery-priority-none-cfg-');
  const originalPath = process.env.PATH;
  process.env.PATH = '';
  try {
    assert.equal(resolveFgosBin(dir, { globalDir }), null);
  } finally {
    process.env.PATH = originalPath;
  }
});

// Tier 0 follows the fgctl shim rule (src/util/host-bin-path.mjs): a ready
// activation's `<releasePath>/bin/fgos`. The earlier form with a manifest
// directly inside .fgos/installation and no releasePath is gone on purpose:
// the shim, the door the `fgos` command takes, never ran that form.
function stageActivation(dir, activation) {
  const installDir = path.join(dir, '.fgos', 'installation');
  fs.mkdirSync(installDir, { recursive: true });
  fs.writeFileSync(path.join(installDir, 'activation.json'), JSON.stringify(activation));
}

test('resolveWorkspaceInstallationBin resolves the release binary a ready activation names', () => {
  const dir = mkTempDir('bin-discovery-tier0-rel-');
  const releaseDir = mkTempDir('bin-discovery-release-');
  const binPath = path.join(releaseDir, 'bin', 'fgos');
  writeStub(binPath);
  stageActivation(dir, { schemaVersion: 1, status: 'ready', releasePath: releaseDir });

  assert.equal(resolveWorkspaceInstallationBin(dir), binPath);
});

test('resolveWorkspaceInstallationBin returns null without a ready activation that names a release', () => {
  const dir = mkTempDir('bin-discovery-tier0-absent-');
  assert.equal(resolveWorkspaceInstallationBin(dir), null);

  const installDir = path.join(dir, '.fgos', 'installation');
  fs.mkdirSync(installDir, { recursive: true });
  fs.writeFileSync(path.join(installDir, 'activation.json'), '{ "invalid" json');
  assert.equal(resolveWorkspaceInstallationBin(dir), null);

  const releaseDir = mkTempDir('bin-discovery-release-');
  writeStub(path.join(releaseDir, 'bin', 'fgos'));
  stageActivation(dir, { status: 'staging', releasePath: releaseDir });
  assert.equal(resolveWorkspaceInstallationBin(dir), null, 'not ready');

  writeStub(path.join(installDir, 'bin', 'fgos'));
  stageActivation(dir, { status: 'ready' });
  assert.equal(resolveWorkspaceInstallationBin(dir), null, 'no releasePath');
});

// Regression: a non-executable entry was selected as tier 0 instead of
// falling through.
test('resolveWorkspaceInstallationBin returns null when the release binary is not executable', (t) => {
  if (process.platform === 'win32') {
    t.skip('fs.constants.X_OK has no effect on Windows (NTFS has no POSIX execute bit)');
    return;
  }
  const dir = mkTempDir('bin-discovery-tier0-noexec-');
  const releaseDir = mkTempDir('bin-discovery-release-');
  fs.mkdirSync(path.join(releaseDir, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(releaseDir, 'bin', 'fgos'), '#!/bin/sh\n', { mode: 0o644 });
  stageActivation(dir, { status: 'ready', releasePath: releaseDir });

  assert.equal(resolveWorkspaceInstallationBin(dir), null);
});

// Regression: a release binary that is itself a symlink escaping the
// release root (real target outside it) was selected as tier 0 instead of
// falling through.
test('resolveWorkspaceInstallationBin returns null when the release binary is a symlink escaping the release root', () => {
  const dir = mkTempDir('bin-discovery-tier0-symlink-escape-');
  const releaseDir = mkTempDir('bin-discovery-release-');
  fs.mkdirSync(path.join(releaseDir, 'bin'), { recursive: true });
  const outsideTarget = path.join(mkTempDir('bin-discovery-tier0-outside-'), 'sh-stub');
  fs.writeFileSync(outsideTarget, '#!/bin/sh\n', { mode: 0o755 });
  fs.symlinkSync(outsideTarget, path.join(releaseDir, 'bin', 'fgos'));
  stageActivation(dir, { status: 'ready', releasePath: releaseDir });

  assert.equal(resolveWorkspaceInstallationBin(dir), null);
});

test('resolveFgosBin prefers tier 0 (workspace installation) over tier 1, tier 2, and tier 3', () => {
  const dir = mkTempDir('bin-discovery-priority-0-');
  const releaseDir = mkTempDir('bin-discovery-release-');
  const tier0Bin = path.join(releaseDir, 'bin', 'fgos');
  writeStub(tier0Bin);
  stageActivation(dir, { status: 'ready', releasePath: releaseDir });

  // Also stage tier 1 and tier 2
  writeStub(path.join(dir, 'bin', 'fgos.mjs'));
  writeStub(path.join(dir, 'node_modules', '.bin', 'fgos'));

  const result = resolveFgosBin(dir);
  assert.equal(result.tier, 0);
  assert.equal(result.path, tier0Bin);
});
