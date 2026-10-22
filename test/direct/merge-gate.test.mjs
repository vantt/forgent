import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { approveUseCase } from '../../src/verbs/merge/approve.mjs';
import { addWork } from '../../src/state/store.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { prepareActivatedGitFixture } from '../helpers/run-unit-with-port.mjs';

const execGit = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8' });

// Work events need the store's machine id before the first addWork. The activation fence stays untracked, as in
// production, so the fixture's `git add .fgos` never commits it.
function activateWorkFixture(cwd) {
  prepareActivatedGitFixture(cwd);
  fs.appendFileSync(path.join(cwd, '.git', 'info', 'exclude'), '.fgos/locks/\n');
}

function addTestWork(dir, id, extra = {}) {
  return addWork(dir, {
    id,
    title: extra.title ?? ('Title ' + id),
    kind: extra.kind ?? 'task',
    status: extra.status ?? 'todo',
    risk: extra.risk ?? 'light',
    deps: extra.deps ?? [],
    refs: extra.refs ?? [],
    verify: extra.verify ?? 'test',
    description: 'test',
    ...extra
  });
}

test('approve gate: aborts cleanly on test failure without modifying main', async (t) => {
  const cwd = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'test-gate-')));
  
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  execGit(cwd, ['commit', '--allow-empty', '-m', 'initial']);
  
  const fgosDir = path.join(cwd, '.fgos');
  fs.mkdirSync(fgosDir);
  activateWorkFixture(cwd);
  
  addTestWork(fgosDir, 'tsk-test', { status: 'awaiting-approval' });
  execGit(cwd, ['add', '.fgos']);
  execGit(cwd, ['commit', '-m', 'add work']);
  prepareActivatedGitFixture(cwd);
  
  execGit(cwd, ['branch', 'fgw/tsk-test', 'HEAD']);
  
  execGit(cwd, ['checkout', 'fgw/tsk-test']);
  fs.writeFileSync(path.join(cwd, 'new-file.txt'), 'hello');
  execGit(cwd, ['add', 'new-file.txt']);
  execGit(cwd, ['commit', '-m', 'add new-file']);
  execGit(cwd, ['checkout', 'main']);
  
  fs.writeFileSync(path.join(cwd, 'fail.sh'), '#!/bin/sh\nexit 1\n');
  fs.chmodSync(path.join(cwd, 'fail.sh'), 0o755);
  fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ scripts: { test: './fail.sh' } }));
  execGit(cwd, ['add', 'package.json', 'fail.sh']);
  execGit(cwd, ['commit', '-m', 'add test script']);
  const newTargetTip = execGit(cwd, ['rev-parse', 'HEAD']).trim();
  
  execGit(cwd, ['checkout', 'fgw/tsk-test']);
  execGit(cwd, ['merge', 'main']);
  execGit(cwd, ['checkout', 'main']);
  
  try {
    const result = await approveUseCase({ dir: fgosDir, repoRoot: cwd }, {
      id: 'tsk-test',
      resolveTimeoutMs: () => 5000,
      resolveWaitFlags: () => ({ noWait: true }),
      github: false,
      acknowledgeIronLaw: () => {},
      acknowledgeDrift: () => {},
    });
    
    assert.equal(result.to, 'blocked', 'result.to should be blocked');
    assert.equal(result.reason, 'verify-fail', 'result.reason should be verify-fail');
  } catch (e) {
  }
  
  const status = execGit(cwd, ['status', '--porcelain']).trim();
  const statusLines = status.split('\n').filter(line => !line.includes('.fgos/'));
  assert.equal(statusLines.join('\n'), '', 'main working tree should be clean outside of .fgos');
  
  const finalTip = execGit(cwd, ['rev-parse', 'HEAD']).trim();
  assert.equal(finalTip, newTargetTip, 'main ref should not have moved');
});

test('root-into-main merge gate: verify sees the merged tree\'s own declared dependencies installed', async () => {
  const { landRunnerItem } = await import('../../src/runner/merge.mjs');
  const os = await import('node:os');
  // A local `file:` dependency resolves entirely offline, so provisioning
  // stays fast and never hits the registry.
  const depDir = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-localdep-')));
  fs.writeFileSync(path.join(depDir, 'package.json'), JSON.stringify({ name: 'fgos-merge-gate-localdep', version: '1.0.0' }));
  fs.writeFileSync(path.join(depDir, 'index.js'), 'module.exports = {};\n');

  const cwd = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-deps-')));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ name: 'host', version: '1.0.0', dependencies: { 'fgos-merge-gate-localdep': `file:${depDir}` } }));
  execGit(cwd, ['add', 'package.json']);
  execGit(cwd, ['commit', '-m', 'declare dependency']);
  fs.mkdirSync(path.join(cwd, '.fgos'));
  prepareActivatedGitFixture(cwd);

  execGit(cwd, ['branch', 'fgw/tsk-dep', 'HEAD']);
  execGit(cwd, ['checkout', 'fgw/tsk-dep']);
  fs.writeFileSync(path.join(cwd, 'feature.txt'), 'feature\n');
  execGit(cwd, ['add', 'feature.txt']);
  execGit(cwd, ['commit', '-m', 'add feature']);
  execGit(cwd, ['checkout', 'main']);
  const mainBefore = execGit(cwd, ['rev-parse', 'HEAD']).trim();

  const item = { id: 'tsk-dep', verify: `node -e "require('fgos-merge-gate-localdep')"` };
  const result = await landRunnerItem(cwd, item, { branch: 'fgw/tsk-dep', timeoutMs: 60000 });

  assert.equal(result.outcome, 'merged', `expected merged, got ${result.outcome}: ${result.check?.output ?? ''}`);
  assert.notEqual(execGit(cwd, ['rev-parse', 'main']).trim(), mainBefore, 'main should advance to the merge commit');
});

