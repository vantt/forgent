import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import {
  resolveRepoRoot,
  fgosDirFromRoot,
  resolveFgosDir,
  resolveLogsDir,
  resolveSkillRoot,
} from '../../src/runner/paths.mjs';

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function initGitRepo(dir) {
  execFileSync('git', ['init', '-q'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'README.md'), '');
  execFileSync('git', ['add', '.'], { cwd: dir });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: dir });
}

test('resolveRepoRoot strict mode returns cwd as-is, never git-resolved', () => {
  const dir = mkTempDir('paths-strict-');
  assert.equal(resolveRepoRoot(dir, { strict: true }), dir);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('resolveRepoRoot strict mode does not require a git repository', () => {
  const dir = mkTempDir('paths-strict-no-git-');
  assert.doesNotThrow(() => resolveRepoRoot(dir, { strict: true }));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('resolveRepoRoot default mode git-resolves the true top-level from a subdirectory', () => {
  const repo = mkTempDir('paths-git-root-');
  initGitRepo(repo);
  const subDir = path.join(repo, 'nested', 'deeper');
  fs.mkdirSync(subDir, { recursive: true });

  const root = resolveRepoRoot(subDir);

  assert.equal(fs.realpathSync(root), fs.realpathSync(repo));
  fs.rmSync(repo, { recursive: true, force: true });
});

test('resolveRepoRoot default mode throws (validation) outside a git repository', () => {
  const dir = mkTempDir('paths-not-a-repo-');
  assert.throws(() => resolveRepoRoot(dir), (err) => err.category === 'validation');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('fgosDirFromRoot joins .fgos onto an already-resolved root', () => {
  const root = '/some/repo/root';
  assert.equal(fgosDirFromRoot(root), path.join(root, '.fgos'));
});

test('fgosDirFromRoot matches session.mjs\'s prior inline computation exactly (path.resolve + join)', () => {
  const root = 'relative/root';
  assert.equal(fgosDirFromRoot(root), path.join(path.resolve(root), '.fgos'));
});

test('resolveFgosDir(cwd, { strict: true }) matches bin/fgos.mjs\'s prior dataDir() computation exactly', () => {
  const cwd = '/an/example/cwd';
  assert.equal(resolveFgosDir(cwd, { strict: true }), path.join(cwd, '.fgos'));
});

test('resolveLogsDir joins logs onto an already-resolved .fgos dir', () => {
  assert.equal(resolveLogsDir('/repo/.fgos'), path.join('/repo/.fgos', 'logs'));
});

test('resolveSkillRoot returns null when CLAUDE_PROJECT_DIR is unset', () => {
  assert.equal(resolveSkillRoot({}), null);
});

test('resolveSkillRoot returns CLAUDE_PROJECT_DIR as-is when FGOS_NESTED_PREFIX is unset (standalone)', () => {
  assert.equal(resolveSkillRoot({ CLAUDE_PROJECT_DIR: '/workshop-root' }), '/workshop-root');
});

test('resolveSkillRoot joins FGOS_NESTED_PREFIX when set, matching the SKILL.md templates\' own ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX} substitution', () => {
  assert.equal(
    resolveSkillRoot({ CLAUDE_PROJECT_DIR: '/workshop-root', FGOS_NESTED_PREFIX: 'repo' }),
    path.join('/workshop-root', 'repo'),
  );
});
