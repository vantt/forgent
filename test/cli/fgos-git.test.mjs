// `fgos git status|recover` and the recovery step of `fgos init`, as real CLI children over a real interrupted Land.
// Recovery cases (every kind, writer authority, locks) are owned by test/git/recovery.test.mjs; this file proves only the wiring.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createGitLand } from '../../src/git/index.mjs';
import { gitPortOptions } from '../../src/git/inspect.mjs';
import { envelopeData, gitHead, initGitCwdFast, run } from './helpers/fgos-cli-harness.mjs';

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

test('fgos git status reads an interrupted Land without settling it, and fgos git recover settles it once', async () => {
  const cwd = initGitCwdFast();
  await interruptedLand(cwd, 'wired-land');
  const status = data(run(cwd, ['git', 'status', '--json']));
  assert.deepEqual(status.pendingOperations.map(o => [o.operationId, o.kind]), [['wired-land', 'Land']]);
  assert.equal(status.journal.pendingCount, 1);
  assert.equal(data(run(cwd, ['git', 'status', '--json'])).journal.pendingCount, 1, 'status changes nothing');
  const recovered = data(run(cwd, ['git', 'recover', '--json']));
  assert.deepEqual(recovered.recovered, ['wired-land'], recovered.message);
  assert.deepEqual(data(run(cwd, ['git', 'recover', '--json'])).recovered, [], 'a second recover has nothing left');
  assert.equal(data(run(cwd, ['git', 'status', '--json'])).journal.pendingCount, 0);
});

test('fgos init recovers an interrupted Land and answers what it settled', async () => {
  const cwd = initGitCwdFast();
  await interruptedLand(cwd, 'init-land');
  const answer = data(run(cwd, ['init', '--json']));
  assert.deepEqual(answer.gitRecovery.recovered, ['init-land']);
  assert.equal(data(run(cwd, ['git', 'status', '--json'])).journal.pendingCount, 0);
});

test('fgos init in a repository that never journalled a Git operation reports nothing about recovery', () => {
  const answer = data(run(initGitCwdFast(), ['init', '--json']));
  assert.equal(answer.gitRecovery, undefined);
  assert.equal(answer.gitRecoveryWarning, undefined);
});

test('fgos git refuses an unknown sub-verb by name', () => {
  const refused = run(initGitCwdFast(), ['git', 'wipe']);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /unknown git sub-verb "wipe".*status\|recover/);
});