test('root-into-main merge gate: verify runs under the trunk\'s merge slot but without the main checkout mutex, so other fgos commands are not refused meanwhile', async () => {
  const { landRunnerItem } = await import('../../src/runner/merge.mjs');
  const { withMainCheckout } = await import('../../src/runner/repo-locks.mjs');
  const { createLockScope, probe } = await import('../../src/holder-lock/index.mjs');
  const os = await import('node:os');
  const cwd = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-lock-')));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  execGit(cwd, ['commit', '--allow-empty', '-m', 'initial']);
  fs.mkdirSync(path.join(cwd, '.fgos'));
  prepareActivatedGitFixture(cwd);
  execGit(cwd, ['branch', 'fgw/tsk-lock', 'HEAD']);
  execGit(cwd, ['checkout', 'fgw/tsk-lock']);
  fs.writeFileSync(path.join(cwd, 'feature.txt'), 'feature\n');
  execGit(cwd, ['add', 'feature.txt']);
  execGit(cwd, ['commit', '-m', 'add feature']);
  execGit(cwd, ['checkout', 'main']);

  const marker = path.join(cwd, '.fgos', 'verify-started').replaceAll('\\', '/');
  const item = { id: 'tsk-lock', verify: `node -e "require('fs').writeFileSync('${marker}','1');setTimeout(()=>{},1500)"` };
  const merging = landRunnerItem(cwd, item, { branch: 'fgw/tsk-lock', timeoutMs: 60000 });
  const deadline = Date.now() + 20000;
  while (!fs.existsSync(marker)) {
    assert.ok(Date.now() < deadline, 'verify never started');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  const fgosDir = path.join(cwd, '.fgos');
  assert.equal(probe('merge-slot', { fgosDir, ref: encodeURIComponent('refs/heads/main') }).result, 'held', 'the trunk\'s slot is held while the merge verifies');
  const entered = await withMainCheckout(createLockScope('concurrent'), 'concurrent', () => 'in', { fgosDir });
  assert.equal(entered, 'in', 'the main mutex is free while verify runs');

  const result = await merging;
  assert.equal(result.outcome, 'merged', `expected merged, got ${result.outcome}: ${result.check?.output ?? ''}`);
  assert.equal(probe('main-checkout', { fgosDir }).result, 'free', 'the main mutex is released after landing');
  assert.equal(probe('merge-slot', { fgosDir, ref: encodeURIComponent('refs/heads/main') }).result, 'free', 'the slot is released after landing');
  assert.ok(fs.existsSync(path.join(cwd, 'feature.txt')), 'main checkout working tree synced to the merge');
});

test('root-into-main merge gate: a second merge into the same trunk is refused at once (lockWaitMs 0) while the first holds the slot, and before any verify', async () => {
  const { landRunnerItem, MergeError } = await import('../../src/runner/merge.mjs');
  const { holdLockInChild } = await import('../helpers/hold-lock-in-child.mjs');
  const os = await import('node:os');
  const cwd = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-slot-held-')));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  execGit(cwd, ['commit', '--allow-empty', '-m', 'initial']);
  fs.mkdirSync(path.join(cwd, '.fgos'));
  prepareActivatedGitFixture(cwd);
  execGit(cwd, ['branch', 'fgw/tsk-slot', 'HEAD']);
  const mainBefore = execGit(cwd, ['rev-parse', 'main']).trim();

  const holder = await holdLockInChild('merge-slot', { fgosDir: path.join(cwd, '.fgos'), ref: encodeURIComponent('refs/heads/main') });
  try {
    const err = await landRunnerItem(cwd, { id: 'tsk-slot', verify: 'true' }, { branch: 'fgw/tsk-slot', timeoutMs: 60000, lockWaitMs: 0 }).then(() => null, (e) => e);
    assert.ok(err instanceof MergeError, `expected MergeError, got ${err}`);
    assert.equal(err.code, 'lock-held');
    assert.match(err.message, /merge slot of "refs\/heads\/main" is held by another process/);
    assert.ok(err.holders.includes(holder.child.pid));
    assert.equal(execGit(cwd, ['rev-parse', 'main']).trim(), mainBefore);
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
});

test('root-into-main merge gate: with lockWaitMs 0 a busy main checkout refuses the merge before the verify run', async () => {
  const { landRunnerItem } = await import('../../src/runner/merge.mjs');
  const { holdLockInChild } = await import('../helpers/hold-lock-in-child.mjs');
  const os = await import('node:os');
  const cwd = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-main-held-')));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  execGit(cwd, ['commit', '--allow-empty', '-m', 'initial']);
  fs.mkdirSync(path.join(cwd, '.fgos'));
  prepareActivatedGitFixture(cwd);
  execGit(cwd, ['branch', 'fgw/tsk-busy', 'HEAD']);
  const verifyRan = path.join(cwd, '.fgos', 'verify-ran').replaceAll('\\', '/');

  const holder = await holdLockInChild('main-checkout', { fgosDir: path.join(cwd, '.fgos') });
  try {
    const err = await landRunnerItem(cwd, { id: 'tsk-busy', verify: `node -e "require('fs').writeFileSync('${verifyRan}','1')"` }, { branch: 'fgw/tsk-busy', timeoutMs: 60000, lockWaitMs: 0 }).then(() => null, (e) => e);
    assert.equal(err?.code, 'lock-held');
    assert.match(err.message, /main checkout \(precheck\) is held by another process/);
    assert.equal(fs.existsSync(verifyRan), false, 'refused before any verify ran');
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
});

async function casRepoWithSetup(commands) {
  const os = await import('node:os');
  const cwd = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-setup-')));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  execGit(cwd, ['commit', '--allow-empty', '-m', 'initial']);
  fs.mkdirSync(path.join(cwd, '.fgos'));
  prepareActivatedGitFixture(cwd);
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ worktreeSetup: { commands } }));
  execGit(cwd, ['branch', 'fgw/tsk-setup', 'HEAD']);
  execGit(cwd, ['checkout', 'fgw/tsk-setup']);
  fs.writeFileSync(path.join(cwd, 'feature.txt'), 'feature\n');
  execGit(cwd, ['add', 'feature.txt']);
  execGit(cwd, ['commit', '-m', 'add feature']);
  execGit(cwd, ['checkout', 'main']);
  return cwd;
}

