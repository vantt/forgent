import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync, execFileSync } from 'node:child_process';
import { runKnowledgeMigration } from '../../scripts/knowledge-migration.mjs';
import { initStore, registerTopicStore, registerDocStore, retireDocStore, retireTopicStore, rebuild } from '../../src/state/store.mjs';

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

test('knowledge-migration - dry-run reports a duplicate-source conservation error even when both rows are already migrated (moveCount 0)', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    // Two different docs, both already sitting at their real targets --
    // neither produces a plannedMoves entry -- but the inventory itself
    // still names the SAME oldPath for both, a real classifier duplicate-
    // assignment bug that has nothing to do with whether anything is left
    // to move.
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'shared' });
    registerTopicStore(fgosDir, { topicId: 't2', purposeSlug: 'shared' });
    // Both docs carry the shared old path as a recorded alias -- the
    // "already migrated" shortcut also requires the inventory's oldPath to
    // remain traceable (currentPath or an alias), so this test isolates
    // the duplicate-source check specifically, not that one.
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/shared/guide.md', docLifecycle: 'active', aliases: ['docs/dup-already-migrated.md'] });
    registerDocStore(fgosDir, { docId: 't2:pitfall', topicId: 't2', role: 'pitfall', currentPath: 'docs/shared/pitfall.md', docLifecycle: 'active', aliases: ['docs/dup-already-migrated.md'] });
    // The "already migrated" shortcut also requires the target file to be
    // real/reachable on disk (design §13.5 rule 5) -- create both so this
    // test exercises the duplicate-source check in isolation, not that one.
    for (const p of ['docs/shared/guide.md', 'docs/shared/pitfall.md']) {
      const abs = path.join(tmpDir, p);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, `# ${p}\n`, 'utf8');
    }

    const reportsDir = path.join(tmpDir, 'docs/history/compound-learn-artifact-registry/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const inventory = [
      { topicId: 't1', role: 'guide', oldPath: 'docs/dup-already-migrated.md', mode: 'how-to' },
      { topicId: 't2', role: 'pitfall', oldPath: 'docs/dup-already-migrated.md', mode: 'reference' },
    ];
    fs.writeFileSync(path.join(reportsDir, 'inventory-data.json'), JSON.stringify(inventory), 'utf8');

    const dry = runKnowledgeMigration(tmpDir, { dryRun: true });
    assert.equal(dry.moveCount, 0);
    assert.equal(dry.alreadyMigratedCount, 2);
    assert.equal(
      dry.conservationErrors.some((e) => e.includes("duplicate source assignment: 'docs/dup-already-migrated.md' is claimed by 2 inventory rows")),
      true,
      `expected a duplicate-source conservation error, got: ${JSON.stringify(dry.conservationErrors)}`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-migration - refuses (does not silently report success) an unregistered doc whose inventory oldPath already equals the computed target', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'worktree-reclaim' });
    // Deliberately never register the t1:guide doc itself.

    const reportsDir = path.join(tmpDir, 'docs/history/compound-learn-artifact-registry/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    // oldPath already equals what the target path would compute to
    // (docs/worktree-reclaim/guide.md) -- the OLD code's `sourcePath ===
    // targetPath` check fired on this coincidence alone and silently
    // counted it as "already migrated", never checking whether the doc
    // was even registered.
    const inventoryData = [{ topicId: 't1', role: 'guide', oldPath: 'docs/worktree-reclaim/guide.md', mode: 'how-to' }];
    fs.writeFileSync(path.join(reportsDir, 'inventory-data.json'), JSON.stringify(inventoryData, null, 2), 'utf8');

    const oldFile = path.join(tmpDir, 'docs/worktree-reclaim/guide.md');
    fs.mkdirSync(path.dirname(oldFile), { recursive: true });
    fs.writeFileSync(oldFile, '# Guide\n', 'utf8');
    execSync('git add docs/worktree-reclaim/guide.md && git commit -m "add guide"', { cwd: tmpDir, stdio: 'ignore' });

    const dry = runKnowledgeMigration(tmpDir, { dryRun: true });
    assert.equal(dry.alreadyMigratedCount, 0, 'must NOT be silently counted as already-migrated when the doc was never registered');
    assert.equal(dry.moveCount, 1, 'must be planned (and therefore membership-checked) instead of skipped');
    assert.equal(
      dry.conservationErrors.some((e) => e.includes("doc 't1:guide' is not registered in the knowledge registry")),
      true,
      `expected a doc-not-registered conservation error, got: ${JSON.stringify(dry.conservationErrors)}`
    );

    assert.throws(() => {
      runKnowledgeMigration(tmpDir, { dryRun: false });
    }, /doc 't1:guide' is not registered in the knowledge registry/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-migration - refuses (does not report success) a retired doc that already sits at its computed target', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'worktree-reclaim' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/worktree-reclaim/guide.md', docLifecycle: 'active' });
    retireDocStore(fgosDir, { docId: 't1:guide' });

    const reportsDir = path.join(tmpDir, 'docs/history/compound-learn-artifact-registry/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const inventoryData = [{ topicId: 't1', role: 'guide', oldPath: 'docs/worktree-reclaim/guide.md', mode: 'how-to' }];
    fs.writeFileSync(path.join(reportsDir, 'inventory-data.json'), JSON.stringify(inventoryData, null, 2), 'utf8');

    const targetFile = path.join(tmpDir, 'docs/worktree-reclaim/guide.md');
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    fs.writeFileSync(targetFile, '# Guide\n', 'utf8');
    execSync('git add docs/worktree-reclaim/guide.md && git commit -m "add guide"', { cwd: tmpDir, stdio: 'ignore' });

    const dry = runKnowledgeMigration(tmpDir, { dryRun: true });
    assert.equal(dry.alreadyMigratedCount, 0, 'a retired doc must not be silently counted as already-migrated success');
    assert.equal(
      dry.conservationErrors.some((e) => e.includes("doc 't1:guide' is 'retired' (not live)")),
      true,
      `expected a not-live conservation error, got: ${JSON.stringify(dry.conservationErrors)}`
    );

    assert.throws(() => {
      runKnowledgeMigration(tmpDir, { dryRun: false });
    }, /doc 't1:guide' is 'retired' \(not live\)/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-migration - refuses (does not report success) a live doc that already sits at its computed target but the file is missing on disk', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'worktree-reclaim' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/worktree-reclaim/guide.md', docLifecycle: 'active' });
    // Deliberately never create docs/worktree-reclaim/guide.md on disk --
    // the registry claims a currentPath with no real file behind it.

    const reportsDir = path.join(tmpDir, 'docs/history/compound-learn-artifact-registry/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const inventoryData = [{ topicId: 't1', role: 'guide', oldPath: 'docs/worktree-reclaim/guide.md', mode: 'how-to' }];
    fs.writeFileSync(path.join(reportsDir, 'inventory-data.json'), JSON.stringify(inventoryData, null, 2), 'utf8');

    const dry = runKnowledgeMigration(tmpDir, { dryRun: true });
    assert.equal(dry.alreadyMigratedCount, 0, 'a doc whose file is unreachable on disk must not be silently counted as already-migrated success');
    assert.equal(
      dry.conservationErrors.some((e) => e.includes("missing source file: 'docs/worktree-reclaim/guide.md'")),
      true,
      `expected a missing-source-file conservation error, got: ${JSON.stringify(dry.conservationErrors)}`
    );

    assert.throws(() => {
      runKnowledgeMigration(tmpDir, { dryRun: false });
    }, /missing source file/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-migration - dry-run against a completely fresh store (no bootstrap ever run) reports a clean error, not a TypeError', () => {
  const { tmpDir } = setupGitRepoWithStore();
  try {
    // Deliberately never register any topic/doc -- view.topics is only
    // initialized lazily by the reducer, so on a store with zero knowledge
    // events it stays `undefined`. An inventory row referencing it must
    // not crash on an unguarded `view.topics[item.topicId]`.
    const reportsDir = path.join(tmpDir, 'docs/history/compound-learn-artifact-registry/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const inventoryData = [{ topicId: 't1', role: 'guide', oldPath: 'docs/how-to/reclaim.md', mode: 'how-to' }];
    fs.writeFileSync(path.join(reportsDir, 'inventory-data.json'), JSON.stringify(inventoryData, null, 2), 'utf8');

    const oldFile = path.join(tmpDir, 'docs/how-to/reclaim.md');
    fs.mkdirSync(path.dirname(oldFile), { recursive: true });
    fs.writeFileSync(oldFile, '# Reclaim\n', 'utf8');

    const dry = runKnowledgeMigration(tmpDir, { dryRun: true });
    assert.equal(
      dry.conservationErrors.some((e) => e.includes("doc 't1:guide' is not registered in the knowledge registry")),
      true,
      `expected a clean doc-not-registered error, got: ${JSON.stringify(dry.conservationErrors)}`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-migration - refuses "already migrated" when the inventory oldPath is neither the doc\'s currentPath nor a recorded alias', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    // Doc is live, already sitting at its computed target, and the file is
    // real on disk -- every other already-migrated condition holds. But
    // the doc's own alias trail never recorded this inventory row's
    // oldPath (e.g. it reached its target through some path other than
    // the one this row names), so that old path is untraceable.
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'worktree-reclaim' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/worktree-reclaim/guide.md', docLifecycle: 'active' });

    const reportsDir = path.join(tmpDir, 'docs/history/compound-learn-artifact-registry/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const inventoryData = [{ topicId: 't1', role: 'guide', oldPath: 'docs/how-to/never-recorded.md', mode: 'how-to' }];
    fs.writeFileSync(path.join(reportsDir, 'inventory-data.json'), JSON.stringify(inventoryData, null, 2), 'utf8');

    const targetFile = path.join(tmpDir, 'docs/worktree-reclaim/guide.md');
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    fs.writeFileSync(targetFile, '# Guide\n', 'utf8');

    const dry = runKnowledgeMigration(tmpDir, { dryRun: true });
    assert.equal(dry.alreadyMigratedCount, 0, 'an untraceable oldPath must not be silently counted as already-migrated success');
    assert.equal(
      dry.conservationErrors.some((e) => e.includes("doc 't1:guide' is already at its target") && e.includes("'docs/how-to/never-recorded.md' is neither its currentPath nor a recorded alias")),
      true,
      `expected an untraceable-oldPath conservation error, got: ${JSON.stringify(dry.conservationErrors)}`
    );

    assert.throws(() => {
      runKnowledgeMigration(tmpDir, { dryRun: false });
    }, /is neither its currentPath nor a recorded alias/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-migration - a frontmatter-write failure leaves the source file and the registry untouched (no partial apply)', () => {
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

    // Frontmatter is now updated on the SOURCE file before any physical
    // move or registry event -- a read-only source file makes that write
    // throw EACCES at exactly the point the real bug report reproduced.
    fs.chmodSync(oldFile, 0o444);
    try {
      assert.throws(() => {
        runKnowledgeMigration(tmpDir, { dryRun: false });
      }, /EACCES/);

      const newFile = path.join(tmpDir, 'docs/worktree-reclaim/guide.md');
      assert.equal(fs.existsSync(oldFile), true, 'source file must still exist at its old path');
      assert.equal(fs.existsSync(newFile), false, 'nothing must have moved to the target path');

      const view = rebuild(fgosDir);
      assert.equal(view.docs['t1:guide'].currentPath, 'docs/how-to/reclaim.md', 'registry must not claim a move that never completed');
    } finally {
      fs.chmodSync(oldFile, 0o644);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-migration - a locked git index (both "git mv" and the fallback "git add" fail) throws instead of reporting silent success', () => {
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

    // A stale/held index.lock makes BOTH "git mv" (the primary attempt)
    // and the fallback "git add" fail -- the exact repro shape (the
    // fallback path used to swallow this and report success anyway).
    const lockFile = path.join(tmpDir, '.git', 'index.lock');
    fs.writeFileSync(lockFile, '', 'utf8');
    try {
      assert.throws(() => {
        runKnowledgeMigration(tmpDir, { dryRun: false });
      }, /git add.*failed to stage it/);

      const view = rebuild(fgosDir);
      assert.equal(view.docs['t1:guide'].currentPath, 'docs/how-to/reclaim.md', 'the registry must NOT claim the move happened when git never tracked it');
      assert.equal(fs.existsSync(oldFile), true, 'the rename must have been rolled back -- the source file must be exactly where it started');
      assert.equal(fs.existsSync(path.join(tmpDir, 'docs/worktree-reclaim/guide.md')), false, 'nothing must be left sitting at the target path either');
      assert.equal(fs.readFileSync(oldFile, 'utf8'), '# Reclaim\n', 'content must be rolled back too -- the frontmatter transform applied before the move attempt must not survive a failed apply as an uncommitted doc edit');
    } finally {
      fs.rmSync(lockFile, { force: true });
    }

    // The whole point of rolling the rename back: once the underlying git
    // problem is gone, a plain rerun must work cleanly -- no leftover
    // "missing source file" / "target already exists" deadlock.
    const retryDry = runKnowledgeMigration(tmpDir, { dryRun: true });
    assert.deepEqual(retryDry.conservationErrors, [], `rerun after clearing the lock must be clean, got: ${JSON.stringify(retryDry.conservationErrors)}`);
    const retryApply = runKnowledgeMigration(tmpDir, { dryRun: false });
    assert.equal(retryApply.appliedCount, 1);
    const finalView = rebuild(fgosDir);
    assert.equal(finalView.docs['t1:guide'].currentPath, 'docs/worktree-reclaim/guide.md');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-migration - refuses a planned move for an ACTIVE doc under a retired topic before any file mutation', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'worktree-reclaim' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/how-to/reclaim.md', docLifecycle: 'active' });
    // topic.retire never force-retires its docs -- the doc is left active
    // under a now-retired topic, exactly the drift shape a classifier
    // still naming this row as a live source represents.
    retireTopicStore(fgosDir, { topicId: 't1' });

    const reportsDir = path.join(tmpDir, 'docs/history/compound-learn-artifact-registry/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const inventoryData = [{ topicId: 't1', role: 'guide', oldPath: 'docs/how-to/reclaim.md', mode: 'how-to' }];
    fs.writeFileSync(path.join(reportsDir, 'inventory-data.json'), JSON.stringify(inventoryData, null, 2), 'utf8');

    const oldFile = path.join(tmpDir, 'docs/how-to/reclaim.md');
    fs.mkdirSync(path.dirname(oldFile), { recursive: true });
    fs.writeFileSync(oldFile, '# Reclaim\n', 'utf8');
    execSync('git add docs/how-to/reclaim.md && git commit -m "add reclaim"', { cwd: tmpDir, stdio: 'ignore' });

    const dry = runKnowledgeMigration(tmpDir, { dryRun: true });
    assert.equal(
      dry.conservationErrors.some((e) => e.includes("doc 't1:guide' is under topic 't1', which is 'retired' (not active)")),
      true,
      `expected a non-active-topic conservation error, got: ${JSON.stringify(dry.conservationErrors)}`
    );

    assert.throws(() => {
      runKnowledgeMigration(tmpDir, { dryRun: false });
    }, /is under topic 't1', which is 'retired' \(not active\)/);

    // Nothing must have moved before the refusal -- an active doc under a
    // retired topic used to move the file and record doc.path-move, only
    // THEN throw on doc.demote (assertTopicWritable), leaving the file
    // relocated with no demote applied.
    assert.equal(fs.existsSync(oldFile), true);
    assert.equal(fs.existsSync(path.join(tmpDir, 'docs/worktree-reclaim/guide.md')), false);
    const view = rebuild(fgosDir);
    assert.equal(view.docs['t1:guide'].currentPath, 'docs/how-to/reclaim.md');
    assert.equal(view.docs['t1:guide'].docLifecycle, 'active');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-migration - refuses a planned move for a PROVISIONAL doc under a retired topic (no demote involved to catch it otherwise)', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'worktree-reclaim' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/how-to/reclaim.md', docLifecycle: 'provisional' });
    retireTopicStore(fgosDir, { topicId: 't1' });

    const reportsDir = path.join(tmpDir, 'docs/history/compound-learn-artifact-registry/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const inventoryData = [{ topicId: 't1', role: 'guide', oldPath: 'docs/how-to/reclaim.md', mode: 'how-to' }];
    fs.writeFileSync(path.join(reportsDir, 'inventory-data.json'), JSON.stringify(inventoryData, null, 2), 'utf8');

    const oldFile = path.join(tmpDir, 'docs/how-to/reclaim.md');
    fs.mkdirSync(path.dirname(oldFile), { recursive: true });
    fs.writeFileSync(oldFile, '# Reclaim\n', 'utf8');
    execSync('git add docs/how-to/reclaim.md && git commit -m "add reclaim"', { cwd: tmpDir, stdio: 'ignore' });

    // Without the topic check, a provisional doc (no doc.demote call, so
    // nothing downstream would ever catch this) would complete the move
    // "successfully" under a retired topic.
    assert.throws(() => {
      runKnowledgeMigration(tmpDir, { dryRun: false });
    }, /is under topic 't1', which is 'retired' \(not active\)/);

    assert.equal(fs.existsSync(oldFile), true);
    const view = rebuild(fgosDir);
    assert.equal(view.docs['t1:guide'].currentPath, 'docs/how-to/reclaim.md');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
