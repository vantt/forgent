// lock-fence.mjs — `fgos lock fence <name>`: stop whatever process holds a
// registry lock, so a lock a wedged holder keeps can be taken again. The
// lock is a kernel lock on an open file description; a holder that dies
// releases by dying. This module never takes the lock from a live holder: it
// lists the holders, signals them by identity (pid plus start time, so a
// recycled pid is never hit), and then asks the kernel with a probe whether
// the lock is free.
//
// Holders come from the Linux /proc scan (`lockHolders`). Where the platform
// cannot list them, `attestStopped` lets the caller say the holders are
// already stopped: the answer is then only a probe, never a signal.

import fs from 'node:fs';
import { lockHolders, probe, resolveLock, lockEntry, resolveLockRoot, HolderLockError } from '../holder-lock/index.mjs';
import { ownPidChain } from '../holder-lock/fences.mjs';

export const TERM_WAIT_MS = 5000;
export const KILL_WAIT_MS = 3000;
const POLL_MS = 50;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** `--param k=v` (one string or a list of them) as `{ k: v }`. */
export function parseLockParams(raw) {
  const params = {};
  const items = raw === undefined || raw === true ? [] : Array.isArray(raw) ? raw : [raw];
  for (const item of items) {
    const text = String(item);
    const at = text.indexOf('=');
    if (at <= 0) throw new HolderLockError('lock-param-invalid', `--param wants key=value, got ${JSON.stringify(text)}`, { param: text });
    params[text.slice(0, at)] = text.slice(at + 1);
  }
  return params;
}

/** The params a lock row needs that the caller did not give: the repo's
 * `.fgos` for repo locks, the machine lock root for machine locks. */
export function lockParamsFor({ fgosDir, params = {}, scope }) {
  const filled = { ...params };
  if (filled.fgosDir === undefined) filled.fgosDir = fgosDir;
  if (filled.lockRoot === undefined && scope === 'machine') filled.lockRoot = resolveLockRoot({ fgosDir });
  return filled;
}

/** Start time (clock ticks since boot) of `pid`, the half of its identity a
 * recycled pid cannot share. Null when the process is gone. */
function startTimeOf(pid) {
  try {
    const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
    // The command name is parenthesised and may hold spaces: fields count after the last ')'.
    const rest = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
    return rest[19] ?? null;
  } catch {
    return null;
  }
}

function cmdlineOf(pid) {
  try {
    return fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0').filter(Boolean).join(' ');
  } catch {
    return '';
  }
}

function identityOf(pid) {
  return { pid, startTime: startTimeOf(pid), cmdline: cmdlineOf(pid) };
}

/** Send `signal` to the holder only while it is still the process listed. */
function signalByIdentity(holder, signal) {
  if (startTimeOf(holder.pid) !== holder.startTime) return false;
  try {
    process.kill(holder.pid, signal);
    return true;
  } catch (err) {
    if (err.code === 'ESRCH') return false;
    throw new HolderLockError('lock-fence-signal-refused', `pid ${holder.pid} refused ${signal}: ${err.code}`, { pid: holder.pid, signal });
  }
}

function stillHolding(name, params, holders) {
  const now = lockHolders(name, params);
  if (now.kind !== 'list') return holders;
  return holders.filter((holder) => now.pids.includes(holder.pid) && startTimeOf(holder.pid) === holder.startTime);
}

async function waitUntilGone(name, params, holders, ms) {
  const deadline = Date.now() + ms;
  let left = holders;
  for (;;) {
    left = stillHolding(name, params, left);
    if (left.length === 0 || Date.now() >= deadline) return left;
    await sleep(POLL_MS);
  }
}

/**
 * fenceLock({ name, fgosDir, params, confirm, attestStopped }) -> result
 *
 * `confirm(holders)` is asked once, before the first signal, and returns
 * true to go on; a caller that has no answer passes `async () => false`.
 * Results: `{ status: 'free' }` (nobody holds it), `{ status: 'attested-free' }`
 * (unlistable platform, caller attested, probe says free) or
 * `{ status: 'fenced', holders, terminated, killed }`. Everything else is a
 * named HolderLockError and nothing was signalled.
 */
export async function fenceLock({ name, fgosDir, params = {}, confirm, attestStopped = false }) {
  const filled = lockParamsFor({ fgosDir, params, scope: lockEntry(name).scope });
  const lock = resolveLock(name, filled);
  // A lock file that does not exist cannot be held; nothing is created to ask.
  if (!fs.existsSync(lock.v3Path)) {
    return { lock: name, path: lock.v3Path, status: 'free', holders: [], terminated: [], killed: [] };
  }
  const listed = lockHolders(name, filled);

  if (listed.kind === 'unlistable') {
    if (!attestStopped) {
      throw new HolderLockError('lock-fence-unlistable', `${name}: holders cannot be listed here (${listed.reason}); stop the holder yourself and re-run with --attest-stopped to have the lock checked`, { lock: name, reason: listed.reason });
    }
    if (probe(name, filled).result !== 'free') {
      throw new HolderLockError('lock-fence-still-held', `${name} is still held although the holder was attested stopped; it is not taken from a live holder`, { lock: name });
    }
    return { lock: name, path: lock.v3Path, status: 'attested-free', holders: [], terminated: [], killed: [] };
  }

  if (listed.pids.length === 0) {
    if (probe(name, filled).result === 'free') {
      return { lock: name, path: lock.v3Path, status: 'free', holders: [], terminated: [], killed: [] };
    }
    throw new HolderLockError('lock-fence-unlistable', `${name} is held, but no holder is visible to this user (another user's process?); nothing was signalled`, { lock: name });
  }

  const own = new Set(ownPidChain());
  const holders = listed.pids.map(identityOf);
  const self = holders.filter((holder) => own.has(holder.pid));
  if (self.length > 0) {
    throw new HolderLockError('lock-fence-self', `${name} is held by this process or one of its parents (pid ${self.map((holder) => holder.pid).join(', ')}); not fenced`, { lock: name, pids: self.map((holder) => holder.pid) });
  }

  if (!(await confirm(holders))) {
    throw new HolderLockError('lock-fence-not-confirmed', `${name} is held by ${holders.map((holder) => `pid ${holder.pid}`).join(', ')}; nothing was signalled (confirm, or pass --yes)`, { lock: name, holders });
  }

  const terminated = holders.filter((holder) => signalByIdentity(holder, 'SIGTERM')).map((holder) => holder.pid);
  let left = await waitUntilGone(name, filled, holders, TERM_WAIT_MS);
  const killed = left.filter((holder) => signalByIdentity(holder, 'SIGKILL')).map((holder) => holder.pid);
  left = await waitUntilGone(name, filled, left, KILL_WAIT_MS);

  if (left.length > 0 || probe(name, filled).result !== 'free') {
    throw new HolderLockError('lock-fence-still-held', `${name} is still held after SIGTERM and SIGKILL${left.length ? ` (pid ${left.map((holder) => holder.pid).join(', ')})` : ''}`, { lock: name, pids: left.map((holder) => holder.pid) });
  }
  return { lock: name, path: lock.v3Path, status: 'fenced', holders, terminated, killed };
}
