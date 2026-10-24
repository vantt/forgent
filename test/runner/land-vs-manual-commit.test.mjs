import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import { activateGitFixture } from './worktree-native-fixture.helper.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { landRunnerItem } from '../../src/runner/merge.mjs';
import { retargetMember, resolveIntegrationBranch } from '../../src/runner/promote-engine.mjs';
import { withMainCheckout } from '../../src/runner/repo-locks.mjs';
import { createLockScope, probe } from '../../src/holder-lock/index.mjs';
import { git, mkTempDir, initRepo, installHook, sessionEnv, commitCount, HOOK_TEST_SKIP } from '../helpers/main-checkout-hook-repo.mjs';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';

// The land step of a root-into-main merge and everything that can touch the
// main checkout around it, on real git in disposable repos.

const skip = HOOK_TEST_SKIP;
const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

function addBranch(repoRoot, branch, filename, content) {
  git(repoRoot, ['checkout', '-q', '-b', branch]);
  fs.writeFileSync(path.join(repoRoot, filename), content);
  git(repoRoot, ['add', filename]);
  git(repoRoot, ['commit', '-q', '-m', `on ${branch}`]);
  git(repoRoot, ['checkout', '-q', 'main']);
}

function mainTip(repoRoot) {
  return git(repoRoot, ['rev-parse', 'main']).trim();
}

const item = (id, verify = 'true') => ({ id, verify });

test('two lands into one target exclude each other under the slot, and the second merges onto the first one\'s result', { skip }, async () => {
  const repoRoot = initRepo();
  activateGitFixture(repoRoot);
  addBranch(repoRoot, 'fgw/item-a', 'a.txt', 'a\n');
  addBranch(repoRoot, 'fgw/item-b', 'b.txt', 'b\n');
  const log = path.join(repoRoot, '.git', 'verify-order.log').replaceAll('\\', '/');
  // Each verify logs its own start and end: the second must not start before the first ended.
  const verify = (id) => `node -e "const fs=require('fs');fs.appendFileSync('${log}','start ${id}\\n');setTimeout(()=>{fs.appendFileSync('${log}','end ${id}\\n')},600)"`;

  const [a, b] = await Promise.all([
    landRunnerItem(repoRoot, item('item-a', verify('a')), { branch: 'fgw/item-a', timeoutMs: 60000, lockWaitMs: 30000 }),
    landRunnerItem(repoRoot, item('item-b', verify('b')), { branch: 'fgw/item-b', timeoutMs: 60000, lockWaitMs: 30000 }),
  ]);

  assert.equal(a.outcome, 'merged', JSON.stringify(a));
  assert.equal(b.outcome, 'merged', JSON.stringify(b));
  const order = fs.readFileSync(log, 'utf8').trim().split('\n').map((line) => line.split(' ')[0]);
  assert.deepEqual(order, ['start', 'end', 'start', 'end'], 'the verify runs of the two merges never overlap');
  const files = git(repoRoot, ['ls-tree', '--name-only', 'main']);
  assert.match(files, /a\.txt/);
  assert.match(files, /b\.txt/);
  const merges = git(repoRoot, ['log', '--merges', '--format=%s', 'main']).trim().split('\n');
  assert.equal(merges.length, 2, 'two merge commits, one per land');
  assert.equal(probe('merge-slot', { fgosDir: path.join(repoRoot, '.fgos'), ref: 'main' }).result, 'free');
  assert.equal(probe('main-checkout', { fgosDir: path.join(repoRoot, '.fgos') }).result, 'free');
});

test('a land that waits while another holder has main merges once main is released, and loses nothing', { skip }, async () => {
  const repoRoot = initRepo();
  activateGitFixture(repoRoot);
  addBranch(repoRoot, 'fgw/item-a', 'a.txt', 'a\n');
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  activateGitFixture(repoRoot);

  let land;
  await withMainCheckout(createLockScope('holder'), 'hold', async () => {
    land = landRunnerItem(repoRoot, item('item-a'), { branch: 'fgw/item-a', timeoutMs: 60000, lockWaitMs: 30000 });
    // Long enough for the land to finish its merge and verify and start waiting for main.
    await sleep(1500);
  }, { fgosDir });

  const result = await land;
  assert.equal(result.outcome, 'merged', JSON.stringify(result));
  assert.equal(result.receipt.localEffect.publishedOid, mainTip(repoRoot), 'the land published onto the trunk');
  assert.match(git(repoRoot, ['show', 'main:a.txt']), /^a$/m, 'the branch content landed');
  assert.equal(git(repoRoot, ['status', '--porcelain', '--untracked-files=no']).trim(), '', 'the index and tree are consistent, nothing half-applied');
  assert.equal(fs.existsSync(path.join(repoRoot, '.git', 'index.lock')), false);
});

