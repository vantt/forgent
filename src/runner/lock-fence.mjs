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
import { judge, observe, signalByIdentity } from './dispatch/process-identity.mjs';
import { ownPidChain } from '../holder-lock/fences.mjs';
import { hotPaths, readHotRecord, clearHotRecord, judgeHotRecord } from '../state/hot-lock.mjs';

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

/** Send `signal` to each holder only while it is still the process recorded. Returns who was sent it and who
 * has no such signal on this platform (`unsupported`: Windows has no graceful one). A holder that is no longer
 * the recorded process was sent nothing and needs no signal; a refusal is named. */
function sendAll(holders, signal) {
  const sent = [];
  const unsupported = [];
  for (const holder of holders) {
    const outcome = signalByIdentity(holder, signal);
    if (outcome === 'sent') sent.push(holder);
    else if (outcome === 'unsupported' && signal === 'term') unsupported.push(holder);
    else if (outcome !== 'identity-mismatch' && outcome !== 'not-found') {
      throw new HolderLockError('lock-fence-signal-refused', `pid ${holder.pid} refused ${signal}: ${outcome}`, { pid: holder.pid, signal });
    }
  }
  return { sent, unsupported };
}

async function waitUntilGone(stillHolding, holders, ms) {
  const deadline = Date.now() + ms;
  let left = holders;
  for (;;) {
    left = stillHolding(left);
    if (left.length === 0 || Date.now() >= deadline) return left;
    await sleep(POLL_MS);
  }
}

/** SIGTERM, a wait, SIGKILL for what is left (at once for a holder that cannot be asked to stop), a wait.
 * `stillHolding(list)` is the subset of `list` that still holds the lock. */
async function terminateHolders(holders, stillHolding) {
  const term = sendAll(holders, 'term');
  const waited = await waitUntilGone(stillHolding, holders.filter((holder) => !term.unsupported.includes(holder)), TERM_WAIT_MS);
  const toKill = [...term.unsupported, ...waited];
  const kill = sendAll(toKill, 'kill');
  const left = await waitUntilGone(stillHolding, toKill, KILL_WAIT_MS);
  return { terminated: term.sent.map((holder) => holder.pid), killed: kill.sent.map((holder) => holder.pid), left };
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
  if (lockEntry(name).kind === 'hot-mutex') return fenceHotRecord({ name, fgosDir, confirm, attestStopped });
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

  // An identity read after one listing can belong to a pid reused since: read it between two listings and keep
  // only the pids both listings name.
  const seen = listed.pids.map((pid) => ({ pid, seen: observe(pid) }));
  const again = lockHolders(name, filled);
  if (again.kind !== 'list') {
    throw new HolderLockError('lock-fence-unlistable', `${name}: holders can no longer be listed (${again.reason}); nothing was signalled`, { lock: name, reason: again.reason });
  }
  const holders = [];
  for (const { pid, seen: now } of seen.filter((entry) => again.pids.includes(entry.pid))) {
    if (now.kind !== 'live') {
      throw new HolderLockError('lock-fence-identity-unknown', `${name}: holder pid ${pid} has no readable identity; stop it yourself and re-run`, { lock: name, pid });
    }
    const { kind, ...record } = now;
    holders.push(record);
  }
  if (holders.length === 0) {
    if (probe(name, filled).result === 'free') return { lock: name, path: lock.v3Path, status: 'free', holders: [], terminated: [], killed: [] };
    throw new HolderLockError('lock-fence-unlistable', `${name} is held, but no holder is visible to this user (another user's process?); nothing was signalled`, { lock: name });
  }
  const own = new Set(ownPidChain());
  const self = holders.filter((holder) => own.has(holder.pid));
  if (self.length > 0) {
    throw new HolderLockError('lock-fence-self', `${name} is held by this process or one of its parents (pid ${self.map((holder) => holder.pid).join(', ')}); not fenced`, { lock: name, pids: self.map((holder) => holder.pid) });
  }

  if (!(await confirm(holders))) {
    throw new HolderLockError('lock-fence-not-confirmed', `${name} is held by ${holders.map((holder) => `pid ${holder.pid}`).join(', ')}; nothing was signalled (confirm, or pass --yes)`, { lock: name, holders });
  }

  const stillHolding = (list) => {
    const now = lockHolders(name, filled);
    return now.kind !== 'list' ? list : list.filter((holder) => now.pids.includes(holder.pid) && judge(holder) === 'alive');
  };
  const { terminated, killed, left } = await terminateHolders(holders, stillHolding);

  if (left.length > 0 || probe(name, filled).result !== 'free') {
    throw new HolderLockError('lock-fence-still-held', `${name} is still held after SIGTERM and SIGKILL${left.length ? ` (pid ${left.map((holder) => holder.pid).join(', ')})` : ''}`, { lock: name, pids: left.map((holder) => holder.pid) });
  }
  return { lock: name, path: lock.v3Path, status: 'fenced', holders, terminated, killed };
}

