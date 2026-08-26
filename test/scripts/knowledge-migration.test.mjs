import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { runKnowledgeMigration } from '../../scripts/knowledge-migration.mjs';
import { initStore, registerTopicStore, registerDocStore, rebuild } from '../../src/state/store.mjs';

function setupGitRepoWithStore() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-migration-test-'));
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

test('knowledge-migration - dry-run does not mutate disk or store', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'worktree-reclaim' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/how-to/reclaim.md', docLifecycle: 'active' });

    const reportsDir = path.join(tmpDir, 'docs/history/compound-learn-artifact-registry/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const inventoryData = [{ topicId: 't1', role: 'guide', oldPath: 'docs/how-to/reclaim.md', mode: 'how-to' }];
    fs.writeFileSync(path.join(reportsDir, 'inventory-data.json'), JSON.stringify(inventoryData, null, 2), 'utf8');

    const oldFile = path.join(tmpDir, 'docs/how-to/reclaim.md');
    fs.mkdirSync(path.dirname(oldFile), { recursive: true });
    fs.writeFileSync(oldFile, '# Reclaim\n', 'utf8');

    const res = runKnowledgeMigration(tmpDir, { dryRun: true });
    assert.equal(res.dryRun, true);
    assert.equal(res.moveCount, 1);
    assert.ok(fs.existsSync(oldFile), 'Old file must still exist after dry-run');

    const view = rebuild(fgosDir);
    assert.equal(view.docs['t1:guide'].currentPath, 'docs/how-to/reclaim.md');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-migration - apply moves file and updates store currentPath and aliases', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'worktree-reclaim' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/how-to/reclaim.md', docLifecycle: 'active' });

    const reportsDir = path.join(tmpDir, 'docs/history/compound-learn-artifact-registry/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const inventoryData = [{ topicId: 't1', role: 'guide', oldPath: 'docs/how-to/reclaim.md', mode: 'how-to' }];
    fs.writeFileSync(path.join(reportsDir, 'inventory-data.json'), JSON.stringify(inventoryData, null, 2), 'utf8');

    const oldFile = path.join(tmpDir, 'docs/how-to/reclaim.md');
    fs.mkdirSync(path.dirname(oldFile), { recursive: true });
    fs.writeFileSync(oldFile, '# Reclaim\n', 'utf8');
    execSync('git add docs/how-to/reclaim.md && git commit -m "add reclaim"', { cwd: tmpDir, stdio: 'ignore' });

    const res = runKnowledgeMigration(tmpDir, { dryRun: false });
    assert.equal(res.dryRun, false);
    assert.equal(res.appliedCount, 1);

    const newFile = path.join(tmpDir, 'docs/worktree-reclaim/guide.md');
    assert.ok(fs.existsSync(newFile), 'New file must exist after apply');

    const view = rebuild(fgosDir);
    assert.equal(view.docs['t1:guide'].currentPath, 'docs/worktree-reclaim/guide.md');
    assert.ok(view.docs['t1:guide'].aliases.includes('docs/how-to/reclaim.md'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
