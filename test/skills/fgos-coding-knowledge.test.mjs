import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { initStore, rebuild } from '../../src/state/store.mjs';

function setupGitRepoWithStore() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-knowledge-skill-test-'));
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

test('fgos-coding-knowledge skill flow - end to end sequence', async () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  const fgosBin = path.resolve('bin/fgos.mjs');

  // 1. Topic register
  execSync(`node "${fgosBin}" topic register t1 --purpose-slug worktree-reclaim`, { cwd: tmpDir });

  // 2. Reserve doc slot
  const docPath = 'docs/worktree-reclaim/guide.md';
  execSync(`node "${fgosBin}" doc reserve t1 guide ${docPath}`, { cwd: tmpDir });

  // 3. Write & commit file at docPath
  const fullPath = path.join(tmpDir, docPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `---\nframework: diataxis\nmode: how-to\n---\n# Guide\n`, 'utf8');
  execSync(`git add ${docPath} && git commit -m "add guide"`, { cwd: tmpDir, stdio: 'ignore' });

  // 4. Attest
  const attestResult = execSync(`node "${fgosBin}" knowledge attest --doc-path ${docPath} --capture-id tsk-skill-flow`, { cwd: tmpDir, encoding: 'utf8' });
  assert.ok(attestResult.includes('attested'));
  let view = rebuild(fgosDir);
  assert.ok(view.docs['t1:guide'].sourceCaptureIds.includes('tsk-skill-flow'));

  // 5. Mark rendered -> provisional
  execSync(`node "${fgosBin}" doc mark-rendered --topic-id t1 --role guide`, { cwd: tmpDir });
  view = rebuild(fgosDir);
  assert.equal(view.docs['t1:guide'].docLifecycle, 'provisional');

  // 6. Promote -> active
  execSync(`node "${fgosBin}" doc promote t1 guide`, { cwd: tmpDir });
  view = rebuild(fgosDir);
  assert.equal(view.docs['t1:guide'].docLifecycle, 'active');
});
