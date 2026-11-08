import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readGitStatus, recoverGitOperations } from '../../src/git/status.mjs';
import { fixture as landFixture } from './land-fixture.mjs';
import { ensureGitAddon, root as addonRoot } from '../../scripts/git-addon.mjs';

// boundary: the doctor incidents row counts these same facts; this file owns what each fact says.
test('git status reads native locks and a merge in progress from the repository, and a clean one reads empty', { skip: process.platform === 'win32' }, () => {
  const built = ensureGitAddon();
  const loaderOptions = { descriptor: { manifest: JSON.parse(fs.readFileSync(built.manifest)), releaseRoot: addonRoot } };
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-git-status-'));
  try {
    execFileSync('git', ['init', '-q', repo], { stdio: 'ignore' });
    execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'seed'], { cwd: repo, stdio: 'ignore' });
    const clean = readGitStatus(repo, { loaderOptions });
    assert.equal(clean.mergeInProgress, null);
    assert.deepEqual(clean.nativeLocks, []);
    assert.deepEqual(clean.pendingOperations, []);
    fs.writeFileSync(path.join(repo, '.git', 'index.lock'), '');
    const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
    fs.writeFileSync(path.join(repo, '.git', 'MERGE_HEAD'), `${head}\n`);
    const open = readGitStatus(repo, { loaderOptions });
    assert.equal(open.mergeInProgress, head);
    assert.equal(open.nativeLocks.length, 1);
  } finally { fs.rmSync(repo, { recursive: true, force: true }); }
});

async function withLandJournal(body) {
  const f = landFixture();
  const prior = process.env.FGOS_STATE_ROOT;
  process.env.FGOS_STATE_ROOT = f.options.stateRoot;
  try { return await body(f); } finally { if (prior === undefined) delete process.env.FGOS_STATE_ROOT; else process.env.FGOS_STATE_ROOT = prior; f.close(); }
}

test('a part git status cannot read answers an error in place and hides no other part', { skip: process.platform === 'win32' }, () => withLandJournal(async (f) => {
  const land = f.port();
  await land.prepare({ operationId: 'pending-only', request: f.request });
  land.close();
  const broken = { ...f.options, repoPath: path.join(f.temp, 'no-such-repo') };
  const status = readGitStatus(f.repo, { loaderOptions: f.loader, portOptions: broken });
  assert.equal(status.journal.pendingCount, 1);
  assert.equal(typeof status.retainedLand.error, 'string');
}));

test('git status reports the retained finished operations of a real journal with their count and age', { skip: process.platform === 'win32' }, () => withLandJournal(async (f) => {
  const land = f.port();
  await land.prepare({ operationId: 'finished-one', request: f.request });
  land.close();
  recoverGitOperations(f.repo, { loaderOptions: f.loader, portOptions: f.options });
  const { retention } = readGitStatus(f.repo, { loaderOptions: f.loader, portOptions: f.options }).journal;
  // The Land chain and the candidate worktree's own chain are both finished and retained.
  assert.equal(retention.retainedChains, 2);
  assert.equal(typeof retention.oldestRetainedAtMs, 'number');
}));