test('root-into-main merge gate: runs the project\'s worktreeSetup commands before verify (e.g. building an artifact the suite needs)', async () => {
  const { landRunnerItem } = await import('../../src/runner/merge.mjs');
  const cwd = await casRepoWithSetup(['echo built > build-artifact.txt']);
  const item = { id: 'tsk-setup', verify: `node -e "process.exit(require('fs').existsSync('build-artifact.txt') ? 0 : 1)"` };
  const result = await landRunnerItem(cwd, item, { branch: 'fgw/tsk-setup', timeoutMs: 60000 });
  assert.equal(result.outcome, 'merged', `expected merged, got ${result.outcome}: ${result.check?.output ?? ''}`);
});

test('root-into-main merge gate: a failing worktreeSetup command is a verify-fail naming the command, main untouched', async () => {
  const { landRunnerItem } = await import('../../src/runner/merge.mjs');
  const cwd = await casRepoWithSetup(['node -e "console.error(\'setup-broke\'); process.exit(2)"']);
  const mainBefore = execGit(cwd, ['rev-parse', 'main']).trim();
  const result = await landRunnerItem(cwd, { id: 'tsk-setup', verify: 'true' }, { branch: 'fgw/tsk-setup', timeoutMs: 60000 });
  assert.equal(result.outcome, 'verify-fail');
  assert.match(result.check.output, /setup-broke/);
  assert.equal(execGit(cwd, ['rev-parse', 'main']).trim(), mainBefore);
});

