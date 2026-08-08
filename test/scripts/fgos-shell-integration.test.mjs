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
  return execFileSync('bash', ['-c', script], { cwd, encoding: 'utf8' });
}

function runZsh(cwd, script) {
  return execFileSync('zsh', ['-c', script], { cwd, encoding: 'utf8' });
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

  const result = spawnSync('bash', ['-c', `source "${scriptPath}"; fgos --x`], { cwd: noGitDir, encoding: 'utf8' });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not a git repository/);
  fs.rmSync(noGitDir, { recursive: true, force: true });
});

test('fgos-runner returns non-zero and prints an error to stderr outside any git repo', () => {
  const noGitDir = mkTempDir('fgos-shell-integration-no-git-');

  const result = spawnSync('bash', ['-c', `source "${scriptPath}"; fgos-runner --x`], { cwd: noGitDir, encoding: 'utf8' });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not a git repository/);
  fs.rmSync(noGitDir, { recursive: true, force: true });
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
