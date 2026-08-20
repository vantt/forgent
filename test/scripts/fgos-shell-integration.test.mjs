import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(new URL('../../scripts/fgos-shell-integration.sh', import.meta.url));

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// tsk-2qc-1: an isolated HOME for every test in this file. The shell
// script's tier-3 resolution now reads `$HOME/.fgos/config.json` (the
// bin-discovery config-cache, D4) -- without this, any real cached
// `bin.globalFgosPath` left on the machine running these tests (from a
// real `fgos setup`/`doctor --fix` run) would make a test resolve to that
// real global fgos instead of the fixture the test itself set up,
// answering "unknown verb" instead of matching the fixture's own marker.
// No test in this file needs a real HOME (rc-file sourcing is covered
// separately, test/setup/checks.test.mjs's own shell-integration-sourced
// tests) -- one shared isolated dir for the whole file is enough.
const isolatedHome = mkTempDir('fgos-shell-integration-home-');
const SHELL_ENV = { ...process.env, HOME: isolatedHome };

function writeBinStub(repoRoot, name, marker) {
  const binDir = path.join(repoRoot, 'bin');
  fs.mkdirSync(binDir, { recursive: true });
  const stub = `#!/usr/bin/env node\nconsole.log(${JSON.stringify(marker)}, JSON.stringify(process.argv.slice(2)));\n`;
  fs.writeFileSync(path.join(binDir, `${name}.mjs`), stub);
}

function setupRepo() {
  const repoRoot = mkTempDir('fgos-shell-integration-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  writeBinStub(repoRoot, 'fgos', 'FGOS_MARKER');
  writeBinStub(repoRoot, 'fgos-runner', 'FGOS_RUNNER_MARKER');
  execFileSync('git', ['add', '-A'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });
  return repoRoot;
}

function runBash(cwd, script) {
  return execFileSync('bash', ['-c', script], { cwd, encoding: 'utf8', env: SHELL_ENV });
}

function runZsh(cwd, script) {
  return execFileSync('zsh', ['-c', script], { cwd, encoding: 'utf8', env: SHELL_ENV });
}

// A real, minimal PATH carrying only bash/git/node -- enough for the
// script itself to run (it shells out to `git rev-parse` and `command
// -v`) while guaranteeing no real `fgos` is reachable on it. Used by
// tests that need to rule out a live PATH match without breaking bash/git
// resolution the way a literal nonexistent PATH would.
function minimalSystemPath() {
  const bashDir = path.dirname(execFileSync('which', ['bash']).toString().trim());
  const gitDir = path.dirname(execFileSync('which', ['git']).toString().trim());
  const nodeDir = path.dirname(process.execPath);
  return [...new Set([bashDir, gitDir, nodeDir])].join(':');
}

function writePathStub(dir, name, marker) {
  fs.mkdirSync(dir, { recursive: true });
  const stubPath = path.join(dir, name);
  fs.writeFileSync(stubPath, `#!/usr/bin/env bash\necho "${marker}" "$@"\n`);
  fs.chmodSync(stubPath, 0o755);
  return stubPath;
}

function setupRepoWithoutBin(prefix) {
  const repoRoot = mkTempDir(prefix);
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'placeholder.txt'), '');
  execFileSync('git', ['add', '-A'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });
  return repoRoot;
}