test('with the hook, the land\'s ref update runs no repository hook, a manual commit attempted while main is held is refused, and the land completes with no manual commit', { skip }, async () => {
  const repoRoot = initRepo();
  activateGitFixture(repoRoot);
  addBranch(repoRoot, 'fgw/item-a', 'a.txt', 'a\n');
  installHook(repoRoot);
  const attemptLog = path.join(mkTempDir('fgos-land-attempt-'), 'attempt.log');
  // A real git hook that would fire while a plain `git update-ref` runs, where
  // a concurrent manual commit would ride inside the land. Land's publication
  // runs Git with repository hooks disabled, so it never fires.
  const refHook = path.join(repoRoot, '.githooks', 'reference-transaction');
  fs.writeFileSync(refHook, `#!/bin/sh
[ "$1" = "prepared" ] || exit 0
grep -q ' refs/heads/main$' || exit 0
[ -e '${attemptLog}' ] && exit 0
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE FGOS_LOCK_FD
cd '${repoRoot}' || exit 0
echo manual > manual.txt
git add manual.txt >/dev/null 2>&1
git -c user.name=Manual -c user.email=m@example.com commit -q -m "manual commit during land" >'${attemptLog}' 2>&1
echo "exit=$?" >> '${attemptLog}'
git reset -q manual.txt >/dev/null 2>&1
exit 0
`);
  fs.chmodSync(refHook, 0o755);
  const before = commitCount(repoRoot);

  const result = await landRunnerItem(repoRoot, item('item-a'), { branch: 'fgw/item-a', timeoutMs: 60000, lockWaitMs: 30000, ownFileSet: new Set(['a.txt']) });

  assert.equal(result.outcome, 'merged', JSON.stringify(result));
  assert.equal(fs.existsSync(attemptLog), false, 'the land ran the reference-transaction hook');
  // The land publishes holding main; a manual commit under that same lock is refused.
  await withMainCheckout(createLockScope('land'), 'land', async () => {
    fs.writeFileSync(path.join(repoRoot, 'manual.txt'), 'manual\n');
    git(repoRoot, ['add', 'manual.txt']);
    const res = spawnSync('git', ['-c', 'user.name=Manual', '-c', 'user.email=m@example.com', 'commit', '-q', '-m', 'manual commit during land'], { cwd: repoRoot, encoding: 'utf8', env: sessionEnv() });
    const attempt = `${res.stdout}${res.stderr}exit=${res.status}`;
    assert.doesNotMatch(attempt, /exit=0/, `the manual commit must be refused while the land holds main:\n${attempt}`);
    assert.match(attempt, /fgOS is writing the main checkout/);
    git(repoRoot, ['reset', '-q', 'manual.txt']);
  }, { fgosDir: path.join(repoRoot, '.fgos') });
  assert.doesNotMatch(git(repoRoot, ['log', '--format=%s', 'main']), /manual commit during land/);
  assert.equal(commitCount(repoRoot), before + 2, 'the merged branch commit and the merge commit, nothing else');
});

test('without the hook (raw git outside fgOS), a manual commit that slips in before the land is detected by the CAS: the land reports it and the commit survives', { skip }, async () => {
  const repoRoot = initRepo();
  activateGitFixture(repoRoot);
  addBranch(repoRoot, 'fgw/item-a', 'a.txt', 'a\n');
  const fgosDir = path.join(repoRoot, '.fgos');
  const tipBefore = mainTip(repoRoot);

  let land;
  await withMainCheckout(createLockScope('holder'), 'hold', async () => {
    land = landRunnerItem(repoRoot, item('item-a'), { branch: 'fgw/item-a', timeoutMs: 60000, lockWaitMs: 30000 });
    await sleep(1500);
    fs.writeFileSync(path.join(repoRoot, 'manual.txt'), 'manual\n');
    git(repoRoot, ['add', 'manual.txt']);
    const res = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'user.name=Manual', '-c', 'user.email=m@example.com', 'commit', '-q', '-m', 'manual commit without hook'], { cwd: repoRoot, encoding: 'utf8', env: sessionEnv() });
    assert.equal(res.status, 0, res.stderr);
  }, { fgosDir });

  await assert.rejects(land, (err) => {
    assert.equal(JSON.parse(err.message).cause, 'land-target-changed', err.message);
    return true;
  });
  assert.match(git(repoRoot, ['log', '--format=%s', `${tipBefore}..main`]), /manual commit without hook/);
  assert.doesNotMatch(git(repoRoot, ['log', '--format=%s', 'main']), /^merge fgw\/item-a/m, 'the merge commit never landed on the moved trunk');
  assert.equal(git(repoRoot, ['show', 'main:manual.txt']), 'manual\n', 'the manual commit is not lost');
});

