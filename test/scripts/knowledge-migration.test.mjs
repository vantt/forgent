import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync, execFileSync } from 'node:child_process';
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

test('knowledge-migration - apply demotes an active doc to provisional (design §13.5 rule 6)', () => {
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

    runKnowledgeMigration(tmpDir, { dryRun: false });

    const view = rebuild(fgosDir);
    assert.equal(view.docs['t1:guide'].docLifecycle, 'provisional');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-migration - apply is idempotent: a second run finds nothing left to plan, no throw', () => {
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

    const first = runKnowledgeMigration(tmpDir, { dryRun: false });
    assert.equal(first.appliedCount, 1);

    // The inventory file on disk is UNCHANGED (still names the old oldPath)
    // -- a second run must resolve the doc's REAL current path from the
    // registry, see it already equals the target, and plan/apply nothing.
    const second = runKnowledgeMigration(tmpDir, { dryRun: false });
    assert.equal(second.appliedCount, 0);
    assert.equal(second.totalPlanned, 0);
    assert.equal(second.alreadyMigratedCount, 1);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-migration - apply fails closed (throws, applies nothing) when a planned source file is missing from disk', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'worktree-reclaim' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/how-to/reclaim.md', docLifecycle: 'active' });

    const reportsDir = path.join(tmpDir, 'docs/history/compound-learn-artifact-registry/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const inventoryData = [{ topicId: 't1', role: 'guide', oldPath: 'docs/how-to/reclaim.md', mode: 'how-to' }];
    fs.writeFileSync(path.join(reportsDir, 'inventory-data.json'), JSON.stringify(inventoryData, null, 2), 'utf8');

    // Deliberately never create docs/how-to/reclaim.md on disk.

    assert.throws(() => {
      runKnowledgeMigration(tmpDir, { dryRun: false });
    }, /missing source file: 'docs\/how-to\/reclaim\.md'/);

    const view = rebuild(fgosDir);
    assert.equal(view.docs['t1:guide'].currentPath, 'docs/how-to/reclaim.md', 'a refused apply must not have moved anything');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-migration - apply refuses (no partial apply) when the planned doc is not registered in the registry', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'worktree-reclaim' });
    // Deliberately never register the t1:guide doc itself.

    const reportsDir = path.join(tmpDir, 'docs/history/compound-learn-artifact-registry/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const inventoryData = [{ topicId: 't1', role: 'guide', oldPath: 'docs/how-to/reclaim.md', mode: 'how-to' }];
    fs.writeFileSync(path.join(reportsDir, 'inventory-data.json'), JSON.stringify(inventoryData, null, 2), 'utf8');

    const oldFile = path.join(tmpDir, 'docs/how-to/reclaim.md');
    fs.mkdirSync(path.dirname(oldFile), { recursive: true });
    fs.writeFileSync(oldFile, '# Reclaim\n', 'utf8');
    execSync('git add docs/how-to/reclaim.md && git commit -m "add reclaim"', { cwd: tmpDir, stdio: 'ignore' });

    assert.throws(() => {
      runKnowledgeMigration(tmpDir, { dryRun: false });
    }, /doc 't1:guide' is not registered in the knowledge registry/);

    // The real bug this reproduces: the file must NOT have been moved even
    // though the registry write would have failed -- refusing up front
    // means neither happens, not "file moved, registry write failed."
    const newFile = path.join(tmpDir, 'docs/worktree-reclaim/guide.md');
    assert.equal(fs.existsSync(oldFile), true, 'source file must still be at its old path');
    assert.equal(fs.existsSync(newFile), false, 'target file must not have been created');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-migration - apply refuses when the target path already exists on disk (no overwrite)', () => {
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

    // Something else already occupies the computed target path.
    const collidingFile = path.join(tmpDir, 'docs/worktree-reclaim/guide.md');
    fs.mkdirSync(path.dirname(collidingFile), { recursive: true });
    fs.writeFileSync(collidingFile, '# Already here\n', 'utf8');

    assert.throws(() => {
      runKnowledgeMigration(tmpDir, { dryRun: false });
    }, /target 'docs\/worktree-reclaim\/guide\.md' already exists on disk/);

    assert.equal(fs.readFileSync(collidingFile, 'utf8'), '# Already here\n', 'the colliding file must not have been overwritten');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-migration - apply refuses when projection paths cannot depend on the caller cwd; writes docs/doc-registry.* under repoRoot', () => {
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

    // Run from a DIFFERENT cwd than repoRoot -- projection output must
    // still land under repoRoot, not under process.cwd().
    const otherCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-migration-othercwd-'));
    const originalCwd = process.cwd();
    process.chdir(otherCwd);
    let res;
    try {
      res = runKnowledgeMigration(tmpDir, { dryRun: false });
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(otherCwd, { recursive: true, force: true });
    }

    assert.equal(res.appliedCount, 1);
    assert.ok(fs.existsSync(path.join(tmpDir, 'docs/doc-registry.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'docs/doc-registry.json')));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-migration - dry-run reports conservation errors for duplicate source and duplicate target, apply refuses them', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'shared' });
    registerTopicStore(fgosDir, { topicId: 't2', purposeSlug: 'shared' });
    registerTopicStore(fgosDir, { topicId: 't3', purposeSlug: 'dup-source' });

    const reportsDir = path.join(tmpDir, 'docs/history/compound-learn-artifact-registry/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const inventoryData = [
      // t1:guide and t2:guide both share purposeSlug 'shared' + role 'guide'
      // -- they compute the SAME target, an un-folded duplicate target.
      { topicId: 't1', role: 'guide', oldPath: 'docs/a/guide.md', mode: 'how-to' },
      { topicId: 't2', role: 'guide', oldPath: 'docs/b/guide.md', mode: 'how-to' },
      // t3:guide and t3:pitfall both claim the SAME source file -- a
      // duplicate source assignment.
      { topicId: 't3', role: 'guide', oldPath: 'docs/c/shared-source.md', mode: 'how-to' },
      { topicId: 't3', role: 'pitfall', oldPath: 'docs/c/shared-source.md', mode: 'reference' },
    ];
    fs.writeFileSync(path.join(reportsDir, 'inventory-data.json'), JSON.stringify(inventoryData, null, 2), 'utf8');

    for (const p of ['docs/a/guide.md', 'docs/b/guide.md', 'docs/c/shared-source.md']) {
      const abs = path.join(tmpDir, p);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, `# ${p}\n`, 'utf8');
    }

    const dry = runKnowledgeMigration(tmpDir, { dryRun: true });
    assert.equal(dry.conservationErrors.some((e) => e.includes('duplicate source assignment')), true);
    assert.equal(dry.conservationErrors.some((e) => e.includes('has 2 sources')), true);

    assert.throws(() => {
      runKnowledgeMigration(tmpDir, { dryRun: false });
    }, /conservation violation/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-migration - apply moves a source path containing shell metacharacters correctly (execFileSync, not a shell string)', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    const weirdOldPath = 'docs/how-to/weird"quote;semi$(x).md';
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'worktree-reclaim' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: weirdOldPath, docLifecycle: 'active' });

    const reportsDir = path.join(tmpDir, 'docs/history/compound-learn-artifact-registry/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const inventoryData = [{ topicId: 't1', role: 'guide', oldPath: weirdOldPath, mode: 'how-to' }];
    fs.writeFileSync(path.join(reportsDir, 'inventory-data.json'), JSON.stringify(inventoryData, null, 2), 'utf8');

    const oldFile = path.join(tmpDir, weirdOldPath);
    fs.mkdirSync(path.dirname(oldFile), { recursive: true });
    fs.writeFileSync(oldFile, '# Weird\n', 'utf8');
    execFileSync('git', ['add', '--', weirdOldPath], { cwd: tmpDir, stdio: 'ignore' });
    execFileSync('git', ['commit', '-m', 'add weird'], { cwd: tmpDir, stdio: 'ignore' });

    const res = runKnowledgeMigration(tmpDir, { dryRun: false });
    assert.equal(res.appliedCount, 1);

    const newFile = path.join(tmpDir, 'docs/worktree-reclaim/guide.md');
    assert.ok(fs.existsSync(newFile), 'the shell-hostile source file must have been moved to its real target');
    assert.equal(fs.existsSync(oldFile), false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
