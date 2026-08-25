import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { initStore, rebuild } from '../../src/state/store.mjs';

function setupGitRepoWithStore() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-attest-test-'));
  execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.name "Test"', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.email "test@example.com"', { cwd: tmpDir, stdio: 'ignore' });

  const readme = path.join(tmpDir, 'README.md');
  fs.writeFileSync(readme, '# Test Repo\n', 'utf8');
  execSync('git add README.md && git commit -m "initial commit"', { cwd: tmpDir, stdio: 'ignore' });

  const fgosDir = path.join(tmpDir, '.fgos');
  initStore(fgosDir);
  return { tmpDir, fgosDir };
}

test('knowledge attest gate - 6 key conditions and regression', async () => {
  const { tmpDir } = setupGitRepoWithStore();
  const fgosBin = path.resolve('bin/fgos.mjs');

  // Register topic and doc slot
  execSync(`node "${fgosBin}" topic register t1 --purpose-slug worktree-reclaim`, { cwd: tmpDir });
  execSync(`node "${fgosBin}" doc reserve t1 guide docs/worktree-reclaim/guide.md`, { cwd: tmpDir });
  execSync(`node "${fgosBin}" doc register t1 guide docs/worktree-reclaim/guide.md --lifecycle provisional --aliases docs/worktree-reclaim/guide-old.md`, { cwd: tmpDir });

  // 1. Rejects registered path if NOT committed at HEAD
  let err = '';
  try {
    execSync(`node "${fgosBin}" knowledge attest --doc-path docs/worktree-reclaim/guide.md`, { cwd: tmpDir, stdio: 'pipe' });
  } catch (e) {
    err = e.stderr.toString();
  }
  assert.ok(err.includes('not committed at git HEAD'), 'Must reject uncommitted path');

  // Commit file at HEAD
  const docFile = path.join(tmpDir, 'docs/worktree-reclaim/guide.md');
  fs.mkdirSync(path.dirname(docFile), { recursive: true });
  fs.writeFileSync(docFile, '# Guide\n', 'utf8');
  execSync('git add docs/worktree-reclaim/guide.md && git commit -m "add guide"', { cwd: tmpDir, stdio: 'ignore' });

  // 2. Accepts registered currentPath committed at HEAD
  const attestOut = execSync(`node "${fgosBin}" knowledge attest --doc-path docs/worktree-reclaim/guide.md`, { cwd: tmpDir, encoding: 'utf8' });
  assert.ok(attestOut.includes('attested') || attestOut.includes('guide.md'));

  // 3. Rejects ALIAS path for new tag
  const aliasFile = path.join(tmpDir, 'docs/worktree-reclaim/guide-old.md');
  fs.writeFileSync(aliasFile, '# Old Guide\n', 'utf8');
  execSync('git add docs/worktree-reclaim/guide-old.md && git commit -m "add old guide"', { cwd: tmpDir, stdio: 'ignore' });

  err = '';
  try {
    execSync(`node "${fgosBin}" knowledge attest --doc-path docs/worktree-reclaim/guide-old.md`, { cwd: tmpDir, stdio: 'pipe' });
  } catch (e) {
    err = e.stderr.toString();
  }
  assert.ok(err.includes('ALIAS'), 'Must reject alias path');

  // 4. Rejects committed path NOT in registry
  const randomFile = path.join(tmpDir, 'docs/explanation/new-random.md');
  fs.mkdirSync(path.dirname(randomFile), { recursive: true });
  fs.writeFileSync(randomFile, '# Random\n', 'utf8');
  execSync('git add docs/explanation/new-random.md && git commit -m "random"', { cwd: tmpDir, stdio: 'ignore' });

  err = '';
  try {
    execSync(`node "${fgosBin}" knowledge attest --doc-path docs/explanation/new-random.md`, { cwd: tmpDir, stdio: 'pipe' });
  } catch (e) {
    err = e.stderr.toString();
  }
  assert.ok(err.includes('not registered in knowledge registry'), 'Must reject path not in registry');

  // 5. doc.reserve holds path before file exists
  execSync(`node "${fgosBin}" doc reserve t1 concept docs/worktree-reclaim/concept.md`, { cwd: tmpDir });
  const view = rebuild(path.join(tmpDir, '.fgos'));
  assert.equal(view.docs['t1:concept'].docLifecycle, 'reserved');
});
