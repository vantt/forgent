import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installGitHooks } from '../../scripts/install-git-hooks.mjs';

const scriptPath = fileURLToPath(new URL('../../scripts/install-git-hooks.mjs', import.meta.url));

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// --- installGitHooks: function form, real git checkout -------------------

test('installGitHooks sets core.hooksPath to .githooks inside a real git checkout', () => {
  const repoRoot = mkTempDir('install-git-hooks-fn-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });

  installGitHooks(repoRoot);

  const hooksPath = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  assert.equal(hooksPath, '.githooks');

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('installGitHooks no-ops silently when no .git entry exists', () => {
  const noGitDir = mkTempDir('install-git-hooks-no-git-');

  assert.doesNotThrow(() => installGitHooks(noGitDir));

  fs.rmSync(noGitDir, { recursive: true, force: true });
});

test('installGitHooks is idempotent -- running it twice does not throw and leaves the same config', () => {
  const repoRoot = mkTempDir('install-git-hooks-idempotent-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });

  installGitHooks(repoRoot);
  installGitHooks(repoRoot);

  const hooksPath = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  assert.equal(hooksPath, '.githooks');

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

// --- CLI: real end-to-end run, mirroring the production <repoRoot>/scripts/ layout ---

function setupCliFixture() {
  const fixtureRoot = mkTempDir('install-git-hooks-cli-');
  const scriptsDir = path.join(fixtureRoot, 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });
  const scriptCopyPath = path.join(scriptsDir, 'install-git-hooks.mjs');
  fs.copyFileSync(scriptPath, scriptCopyPath);
  return { fixtureRoot, scriptCopyPath };
}

test('CLI: running install-git-hooks.mjs inside a fresh temp git clone sets core.hooksPath to .githooks', () => {
  const { fixtureRoot, scriptCopyPath } = setupCliFixture();
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: fixtureRoot });

  const result = spawnSync(process.execPath, [scriptCopyPath], { cwd: fixtureRoot, encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr);
  const hooksPath = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd: fixtureRoot, encoding: 'utf8' }).trim();
  assert.equal(hooksPath, '.githooks');

  fs.rmSync(fixtureRoot, { recursive: true, force: true });
});

test('CLI: running install-git-hooks.mjs where no .git exists exits 0 without error', () => {
  const { fixtureRoot, scriptCopyPath } = setupCliFixture();

  const result = spawnSync(process.execPath, [scriptCopyPath], { cwd: fixtureRoot, encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr);

  fs.rmSync(fixtureRoot, { recursive: true, force: true });
});
