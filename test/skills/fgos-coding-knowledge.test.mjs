import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { initializeWorkRepository } from '../helpers/work-store-release.mjs';
import { initStore, rebuild } from '../../src/state/store.mjs';

function setupGitRepoWithStore() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-knowledge-skill-test-'));
  // The Work store opens only in a repository the Event Store can use: a machine id and the activation fence.
  initializeWorkRepository(tmpDir);

  const readme = path.join(tmpDir, 'README.md');
  fs.writeFileSync(readme, '# Test Repo\n', 'utf8');
  execSync('git add README.md && git commit -m "initial commit"', { cwd: tmpDir, stdio: 'ignore' });

  const fgosDir = path.join(tmpDir, '.fgos');
  initStore(fgosDir);
  return { tmpDir, fgosDir };
}

// The skill's default path: a unit that already carries the claim gains one
// evidence line and an attestation; the writer opens no topic and reserves no
// slot. Reserve, mark-rendered and promote keep their own proofs in
// test/cli/knowledge-verbs.test.mjs; here they only build the existing unit.
test('fgos-coding-knowledge grows an existing unit with an evidence line and attests it, without opening a topic or slot', async () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  const fgosBin = path.resolve('bin/fgos.mjs');

  // The existing unit that already carries the claim.
  const docPath = 'docs/worktree-reclaim/guide.md';
  execSync(`node "${fgosBin}" topic register t1 --purpose-slug worktree-reclaim`, { cwd: tmpDir });
  execSync(`node "${fgosBin}" doc reserve t1 guide ${docPath}`, { cwd: tmpDir });
  const fullPath = path.join(tmpDir, docPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, '---\nframework: diataxis\nmode: how-to\n---\n# Guide\n\nReclaim a worktree only after its run has exited.\n', 'utf8');
  execSync(`git add ${docPath} && git commit -m "add guide"`, { cwd: tmpDir, stdio: 'ignore' });
  const before = rebuild(fgosDir);
  const topicsBefore = Object.keys(before.topics).length;
  const docsBefore = Object.keys(before.docs).length;

  // grow: append the evidence section, commit by pathspec, then attest.
  fs.appendFileSync(fullPath, '\n## Evidence\n\n- 2026-11-13 tsk-skill-flow: reclaim refused while the run was still alive.\n', 'utf8');
  execSync(`git commit -m "docs(knowledge): guide gains evidence" -- ${docPath}`, { cwd: tmpDir, stdio: 'ignore' });
  const attestResult = execSync(`node "${fgosBin}" knowledge attest --doc-path ${docPath} --capture-id tsk-skill-flow`, { cwd: tmpDir, encoding: 'utf8' });
  assert.ok(attestResult.includes('attested'));

  const view = rebuild(fgosDir);
  assert.ok(view.docs['t1:guide'].sourceCaptureIds.includes('tsk-skill-flow'));
  assert.equal(Object.keys(view.topics).length, topicsBefore);
  assert.equal(Object.keys(view.docs).length, docsBefore);
  const committed = execSync(`git show HEAD:${docPath}`, { cwd: tmpDir, encoding: 'utf8' });
  assert.match(committed, /^## Evidence\n\n- 2026-11-13 tsk-skill-flow: /m);
});
