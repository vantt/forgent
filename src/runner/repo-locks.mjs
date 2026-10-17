// repo-locks.mjs — the one door to the three repo locks of the runner: the
// main checkout mutex (rank 50), the per-target merge slot (rank 20) and the
// worktree-admin mutex (rank 40). Each is a kernel lock on an open file
// description taken through the holder-lock facade: no TTL, no heartbeat, no
// pid self-recognition. A holder that dies releases by dying.
//
// This module knows nothing about the event log. The `.fgos` checkpoint is a
// separate adapter (main-fgos-checkpoint.mjs) that attaches to the handle
// `withMainCheckout` gives its callback.

import { spawnSync } from 'node:child_process';
import { acquire, lockHolders, HolderLockError } from '../holder-lock/index.mjs';

const MAIN_CHECKOUT = 'main-checkout';
const MERGE_SLOT = 'merge-slot';
const WORKTREE_ADMIN = 'worktree-admin';

/** Hold the lock `name` across `fn(handle)`, release in `finally`. `held`
 * and `timeout` answers become one named error, `lock-held`, which carries
 * the pids the kernel shows on the lock file (diagnostic only). */
async function withRepoLock(scope, name, params, label, fn, { waitMs } = {}) {
  const res = await acquire(scope, name, params, { waitMs });
  if (res.result !== 'acquired') {
    const holders = lockHolders(name, params);
    const pids = holders.kind === 'list' ? holders.pids : [];
    throw new HolderLockError(
      'lock-held',
      `${label} is held by another process${pids.length ? ` (pid ${pids.join(', ')})` : ''}${res.result === 'timeout' ? ` after waiting ${res.waitedMs} ms` : ''}`,
      { lock: name, label, holders: pids, timedOut: res.result === 'timeout' },
    );
  }
  const { handle } = res;
  let failed = false;
  try {
    return await fn(handle);
  } catch (err) {
    failed = true;
    throw err;
  } finally {
    try {
      handle.release();
    } catch (err) {
      // A borrowed child still running when fn threw must not hide fn's own error.
      if (!failed) throw err;
    }
  }
}

/**
 * withMainCheckout(scope, purpose, fn, { fgosDir, waitMs }) — `fn(mainHandle)`
 * runs while this process holds the main checkout mutex. `purpose` only
 * names the operation in the error and in `lock-status`. A git child that
 * must write the main checkout runs through `runBorrowed(mainHandle, ...)`.
 */
export function withMainCheckout(scope, purpose, fn, { fgosDir, waitMs } = {}) {
  return withRepoLock(scope, MAIN_CHECKOUT, { fgosDir }, `main checkout (${purpose})`, fn, { waitMs });
}

/**
 * withMergeTargetSlot(scope, lockRoot, targetRef, fn, { waitMs }) — the
 * per-target-ref merge slot. Distinct refs never contend. Must be taken
 * before anything reads the target's tip.
 */
export function withMergeTargetSlot(scope, lockRoot, targetRef, fn, { waitMs } = {}) {
  const fgosDir = `${lockRoot}/.fgos`;
  return withRepoLock(scope, MERGE_SLOT, { fgosDir, ref: encodeURIComponent(targetRef) }, `merge slot of "${targetRef}"`, () => fn(), { waitMs });
}

/** withWorktreeAdmin(scope, fgosDir, fn, { waitMs }) — serializes `git worktree add`. */
export function withWorktreeAdmin(scope, fgosDir, fn, { waitMs } = {}) {
  return withRepoLock(scope, WORKTREE_ADMIN, { fgosDir }, 'worktree admin', () => fn(), { waitMs });
}

/** addWorktree(scope, repoRoot, args) — `git worktree add <args>` under the
 * worktree-admin mutex; returns git's stdout, throws on a non-zero exit. */
export function addWorktree(scope, repoRoot, args, { waitMs } = {}) {
  return withWorktreeAdmin(scope, `${repoRoot}/.fgos`, () => {
    const res = spawnSync('git', ['worktree', 'add', ...args], { cwd: repoRoot, encoding: 'utf8' });
    if (res.error) throw res.error;
    if (res.status !== 0) {
      throw new Error(`git worktree add ${args.join(' ')} failed (exit ${res.status}): ${String(res.stderr).trim()}`);
    }
    return res.stdout;
  }, { waitMs });
}
