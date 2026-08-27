import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { initStore, rebuild } from '../../src/state/store.mjs';
import { writeSharedConfig } from '../../src/config/shared-config-file.mjs';

function setupGitRepoWithStore({ enforceRegistry = false } = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-attest-test-'));
  execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.name "Test"', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.email "test@example.com"', { cwd: tmpDir, stdio: 'ignore' });

  const readme = path.join(tmpDir, 'README.md');
  fs.writeFileSync(readme, '# Test Repo\n', 'utf8');
  execSync('git add README.md && git commit -m "initial commit"', { cwd: tmpDir, stdio: 'ignore' });

  const fgosDir = path.join(tmpDir, '.fgos');
  initStore(fgosDir);
  if (enforceRegistry) {
    writeSharedConfig(tmpDir, { docRegistry: { enforce: true } });
  }
  return { tmpDir, fgosDir };
}

// docRegistry.enforce gates knowledge attest's own registry-membership/
// alias checks (phase-06-attest-gate.md requirement 1) -- this test exercises
// that STRICT path explicitly, so it turns enforcement on itself.
test('knowledge attest gate - 6 key conditions and regression', async () => {
  const { tmpDir } = setupGitRepoWithStore({ enforceRegistry: true });
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

  // 2. Accepts registered currentPath committed at HEAD, and actually
  // records the capture-id linkage (not just "attested: true" with nothing written).
  const attestOut = execSync(`node "${fgosBin}" knowledge attest --doc-path docs/worktree-reclaim/guide.md --capture-id tsk-attest-gate`, { cwd: tmpDir, encoding: 'utf8' });
  assert.ok(attestOut.includes('attested') || attestOut.includes('guide.md'));
  const viewAfterAttest = rebuild(path.join(tmpDir, '.fgos'));
  assert.ok(viewAfterAttest.docs['t1:guide'].sourceCaptureIds.includes('tsk-attest-gate'));

  // --capture-id is required -- omitting it must refuse, not silently
  // return "attested: true" with nothing recorded.
  err = '';
  try {
    execSync(`node "${fgosBin}" knowledge attest --doc-path docs/worktree-reclaim/guide.md`, { cwd: tmpDir, stdio: 'pipe' });
  } catch (e) {
    err = e.stderr.toString();
  }
  assert.ok(err.includes('--capture-id'), 'Must require --capture-id');

  // 3. Rejects ALIAS path for new tag
  const aliasFile = path.join(tmpDir, 'docs/worktree-reclaim/guide-old.md');
  fs.writeFileSync(aliasFile, '# Old Guide\n', 'utf8');
  execSync('git add docs/worktree-reclaim/guide-old.md && git commit -m "add old guide"', { cwd: tmpDir, stdio: 'ignore' });

  err = '';
  try {
    execSync(`node "${fgosBin}" knowledge attest --doc-path docs/worktree-reclaim/guide-old.md --capture-id tsk-alias-check`, { cwd: tmpDir, stdio: 'pipe' });
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
    execSync(`node "${fgosBin}" knowledge attest --doc-path docs/explanation/new-random.md --capture-id tsk-not-registered-check`, { cwd: tmpDir, stdio: 'pipe' });
  } catch (e) {
    err = e.stderr.toString();
  }
  assert.ok(err.includes('not registered in knowledge registry'), 'Must reject path not in registry');

  // 5. doc.reserve holds path before file exists
  execSync(`node "${fgosBin}" doc reserve t1 concept docs/worktree-reclaim/concept.md`, { cwd: tmpDir });
  const view = rebuild(path.join(tmpDir, '.fgos'));
  assert.equal(view.docs['t1:concept'].docLifecycle, 'reserved');
});

test('knowledge attest - with docRegistry.enforce off (fgos setup\'s own fresh-install default), an unregistered path is skipped, not refused or silently accepted', async () => {
  // enforceRegistry defaults to false here -- the actual shipped default,
  // kept that way so retrospective items are never deadlocked before
  // bootstrap/migration finishes (phase-06-attest-gate.md's own "Risks &
  // rollback"). The git-HEAD check still applies unconditionally.
  const { tmpDir } = setupGitRepoWithStore();
  const fgosBin = path.resolve('bin/fgos.mjs');

  const randomFile = path.join(tmpDir, 'docs/explanation/new-random.md');
  fs.mkdirSync(path.dirname(randomFile), { recursive: true });
  fs.writeFileSync(randomFile, '# Random\n', 'utf8');
  execSync('git add docs/explanation/new-random.md && git commit -m "random"', { cwd: tmpDir, stdio: 'ignore' });

  const out = execSync(`node "${fgosBin}" knowledge attest --doc-path docs/explanation/new-random.md --capture-id tsk-not-enforced`, { cwd: tmpDir, encoding: 'utf8' });
  const parsed = JSON.parse(out).data;
  assert.equal(parsed.attested, false, 'must not silently report "attested: true" with nothing recorded');
  assert.ok(parsed.reason.includes('docRegistry.enforce is off'));

  // A registered doc still attests normally regardless of the flag.
  execSync(`node "${fgosBin}" topic register t1 --purpose-slug worktree-reclaim`, { cwd: tmpDir });
  execSync(`node "${fgosBin}" doc reserve t1 guide docs/worktree-reclaim/guide.md`, { cwd: tmpDir });
  const docFile = path.join(tmpDir, 'docs/worktree-reclaim/guide.md');
  fs.mkdirSync(path.dirname(docFile), { recursive: true });
  fs.writeFileSync(docFile, '# Guide\n', 'utf8');
  execSync('git add docs/worktree-reclaim/guide.md && git commit -m "add guide"', { cwd: tmpDir, stdio: 'ignore' });

  const attestOut = execSync(`node "${fgosBin}" knowledge attest --doc-path docs/worktree-reclaim/guide.md --capture-id tsk-registered`, { cwd: tmpDir, encoding: 'utf8' });
  const parsedAttest = JSON.parse(attestOut).data;
  assert.equal(parsedAttest.attested, true);
  const view = rebuild(path.join(tmpDir, '.fgos'));
  assert.ok(view.docs['t1:guide'].sourceCaptureIds.includes('tsk-registered'));
});