test('fgos resolves and invokes bin/fgos.mjs from the repo root', () => {
  const repoRoot = setupRepo();

  const out = runBash(repoRoot, `source "${scriptPath}"; fgos --x`);

  assert.match(out, /FGOS_MARKER/);
  assert.match(out, /"--x"/);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('fgos-runner resolves and invokes bin/fgos-runner.mjs from the repo root', () => {
  const repoRoot = setupRepo();

  const out = runBash(repoRoot, `source "${scriptPath}"; fgos-runner --y`);

  assert.match(out, /FGOS_RUNNER_MARKER/);
  assert.match(out, /"--y"/);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('fgos and fgos-runner still resolve and invoke correctly even when a leading-underscore helper function gets stripped from the shell (tsk-3k2: this is what a harness shell-function snapshot did in practice, reproduced live as "fgos:2: command not found: _fgos_repo_root")', () => {
  const repoRoot = setupRepo();

  // Simulates the harness filtering out any `_`-prefixed function from a
  // sourced shell's surviving functions -- `fgos`/`fgos-runner` no longer
  // depend on any such helper, so unsetting one (real or not) must have
  // no effect on them.
  const out = runBash(repoRoot, `source "${scriptPath}"; unset -f _fgos_repo_root 2>/dev/null; fgos --x; fgos-runner --y`);

  assert.match(out, /FGOS_MARKER/);
  assert.match(out, /"--x"/);
  assert.match(out, /FGOS_RUNNER_MARKER/);
  assert.match(out, /"--y"/);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('from inside a linked worktree, fgos resolves to the MAIN checkout bin/fgos.mjs, not the worktree-local copy', () => {
  const repoRoot = setupRepo();
  const worktreeRoot = mkTempDir('fgos-shell-integration-wt-');
  fs.rmSync(worktreeRoot, { recursive: true, force: true });
  execFileSync('git', ['worktree', 'add', '-q', worktreeRoot, '-b', 'wt-branch'], { cwd: repoRoot });

  // Overwrite the worktree's own (uncommitted) copy of bin/fgos.mjs with a
  // different marker, so a pass only if the shell function actually
  // resolved via --git-common-dir to the main checkout's bin/fgos.mjs.
  writeBinStub(worktreeRoot, 'fgos', 'WORKTREE_LOCAL_MARKER');

  const out = runBash(worktreeRoot, `source "${scriptPath}"; fgos --z`);

  assert.match(out, /FGOS_MARKER/);
  assert.doesNotMatch(out, /WORKTREE_LOCAL_MARKER/);

  execFileSync('git', ['worktree', 'remove', '--force', worktreeRoot], { cwd: repoRoot });
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('fgos returns non-zero and prints an error to stderr outside any git repo', () => {
  const noGitDir = mkTempDir('fgos-shell-integration-no-git-');

  const result = spawnSync('bash', ['-c', `source "${scriptPath}"; fgos --x`], { cwd: noGitDir, encoding: 'utf8', env: SHELL_ENV });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not a git repository/);
  fs.rmSync(noGitDir, { recursive: true, force: true });
});

test('fgos-runner returns non-zero and prints an error to stderr outside any git repo', () => {
  const noGitDir = mkTempDir('fgos-shell-integration-no-git-');

  const result = spawnSync('bash', ['-c', `source "${scriptPath}"; fgos-runner --x`], { cwd: noGitDir, encoding: 'utf8', env: SHELL_ENV });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not a git repository/);
  fs.rmSync(noGitDir, { recursive: true, force: true });
});

// ─── tsk-2qc-1 D2/D3: tier 2 (project-local node_modules/.bin/fgos) and
// tier 3's config-cache (bin.globalFgosPath), extending this file's
// pre-existing tier-1/tier-3-PATH coverage to all 3 tiers.

test('fgos resolves tier 2 (project-local node_modules/.bin/fgos) when the resolved root has no bin/fgos.mjs and no PATH install exists', () => {
  const repoRoot = setupRepoWithoutBin('fgos-shell-integration-tier2-');
  writePathStub(path.join(repoRoot, 'node_modules', '.bin'), 'fgos', 'PROJECT_LOCAL_FGOS_MARKER');

  const out = execFileSync('bash', ['-c', `source "${scriptPath}"; fgos --w`], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...SHELL_ENV, PATH: minimalSystemPath() },
  });

  assert.match(out, /PROJECT_LOCAL_FGOS_MARKER/);
  assert.match(out, /--w/);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('fgos-runner resolves tier 2 (project-local node_modules/.bin/fgos-runner) the same way', () => {
  const repoRoot = setupRepoWithoutBin('fgos-shell-integration-tier2-');
  writePathStub(path.join(repoRoot, 'node_modules', '.bin'), 'fgos-runner', 'PROJECT_LOCAL_FGOS_RUNNER_MARKER');

  const out = execFileSync('bash', ['-c', `source "${scriptPath}"; fgos-runner --w`], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...SHELL_ENV, PATH: minimalSystemPath() },
  });

  assert.match(out, /PROJECT_LOCAL_FGOS_RUNNER_MARKER/);
  assert.match(out, /--w/);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('fgos tier 2 walks up from a nested cwd to find node_modules/.bin/fgos at the repo root', () => {
  const repoRoot = setupRepoWithoutBin('fgos-shell-integration-tier2-nested-');
  writePathStub(path.join(repoRoot, 'node_modules', '.bin'), 'fgos', 'PROJECT_LOCAL_FGOS_MARKER');
  const nested = path.join(repoRoot, 'a', 'b', 'c');
  fs.mkdirSync(nested, { recursive: true });

  const out = execFileSync('bash', ['-c', `source "${scriptPath}"; fgos --w`], {
    cwd: nested,
    encoding: 'utf8',
    env: { ...SHELL_ENV, PATH: minimalSystemPath() },
  });

  assert.match(out, /PROJECT_LOCAL_FGOS_MARKER/);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('fgos resolves tier 3 from the config-cache (bin.globalFgosPath) without shelling out to a live PATH lookup', () => {
  const repoRoot = setupRepoWithoutBin('fgos-shell-integration-tier3-cache-');
  const cachedBinDir = mkTempDir('fgos-shell-integration-cached-bin-');
  const cachedBinPath = writePathStub(cachedBinDir, 'fgos', 'CACHED_GLOBAL_FGOS_MARKER');
  const cacheHome = mkTempDir('fgos-shell-integration-cache-home-');
  fs.mkdirSync(path.join(cacheHome, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(cacheHome, '.fgos', 'config.json'),
    JSON.stringify({ bin: { globalFgosPath: cachedBinPath } }, null, 2),
  );

  // A minimal real PATH (no cachedBinDir on it, no real fgos anywhere on
  // it) -- a pass here proves the cache was actually used, not a live
  // PATH fallback that happened to find the same stub some other way.
  const out = execFileSync('bash', ['-c', `source "${scriptPath}"; fgos --w`], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...SHELL_ENV, HOME: cacheHome, PATH: minimalSystemPath() },
  });

  assert.match(out, /CACHED_GLOBAL_FGOS_MARKER/);
  fs.rmSync(repoRoot, { recursive: true, force: true });
  fs.rmSync(cachedBinDir, { recursive: true, force: true });
  fs.rmSync(cacheHome, { recursive: true, force: true });
});

test('fgos self-heals past a stale config-cache entry (cached path no longer exists on disk) by falling back to a live PATH probe', () => {
  const repoRoot = setupRepoWithoutBin('fgos-shell-integration-tier3-stale-cache-');
  const cacheHome = mkTempDir('fgos-shell-integration-stale-cache-home-');
  fs.mkdirSync(path.join(cacheHome, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(cacheHome, '.fgos', 'config.json'),
    JSON.stringify({ bin: { globalFgosPath: '/nonexistent/stale-fgos-path' } }, null, 2),
  );
  const pathStubDir = mkTempDir('fgos-shell-integration-pathstub-');
  writePathStub(pathStubDir, 'fgos', 'LIVE_PATH_FGOS_MARKER');

  const out = execFileSync('bash', ['-c', `export PATH="${pathStubDir}:$PATH"; source "${scriptPath}"; fgos --w`], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...SHELL_ENV, HOME: cacheHome },
  });

  assert.match(out, /LIVE_PATH_FGOS_MARKER/);
  fs.rmSync(repoRoot, { recursive: true, force: true });
  fs.rmSync(cacheHome, { recursive: true, force: true });
  fs.rmSync(pathStubDir, { recursive: true, force: true });
});

test('fgos falls back to a real PATH install when the resolved root has no bin/fgos.mjs', () => {
  const repoRoot = setupRepoWithoutBin('fgos-shell-integration-no-bin-');
  const pathStubDir = mkTempDir('fgos-shell-integration-pathstub-');
  writePathStub(pathStubDir, 'fgos', 'PATH_FGOS_MARKER');

  const out = runBash(repoRoot, `export PATH="${pathStubDir}:$PATH"; source "${scriptPath}"; fgos --w`);

  assert.match(out, /PATH_FGOS_MARKER/);
  assert.match(out, /--w/);

  fs.rmSync(repoRoot, { recursive: true, force: true });
  fs.rmSync(pathStubDir, { recursive: true, force: true });
});

test('fgos-runner falls back to a real PATH install when the resolved root has no bin/fgos-runner.mjs', () => {
  const repoRoot = setupRepoWithoutBin('fgos-shell-integration-no-bin-');
  const pathStubDir = mkTempDir('fgos-shell-integration-pathstub-');
  writePathStub(pathStubDir, 'fgos-runner', 'PATH_FGOS_RUNNER_MARKER');

  const out = runBash(repoRoot, `export PATH="${pathStubDir}:$PATH"; source "${scriptPath}"; fgos-runner --w`);

  assert.match(out, /PATH_FGOS_RUNNER_MARKER/);
  assert.match(out, /--w/);

  fs.rmSync(repoRoot, { recursive: true, force: true });
  fs.rmSync(pathStubDir, { recursive: true, force: true });
});

test('fgos falls back to a real PATH install under zsh, not just bash (regression: `type -P` is bash-only and silently breaks this branch under zsh)', () => {
  const repoRoot = setupRepoWithoutBin('fgos-shell-integration-no-bin-');
  const pathStubDir = mkTempDir('fgos-shell-integration-pathstub-');
  writePathStub(pathStubDir, 'fgos', 'PATH_FGOS_MARKER');

  const out = runZsh(repoRoot, `export PATH="${pathStubDir}:$PATH"; source "${scriptPath}"; fgos --w`);

  assert.match(out, /PATH_FGOS_MARKER/);
  assert.match(out, /--w/);

  fs.rmSync(repoRoot, { recursive: true, force: true });
  fs.rmSync(pathStubDir, { recursive: true, force: true });
});

test('fgos-runner falls back to a real PATH install under zsh, not just bash', () => {
  const repoRoot = setupRepoWithoutBin('fgos-shell-integration-no-bin-');
  const pathStubDir = mkTempDir('fgos-shell-integration-pathstub-');
  writePathStub(pathStubDir, 'fgos-runner', 'PATH_FGOS_RUNNER_MARKER');

  const out = runZsh(repoRoot, `export PATH="${pathStubDir}:$PATH"; source "${scriptPath}"; fgos-runner --w`);

  assert.match(out, /PATH_FGOS_RUNNER_MARKER/);
  assert.match(out, /--w/);

  fs.rmSync(repoRoot, { recursive: true, force: true });
  fs.rmSync(pathStubDir, { recursive: true, force: true });
});

test('fgos prints a clear error, not a raw Node stack, when the resolved root has no bin/fgos.mjs and no PATH install exists', () => {
  const repoRoot = setupRepoWithoutBin('fgos-shell-integration-no-bin-no-path-');
  const bashDir = path.dirname(execFileSync('which', ['bash']).toString().trim());
  const gitDir = path.dirname(execFileSync('which', ['git']).toString().trim());
  const minimalPath = [...new Set([bashDir, gitDir])].join(':');

  const result = spawnSync('bash', ['-c', `source "${scriptPath}"; fgos --x`], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { PATH: minimalPath },
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /no bin\/fgos\.mjs/);
  assert.doesNotMatch(result.stderr, /Cannot find module/);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('fgos auto-appends --dir "$root" when caller omits --dir', () => {
  const repoRoot = setupRepo();

  const out = runBash(repoRoot, `source "${scriptPath}"; fgos --x`);

  assert.match(out, /FGOS_MARKER/);
  assert.match(out, /"--x"/);
  assert.match(out, /"--dir"/);
  assert.ok(out.includes(repoRoot));

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('fgos preserves explicit --dir without overriding it', () => {
  const repoRoot = setupRepo();

  const out = runBash(repoRoot, `source "${scriptPath}"; fgos --x --dir /explicit/path`);

  assert.match(out, /FGOS_MARKER/);
  assert.match(out, /"--x"/);
  assert.match(out, /"--dir"/);
  assert.match(out, /"\/explicit\/path"/);
  assert.doesNotMatch(out, new RegExp(repoRoot));

  const outEq = runBash(repoRoot, `source "${scriptPath}"; fgos --x --dir=/explicit/path`);
  assert.match(outEq, /FGOS_MARKER/);
  assert.match(outEq, /"--x"/);
  assert.match(outEq, /"--dir=\/explicit\/path"/);
  assert.doesNotMatch(outEq, new RegExp(repoRoot));

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