test('root-into-main merge gate: a path in ownFileSet dirtied on repoRoot AFTER the merge+verify started (but before the land step) is caught under the lock, not raced past', async () => {
  const { landRunnerItem } = await import('../../src/runner/merge.mjs');
  const os = await import('node:os');
  const cwd = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-race-')));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  fs.writeFileSync(path.join(cwd, 'owned.txt'), 'original\n');
  execGit(cwd, ['add', 'owned.txt']);
  execGit(cwd, ['commit', '-m', 'initial']);
  fs.mkdirSync(path.join(cwd, '.fgos'));
  prepareActivatedGitFixture(cwd);
  execGit(cwd, ['branch', 'fgw/tsk-race', 'HEAD']);
  execGit(cwd, ['checkout', 'fgw/tsk-race']);
  fs.writeFileSync(path.join(cwd, 'owned.txt'), 'from the item\n');
  execGit(cwd, ['add', 'owned.txt']);
  execGit(cwd, ['commit', '-m', 'update owned.txt']);
  execGit(cwd, ['checkout', 'main']);
  const mainBefore = execGit(cwd, ['rev-parse', 'main']).trim();

  // Slow enough that a write fired right after the call starts lands well
  // before the CAS merge+verify (git worktree add, merge, goal-check) can
  // possibly finish and reach the land step.
  const item = { id: 'tsk-race', verify: 'node -e "setTimeout(() => process.exit(0), 400)"' };
  const racePromise = landRunnerItem(cwd, item, { branch: 'fgw/tsk-race', timeoutMs: 60000,
    ownFileSet: new Set(['owned.txt']), });
  // Fires on the next tick -- long before the 400ms verify sleep ends, so
  // this is genuinely mid-merge, not a pre-check the function hasn't
  // reached yet.
  setTimeout(() => fs.writeFileSync(path.join(cwd, 'owned.txt'), 'dirtied by another writer mid-merge\n'), 10);
  const result = await racePromise;

  assert.equal(result.outcome, 'main-checkout-dirty-mid-merge', `expected the second check to catch the race, got ${result.outcome}: ${JSON.stringify(result)}`);
  assert.equal(execGit(cwd, ['rev-parse', 'main']).trim(), mainBefore, 'update-ref must never have run');
  assert.equal(fs.readFileSync(path.join(cwd, 'owned.txt'), 'utf8'), 'dirtied by another writer mid-merge\n', 'the dirty write is left exactly as it was -- no working-tree sync was attempted');
});

test('root-into-main merge gate: an UNRELATED path dirtied mid-merge (outside ownFileSet) does not trip the second check', async () => {
  const { landRunnerItem } = await import('../../src/runner/merge.mjs');
  const os = await import('node:os');
  const cwd = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-race-unrelated-')));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  execGit(cwd, ['commit', '--allow-empty', '-m', 'initial']);
  fs.mkdirSync(path.join(cwd, '.fgos'));
  prepareActivatedGitFixture(cwd);
  execGit(cwd, ['branch', 'fgw/tsk-race-ok', 'HEAD']);
  execGit(cwd, ['checkout', 'fgw/tsk-race-ok']);
  fs.writeFileSync(path.join(cwd, 'feature.txt'), 'feature\n');
  execGit(cwd, ['add', 'feature.txt']);
  execGit(cwd, ['commit', '-m', 'add feature']);
  execGit(cwd, ['checkout', 'main']);

  const item = { id: 'tsk-race-ok', verify: 'node -e "setTimeout(() => process.exit(0), 400)"' };
  const racePromise = landRunnerItem(cwd, item, { branch: 'fgw/tsk-race-ok', timeoutMs: 60000,
    ownFileSet: new Set(['feature.txt']), });
  setTimeout(() => fs.writeFileSync(path.join(cwd, 'unrelated-scratch.txt'), 'another session\'s work\n'), 10);
  const result = await racePromise;

  assert.equal(result.outcome, 'merged', `an unrelated dirty path must not block landing, got ${result.outcome}: ${result.check?.output ?? ''}`);
  assert.equal(fs.readFileSync(path.join(cwd, 'unrelated-scratch.txt'), 'utf8'), "another session's work\n", 'the unrelated file is left untouched, still uncommitted');
});

// approve's --no-wait / --wait against a held merge slot, through the use case
// itself on a real repo and a real other process holding the slot.
async function approvableRootRepo(id, { verify = 'true' } = {}) {
  const cwd = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-approve-wait-')));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  execGit(cwd, ['commit', '--allow-empty', '-m', 'initial']);
  const fgosDir = path.join(cwd, '.fgos');
  fs.mkdirSync(fgosDir);
  activateWorkFixture(cwd);
  addTestWork(fgosDir, id, { status: 'awaiting-approval', verify });
  execGit(cwd, ['add', '.fgos']);
  execGit(cwd, ['commit', '-m', 'add work']);
  prepareActivatedGitFixture(cwd);
  execGit(cwd, ['branch', `fgw/${id}`, 'HEAD']);
  execGit(cwd, ['checkout', `fgw/${id}`]);
  fs.writeFileSync(path.join(cwd, 'produced.txt'), 'ok\n');
  execGit(cwd, ['add', 'produced.txt']);
  execGit(cwd, ['commit', '-m', 'produce']);
  execGit(cwd, ['checkout', 'main']);
  return { cwd, fgosDir };
}

const approveOptions = (id, waitFlags) => ({
  id,
  resolveTimeoutMs: () => 60000,
  resolveWaitFlags: () => waitFlags,
  github: false,
  acknowledgeIronLaw: () => {},
  acknowledgeDrift: () => {},
});

