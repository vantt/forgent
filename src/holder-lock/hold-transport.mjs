// hold-transport.mjs -- the Windows transport of the lock port. Node cannot
// call LockFileEx, and the lock belongs to the process that took it, so one
// `fgos internal lock-hold` helper lives for as long as the lock is held
// (packages/holder-lock/contracts/internal-route.lock-hold.v1.json).
//
// Node and the helper talk through files in a private work directory, never
// through stdin: libuv queues pipe writes until the event loop turns, and a
// synchronous acquire blocks the loop. The helper's stdio is `ignore`, and it
// is unref'd, so a held lock never keeps a CLI's event loop alive; libuv's
// kill-on-close job ends it when Node dies, and it also waits on its parent.
//
// Release is TerminateProcess on the helper: the kernel frees the lock at
// once. `process.kill(pid, 0)` then tells when the helper is gone; the pid
// cannot be reused while libuv still holds the unreaped child handle.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { HolderLockError, PROTOCOL, parseRouteLine } from './protocol.mjs';
import { routeLineOrThrow } from './driver.mjs';

const WORK_PREFIX = 'fgos-lock-hold-';
const READY_POLL_MS = 2;
const EXIT_POLL_MS = 1;
/** Bound on waiting for a terminated helper to be gone. */
export const HELPER_EXIT_BOUND_MS = 2000;
const STALE_WORK_AGE_MS = 60 * 60 * 1000;
const STALE_WORK_MAX_PER_CALL = 50;

let sequence = 0;

export function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Is `pid` a live process (or one this user may not signal)? */
function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

/** Delete work directories an interrupted acquire left behind: older than an
 * hour, and not owned by a live process (the owner's pid is in the name; a
 * long-held lock keeps its directory, which ages without changing). At most
 * `STALE_WORK_MAX_PER_CALL` per call. */
export function sweepStaleWorkDirs({ tmpdir = os.tmpdir(), now = Date.now() } = {}) {
  let names;
  try {
    names = fs.readdirSync(tmpdir).filter((name) => name.startsWith(WORK_PREFIX));
  } catch {
    return 0;
  }
  let removed = 0;
  for (const name of names) {
    if (removed >= STALE_WORK_MAX_PER_CALL) break;
    const dir = path.join(tmpdir, name);
    try {
      if (now - fs.statSync(dir).mtimeMs < STALE_WORK_AGE_MS) continue;
      const ownerPid = Number(/^fgos-lock-hold-(\d+)-/.exec(name)?.[1]);
      if (Number.isInteger(ownerPid) && ownerPid > 0 && pidAlive(ownerPid)) continue;
      fs.rmSync(dir, { recursive: true, force: true });
      removed += 1;
    } catch {
      // gone already, or not ours to remove
    }
  }
  return removed;
}

function holdArgv({ lockPath, mode = 'ex', wait, killWaitMs, work }) {
  const waitArgs = wait.kind === 'ms' ? ['--wait-ms', String(wait.ms)] : ['--try'];
  return ['internal', 'lock-hold', '--protocol', String(PROTOCOL), '--path', path.resolve(lockPath), '--mode', mode, ...waitArgs, '--kill-wait-ms', String(killWaitMs), '--work', work];
}

/** Remove a work directory; a failure leaves it for the next sweep. */
export function removeWorkDir(work) {
  try {
    fs.rmSync(work, { recursive: true, force: true });
  } catch {
    // swept later
  }
}

/** Start one helper with a fresh work directory. `{ child, pid, work }`; the
 * work directory is removed again when the helper cannot start. */
export function startHold({ bin, lockPath, wait, killWaitMs, env }) {
  sweepStaleWorkDirs();
  sequence += 1;
  const work = fs.mkdtempSync(path.join(os.tmpdir(), `${WORK_PREFIX}${process.pid}-${sequence}-`));
  let child;
  try {
    child = spawn(bin, holdArgv({ lockPath, wait, killWaitMs, work }), { env, stdio: 'ignore', windowsHide: true });
  } catch (err) {
    removeWorkDir(work);
    throw new HolderLockError('lock-driver-unavailable', `cannot run ${bin}: ${err.message}`, { reason: 'no-host-binary', tried: [bin] });
  }
  // A spawn that failed (ENOENT) has no pid; the error event only fires when
  // the loop turns, which a synchronous acquire never lets it do.
  child.on('error', () => {});
  if (!Number.isInteger(child.pid)) {
    removeWorkDir(work);
    throw new HolderLockError('lock-driver-unavailable', `cannot run ${bin}`, { reason: 'no-host-binary', tried: [bin] });
  }
  child.unref();
  return { child, pid: child.pid, work };
}

/** The helper's answer once `ready.json` exists, else null. */
export function readReady(hold, bin) {
  let text;
  try {
    text = fs.readFileSync(path.join(hold.work, 'ready.json'), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
  return routeLineOrThrow(parseRouteLine(text, bin), bin, 'lock-hold');
}

/** Bound after which an unanswered helper is killed. */
export function readyBoundMs(wait, killWaitMs, slackMs) {
  return (wait.kind === 'ms' ? wait.ms : 0) + killWaitMs + slackMs;
}

/** One look at the helper: its answer, or null while it is still working.
 * Throws when it died without answering. */
function pollReady(hold, bin) {
  const line = readReady(hold, bin);
  if (line) return line;
  if (pidAlive(hold.pid)) return null;
  // It may have answered and exited between the two looks.
  const last = readReady(hold, bin);
  if (last) return last;
  removeWorkDir(hold.work);
  throw new HolderLockError('lock-route-bad-output', `${bin} lock-hold exited before it answered`, { pid: hold.pid });
}

/** The helper ran past its bound: end it and remove its directory. */
function abandon(hold) {
  try {
    terminateSync(hold);
  } finally {
    removeWorkDir(hold.work);
  }
}

/** Poll until the helper answers. `{ line }`, or `{ line: null }` once `boundMs`
 * has passed (the helper is then killed and its directory removed). */
export function waitReadySync(hold, bin, boundMs) {
  const deadline = Date.now() + boundMs;
  for (;;) {
    const line = pollReady(hold, bin);
    if (line) return { line };
    if (Date.now() >= deadline) {
      abandon(hold);
      return { line: null };
    }
    sleepSync(READY_POLL_MS);
  }
}

/** The async twin: polls with timers, so the event loop keeps turning. */
export async function waitReady(hold, bin, boundMs) {
  const deadline = Date.now() + boundMs;
  for (;;) {
    const line = pollReady(hold, bin);
    if (line) return { line };
    if (Date.now() >= deadline) {
      abandon(hold);
      return { line: null };
    }
    await new Promise((resolve) => setTimeout(resolve, READY_POLL_MS));
  }
}

/** Terminate the helper and wait until it is gone: the lock is free by then.
 * Throws `lock-release-stuck` past `HELPER_EXIT_BOUND_MS`. */
export function terminateSync(hold) {
  hold.child.kill();
  const deadline = Date.now() + HELPER_EXIT_BOUND_MS;
  while (pidAlive(hold.pid)) {
    if (Date.now() >= deadline) {
      throw new HolderLockError('lock-release-stuck', `lock-hold helper ${hold.pid} did not end within ${HELPER_EXIT_BOUND_MS} ms of being terminated`, { pid: hold.pid });
    }
    sleepSync(EXIT_POLL_MS);
  }
}

/** Release a held lock: terminate the helper, then remove its directory. */
export function releaseHold(hold) {
  terminateSync(hold);
  removeWorkDir(hold.work);
}
