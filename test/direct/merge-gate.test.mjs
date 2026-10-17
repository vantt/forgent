import test from 'node:test';
import assert from 'node:assert/strict';
import { approveUseCase } from '../../src/verbs/merge/approve.mjs';
import { addWork } from '../../src/state/store.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const execGit = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8' });

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
  
  addTestWork(fgosDir, 'tsk-test', { status: 'awaiting-approval' });
  execGit(cwd, ['add', '.fgos']);
  execGit(cwd, ['commit', '-m', 'add work']);
  
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
  const { mergeRootIntoMainCas } = await import('../../src/runner/merge.mjs');
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

  execGit(cwd, ['branch', 'fgw/tsk-dep', 'HEAD']);
  execGit(cwd, ['checkout', 'fgw/tsk-dep']);
  fs.writeFileSync(path.join(cwd, 'feature.txt'), 'feature\n');
  execGit(cwd, ['add', 'feature.txt']);
  execGit(cwd, ['commit', '-m', 'add feature']);
  execGit(cwd, ['checkout', 'main']);
  const mainBefore = execGit(cwd, ['rev-parse', 'HEAD']).trim();

  const item = { id: 'tsk-dep', verify: `node -e "require('fgos-merge-gate-localdep')"` };
  const result = await mergeRootIntoMainCas(cwd, item, 'fgw/tsk-dep', { timeoutMs: 60000 });

  assert.equal(result.outcome, 'merged', `expected merged, got ${result.outcome}: ${result.check?.output ?? ''}`);
  assert.notEqual(execGit(cwd, ['rev-parse', 'main']).trim(), mainBefore, 'main should advance to the merge commit');
});