test('approve --no-wait with the trunk\'s merge slot held fails at once naming the slot, the item stays awaiting-approval, and a retry once the slot is free delivers under the same recorded operation', async () => {
  const { holdLockInChild } = await import('../helpers/hold-lock-in-child.mjs');
  const { listWork } = await import('../../src/state/store.mjs');
  const { cwd, fgosDir } = await approvableRootRepo('tsk-nowait');
  const holder = await holdLockInChild('merge-slot', { fgosDir, ref: encodeURIComponent('refs/heads/main') });
  try {
    const started = Date.now();
    await assert.rejects(
      () => approveUseCase({ dir: fgosDir, repoRoot: cwd }, approveOptions('tsk-nowait', { noWait: true })),
      (err) => {
        assert.equal(err.code, 'lock-held');
        assert.match(err.message, /merge slot of "refs\/heads\/main" is held by another process/);
        assert.ok(err.holders.includes(holder.child.pid));
        return true;
      },
    );
    assert.ok(Date.now() - started < 5000, 'a no-wait refusal must not wait');
    assert.equal(listWork(fgosDir).work['tsk-nowait'].status, 'awaiting-approval');
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
  // The refusal came before Land journalled anything, so the recorded id is
  // no prior attempt: the retry reuses it instead of failing on the journal.
  const result = await approveUseCase({ dir: fgosDir, repoRoot: cwd }, approveOptions('tsk-nowait', { noWait: true }));
  assert.equal(result.to, 'delivered', JSON.stringify(result));
  const view = listWork(fgosDir);
  const recorded = view.decisions.filter((d) => d.id === 'tsk-nowait' && d.landOperation);
  assert.equal(recorded.length, 1, 'a retry records no second Land operation');
  assert.equal(view.work['tsk-nowait'].landSettlement.operationId, recorded[0].landOperation.operationId);
});

test('approve --wait <ms> waits for the held merge slot and lands once the holder releases', async () => {
  const { holdLockInChild } = await import('../helpers/hold-lock-in-child.mjs');
  const { listWork } = await import('../../src/state/store.mjs');
  const { cwd, fgosDir } = await approvableRootRepo('tsk-wait');
  const holder = await holdLockInChild('merge-slot', { fgosDir, ref: encodeURIComponent('refs/heads/main') });
  setTimeout(() => holder.child.kill('SIGKILL'), 600);
  const result = await approveUseCase({ dir: fgosDir, repoRoot: cwd }, approveOptions('tsk-wait', { noWait: false, waitMs: 15000 }));
  await holder.exited;
  assert.equal(result.to, 'delivered', JSON.stringify(result));
  assert.equal(listWork(fgosDir).work['tsk-wait'].status, 'delivered');
  assert.ok(fs.existsSync(path.join(cwd, 'produced.txt')), 'the branch landed on main');
});

test('sync-root --no-wait with the trunk\'s merge slot held fails at once naming the slot; --wait <ms> lands once the holder releases', async () => {
  const { holdLockInChild } = await import('../helpers/hold-lock-in-child.mjs');
  const { syncRootUseCase } = await import('../../src/verbs/merge/sync-root.mjs');
  const { cwd, fgosDir } = await approvableRootRepo('tsk-sync');
  const options = (waitFlags) => ({ id: 'tsk-sync', resolveTimeoutMs: () => 60000, resolveWaitFlags: () => waitFlags, acknowledgeIronLaw: true });
  const holder = await holdLockInChild('merge-slot', { fgosDir, ref: encodeURIComponent('refs/heads/main') });
  try {
    await assert.rejects(
      () => syncRootUseCase({ dir: fgosDir, repoRoot: cwd }, options({ noWait: true })),
      (err) => err.code === 'lock-held' && /merge slot of "refs\/heads\/main" is held by another process/.test(err.message),
    );
    assert.equal(fs.existsSync(path.join(cwd, 'produced.txt')), false, 'nothing merged while refused');
    setTimeout(() => holder.child.kill('SIGKILL'), 600);
    const result = await syncRootUseCase({ dir: fgosDir, repoRoot: cwd }, options({ noWait: false, waitMs: 15000 }));
    assert.equal(result.outcome, 'synced', JSON.stringify(result));
    assert.ok(fs.existsSync(path.join(cwd, 'produced.txt')));
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
});

test('a failing post-land drift detection is reported beside a landed merge, never as a failed merge', async () => {
  const { landRunnerItem } = await import('../../src/runner/merge.mjs');
  const { cwd, fgosDir } = await approvableRootRepo('tsk-drift-broken');
  // The verify breaks the session registry drift detection reads, after
  // approve's own guards have read it and before Land publishes.
  const registry = path.join(fgosDir, 'sessions.json');
  const item = { id: 'tsk-drift-broken', verify: `node -e "require('fs').writeFileSync('${registry}','not json')"` };
  const result = await landRunnerItem(cwd, item, { branch: 'fgw/tsk-drift-broken', timeoutMs: 60000 });
  assert.equal(result.outcome, 'merged', JSON.stringify(result));
  assert.equal(result.landSettlement.settlementKind, 'delivered');
  assert.match(result.postLand.error, /post-land drift detection failed: .*sessions\.json/);
  assert.equal(execGit(cwd, ['show', 'main:produced.txt']), 'ok\n', 'the branch landed on main');
});

test('an unclassified failure while publishing claims no abandoned result: the land reports its effect unknown and doctor --fix settles it through Land recovery', async () => {
  const { landRunnerItem } = await import('../../src/runner/merge.mjs');
  const { fixLandRecovery } = await import('../../src/setup/git-checks.mjs');
  const { cwd } = await approvableRootRepo('tsk-publish-unknown');
  const mainBefore = execGit(cwd, ['rev-parse', 'main']).trim();
  // The verify edits a tracked file of the candidate, so publication refuses.
  const item = { id: 'tsk-publish-unknown', verify: `node -e "require('fs').writeFileSync('produced.txt','edited by verify')"` };
  const err = await landRunnerItem(cwd, item, { branch: 'fgw/tsk-publish-unknown', timeoutMs: 60000 }).then(() => null, (e) => e);
  assert.equal(err?.code, 'land-effect-unknown', String(err?.stack ?? err));
  assert.match(err.message, /fgos doctor --fix/);
  assert.equal(execGit(cwd, ['rev-parse', 'main']).trim(), mainBefore);
  const fixed = fixLandRecovery(cwd);
  assert.equal(fixed.changed, true, fixed.message);
  assert.match(fixed.message, new RegExp(`recovered interrupted Land operations: ${err.operationId}`));
});

test('approve releases the published Land candidate once Work has recorded the delivery', async () => {
  const { listWork } = await import('../../src/state/store.mjs');
  const { cwd, fgosDir } = await approvableRootRepo('tsk-release');
  const result = await approveUseCase({ dir: fgosDir, repoRoot: cwd }, approveOptions('tsk-release', { noWait: false, waitMs: 15000 }));
  assert.equal(result.to, 'delivered', JSON.stringify(result));
  const item = listWork(fgosDir).work['tsk-release'];
  const { landOperation } = listWork(fgosDir).decisions.find((d) => d.id === 'tsk-release' && d.landOperation);
  assert.equal(item.landSettlement.operationId, landOperation.operationId, 'delivery is settled under the recorded Land operation');
  const candidates = path.join(cwd, '.fgos/runtime/git-candidates');
  assert.deepEqual(fs.existsSync(candidates) ? fs.readdirSync(candidates) : [], [], 'no candidate is left once the delivery is acknowledged');
  assert.ok(fs.existsSync(path.join(cwd, 'produced.txt')), 'the branch landed on main');
});

test('approve lands a leaf on its root branch through Land, with the delivery settled by that operation and the main checkout untouched', async () => {
  const { listWork } = await import('../../src/state/store.mjs');
  const cwd = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-approve-leaf-')));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  execGit(cwd, ['commit', '--allow-empty', '-m', 'initial']);
  const fgosDir = path.join(cwd, '.fgos');
  fs.mkdirSync(fgosDir);
  activateWorkFixture(cwd);
  addTestWork(fgosDir, 'tsk-root', { status: 'todo', verify: 'true' });
  addTestWork(fgosDir, 'tsk-leaf', { status: 'awaiting-approval', verify: 'test -f leaf.txt', parent: 'tsk-root' });
  execGit(cwd, ['add', '.fgos']);
  execGit(cwd, ['commit', '-m', 'add work']);
  prepareActivatedGitFixture(cwd);
  execGit(cwd, ['branch', 'fgw/tsk-root', 'HEAD']);
  execGit(cwd, ['branch', 'fgw/tsk-leaf', 'HEAD']);
  execGit(cwd, ['checkout', 'fgw/tsk-leaf']);
  fs.writeFileSync(path.join(cwd, 'leaf.txt'), 'leaf\n');
  execGit(cwd, ['add', 'leaf.txt']);
  execGit(cwd, ['commit', '-m', 'leaf work']);
  execGit(cwd, ['checkout', 'main']);
  const mainBefore = execGit(cwd, ['rev-parse', 'main']).trim();

  const result = await approveUseCase({ dir: fgosDir, repoRoot: cwd }, approveOptions('tsk-leaf', { noWait: false, waitMs: 15000 }));
  assert.equal(result.to, 'delivered', JSON.stringify(result));
  assert.equal(result.target, 'fgw/tsk-root');
  const rootTip = execGit(cwd, ['rev-parse', 'fgw/tsk-root']).trim();
  assert.equal(execGit(cwd, ['show', 'fgw/tsk-root:leaf.txt']), 'leaf\n', 'the leaf landed on its root branch');
  assert.equal(execGit(cwd, ['rev-parse', 'main']).trim(), mainBefore, 'main never moved');
  assert.equal(fs.existsSync(path.join(cwd, 'leaf.txt')), false, 'the main checkout was never written');
  const item = listWork(fgosDir).work['tsk-leaf'];
  assert.equal(item.mergedSha, rootTip);
  const { landOperation } = listWork(fgosDir).decisions.find((d) => d.id === 'tsk-leaf' && d.landOperation);
  assert.equal(landOperation.destination, 'refs/heads/fgw/tsk-root');
  assert.equal(item.landSettlement.operationId, landOperation.operationId);
});

// Land keeps a candidate, its pins and its journal until Work durably records
// the result; a result that published nothing is released the same way.
function assertNoLandCandidate(cwd) {
  const candidates = path.join(cwd, '.fgos/runtime/git-candidates');
  assert.deepEqual(fs.existsSync(candidates) ? fs.readdirSync(candidates) : [], [], 'no candidate is left once the result is acknowledged');
  assert.equal(execGit(cwd, ['for-each-ref', 'refs/fgos/git-operations']), '', 'no candidate pin is left');
}

test('approve releases a red Land candidate once Work has recorded the block', async () => {
  const { listWork } = await import('../../src/state/store.mjs');
  const { cwd, fgosDir } = await approvableRootRepo('tsk-red', { verify: 'false' });
  const mainBefore = execGit(cwd, ['rev-parse', 'main']).trim();
  const result = await approveUseCase({ dir: fgosDir, repoRoot: cwd }, approveOptions('tsk-red', { noWait: false, waitMs: 15000 }));
  assert.equal(result.to, 'blocked', JSON.stringify(result));
  assert.equal(listWork(fgosDir).work['tsk-red'].status, 'blocked');
  assert.equal(execGit(cwd, ['rev-parse', 'main']).trim(), mainBefore, 'nothing was published');
  assertNoLandCandidate(cwd);
});

test('sync-root records a red Land result as a decision and releases its candidate', async () => {
  const { listWork } = await import('../../src/state/store.mjs');
  const { syncRootUseCase } = await import('../../src/verbs/merge/sync-root.mjs');
  const { cwd, fgosDir } = await approvableRootRepo('tsk-sync-red', { verify: 'false' });
  const mainBefore = execGit(cwd, ['rev-parse', 'main']).trim();
  const result = await syncRootUseCase({ dir: fgosDir, repoRoot: cwd }, { id: 'tsk-sync-red', resolveTimeoutMs: () => 60000, resolveWaitFlags: () => ({ noWait: false, waitMs: 15000 }), acknowledgeIronLaw: true });
  assert.equal(result.outcome, 'blocked', JSON.stringify(result));
  assert.equal(result.reason, 'verify-fail');
  assert.equal(execGit(cwd, ['rev-parse', 'main']).trim(), mainBefore, 'nothing was published');
  assert.ok(listWork(fgosDir).decisions.some((d) => d.id === 'tsk-sync-red' && d.kind === 'engine' && /published nothing \(verify-fail\)/.test(d.text)),
    'Work records the unpublished result before the candidate is released');
  assertNoLandCandidate(cwd);
});

test('promote-to-component releases every member\'s Land candidate, merged or red, once its decision is recorded', async () => {
  const { promoteToComponentUseCase } = await import('../../src/verbs/merge/promote-to-component.mjs');
  const cwd = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-promote-')));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  execGit(cwd, ['commit', '--allow-empty', '-m', 'initial']);
  const fgosDir = path.join(cwd, '.fgos');
  fs.mkdirSync(fgosDir);
  activateWorkFixture(cwd);
  addTestWork(fgosDir, 'ptc-green', { status: 'awaiting-approval', verify: 'true' });
  addTestWork(fgosDir, 'ptc-red', { status: 'awaiting-approval', verify: 'false', deps: ['ptc-green'] });
  execGit(cwd, ['add', '.fgos']);
  execGit(cwd, ['commit', '-m', 'add work']);
  prepareActivatedGitFixture(cwd);
  for (const id of ['ptc-green', 'ptc-red']) {
    execGit(cwd, ['branch', `fgw/${id}`, 'HEAD']);
    execGit(cwd, ['checkout', `fgw/${id}`]);
    fs.writeFileSync(path.join(cwd, `${id}.txt`), `${id}\n`);
    execGit(cwd, ['add', `${id}.txt`]);
    execGit(cwd, ['commit', '-m', id]);
    execGit(cwd, ['checkout', 'main']);
  }
  const result = await promoteToComponentUseCase({ dir: fgosDir, repoRoot: cwd }, { ids: ['ptc-green', 'ptc-red'], rootTitle: 'Promoted component', timeoutMs: 60000 });
  assert.deepEqual(result.results.map((r) => [r.id, r.outcome]), [['ptc-green', 'merged'], ['ptc-red', 'blocked']]);
  assert.ok(result.results.every((r) => !('landSettlement' in r)), 'settlement identities stay internal to the verb');
  assertNoLandCandidate(cwd);
});

// A candidate Land kept because its release never ran (busy slot, or a command that died after recording the
// result): the land is driven directly, so nothing acknowledges it and Work's record is made by hand.
async function landLeavingCandidate(id, { verify = 'true' } = {}) {
  const { landRunnerItem } = await import('../../src/runner/merge.mjs');
  const repo = await approvableRootRepo(id, { verify });
  const result = await landRunnerItem(repo.cwd, { id, verify }, { branch: `fgw/${id}`, timeoutMs: 60000 });
  assert.ok(result.landSettlement, JSON.stringify(result));
  const candidates = path.join(repo.cwd, '.fgos/runtime/git-candidates');
  assert.equal(fs.readdirSync(candidates).length, 1, 'the unacknowledged land keeps its candidate');
  return { ...repo, result, candidates };
}

const RECORDS_OF_A_LAND_RESULT = {
  'a delivery': async ({ fgosDir, result }, id) => {
    const { moveWork } = await import('../../src/state/store.mjs');
    moveWork(fgosDir, { id, to: 'delivered', expectedStatus: 'awaiting-approval', role: 'human', mergedSha: result.receipt.localEffect.publishedOid, mergedInto: 'main', landSettlement: result.landSettlement });
  },
  'a block': async ({ fgosDir, result }, id) => {
    const { moveWork } = await import('../../src/state/store.mjs');
    moveWork(fgosDir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: 'merge-conflict', role: 'system', landOperationIds: [result.landSettlement.operationId] });
  },
  'an engine decision': async ({ fgosDir, result }, id) => {
    const { addDecision } = await import('../../src/state/store.mjs');
    addDecision(fgosDir, { id, kind: 'engine', text: 'sync-root: merged', rationale: 'records the land result', landOperationIds: [result.landSettlement.operationId] });
  },
};

for (const [kind, record] of Object.entries(RECORDS_OF_A_LAND_RESULT)) {
  test(`the release sweep releases a retained Land candidate once Work has recorded its result as ${kind}`, async () => {
    const { releaseRecordedLand } = await import('../../src/runner/merge.mjs');
    const id = `tsk-sweep-${kind.split(' ').pop()}`;
    const landed = await landLeavingCandidate(id);
    await record(landed, id);
    assert.deepEqual(releaseRecordedLand(landed.cwd), { released: [landed.result.landSettlement.operationId], warnings: [] });
    assertNoLandCandidate(landed.cwd);
    assert.deepEqual(releaseRecordedLand(landed.cwd), { released: [], warnings: [] }, 'nothing is left for a second sweep');
  });
}

test('the release sweep leaves a retained Land candidate alone when Work recorded no result for its operation, a prepared operation included', async () => {
  const { releaseRecordedLand } = await import('../../src/runner/merge.mjs');
  const { addDecision } = await import('../../src/state/store.mjs');
  const landed = await landLeavingCandidate('tsk-sweep-unrecorded');
  // Approve records the operation before Land starts; that is a plan, not a result.
  addDecision(landed.fgosDir, { id: 'tsk-sweep-unrecorded', kind: 'engine', text: 'approve: prepare Land operation', rationale: 'retain the identity',
    landOperation: { operationId: landed.result.landSettlement.operationId, source: 's', destination: 'refs/heads/main' } });
  assert.deepEqual(releaseRecordedLand(landed.cwd), { released: [], warnings: [] });
  assert.equal(fs.readdirSync(landed.candidates).length, 1, 'the candidate stays');
});

test('the Land acknowledgement is the recording event\'s hash, so two origins recording the same item and sequence differ', async () => {
  const { landAcknowledgement } = await import('../../src/runner/merge.mjs');
  const here = landAcknowledgement({ seq: 7, origin: 'machine-a', h: 'a'.repeat(64) });
  const there = landAcknowledgement({ seq: 7, origin: 'machine-b', h: 'b'.repeat(64) });
  assert.notEqual(here, there);
  assert.match(here, /^work-event:a{64}$/);
  assert.equal(landAcknowledgement({ seq: 7 }), '', 'an event with no hash names nothing durable, and Land refuses an empty acknowledgement');
});

test('a Land command releases the candidates Work already recorded as it ends, and a command that cannot land does not look', async () => {
  const landed = await landLeavingCandidate('tsk-sweep-bin');
  const { moveWork } = await import('../../src/state/store.mjs');
  moveWork(landed.fgosDir, { id: 'tsk-sweep-bin', to: 'delivered', expectedStatus: 'awaiting-approval', role: 'human', mergedSha: landed.result.receipt.localEffect.publishedOid, mergedInto: 'main', landSettlement: landed.result.landSettlement });
  const bin = path.resolve(import.meta.dirname, '../../bin/fgos.mjs');
  const run = (...args) => execFileSync(process.execPath, [bin, ...args], { cwd: landed.cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  run('list');
  assert.equal(fs.readdirSync(landed.candidates).length, 1, 'a read-only command leaves the sweep to the commands that can land');
  assert.throws(() => run('approve', 'tsk-missing'), /tsk-missing/);
  assertNoLandCandidate(landed.cwd);
});
