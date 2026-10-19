import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { mergeRootIntoMainCas } from '../../src/runner/merge.mjs';
import { retargetMember, resolveIntegrationBranch } from '../../src/runner/promote-engine.mjs';
import { withMainCheckout } from '../../src/runner/repo-locks.mjs';
import { checkpointMainFgos } from '../../src/runner/main-fgos-checkpoint.mjs';
import { createLockScope, probe } from '../../src/holder-lock/index.mjs';
import { git, mkTempDir, initRepo, installHook, sessionEnv, commitCount, HOOK_TEST_SKIP } from '../helpers/main-checkout-hook-repo.mjs';

// The land step of a root-into-main merge and everything that can touch the
// main checkout around it, on real git in disposable repos. Every test here
// runs with no checkpoint adapter attached to the lock core: the checkpoint
// is only attached where a test names it.

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
  addBranch(repoRoot, 'fgw/item-a', 'a.txt', 'a\n');
  addBranch(repoRoot, 'fgw/item-b', 'b.txt', 'b\n');
  const log = path.join(repoRoot, '.git', 'verify-order.log').replaceAll('\\', '/');
  // Each verify logs its own start and end: the second must not start before the first ended.
  const verify = (id) => `node -e "const fs=require('fs');fs.appendFileSync('${log}','start ${id}\\n');setTimeout(()=>{fs.appendFileSync('${log}','end ${id}\\n')},600)"`;

  const [a, b] = await Promise.all([
    mergeRootIntoMainCas(repoRoot, item('item-a', verify('a')), 'fgw/item-a', { timeoutMs: 60000, lockWaitMs: 30000 }),
    mergeRootIntoMainCas(repoRoot, item('item-b', verify('b')), 'fgw/item-b', { timeoutMs: 60000, lockWaitMs: 30000 }),
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

test('a checkpoint that holds main while a land waits for it finishes first; the land then reports the moved trunk and loses nothing', { skip }, async () => {
  const repoRoot = initRepo();
  addBranch(repoRoot, 'fgw/item-a', 'a.txt', 'a\n');
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify({ checkpoint: { fallbackIntervalSec: 0 } }));
  fs.writeFileSync(path.join(fgosDir, 'events.jsonl'), '{"seq":1}\n{"seq":2}\n');
  const tipBefore = mainTip(repoRoot);

  const saved = process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS;
  delete process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS;
  try {
    let land;
    await withMainCheckout(createLockScope('checkpointer'), 'checkpoint', async (mainHandle) => {
      land = mergeRootIntoMainCas(repoRoot, item('item-a'), 'fgw/item-a', { timeoutMs: 60000, lockWaitMs: 30000 });
      // Long enough for the land to finish its merge and verify and start waiting for main.
      await sleep(1500);
      checkpointMainFgos(mainHandle, fgosDir, repoRoot);
    }, { fgosDir });
    const result = await land;

    assert.equal(result.outcome, 'merge-failed-unclassified', `the trunk moved under the land: ${JSON.stringify(result)}`);
    assert.match(result.error.message, /update-ref failed/);
    assert.match(git(repoRoot, ['log', '--format=%s', `${tipBefore}..main`]), /chore\(\.fgos\): fallback events checkpoint/);
    assert.equal(git(repoRoot, ['status', '--porcelain', '--untracked-files=no']).trim(), '', 'the index and tree are consistent, nothing half-applied');
    assert.equal(fs.existsSync(path.join(repoRoot, '.git', 'index.lock')), false);
  } finally {
    if (saved !== undefined) process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS = saved;
  }
});

test('with the hook, a manual commit attempted inside the land\'s ref update is refused while the land holds main; the land completes and no manual commit appears', { skip }, async () => {
  const repoRoot = initRepo();
  addBranch(repoRoot, 'fgw/item-a', 'a.txt', 'a\n');
  installHook(repoRoot);
  const attemptLog = path.join(mkTempDir('fgos-land-attempt-'), 'attempt.log');
  // A real git hook that fires while `git update-ref` runs: it is where a
  // concurrent manual commit would land, with the land holding main.
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

  const result = await mergeRootIntoMainCas(repoRoot, item('item-a'), 'fgw/item-a', { timeoutMs: 60000, lockWaitMs: 30000 });

  assert.equal(result.outcome, 'merged', JSON.stringify(result));
  const attempt = fs.readFileSync(attemptLog, 'utf8');
  assert.doesNotMatch(attempt, /exit=0/, `the manual commit must be refused while the land holds main:\n${attempt}`);
  assert.match(attempt, /fgOS is writing the main checkout/);
  assert.doesNotMatch(git(repoRoot, ['log', '--format=%s', 'main']), /manual commit during land/);
  assert.equal(commitCount(repoRoot), before + 2, 'the merged branch commit and the merge commit, nothing else');
});

test('without the hook (raw git outside fgOS), a manual commit that slips in before the land is detected by the CAS: the land reports it and the commit survives', { skip }, async () => {
  const repoRoot = initRepo();
  addBranch(repoRoot, 'fgw/item-a', 'a.txt', 'a\n');
  const fgosDir = path.join(repoRoot, '.fgos');
  const tipBefore = mainTip(repoRoot);

  let land;
  await withMainCheckout(createLockScope('holder'), 'hold', async () => {
    land = mergeRootIntoMainCas(repoRoot, item('item-a'), 'fgw/item-a', { timeoutMs: 60000, lockWaitMs: 30000 });
    await sleep(1500);
    fs.writeFileSync(path.join(repoRoot, 'manual.txt'), 'manual\n');
    git(repoRoot, ['add', 'manual.txt']);
    const res = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'user.name=Manual', '-c', 'user.email=m@example.com', 'commit', '-q', '-m', 'manual commit without hook'], { cwd: repoRoot, encoding: 'utf8', env: sessionEnv() });
    assert.equal(res.status, 0, res.stderr);
  }, { fgosDir });
  const result = await land;

  assert.equal(result.outcome, 'merge-failed-unclassified', JSON.stringify(result));
  assert.match(result.error.message, /update-ref failed/);
  assert.match(git(repoRoot, ['log', '--format=%s', `${tipBefore}..main`]), /manual commit without hook/);
  assert.doesNotMatch(git(repoRoot, ['log', '--format=%s', 'main']), /^merge fgw\/item-a/m, 'the merge commit never landed on the moved trunk');
  assert.equal(git(repoRoot, ['show', 'main:manual.txt']), 'manual\n', 'the manual commit is not lost');
});