test('root-into-main merge gate: verify runs under the trunk\'s merge slot but without the main checkout mutex, so other fgos commands are not refused meanwhile', async () => {
  const { mergeRootIntoMainCas } = await import('../../src/runner/merge.mjs');
  const { withMainCheckout } = await import('../../src/runner/repo-locks.mjs');
  const { createLockScope, probe } = await import('../../src/holder-lock/index.mjs');
  const os = await import('node:os');
  const cwd = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-lock-')));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  execGit(cwd, ['commit', '--allow-empty', '-m', 'initial']);
  fs.mkdirSync(path.join(cwd, '.fgos'));
  execGit(cwd, ['branch', 'fgw/tsk-lock', 'HEAD']);
  execGit(cwd, ['checkout', 'fgw/tsk-lock']);
  fs.writeFileSync(path.join(cwd, 'feature.txt'), 'feature\n');
  execGit(cwd, ['add', 'feature.txt']);
  execGit(cwd, ['commit', '-m', 'add feature']);
  execGit(cwd, ['checkout', 'main']);

  const marker = path.join(cwd, '.fgos', 'verify-started').replaceAll('\\', '/');
  const item = { id: 'tsk-lock', verify: `node -e "require('fs').writeFileSync('${marker}','1');setTimeout(()=>{},1500)"` };
  const merging = mergeRootIntoMainCas(cwd, item, 'fgw/tsk-lock', { timeoutMs: 60000 });
  const deadline = Date.now() + 20000;
  while (!fs.existsSync(marker)) {
    assert.ok(Date.now() < deadline, 'verify never started');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  const fgosDir = path.join(cwd, '.fgos');
  assert.equal(probe('merge-slot', { fgosDir, ref: 'main' }).result, 'held', 'the trunk\'s slot is held while the merge verifies');
  const entered = await withMainCheckout(createLockScope('concurrent'), 'concurrent', () => 'in', { fgosDir });
  assert.equal(entered, 'in', 'the main mutex is free while verify runs');

  const result = await merging;
  assert.equal(result.outcome, 'merged', `expected merged, got ${result.outcome}: ${result.check?.output ?? ''}`);
  assert.equal(probe('main-checkout', { fgosDir }).result, 'free', 'the main mutex is released after landing');
  assert.equal(probe('merge-slot', { fgosDir, ref: 'main' }).result, 'free', 'the slot is released after landing');
  assert.ok(fs.existsSync(path.join(cwd, 'feature.txt')), 'main checkout working tree synced to the merge');
});

test('root-into-main merge gate: a second merge into the same trunk is refused at once (lockWaitMs 0) while the first holds the slot, and before any verify', async () => {
  const { mergeRootIntoMainCas, MergeError } = await import('../../src/runner/merge.mjs');
  const { holdLockInChild } = await import('../helpers/hold-lock-in-child.mjs');
  const os = await import('node:os');
  const cwd = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-slot-held-')));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  execGit(cwd, ['commit', '--allow-empty', '-m', 'initial']);
  fs.mkdirSync(path.join(cwd, '.fgos'));
  execGit(cwd, ['branch', 'fgw/tsk-slot', 'HEAD']);
  const mainBefore = execGit(cwd, ['rev-parse', 'main']).trim();

  const holder = await holdLockInChild('merge-slot', { fgosDir: path.join(cwd, '.fgos'), ref: 'main' });
  try {
    const err = await mergeRootIntoMainCas(cwd, { id: 'tsk-slot', verify: 'true' }, 'fgw/tsk-slot', { timeoutMs: 60000, lockWaitMs: 0 }).then(() => null, (e) => e);
    assert.ok(err instanceof MergeError, `expected MergeError, got ${err}`);
    assert.equal(err.code, 'lock-held');
    assert.match(err.message, /merge slot of "main" is held by another process/);
    assert.ok(err.holders.includes(holder.child.pid));
    assert.equal(execGit(cwd, ['rev-parse', 'main']).trim(), mainBefore);
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
});

test('root-into-main merge gate: with lockWaitMs 0 a busy main checkout refuses the merge before the verify run', async () => {
  const { mergeRootIntoMainCas } = await import('../../src/runner/merge.mjs');
  const { holdLockInChild } = await import('../helpers/hold-lock-in-child.mjs');
  const os = await import('node:os');
  const cwd = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-main-held-')));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  execGit(cwd, ['commit', '--allow-empty', '-m', 'initial']);
  fs.mkdirSync(path.join(cwd, '.fgos'));
  execGit(cwd, ['branch', 'fgw/tsk-busy', 'HEAD']);
  const verifyRan = path.join(cwd, '.fgos', 'verify-ran').replaceAll('\\', '/');

  const holder = await holdLockInChild('main-checkout', { fgosDir: path.join(cwd, '.fgos') });
  try {
    const err = await mergeRootIntoMainCas(cwd, { id: 'tsk-busy', verify: `node -e "require('fs').writeFileSync('${verifyRan}','1')"` }, 'fgw/tsk-busy', { timeoutMs: 60000, lockWaitMs: 0 }).then(() => null, (e) => e);
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
  const { mergeRootIntoMainCas } = await import('../../src/runner/merge.mjs');
  const cwd = await casRepoWithSetup(['echo built > build-artifact.txt']);
  const item = { id: 'tsk-setup', verify: `node -e "process.exit(require('fs').existsSync('build-artifact.txt') ? 0 : 1)"` };
  const result = await mergeRootIntoMainCas(cwd, item, 'fgw/tsk-setup', { timeoutMs: 60000 });
  assert.equal(result.outcome, 'merged', `expected merged, got ${result.outcome}: ${result.check?.output ?? ''}`);
});

test('root-into-main merge gate: a failing worktreeSetup command is a verify-fail naming the command, main untouched', async () => {
  const { mergeRootIntoMainCas } = await import('../../src/runner/merge.mjs');
  const cwd = await casRepoWithSetup(['node -e "console.error(\'setup-broke\'); process.exit(2)"']);
  const mainBefore = execGit(cwd, ['rev-parse', 'main']).trim();
  const result = await mergeRootIntoMainCas(cwd, { id: 'tsk-setup', verify: 'true' }, 'fgw/tsk-setup', { timeoutMs: 60000 });
  assert.equal(result.outcome, 'verify-fail');
  assert.match(result.check.output, /setup-broke/);
  assert.equal(execGit(cwd, ['rev-parse', 'main']).trim(), mainBefore);
});

test('root-into-main merge gate: a path in ownFileSet dirtied on repoRoot AFTER the merge+verify started (but before the land step) is caught under the lock, not raced past', async () => {
  const { mergeRootIntoMainCas } = await import('../../src/runner/merge.mjs');
  const os = await import('node:os');
  const cwd = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-race-')));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  fs.writeFileSync(path.join(cwd, 'owned.txt'), 'original\n');
  execGit(cwd, ['add', 'owned.txt']);
  execGit(cwd, ['commit', '-m', 'initial']);
  fs.mkdirSync(path.join(cwd, '.fgos'));
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
  const racePromise = mergeRootIntoMainCas(cwd, item, 'fgw/tsk-race', {
    timeoutMs: 60000,
    ownFileSet: new Set(['owned.txt']),
  });
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
  const { mergeRootIntoMainCas } = await import('../../src/runner/merge.mjs');
  const os = await import('node:os');
  const cwd = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-race-unrelated-')));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  execGit(cwd, ['commit', '--allow-empty', '-m', 'initial']);
  fs.mkdirSync(path.join(cwd, '.fgos'));
  execGit(cwd, ['branch', 'fgw/tsk-race-ok', 'HEAD']);
  execGit(cwd, ['checkout', 'fgw/tsk-race-ok']);
  fs.writeFileSync(path.join(cwd, 'feature.txt'), 'feature\n');
  execGit(cwd, ['add', 'feature.txt']);
  execGit(cwd, ['commit', '-m', 'add feature']);
  execGit(cwd, ['checkout', 'main']);

  const item = { id: 'tsk-race-ok', verify: 'node -e "setTimeout(() => process.exit(0), 400)"' };
  const racePromise = mergeRootIntoMainCas(cwd, item, 'fgw/tsk-race-ok', {
    timeoutMs: 60000,
    ownFileSet: new Set(['feature.txt']),
  });
  setTimeout(() => fs.writeFileSync(path.join(cwd, 'unrelated-scratch.txt'), 'another session\'s work\n'), 10);
  const result = await racePromise;

  assert.equal(result.outcome, 'merged', `an unrelated dirty path must not block landing, got ${result.outcome}: ${result.check?.output ?? ''}`);
  assert.equal(fs.readFileSync(path.join(cwd, 'unrelated-scratch.txt'), 'utf8'), "another session's work\n", 'the unrelated file is left untouched, still uncommitted');
});

// approve's --no-wait / --wait against a held merge slot, through the use case
// itself on a real repo and a real other process holding the slot.
async function approvableRootRepo(id) {
  const cwd = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-approve-wait-')));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  execGit(cwd, ['commit', '--allow-empty', '-m', 'initial']);
  const fgosDir = path.join(cwd, '.fgos');
  fs.mkdirSync(fgosDir);
  addTestWork(fgosDir, id, { status: 'awaiting-approval', verify: 'true' });
  execGit(cwd, ['add', '.fgos']);
  execGit(cwd, ['commit', '-m', 'add work']);
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

test('approve --no-wait with the trunk\'s merge slot held fails at once naming the slot, and the item stays awaiting-approval', async () => {
  const { holdLockInChild } = await import('../helpers/hold-lock-in-child.mjs');
  const { listWork } = await import('../../src/state/store.mjs');
  const { cwd, fgosDir } = await approvableRootRepo('tsk-nowait');
  const holder = await holdLockInChild('merge-slot', { fgosDir, ref: 'main' });
  try {
    const started = Date.now();
    await assert.rejects(
      () => approveUseCase({ dir: fgosDir, repoRoot: cwd }, approveOptions('tsk-nowait', { noWait: true })),
      (err) => {
        assert.equal(err.code, 'lock-held');
        assert.match(err.message, /merge slot of "main" is held by another process/);
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
});

test('approve --wait <ms> waits for the held merge slot and lands once the holder releases', async () => {
  const { holdLockInChild } = await import('../helpers/hold-lock-in-child.mjs');
  const { listWork } = await import('../../src/state/store.mjs');
  const { cwd, fgosDir } = await approvableRootRepo('tsk-wait');
  const holder = await holdLockInChild('merge-slot', { fgosDir, ref: 'main' });
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
  const holder = await holdLockInChild('merge-slot', { fgosDir, ref: 'main' });
  try {
    await assert.rejects(
      () => syncRootUseCase({ dir: fgosDir, repoRoot: cwd }, options({ noWait: true })),
      (err) => err.code === 'lock-held' && /merge slot of "main" is held by another process/.test(err.message),
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