/**
 * A hot mutex (`state`, `porting-events`) is held by the record file
 * `<fgosDir>/locks/<name>.hot`, not by a kernel lock the holder keeps: the
 * holder is the pid the record names. A record whose holder is provably alive
 * is signalled by identity like any other holder; one that does not parse, or
 * whose holder cannot be judged here, needs `attestStopped` (the person says
 * the holder is gone). The record is then removed under the reclaim lock.
 */
async function fenceHotRecord({ name, fgosDir, confirm, attestStopped }) {
  const { record: recordPath } = hotPaths(fgosDir, name);
  const seen = readHotRecord(recordPath);
  const result = (status, holders = [], terminated = [], killed = []) => ({ lock: name, path: recordPath, status, holders, terminated, killed });
  if (seen.state === 'absent') return result('free');

  let holders = [];
  let terminated = [];
  let killed = [];
  const verdict = seen.state === 'ok' ? judgeHotRecord(seen.record) : 'unreadable';
  if (verdict === 'alive') {
    // The record is its own tuple: no second read of the process, so a holder that vanished since the judge
    // yields not-found or identity-mismatch from the signal and is never confused with another process.
    const holder = seen.record;
    if (new Set(ownPidChain()).has(holder.pid)) {
      throw new HolderLockError('lock-fence-self', `${name} is held by this process or one of its parents (pid ${holder.pid}); not fenced`, { lock: name, pids: [holder.pid] });
    }
    holders = [holder];
    if (!(await confirm(holders))) {
      throw new HolderLockError('lock-fence-not-confirmed', `${name} is held by pid ${holder.pid}; nothing was signalled (confirm, or pass --yes)`, { lock: name, holders });
    }
    const outcome = await terminateHolders(holders, (list) => list.filter((h) => judge(h) === 'alive'));
    ({ terminated, killed } = outcome);
    if (outcome.left.length > 0) {
      throw new HolderLockError('lock-fence-still-held', `${name} is still held after SIGTERM and SIGKILL (pid ${outcome.left.map((h) => h.pid).join(', ')})`, { lock: name, pids: outcome.left.map((h) => h.pid) });
    }
  } else if (verdict !== 'dead' && !attestStopped) {
    const why = verdict === 'unreadable' ? 'its record does not parse' : 'its holder cannot be judged here';
    throw new HolderLockError('lock-fence-unlistable', `${name}: ${why}; stop the holder yourself and re-run with --attest-stopped to remove the record (${recordPath})`, { lock: name, record: recordPath });
  }
  if (!clearHotRecord(fgosDir, name, seen.raw)) {
    throw new HolderLockError('lock-fence-still-held', `${name}: the record at ${recordPath} changed while it was being cleared; nothing was removed`, { lock: name, record: recordPath });
  }
  return result(holders.length > 0 ? 'fenced' : 'attested-free', holders, terminated, killed);
}
