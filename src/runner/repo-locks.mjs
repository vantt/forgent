// repo-locks.mjs — the one door to the runner's repo locks: the main
// checkout mutex (rank 50) and the worktree-admin mutex (rank 40). The
// per-target merge slot (rank 20) belongs to Land's own session (Git spec
// §9). Each is a kernel lock on an open file
// description taken through the holder-lock facade: no TTL, no heartbeat, no
// pid self-recognition. A holder that dies releases by dying.
//
// This module knows nothing about the event log.

import fs from 'node:fs';
import crypto from 'node:crypto';
import { gitPortOptions } from '../git/inspect.mjs';
import { createGitWorktree } from '../git/worktree.mjs';
import { acquire, acquireSync, lockHolders, HolderLockError } from '../holder-lock/index.mjs';

const MAIN_CHECKOUT = 'main-checkout';
const WORKTREE_ADMIN = 'worktree-admin';

// `git worktree add` is short; the synchronous creation helpers wait for the
// holder rather than failing, so concurrent adds queue instead of erroring.
const DEFAULT_WORKTREE_ADMIN_WAIT_MS = 30_000;

/** Hold the lock `name` across `fn(handle)`, release in `finally`. `held`
 * and `timeout` answers become one named error, `lock-held`, which carries
 * the pids the kernel shows on the lock file (diagnostic only). */
async function withRepoLock(scope, name, params, label, fn, { waitMs } = {}) {
  const res = await acquire(scope, name, params, { waitMs });
  if (res.result !== 'acquired') {
    const holders = lockHolders(name, params);
    const pids = holders.kind === 'list' ? holders.holders.map((h) => h.pid) : [];
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
 * names the operation in the error and in `lock-status`. Git writes use a
 * typed port with this verified main handle.
 */
export function withMainCheckout(scope, purpose, fn, { fgosDir, waitMs } = {}) {
  return withRepoLock(scope, MAIN_CHECKOUT, { fgosDir }, `main checkout (${purpose})`, fn, { waitMs });
}

/** withWorktreeAdmin(scope, fgosDir, fn, { waitMs }) — serializes `git worktree add`. */
export function withWorktreeAdmin(scope, fgosDir, fn, { waitMs } = {}) {
  return withRepoLock(scope, WORKTREE_ADMIN, { fgosDir }, 'worktree admin', fn, { waitMs });
}

function lockHeldError(res, label, fgosDir) {
  const holders = lockHolders(WORKTREE_ADMIN, { fgosDir });
  const pids = holders.kind === 'list' ? holders.holders.map((h) => h.pid) : [];
  return new HolderLockError(
    'lock-held',
    `${label} is held by another process${pids.length ? ` (pid ${pids.join(', ')})` : ''}${res.result === 'timeout' ? ` after waiting ${res.waitedMs} ms` : ''}`,
    { lock: WORKTREE_ADMIN, label, holders: pids, timedOut: res.result === 'timeout' },
  );
}

/** Typed creation; the same holder spans native inspection and registration. */
export function createWorktreeCheckoutSync(scope, repoRoot, request, { waitMs = DEFAULT_WORKTREE_ADMIN_WAIT_MS } = {}) {
  scope.assertCanAcquire(WORKTREE_ADMIN, 40);
  const options = gitPortOptions(repoRoot, { mutation: true });
  const fgosDir = `${options.trustedMain}/.fgos`;
  const res = acquireSync(scope, WORKTREE_ADMIN, { fgosDir }, { waitMs });
  if (res.result !== 'acquired') throw lockHeldError(res, 'worktree admin', fgosDir);
  try {
    // The caller allocated this empty placeholder; native creation requires an absent destination.
    if (fs.existsSync(request.path) && fs.readdirSync(request.path).length === 0) fs.rmdirSync(request.path);
    const port = createGitWorktree(options);
    return port[request.branch ? 'create' : 'createDetached']({ ...request, operationId: request.operationId ?? crypto.randomUUID() }, [res.handle]);
  } finally { res.handle.release(); }
}

// Compatibility translation for remaining Land callers; remove with the last importer.
function creationRequest(args) {
  const words = [...args];
  const detached = words[0] === '--detach';
  let branch;
  if (words[0] === '-b') { words.shift(); branch = words.shift(); }
  else if (detached) words.shift();
  const target = words.shift();
  const base = words.shift();
  return { path: target, ...(detached ? {} : { branch: branch ?? base }), ...(branch || detached ? { base: base ?? 'HEAD' } : { base }) };
}
export function addWorktreeSync(scope, repoRoot, args, options) {
  try { createWorktreeCheckoutSync(scope, repoRoot, creationRequest(args), options); return ''; }
  catch (err) {
    if (err instanceof HolderLockError) throw err;
    throw new Error(`git worktree add ${args.join(' ')} failed: ${err.message}`, { cause: err });
  }
}
export async function addWorktree(scope, repoRoot, args, options = {}) {
  scope.assertCanAcquire(WORKTREE_ADMIN, 40);
  const context = gitPortOptions(repoRoot, { mutation: true });
  const request = creationRequest(args);
  return withWorktreeAdmin(scope, `${context.trustedMain}/.fgos`, handle => {
    try {
      if (fs.existsSync(request.path) && fs.readdirSync(request.path).length === 0) fs.rmdirSync(request.path);
      createGitWorktree(context)[request.branch ? 'create' : 'createDetached']({ ...request, operationId: crypto.randomUUID() }, [handle]);
      return '';
    } catch (err) { throw new Error(`git worktree add ${args.join(' ')} failed: ${err.message}`, { cause: err }); }
  }, options);
}