test('a file staged in main before the land refuses it even outside the item\'s own file set: the working-tree sync would delete it, so the trunk does not move and the staged file is kept', { skip }, async () => {
  const repoRoot = initRepo();
  addBranch(repoRoot, 'fgw/item-a', 'a.txt', 'a\n');
  fs.writeFileSync(path.join(repoRoot, 'staged.txt'), 'staged by a person\n');
  git(repoRoot, ['add', 'staged.txt']);
  const tipBefore = mainTip(repoRoot);

  const result = await mergeRootIntoMainCas(repoRoot, item('item-a'), 'fgw/item-a', { timeoutMs: 60000, lockWaitMs: 30000, ownFileSet: new Set(['a.txt']) });

  assert.equal(result.outcome, 'main-checkout-dirty-mid-merge', JSON.stringify(result));
  assert.deepEqual(result.stagedPaths, ['staged.txt']);
  assert.equal(mainTip(repoRoot), tipBefore, 'update-ref never ran');
  assert.match(git(repoRoot, ['diff', '--cached', '--name-only']), /staged\.txt/, 'still staged');
  assert.equal(fs.readFileSync(path.join(repoRoot, 'staged.txt'), 'utf8'), 'staged by a person\n');
});

test('staged .fgos event files in main are fgOS\'s own: they survive the land content-intact and staged, they do not refuse it', { skip }, async () => {
  const repoRoot = initRepo();
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), '{"seq":1}\n');
  git(repoRoot, ['add', '-f', '.fgos/events.jsonl']);
  git(repoRoot, ['commit', '-q', '-m', 'track events']);
  addBranch(repoRoot, 'fgw/item-a', 'a.txt', 'a\n');
  fs.appendFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), '{"seq":2}\n');
  fs.mkdirSync(path.join(repoRoot, '.fgos', 'events'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'events', 'w1.jsonl'), '{"seq":3}\n');
  git(repoRoot, ['add', '-f', '.fgos/events.jsonl', '.fgos/events/w1.jsonl']);

  const result = await mergeRootIntoMainCas(repoRoot, item('item-a'), 'fgw/item-a', { timeoutMs: 60000, lockWaitMs: 30000, ownFileSet: new Set(['a.txt']) });

  assert.equal(result.outcome, 'merged', JSON.stringify(result));
  assert.equal(fs.readFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), 'utf8'), '{"seq":1}\n{"seq":2}\n', 'the staged edit is not reset to HEAD');
  assert.equal(fs.readFileSync(path.join(repoRoot, '.fgos', 'events', 'w1.jsonl'), 'utf8'), '{"seq":3}\n', 'the staged new shard is not deleted');
  const stagedNow = git(repoRoot, ['diff', '--cached', '--name-only']);
  assert.match(stagedNow, /\.fgos\/events\.jsonl/);
  assert.match(stagedNow, /\.fgos\/events\/w1\.jsonl/);
});

