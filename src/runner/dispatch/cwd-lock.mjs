// cwd-lock.mjs -- the per-working-directory dispatch lock.
//
// One writing dispatch at a time per working directory, because two writers in
// one tree race. The lock is a kernel lease at
// `<fgosDir>/locks/dispatch-cwd--<dev>-<ino>-<birthtimeNs>.lock`, keyed by the directory's
// identity after realpath, so a worktree reached through a symlink is the same
// lock. It has no TTL and no heartbeat: a holder that dies releases it at once.

import fs from 'node:fs';
import { acquireSync, createLockScope, lockHolders, probe, resolveLock } from '../../holder-lock/index.mjs';
import { DispatchError } from './dispatch-error.mjs';

const LOCK_NAME = 'dispatch-cwd';

function lockParams(fgosDir, cwd) {
  return { fgosDir, cwd };
}

/** The first pid the kernel lists as holding the lock, or null where holders cannot be listed. */
function holderPidOf(params) {
  const holders = lockHolders(LOCK_NAME, params);
  return holders.kind === 'list' && holders.pids.length > 0 ? holders.pids[0] : null;
}

/**
 * Take the lock for `cwd` with one try. Returns the handle (release it in a
 * `finally`); throws `DispatchError('dispatch-in-flight')` naming the holder
 * when another dispatch has it, `DispatchError('worker-spawn-fail')` when
 * `cwd` does not exist.
 */
export function acquireDispatchCwdLock(fgosDir, cwd) {
  return acquireDispatchCwdLockIn(createLockScope(LOCK_NAME), fgosDir, cwd);
}

/** Admit a custody successor. A free lease never proves a best-effort domain empty. */
export function admitSuccessor(scope, fgosDir, cwd) {
  if (!fs.existsSync(cwd)) throw new DispatchError('worker-spawn-fail', `dispatch cwd "${cwd}" does not exist.`, { cwd });
  const lockPath = resolveLock(LOCK_NAME, lockParams(fgosDir, cwd)).v3Path;
  try { return acquireDispatchCwdLockIn(scope, fgosDir, cwd, { predecessorKinds: ['linux-gate', 'windows-job'] }); }
  catch (error) {
    if (error.code === 'lock-predecessor-domain-not-empty') {
      throw new DispatchError('custody-predecessor-unknown', `preserve cwd "${cwd}": the predecessor domain is not proven empty`, { cwd, lockPath, recovery: { check: 'git-worktree-recovery', disposition: 'preserve', next: 'new-worktree' } });
    }
    throw error;
  }
}

/**
 * The same acquire inside a scope the caller already holds locks in, so the order check
 * (attempt before dispatch-cwd) covers it.
 */
export function acquireDispatchCwdLockIn(scope, fgosDir, cwd, policy = {}) {
  // The lock is keyed by the directory itself, so a directory that is not
  // there cannot be dispatched into: say so plainly, as the spawn would.
  if (!fs.existsSync(cwd)) {
    throw new DispatchError('worker-spawn-fail', `dispatch cwd "${cwd}" does not exist.`, { cwd });
  }
  const params = lockParams(fgosDir, cwd);
  const res = acquireSync(scope, LOCK_NAME, { ...params, ...policy });
  if (res.result === 'acquired') return res.handle;
  const holderPid = holderPidOf(params);
  const holder = holderPid ? ` by process ${holderPid}` : '';
  throw new DispatchError(
    'dispatch-in-flight',
    `dispatch for cwd "${cwd}" is already in flight (held${holder}).`,
    { cwd, holderPid, lockPath: resolveLock(LOCK_NAME, params).v3Path },
  );
}

/**
 * `{ pid, lockPath }` of the dispatch holding `cwd`'s lock (pid null where the
 * kernel cannot list holders), or null when nothing holds it. Reads the kernel
 * holder list, which takes no lock, so a check never makes a concurrent
 * dispatch see the lock held; the probe is only for a platform that cannot list.
 */
export function dispatchCwdHolder(fgosDir, cwd) {
  // A directory that does not exist has no dispatch running in it.
  if (!fs.existsSync(cwd)) return null;
  const params = lockParams(fgosDir, cwd);
  const lockPath = resolveLock(LOCK_NAME, params).v3Path;
  // A lock file never created was never taken: nothing to look at.
  if (!fs.existsSync(lockPath)) return null;
  const holders = lockHolders(LOCK_NAME, params);
  if (holders.kind === 'list') return holders.pids.length > 0 ? { pid: holders.pids[0], lockPath } : null;
  return probe(LOCK_NAME, params).result === 'free' ? null : { pid: null, lockPath };
}

/** A failed handoff leaves predecessor evidence intact and preserves the settled result. */
export function recordCustodyHandoff(custody, result) {
  try { custody?.clearDomain(); }
  catch (error) {
    const warning = { code: 'custody-handoff-not-recorded', detail: error.message };
    Object.defineProperty(result, 'warnings', { value: [...(result.warnings ?? []), warning], writable: true, enumerable: true, configurable: true });
  }
}
