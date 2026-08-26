import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { initStore, rebuild, StoreError } from '../../src/state/store.mjs';

function setupGitRepoWithStore() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-verbs-test-'));
  execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.name "Test"', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.email "test@example.com"', { cwd: tmpDir, stdio: 'ignore' });

  // Create initial commit
  const readme = path.join(tmpDir, 'README.md');
  fs.writeFileSync(readme, '# Test Repo\n', 'utf8');
  execSync('git add README.md && git commit -m "initial commit"', { cwd: tmpDir, stdio: 'ignore' });

  const fgosDir = path.join(tmpDir, '.fgos');
  initStore(fgosDir);
  return { tmpDir, fgosDir };
}

test('knowledge-verbs - topic register, rename, split, merge, retire', async () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    // 1. topic register
    const fgosBin = path.resolve('bin/fgos.mjs');
    execSync(`node "${fgosBin}" topic register t1 --purpose-slug worktree-reclaim --purpose-title "Worktree Reclaim"`, { cwd: tmpDir });
    let view = rebuild(fgosDir);
    assert.equal(view.topics.t1.purposeSlug, 'worktree-reclaim');

    // 2. topic rename
    execSync(`node "${fgosBin}" topic rename t1 --new-purpose-slug worktree-mgmt`, { cwd: tmpDir });
    view = rebuild(fgosDir);
    assert.equal(view.topics.t1.purposeSlug, 'worktree-mgmt');
    assert.equal(view.topics.t1.lineage.renamedFrom, 'worktree-reclaim');

    // 3. topic split
    const intoJson = JSON.stringify([{ topicId: 't2', purposeSlug: 'worktree-reclaim' }, { topicId: 't3', purposeSlug: 'worktree-clean' }]);
    execSync(`node "${fgosBin}" topic split t1 --into '${intoJson}'`, { cwd: tmpDir });
    view = rebuild(fgosDir);
    assert.equal(view.topics.t1.status, 'retired');
    assert.equal(view.topics.t2.status, 'active');
    assert.equal(view.topics.t2.lineage.splitFrom, 't1');

    // 4. topic merge
    execSync(`node "${fgosBin}" topic merge t3 --sources t2`, { cwd: tmpDir });
    view = rebuild(fgosDir);
    assert.equal(view.topics.t2.status, 'retired');
    assert.equal(view.topics.t3.lineage.mergedFrom[0], 't2');

    // 5. topic retire
    execSync(`node "${fgosBin}" topic retire t3`, { cwd: tmpDir });
    view = rebuild(fgosDir);
    assert.equal(view.topics.t3.status, 'retired');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-verbs - doc verbs resolve by (topicId, role) after topic split, not by a stale docId string', async () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    const fgosBin = path.resolve('bin/fgos.mjs');

    execSync(`node "${fgosBin}" topic register t1 --purpose-slug worktree-all`, { cwd: tmpDir });
    // Default docId (no --doc-id): the common case, and exactly what a
    // split leaves stale since docId stays "t1:guide" while topicId moves.
    execSync(`node "${fgosBin}" doc reserve t1 guide docs/worktree-all/guide.md`, { cwd: tmpDir });

    const intoJson = JSON.stringify([{ topicId: 't2', purposeSlug: 'worktree-reclaim', rolesToMove: ['guide'] }]);
    execSync(`node "${fgosBin}" topic split t1 --into '${intoJson}'`, { cwd: tmpDir });

    let view = rebuild(fgosDir);
    assert.equal(view.docs['t1:guide'].topicId, 't2');

    // doc mark-rendered (by new topicId/role) must find and advance the SAME
    // doc, not "doc not found" from reconstructing a "t2:guide" key that was
    // never the real docId.
    execSync(`node "${fgosBin}" doc mark-rendered t2 guide`, { cwd: tmpDir });
    view = rebuild(fgosDir);
    assert.equal(view.docs['t1:guide'].docLifecycle, 'provisional');
    assert.equal(view.docs['t2:guide'], undefined);

    const docFile = path.join(tmpDir, 'docs/worktree-all/guide.md');
    fs.mkdirSync(path.dirname(docFile), { recursive: true });
    fs.writeFileSync(docFile, '# Guide\n', 'utf8');
    execSync('git add docs/worktree-all/guide.md && git commit -m "add guide"', { cwd: tmpDir, stdio: 'ignore' });

    // doc promote (by new topicId/role) must resolve the same pre-split docId.
    execSync(`node "${fgosBin}" doc promote t2 guide`, { cwd: tmpDir });
    view = rebuild(fgosDir);
    assert.equal(view.docs['t1:guide'].docLifecycle, 'active');

    // doc move-path (by new topicId/role) must resolve the same pre-split docId.
    execSync(`node "${fgosBin}" doc move-path t2 guide --new-path docs/worktree-reclaim/guide.md`, { cwd: tmpDir });
    view = rebuild(fgosDir);
    assert.equal(view.docs['t1:guide'].currentPath, 'docs/worktree-reclaim/guide.md');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-verbs - doc lifecycle and promote preconditions', async () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    const fgosBin = path.resolve('bin/fgos.mjs');

    // Register topic
    execSync(`node "${fgosBin}" topic register t1 --purpose-slug worktree-reclaim`, { cwd: tmpDir });

    // 1. doc reserve
    execSync(`node "${fgosBin}" doc reserve t1 guide docs/worktree-reclaim/guide.md`, { cwd: tmpDir });
    let view = rebuild(fgosDir);
    assert.equal(view.docs['t1:guide'].docLifecycle, 'reserved');

    // Attempt promote from reserved -> MUST refuse with remedy
    let errOutput = '';
    try {
      execSync(`node "${fgosBin}" doc promote t1 guide`, { cwd: tmpDir, stdio: 'pipe' });
    } catch (err) {
      errOutput = err.stderr.toString();
    }
    assert.ok(errOutput.includes('Remedy'), 'Error message must contain a remedy');
    assert.ok(errOutput.includes('reserved'), 'Error must mention reserved state');

    // 2. doc register as provisional
    execSync(`node "${fgosBin}" doc register t1 guide docs/worktree-reclaim/guide.md --lifecycle provisional`, { cwd: tmpDir });
    view = rebuild(fgosDir);
    assert.equal(view.docs['t1:guide'].docLifecycle, 'provisional');

    // Attempt promote when file NOT committed at HEAD -> MUST refuse with remedy
    errOutput = '';
    try {
      execSync(`node "${fgosBin}" doc promote t1 guide`, { cwd: tmpDir, stdio: 'pipe' });
    } catch (err) {
      errOutput = err.stderr.toString();
    }
    assert.ok(errOutput.includes('Remedy'), 'Error message must contain a remedy');
    assert.ok(errOutput.includes('not committed at git HEAD'), 'Error must mention git HEAD');

    // Create and commit file at HEAD
    const docFile = path.join(tmpDir, 'docs/worktree-reclaim/guide.md');
    fs.mkdirSync(path.dirname(docFile), { recursive: true });
    fs.writeFileSync(docFile, '# Guide\n', 'utf8');
    execSync('git add docs/worktree-reclaim/guide.md && git commit -m "add guide"', { cwd: tmpDir, stdio: 'ignore' });

    // Now promote -> SUCCESS
    execSync(`node "${fgosBin}" doc promote t1 guide`, { cwd: tmpDir });
    view = rebuild(fgosDir);
    assert.equal(view.docs['t1:guide'].docLifecycle, 'active');

    // 3. Register second provisional doc for same (t1, guide) WHILE first is still
    // active -> MUST refuse immediately, at register time (not deferred to promote):
    // a second non-retired/non-superseded doc for the same (topicId, role) is the
    // sprawl escape hatch fgos-coding-knowledge's docId-per-role design forbids.
    errOutput = '';
    try {
      execSync(`node "${fgosBin}" doc register t1 guide docs/worktree-reclaim/guide2.md --doc-id t1:guide2 --lifecycle provisional`, { cwd: tmpDir, stdio: 'pipe' });
    } catch (err) {
      errOutput = err.stderr.toString();
    }
    assert.ok(errOutput.includes('already occupied'), 'Error must refuse a second doc for the same (topicId, role) while the first is still active');

    // Supersede the active doc to legitimately free the (t1, guide) slot
    execSync(`node "${fgosBin}" doc supersede t1 guide`, { cwd: tmpDir });
    view = rebuild(fgosDir);
    assert.equal(view.docs['t1:guide'].docLifecycle, 'superseded');

    // Now registering the replacement doc succeeds
    execSync(`node "${fgosBin}" doc register t1 guide docs/worktree-reclaim/guide2.md --doc-id t1:guide2 --lifecycle provisional`, { cwd: tmpDir });
    const docFile2 = path.join(tmpDir, 'docs/worktree-reclaim/guide2.md');
    fs.writeFileSync(docFile2, '# Guide 2\n', 'utf8');
    execSync('git add docs/worktree-reclaim/guide2.md && git commit -m "add guide 2"', { cwd: tmpDir, stdio: 'ignore' });

    // Promote the replacement doc -> SUCCESS since t1:guide is superseded, not active
    execSync(`node "${fgosBin}" doc promote --doc-path docs/worktree-reclaim/guide2.md`, { cwd: tmpDir });
    view = rebuild(fgosDir);
    assert.equal(view.docs['t1:guide2'].docLifecycle, 'active');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
