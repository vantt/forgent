import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { runKnowledgeCanary } from '../../scripts/knowledge-canary.mjs';
import { initStore } from '../../src/state/store.mjs';

function setupGitRepoWithStore() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-canary-test-'));
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

test('knowledge-canary - canary execution GREEN end to end', () => {
  const { tmpDir } = setupGitRepoWithStore();
  try {
    const res = runKnowledgeCanary(tmpDir);
    assert.equal(res.success, true);
    assert.equal(res.docId, 't1:guide');
    assert.equal(res.currentPath, 'docs/worktree-reclaim/guide.md');

    // Verify projections created
    assert.ok(fs.existsSync(path.join(tmpDir, 'docs/doc-registry.json')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'docs/doc-registry.md')));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-canary - finds the real bin/fgos.mjs regardless of the calling process\'s own cwd', () => {
  const { tmpDir } = setupGitRepoWithStore();
  const otherCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-canary-othercwd-'));
  const originalCwd = process.cwd();
  try {
    process.chdir(otherCwd);
    const res = runKnowledgeCanary(tmpDir);
    assert.equal(res.success, true);
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(otherCwd, { recursive: true, force: true });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
