import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { readGitStatus, recoverGitOperations } from '../../src/git/status.mjs';
import { createGitLand } from '../../src/git/index.mjs';
import { gitPortOptions } from '../../src/git/inspect.mjs';
import { fixture as landFixture } from './land-fixture.mjs';
import { envelopeData, gitHead, initGitCwdFast, run } from '../cli/helpers/fgos-cli-harness.mjs';

// boundary: what each fact says, and how a part that cannot be read answers, is owned by the open-incident model in
// packages/git/rust/tests/incidents.rs. This file proves only that the Node callers (`fgos init`, the doctor rows) reach it.
async function withLandJournal(body) {
  const f = landFixture();
  const prior = process.env.FGOS_STATE_ROOT;
  process.env.FGOS_STATE_ROOT = f.options.stateRoot;
  try { return await body(f); } finally { if (prior === undefined) delete process.env.FGOS_STATE_ROOT; else process.env.FGOS_STATE_ROOT = prior; f.close(); }
}

test('the adapter reads a real journal through the addon and recovery settles it', { skip: process.platform === 'win32' }, () => withLandJournal(async (f) => {
  const land = f.port();
  await land.prepare({ operationId: 'finished-one', request: f.request });
  land.close();
  assert.deepEqual(readGitStatus(f.repo, { loaderOptions: f.loader, portOptions: f.options }).pendingOperations.map(o => [o.operationId, o.kind]), [['finished-one', 'Land']]);
  assert.deepEqual(recoverGitOperations(f.repo, { loaderOptions: f.loader, portOptions: f.options }).recovered, ['finished-one']);
  const { retention } = readGitStatus(f.repo, { loaderOptions: f.loader, portOptions: f.options }).journal;
  // The Land chain and the candidate worktree's own chain are both finished and retained.
  assert.equal(retention.retainedChains, 2);
  assert.equal(typeof retention.oldestRetainedAtMs, 'number');
}));

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

// A Land that prepared and stopped: one pending operation, closed by recovery whoever runs it.
async function interruptedLand(cwd, operationId) {
  const target = gitHead(cwd);
  const destination = `refs/heads/${git(cwd, 'symbolic-ref', '--short', 'HEAD')}`;
  git(cwd, 'checkout', '-qb', `source-${operationId}`);
  fs.writeFileSync(`${cwd}/seed.txt`, `incoming ${operationId}\n`);
  git(cwd, 'commit', '-qam', 'source');
  const source = gitHead(cwd);
  git(cwd, 'checkout', '-q', destination.replace('refs/heads/', ''));
  const land = createGitLand(gitPortOptions(cwd, { mutation: true }));
  try { await land.prepare({ operationId, request: { source, target, destination, message: 'consumer land', squash: false, footprint: [], subtree: null, files: [] } }); } finally { land.close(); }
}

const data = (result) => { assert.equal(result.status, 0, result.stderr); return envelopeData(result.stdout); };

test('fgos init recovers an interrupted Land and answers what it settled', { skip: process.platform === 'win32' }, async () => {
  const cwd = initGitCwdFast();
  await interruptedLand(cwd, 'init-land');
  const answer = data(run(cwd, ['init', '--json']));
  assert.deepEqual(answer.gitRecovery.recovered, ['init-land']);
  assert.equal(data(run(cwd, ['git', 'status', '--json'])).journal.pendingCount, 0);
});

test('fgos init in a repository that never journalled a Git operation reports nothing about recovery', { skip: process.platform === 'win32' }, () => {
  const answer = data(run(initGitCwdFast(), ['init', '--json']));
  assert.equal(answer.gitRecovery, undefined);
  assert.equal(answer.gitRecoveryWarning, undefined);
});