test('an unstaged edit on an unrelated path survives the land untouched', { skip }, async () => {
  const repoRoot = initRepo();
  addBranch(repoRoot, 'fgw/item-a', 'a.txt', 'a\n');
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'edited by a person, not staged\n');

  const result = await mergeRootIntoMainCas(repoRoot, item('item-a'), 'fgw/item-a', { timeoutMs: 60000, lockWaitMs: 30000, ownFileSet: new Set(['a.txt']) });

  assert.equal(result.outcome, 'merged', JSON.stringify(result));
  assert.equal(fs.readFileSync(path.join(repoRoot, 'seed.txt'), 'utf8'), 'edited by a person, not staged\n');
  assert.equal(fs.readFileSync(path.join(repoRoot, 'a.txt'), 'utf8'), 'a\n', 'the working tree synced to the merge');
});

test('a file staged in main that is part of the item\'s own file set refuses the land: the trunk does not move and the staged change is kept', { skip }, async () => {
  const repoRoot = initRepo();
  addBranch(repoRoot, 'fgw/item-a', 'a.txt', 'a\n');
  fs.writeFileSync(path.join(repoRoot, 'a.txt'), 'a person\'s own edit\n');
  git(repoRoot, ['add', 'a.txt']);
  const tipBefore = mainTip(repoRoot);

  const result = await mergeRootIntoMainCas(repoRoot, item('item-a'), 'fgw/item-a', { timeoutMs: 60000, lockWaitMs: 30000, ownFileSet: new Set(['a.txt']) });

  assert.equal(result.outcome, 'main-checkout-dirty-mid-merge', JSON.stringify(result));
  assert.equal(mainTip(repoRoot), tipBefore, 'update-ref never ran');
  assert.match(git(repoRoot, ['diff', '--cached', '--name-only']), /a\.txt/);
  assert.equal(fs.readFileSync(path.join(repoRoot, 'a.txt'), 'utf8'), 'a person\'s own edit\n');
});

test('promoting a member does not hold the main mutex during verify: another withMainCheckout gets in while verify runs', { skip }, async () => {
  const repoRoot = initRepo();
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
  assert.equal(probe('merge-slot', { fgosDir, ref: encodeURIComponent('fgw/root-x') }).result, 'held', 'the integration branch\'s slot is held');
  const entered = await withMainCheckout(createLockScope('concurrent'), 'concurrent', () => 'in', { fgosDir });
  assert.equal(entered, 'in');
  assert.deepEqual(await promoting, { id: 'member-a', outcome: 'merged' });
});