test('a file staged in main outside the item\'s own file set does not refuse the land: the trunk moves, the staged file is kept staged and the checkout reports pending', { skip }, async () => {
  const repoRoot = initRepo();
  activateGitFixture(repoRoot);
  addBranch(repoRoot, 'fgw/item-a', 'a.txt', 'a\n');
  fs.writeFileSync(path.join(repoRoot, 'staged.txt'), 'staged by a person\n');
  git(repoRoot, ['add', 'staged.txt']);
  const tipBefore = mainTip(repoRoot);

  const result = await landRunnerItem(repoRoot, item('item-a'), { branch: 'fgw/item-a', timeoutMs: 60000, lockWaitMs: 30000, ownFileSet: new Set(['a.txt']) });

  assert.equal(result.outcome, 'merged', JSON.stringify(result));
  assert.equal(result.receipt.checkout, 'pending', 'checkout-lagging: the staged bytes are preserved, not synced over');
  assert.notEqual(mainTip(repoRoot), tipBefore, 'the trunk moved');
  assert.match(git(repoRoot, ['ls-tree', '--name-only', 'main']), /a\.txt/);
  assert.match(git(repoRoot, ['diff', '--cached', '--name-only']), /staged\.txt/, 'still staged');
  assert.equal(fs.readFileSync(path.join(repoRoot, 'staged.txt'), 'utf8'), 'staged by a person\n');
});

test('staged .fgos event files in main are fgOS\'s own: they survive the land content-intact and staged, they do not refuse it', { skip }, async () => {
  const repoRoot = initRepo();
  activateGitFixture(repoRoot);
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), '{"seq":1}\n');
  git(repoRoot, ['add', '-f', '.fgos/events.jsonl']);
  git(repoRoot, ['commit', '-q', '-m', 'track events']);
  addBranch(repoRoot, 'fgw/item-a', 'a.txt', 'a\n');
  fs.appendFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), '{"seq":2}\n');
  fs.mkdirSync(path.join(repoRoot, '.fgos', 'events'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'events', 'w1.jsonl'), '{"seq":3}\n');
  git(repoRoot, ['add', '-f', '.fgos/events.jsonl', '.fgos/events/w1.jsonl']);

  const result = await landRunnerItem(repoRoot, item('item-a'), { branch: 'fgw/item-a', timeoutMs: 60000, lockWaitMs: 30000, ownFileSet: new Set(['a.txt']) });

  assert.equal(result.outcome, 'merged', JSON.stringify(result));
  assert.equal(fs.readFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), 'utf8'), '{"seq":1}\n{"seq":2}\n', 'the staged edit is not reset to HEAD');
  assert.equal(fs.readFileSync(path.join(repoRoot, '.fgos', 'events', 'w1.jsonl'), 'utf8'), '{"seq":3}\n', 'the staged new shard is not deleted');
  const stagedNow = git(repoRoot, ['diff', '--cached', '--name-only']);
  assert.match(stagedNow, /\.fgos\/events\.jsonl/);
  assert.match(stagedNow, /\.fgos\/events\/w1\.jsonl/);
});

test('an unstaged edit on an unrelated path survives the land untouched', { skip }, async () => {
  const repoRoot = initRepo();
  activateGitFixture(repoRoot);
  addBranch(repoRoot, 'fgw/item-a', 'a.txt', 'a\n');
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'edited by a person, not staged\n');

  const result = await landRunnerItem(repoRoot, item('item-a'), { branch: 'fgw/item-a', timeoutMs: 60000, lockWaitMs: 30000, ownFileSet: new Set(['a.txt']) });

  assert.equal(result.outcome, 'merged', JSON.stringify(result));
  assert.equal(fs.readFileSync(path.join(repoRoot, 'seed.txt'), 'utf8'), 'edited by a person, not staged\n');
  assert.equal(fs.readFileSync(path.join(repoRoot, 'a.txt'), 'utf8'), 'a\n', 'the working tree synced to the merge');
});

test('promoting a member does not hold the main mutex during verify: another withMainCheckout gets in while verify runs', { skip }, async () => {
  const repoRoot = initRepo();
  activateGitFixture(repoRoot);
  addBranch(repoRoot, 'fgw/member-a', 'member-a.txt', 'member a work\n');
  resolveIntegrationBranch(repoRoot, 'root-x');
  const fgosDir = path.join(repoRoot, '.fgos');
  const marker = path.join(repoRoot, '.git', 'verify-started').replaceAll('\\', '/');
  const member = item('member-a', `node -e "require('fs').writeFileSync('${marker}','1');setTimeout(()=>{},2000)"`);

  const promoting = retargetMember(repoRoot, member, 'root-x');
  const deadline = Date.now() + 20000;
  while (!fs.existsSync(marker)) {
    assert.ok(Date.now() < deadline, 'verify never started');
    await sleep(20);
  }
  assert.equal(probe('merge-slot', { fgosDir, ref: encodeURIComponent('refs/heads/fgw/root-x') }).result, 'held', 'the integration branch\'s slot is held');
  const entered = await withMainCheckout(createLockScope('concurrent'), 'concurrent', () => 'in', { fgosDir });
  assert.equal(entered, 'in');
  const { landSettlement, ...promoted } = await promoting;
  assert.deepEqual(promoted, { id: 'member-a', outcome: 'merged' });
  assert.equal(landSettlement.settlementKind, 'delivered');
});
