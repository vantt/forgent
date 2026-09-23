// full-suite-queue.mjs -- machine-wide one-at-a-time queue for full-suite
// runs. Each full run already fans out across (almost) every CPU core, so
// two or three of them started at once from different sessions/worktrees do
// not finish sooner than running back to back -- they all slow down together
// and timing-sensitive tests start flaking under the load. Queuing keeps
// each run at full speed and makes the wait visible instead of silent.
//
// The lock is a single file in the OS temp dir, created atomically with
// `open(..., 'wx')` and holding the owner's pid/cwd/start time. A lock whose
// pid is no longer alive is stale (crashed or killed run) and is reclaimed.
// The child suite gets QUEUE_HELD_ENV so a test that itself spawns the
// full-suite door never waits on the lock its own parent run holds.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const QUEUE_HELD_ENV = 'FGOS_FULL_SUITE_QUEUE_HELD';
export const QUEUE_SWITCH_ENV = 'FGOS_FULL_SUITE_QUEUE';
export const DEFAULT_LOCK_PATH = path.join(os.tmpdir(), 'fgos-full-suite.lock');
const POLL_MS = 2000;

export function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // EPERM: the process exists but belongs to another user -- still alive.
    return err.code === 'EPERM';
  }
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function readHolder(lockPath) {
  try {
    return JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Blocks until this process holds the full-suite lock, then returns a
 * `release()` function (idempotent, also run on process exit). Returns a
 * no-op release without locking when the queue is switched off
 * (`FGOS_FULL_SUITE_QUEUE=off`) or a parent run already holds it
 * (QUEUE_HELD_ENV set).
 */
export function acquireFullSuiteQueue({
  lockPath = DEFAULT_LOCK_PATH,
  env = process.env,
  pid = process.pid,
  cwd = process.cwd(),
  isAlive = isPidAlive,
  sleep = sleepSync,
  log = (msg) => console.error(msg),
  now = () => Date.now(),
} = {}) {
  if (env[QUEUE_SWITCH_ENV] === 'off' || env[QUEUE_HELD_ENV] === '1') return () => {};

  const waitStart = now();
  let announcedPid = null;
  for (;;) {
    try {
      const fd = fs.openSync(lockPath, 'wx');
      fs.writeSync(fd, JSON.stringify({ pid, cwd, startedAt: new Date(now()).toISOString() }));
      fs.closeSync(fd);
      break;
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }

    const holder = readHolder(lockPath);
    if (!holder || !isAlive(holder.pid)) {
      // A half-written lock (holder null) is only ever seen for an instant
      // between another run's open and write -- re-check once after a
      // poll before treating it as stale.
      if (!holder) {
        sleep(50);
        if (readHolder(lockPath)) continue;
      }
      try {
        fs.unlinkSync(lockPath);
      } catch {
        // another waiter reclaimed it first -- just retry the open
      }
      continue;
    }

    if (announcedPid !== holder.pid) {
      log(`run-tests: another full-suite run holds the machine-wide queue (pid ${holder.pid}, cwd ${holder.cwd}, since ${holder.startedAt}) -- waiting. Set ${QUEUE_SWITCH_ENV}=off to skip the queue.`);
      announcedPid = holder.pid;
    }
    sleep(POLL_MS);
  }

  const waitedMs = now() - waitStart;
  if (announcedPid !== null) log(`run-tests: queue acquired after ${Math.round(waitedMs / 1000)}s.`);

  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    process.removeListener('exit', release);
    const holder = readHolder(lockPath);
    if (holder && holder.pid === pid) {
      try {
        fs.unlinkSync(lockPath);
      } catch {
        // already gone
      }
    }
  };
  process.on('exit', release);
  return release;
}
