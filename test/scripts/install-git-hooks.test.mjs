import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installGitHooks } from '../../scripts/install-git-hooks.mjs';

const scriptPath = fileURLToPath(new URL('../../scripts/install-git-hooks.mjs', import.meta.url));
const packageJsonPath = fileURLToPath(new URL('../../package.json', import.meta.url));

// --- package.json lifecycle wiring: no automatic `prepare`, manual `setup:hooks` ---

test('package.json has no prepare script and exposes setup:hooks running install-git-hooks.mjs', () => {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  assert.equal('prepare' in pkg.scripts, false);
  assert.equal(pkg.scripts['setup:hooks'], 'node scripts/install-git-hooks.mjs');
});

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// --- installGitHooks: function form, real git checkout -------------------

test('installGitHooks sets core.hooksPath to this repo root\'s absolute .githooks path inside a real git checkout', () => {
  const repoRoot = mkTempDir('install-git-hooks-fn-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });

  installGitHooks(repoRoot);

  const hooksPath = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  assert.equal(hooksPath, path.join(repoRoot, '.githooks'), 'must be absolute -- a relative value resolves per-worktree, not to this root, once .githooks/ is a tracked directory (tsk-2u5 D4)');

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
  assert.equal(hooksPath, path.join(repoRoot, '.githooks'));

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('installGitHooks returns { wired: true, skippedExisting: null } on a fresh repo, { wired: false, skippedExisting: null } with no .git', () => {
  const repoRoot = mkTempDir('install-git-hooks-return-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  assert.deepEqual(installGitHooks(repoRoot), { wired: true, skippedExisting: null });
  fs.rmSync(repoRoot, { recursive: true, force: true });

  const noGitDir = mkTempDir('install-git-hooks-return-no-git-');
  assert.deepEqual(installGitHooks(noGitDir), { wired: false, skippedExisting: null });
  fs.rmSync(noGitDir, { recursive: true, force: true });
});

test('installGitHooks never overwrites a pre-existing custom core.hooksPath -- fill-only, matches this verb\'s other side effects', () => {
  const repoRoot = mkTempDir('install-git-hooks-custom-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'core.hooksPath', 'husky-hooks'], { cwd: repoRoot });

  assert.deepEqual(installGitHooks(repoRoot), { wired: false, skippedExisting: 'husky-hooks' });

  const hooksPath = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  assert.equal(hooksPath, 'husky-hooks', 'a pre-existing custom hooksPath must survive untouched');

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('installGitHooks treats a pre-existing absolute core.hooksPath resolving to repoRoot/.githooks as already wired, not a foreign custom hook', () => {
  const repoRoot = mkTempDir('install-git-hooks-absolute-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'core.hooksPath', path.join(repoRoot, '.githooks')], { cwd: repoRoot });

  assert.deepEqual(installGitHooks(repoRoot), { wired: true, skippedExisting: null });

  const hooksPath = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  assert.equal(hooksPath, path.join(repoRoot, '.githooks'), 'must not be silently rewritten to the relative form');

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

// --- CLI: real end-to-end run, mirroring the production <repoRoot>/scripts/ layout ---

const gitHooksModulePath = fileURLToPath(new URL('../../src/setup/git-hooks.mjs', import.meta.url));

// The real script is a thin shim over src/setup/git-hooks.mjs (that layer
// ships with the npm package; scripts/ does not — see the script's own
// header comment) — a fixture exercising it as a real CLI must mirror BOTH
// files at their real relative nesting, not just the shim alone.
function setupCliFixture() {
  const fixtureRoot = mkTempDir('install-git-hooks-cli-');
  const scriptsDir = path.join(fixtureRoot, 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });
  const scriptCopyPath = path.join(scriptsDir, 'install-git-hooks.mjs');
  fs.copyFileSync(scriptPath, scriptCopyPath);
  const setupDir = path.join(fixtureRoot, 'src', 'setup');
  fs.mkdirSync(setupDir, { recursive: true });
  fs.copyFileSync(gitHooksModulePath, path.join(setupDir, 'git-hooks.mjs'));
  return { fixtureRoot, scriptCopyPath };
}

test('CLI: running install-git-hooks.mjs inside a fresh temp git clone sets core.hooksPath to the fixture root\'s absolute .githooks path', () => {
  const { fixtureRoot, scriptCopyPath } = setupCliFixture();
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: fixtureRoot });

  const result = spawnSync(process.execPath, [scriptCopyPath], { cwd: fixtureRoot, encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr);
  const hooksPath = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd: fixtureRoot, encoding: 'utf8' }).trim();
  assert.equal(hooksPath, path.join(fixtureRoot, '.githooks'));

  fs.rmSync(fixtureRoot, { recursive: true, force: true });
});

test('CLI: running install-git-hooks.mjs where no .git exists exits 0 without error', () => {
  const { fixtureRoot, scriptCopyPath } = setupCliFixture();

  const result = spawnSync(process.execPath, [scriptCopyPath], { cwd: fixtureRoot, encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr);

  fs.rmSync(fixtureRoot, { recursive: true, force: true });
});
