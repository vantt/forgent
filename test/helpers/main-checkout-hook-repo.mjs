// Disposable git repos wired with the real pre-commit hook for the
// main-checkout hook tests. The hook is copied (it derives its repo root from
// its own location); `src/` is a symlink to this checkout's, so the hook's
// relative imports resolve exactly as in an install while the copy stays the
// real code.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveActiveHostBin } from '../../src/util/host-bin-path.mjs';
import { activateGitFixture } from './git-fixture.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REAL_HOOK = path.join(ROOT, '.githooks', 'pre-commit');
const REAL_SRC = path.join(ROOT, 'src');

const { bin: HOST_BIN } = resolveActiveHostBin({ fgosDir: path.join(ROOT, '.fgos') });
// The hook in a /tmp repo finds its host only through the env: hand it the one this run resolved.
if (HOST_BIN) process.env.FGOS_HOST_BIN ??= HOST_BIN;
const GIT_PRESENT = spawnSync('git', ['--version'], { encoding: 'utf8' }).status === 0;

/** Why the kernel-lock hook tests cannot run here, or false. */
export const HOOK_TEST_SKIP = !HOST_BIN
  ? 'no fgos host binary: set FGOS_HOST_BIN to a host built with the internal lock-fd route'
  : process.platform !== 'linux'
    ? 'reads /proc to list description holders'
    : !GIT_PRESENT ? 'git is not on PATH' : false;

export function git(cwd, args, env) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', ...(env ? { env } : {}) });
}

export function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function initRepo(prefix = 'fgos-hook-repo-') {
  const repoRoot = mkTempDir(prefix);
  git(repoRoot, ['init', '-q', '-b', 'main']);
  git(repoRoot, ['config', 'user.email', 'test@example.com']);
  git(repoRoot, ['config', 'user.name', 'Test']);
  git(repoRoot, ['config', 'commit.gpgsign', 'false']);
  fs.writeFileSync(path.join(repoRoot, '.gitignore'), '.fgos/locks/\n');
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  git(repoRoot, ['add', 'seed.txt', '.gitignore']);
  git(repoRoot, ['commit', '-q', '-m', 'root commit']);
  // After the seed (signing already off), so the fence is never committed.
  activateGitFixture(repoRoot);
  return repoRoot;
}

/** Puts the real hook and a `src` symlink into `root` and points core.hooksPath at it. */
export function installHook(root, { absolute = false } = {}) {
  const hooksDir = path.join(root, '.githooks');
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.copyFileSync(REAL_HOOK, path.join(hooksDir, 'pre-commit'));
  fs.chmodSync(path.join(hooksDir, 'pre-commit'), 0o755);
  if (!fs.existsSync(path.join(root, 'src'))) fs.symlinkSync(REAL_SRC, path.join(root, 'src'), 'dir');
  git(root, ['config', 'core.hooksPath', absolute ? hooksDir : '.githooks']);
}

export function initRepoWithHook(prefix) {
  const repoRoot = initRepo(prefix);
  installHook(repoRoot);
  return repoRoot;
}

/** A process env for one "session": no inherited session identity or lock descriptor. */
export function sessionEnv(overlay = {}) {
  const env = { ...process.env, ...overlay };
  for (const name of ['FGOS_SESSION_ID', 'CLAUDE_CODE_SESSION_ID', 'FGOS_LOCK_FD', 'FGOS_DISABLE_OPPORTUNISTIC_CHECKS']) {
    if (!(name in overlay)) delete env[name];
  }
  return env;
}

let counter = 0;

/** Stages one new unique file and runs `git commit` as a child; returns the spawnSync result. */
export function commitAsSession(repoRoot, overlay) {
  counter += 1;
  const name = `change-${process.pid}-${counter}.txt`;
  fs.writeFileSync(path.join(repoRoot, name), `change ${counter}\n`);
  git(repoRoot, ['add', name]);
  return spawnSync('git', ['commit', '-q', '-m', `change ${counter}`], { cwd: repoRoot, encoding: 'utf8', env: sessionEnv(overlay) });
}

export function commitCount(repoRoot) {
  return git(repoRoot, ['log', '--oneline']).split('\n').filter(Boolean).length;
}
