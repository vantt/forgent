import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createLockScope, probe } from '../../src/holder-lock/index.mjs';
import { withMainCheckout, addWorktree, addWorktreeSync } from '../../src/runner/repo-locks.mjs';
import { createClaimWorktree, createWorktree, removeWorktree } from '../../src/runner/worktree.mjs';
import { createWorkflowWorktree } from '../../src/workflow/integrate.mjs';
import { holdLockInChild } from '../helpers/hold-lock-in-child.mjs';
import { HOOK_TEST_SKIP } from '../helpers/main-checkout-hook-repo.mjs';

// `git worktree add` serialized by the worktree-admin mutex across real
// processes, with no checkpoint adapter anywhere.

const skip = HOOK_TEST_SKIP;
const REPO_LOCKS = fileURLToPath(new URL('../../src/runner/repo-locks.mjs', import.meta.url));
const HOLDER = fileURLToPath(new URL('../../src/holder-lock/index.mjs', import.meta.url));

function tempRepo() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-wt-admin-')));
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  git('-c', 'user.email=t@example.com', '-c', 'user.name=T', 'commit', '-q', '--allow-empty', '-m', 'seed');
  return { root, fgosDir: path.join(root, '.fgos'), git };
}

/** A child that adds `count` worktrees, one `git worktree add` each, named after `tag`. */
function addingChild(root, base, tag, count) {
  const script = `
    import { createLockScope } from ${JSON.stringify(HOLDER)};
    import { addWorktreeSync } from ${JSON.stringify(REPO_LOCKS)};
    for (let i = 0; i < ${count}; i += 1) {
      const dir = ${JSON.stringify(base)} + '/${tag}-' + i;
      addWorktreeSync(createLockScope('child'), ${JSON.stringify(root)}, ['-b', 'fgw/${tag}-' + i, dir], { waitMs: 60000 });
    }
  `;
  const child = spawn(process.execPath, ['--input-type=module', '-e', script], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  return new Promise((resolve) => child.once('exit', (code) => resolve({ code, stderr })));
}

test('8 processes adding worktrees for 20 rounds leave every worktree registered and intact', { skip, timeout: 240000 }, async () => {
  const { root, git } = tempRepo();
  const base = path.join(root, 'wts');
  fs.mkdirSync(base);
  const results = await Promise.all(Array.from({ length: 8 }, (_, n) => addingChild(root, base, `p${n}`, 20)));
  for (const r of results) assert.equal(r.code, 0, r.stderr);
  const listed = git('worktree', 'list', '--porcelain').stdout.split('\n').filter((l) => l.startsWith('worktree '));
  assert.equal(listed.length, 1 + 8 * 20);
  const fsck = git('worktree', 'list');
  assert.equal(fsck.status, 0, fsck.stderr);
  assert.equal(fs.readdirSync(path.join(root, '.git', 'worktrees')).length, 8 * 20);
  assert.equal(git('branch', '--list', 'fgw/*').stdout.trim().split('\n').length, 8 * 20);
});

test('a process holding main does not block addWorktree, and worktree-admin does not block main', { skip }, async () => {
  const { root, fgosDir, git } = tempRepo();
  const mainHolder = await holdLockInChild('main-checkout', { fgosDir });
  try {
    const target = path.join(root, 'wt-while-main-held');
    await addWorktree(createLockScope('add-while-main'), root, ['-b', 'fgw/a', target], { waitMs: 2000 });
    assert.equal(fs.existsSync(target), true);
    assert.equal(git('worktree', 'list').status, 0);
  } finally {
    mainHolder.child.kill('SIGKILL');
    await mainHolder.exited;
  }

  const adminHolder = await holdLockInChild('worktree-admin', { fgosDir });
  try {
    const entered = await withMainCheckout(createLockScope('main-while-admin'), 'test', () => 'in', { fgosDir, waitMs: 2000 });
    assert.equal(entered, 'in');
  } finally {
    adminHolder.child.kill('SIGKILL');
    await adminHolder.exited;
  }
});

test('addWorktree while the scope holds main is a lock-order-violation, nothing is created', { skip }, async () => {
  const { root, fgosDir } = tempRepo();
  const scope = createLockScope('holds-main');
  await withMainCheckout(scope, 'claim', async () => {
    const target = path.join(root, 'wt-under-main');
    await assert.rejects(addWorktree(scope, root, ['-b', 'fgw/x', target]), (err) => err.code === 'lock-order-violation');
    assert.throws(() => addWorktreeSync(scope, root, ['-b', 'fgw/y', target]), (err) => err.code === 'lock-order-violation');
    assert.equal(fs.existsSync(target), false);
  }, { fgosDir });
  assert.equal(probe('worktree-admin', { fgosDir }).result, 'free');
});

test('addWorktreeSync waits for a holder and fails with lock-held past waitMs', { skip }, async () => {
  const { root, fgosDir } = tempRepo();
  const holder = await holdLockInChild('worktree-admin', { fgosDir });
  try {
    const target = path.join(root, 'wt-blocked');
    assert.throws(
      () => addWorktreeSync(createLockScope('sync-blocked'), root, ['-b', 'fgw/b', target], { waitMs: 200 }),
      (err) => err.code === 'lock-held' && err.timedOut === true && err.holders.includes(holder.child.pid),
    );
    assert.equal(fs.existsSync(target), false);
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
  const target = path.join(root, 'wt-after');
  addWorktreeSync(createLockScope('sync-after'), root, ['-b', 'fgw/c', target], { waitMs: 2000 });
  assert.equal(fs.existsSync(target), true);
  assert.equal(probe('worktree-admin', { fgosDir }).result, 'free');
});

test('createClaimWorktree forks from startSha, not from the HEAD it would read now', { skip }, () => {
  const { root, git } = tempRepo();
  const startSha = git('rev-parse', 'HEAD').stdout.trim();
  git('-c', 'user.email=t@example.com', '-c', 'user.name=T', 'commit', '-q', '--allow-empty', '-m', 'moved');
  const worktreeDir = path.join(root, 'claims');
  const wt = createClaimWorktree(root, 'tsk-start', { worktreeDir, startSha, scope: createLockScope('claim-wt') });
  try {
    assert.equal(wt.reused, false);
    const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: wt.path, encoding: 'utf8' }).stdout.trim();
    assert.equal(head, startSha);
  } finally {
    removeWorktree(root, wt.path, { force: true });
  }
});

test('createWorkflowWorktree adds through the lock and releases it', { skip }, () => {
  const { root, fgosDir } = tempRepo();
  const wt = createWorkflowWorktree({ repoRoot: root, branch: 'wf/one', worktreeDir: path.join(root, 'wf-one') });
  assert.equal(fs.existsSync(wt.worktreePath), true);
  assert.equal(probe('worktree-admin', { fgosDir }).result, 'free');
});

test('createWorktree surfaces a held worktree-admin as lock-held, not a generic worktree failure', { skip }, async () => {
  const { root, fgosDir } = tempRepo();
  const holder = await holdLockInChild('worktree-admin', { fgosDir });
  try {
    const worktreeDir = path.join(root, 'claims');
    const scope = createLockScope('blocked-claim');
    assert.throws(
      () => createWorktree(root, 'tsk-blocked', { worktreeDir, scope, waitMs: 150 }),
      (err) => err.code === 'lock-held' && err.holders.includes(holder.child.pid),
    );
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
});
