import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installGitHooks } from '../../scripts/install-git-hooks.mjs';
import { activateGitFixture } from '../helpers/git-fixture.mjs';

const scriptPath = fileURLToPath(new URL('../../scripts/install-git-hooks.mjs', import.meta.url));
const packageJsonPath = fileURLToPath(new URL('../../package.json', import.meta.url));

// --- package.json lifecycle wiring: no automatic `prepare`, manual `setup:hooks` ---

test('package.json has no prepare script and exposes setup:hooks running install-git-hooks.mjs', () => {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  assert.equal('prepare' in pkg.scripts, false);
  assert.equal(pkg.scripts['setup:hooks'], 'node scripts/install-git-hooks.mjs');
});

function mkTempDir(prefix) {
  return fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

// RepositoryConfig writes only inside an activated checkout, so every fixture
// repository carries the activation fence production's activation leaves.
function initActivatedRepo(repoRoot) {
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  activateGitFixture(repoRoot);
}

// --- installGitHooks: function form, real git checkout -------------------

test('installGitHooks sets core.hooksPath to this repo root\'s absolute .githooks path inside a real git checkout', () => {
  const repoRoot = mkTempDir('install-git-hooks-fn-');
  initActivatedRepo(repoRoot);
  fs.mkdirSync(path.join(repoRoot, '.githooks'));

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

test('installGitHooks leaves core.hooksPath unset in a project that ships no .githooks/ directory', () => {
  const repoRoot = mkTempDir('install-git-hooks-no-hooks-dir-');
  initActivatedRepo(repoRoot);

  assert.deepEqual(installGitHooks(repoRoot), { wired: false, skippedExisting: null });
  assert.throws(() => execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd: repoRoot }), 'core.hooksPath must stay unset');

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('installGitHooks is idempotent -- running it twice does not throw and leaves the same config', () => {
  const repoRoot = mkTempDir('install-git-hooks-idempotent-');
  initActivatedRepo(repoRoot);
  fs.mkdirSync(path.join(repoRoot, '.githooks'));

  installGitHooks(repoRoot);
  installGitHooks(repoRoot);

  const hooksPath = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  assert.equal(hooksPath, path.join(repoRoot, '.githooks'));

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('installGitHooks returns { wired: true, skippedExisting: null } on a fresh repo, { wired: false, skippedExisting: null } with no .git', () => {
  const repoRoot = mkTempDir('install-git-hooks-return-');
  initActivatedRepo(repoRoot);
  fs.mkdirSync(path.join(repoRoot, '.githooks'));
  assert.deepEqual(installGitHooks(repoRoot), { wired: true, skippedExisting: null });
  fs.rmSync(repoRoot, { recursive: true, force: true });

  const noGitDir = mkTempDir('install-git-hooks-return-no-git-');
  assert.deepEqual(installGitHooks(noGitDir), { wired: false, skippedExisting: null });
  fs.rmSync(noGitDir, { recursive: true, force: true });
});

test('installGitHooks never overwrites a pre-existing custom core.hooksPath -- fill-only, matches this verb\'s other side effects', () => {
  const repoRoot = mkTempDir('install-git-hooks-custom-');
  initActivatedRepo(repoRoot);
  fs.mkdirSync(path.join(repoRoot, '.githooks'));
  execFileSync('git', ['config', 'core.hooksPath', 'husky-hooks'], { cwd: repoRoot });

  assert.deepEqual(installGitHooks(repoRoot), { wired: false, skippedExisting: 'husky-hooks' });

  const hooksPath = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  assert.equal(hooksPath, 'husky-hooks', 'a pre-existing custom hooksPath must survive untouched');

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('installGitHooks treats a pre-existing absolute core.hooksPath resolving to repoRoot/.githooks as already wired, not a foreign custom hook', () => {
  const repoRoot = mkTempDir('install-git-hooks-absolute-');
  initActivatedRepo(repoRoot);
  fs.mkdirSync(path.join(repoRoot, '.githooks'));
  execFileSync('git', ['config', 'core.hooksPath', path.join(repoRoot, '.githooks')], { cwd: repoRoot });

  assert.deepEqual(installGitHooks(repoRoot), { wired: true, skippedExisting: null });

  const hooksPath = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  assert.equal(hooksPath, path.join(repoRoot, '.githooks'), 'must not be silently rewritten to the relative form');

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

// --- CLI: real end-to-end run, mirroring the production <repoRoot>/scripts/ layout ---

const isMainModulePath = fileURLToPath(new URL('../../scripts/lib/is-main-module.mjs', import.meta.url));
const srcPath = fileURLToPath(new URL('../../src', import.meta.url));

// The real script is a thin shim over src/setup/git-hooks.mjs (that layer
// ships with the npm package; scripts/ does not — see the script's own
// header comment) and resolves the repository it wires from its own
// location. A fixture exercising it as a real CLI therefore copies the shim
// and its entrypoint-guard helper at their real relative nesting, and links
// the real src/ tree beside them: git-hooks.mjs reaches Git through src/git/*
// and the native addon, which loads only from this checkout's own payload.
function setupCliFixture() {
  const fixtureRoot = mkTempDir('install-git-hooks-cli-');
  const scriptsDir = path.join(fixtureRoot, 'scripts');
  const libDir = path.join(scriptsDir, 'lib');
  fs.mkdirSync(libDir, { recursive: true });
  const scriptCopyPath = path.join(scriptsDir, 'install-git-hooks.mjs');
  fs.copyFileSync(scriptPath, scriptCopyPath);
  fs.copyFileSync(isMainModulePath, path.join(libDir, 'is-main-module.mjs'));
  fs.symlinkSync(srcPath, path.join(fixtureRoot, 'src'), 'dir');
  return { fixtureRoot, scriptCopyPath };
}

test('CLI: running install-git-hooks.mjs inside a fresh temp git clone sets core.hooksPath to the fixture root\'s absolute .githooks path', () => {
  const { fixtureRoot, scriptCopyPath } = setupCliFixture();
  initActivatedRepo(fixtureRoot);
  fs.mkdirSync(path.join(fixtureRoot, '.githooks'), { recursive: true });

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

test('CLI: a RepositoryConfig refusal (no activation fence) exits non-zero with its named cause instead of a stack trace, leaving core.hooksPath unset', () => {
  const { fixtureRoot, scriptCopyPath } = setupCliFixture();
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: fixtureRoot });
  fs.mkdirSync(path.join(fixtureRoot, '.githooks'), { recursive: true });

  const result = spawnSync(process.execPath, [scriptCopyPath], { cwd: fixtureRoot, encoding: 'utf8' });

  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /git-fence-missing/);
  assert.doesNotMatch(result.stderr, /^\s+at /m, 'a typed refusal is reported, not thrown');
  assert.throws(() => execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd: fixtureRoot }), 'core.hooksPath must stay unset');

  fs.rmSync(fixtureRoot, { recursive: true, force: true });
});
