// full-suite-queue.mjs -- machine-wide one-at-a-time queue for full-suite
// runs. Each full run already fans out across (almost) every CPU core, so
// two or three of them started at once from different sessions/worktrees do
// not finish sooner than running back to back -- they all slow down together
// and timing-sensitive tests start flaking under the load. Queuing keeps
// each run at full speed and makes the wait visible instead of silent.
//
// The queue is the `full-suite` kernel lock (src/holder-lock) at
// `<state root>/locks/full-suite.lock`, one per machine and user. A run that
// dies releases it at once: there is no record to read and nothing stale to
// reclaim. Waiting is unbounded, one `--try` every POLL_MS. The description
// is close-on-exec, so the suite's children never hold the queue; they get
// QUEUE_HELD_ENV instead, so a test that itself spawns the full-suite door
// never waits on the lock its own parent run holds.
//
// Run from a checkout, the lock needs a host binary: FGOS_HOST_BIN (the
// run-tests door builds one first), or the activation above the checkout.
// Without one the run stops with the named error and the way to run
// unqueued.

import { acquireSync, createLockScope, HolderLockError, lockHolders, resolveLockRoot } from '../../src/holder-lock/index.mjs';

export const QUEUE_HELD_ENV = 'FGOS_FULL_SUITE_QUEUE_HELD';
export const QUEUE_SWITCH_ENV = 'FGOS_FULL_SUITE_QUEUE';
export const POLL_MS = 2000;

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function withQueueHint(err) {
  if (!(err instanceof HolderLockError) || err.code !== 'lock-driver-unavailable') return err;
  err.message += ` -- the full-suite queue needs it; set ${QUEUE_SWITCH_ENV}=off to run without queuing.`;
  return err;
}

function holderText(holders) {
  if (holders.kind !== 'list') return `holder not listable: ${holders.reason}`;
  return holders.holders.length > 0 ? `pid ${holders.holders.map((h) => h.pid).join(', ')}` : 'holder just left';
}

/**
 * Blocks until this process holds the full-suite lock, then returns a
 * `release()` function (idempotent, also run on process exit). Returns a
 * no-op release without locking when the queue is switched off
 * (`FGOS_FULL_SUITE_QUEUE=off`) or a parent run already holds it
 * (QUEUE_HELD_ENV set). `lockRoot` defaults to this machine's
 * `<state root>/locks`.
 */
export function acquireFullSuiteQueue({
  env = process.env,
  lockRoot,
  sleep = sleepSync,
  log = (msg) => console.error(msg),
  now = () => Date.now(),
} = {}) {
  if (env[QUEUE_SWITCH_ENV] === 'off' || env[QUEUE_HELD_ENV] === '1') return () => {};

  let handle;
  let announced = null;
  const waitStart = now();
  try {
    const params = { lockRoot: lockRoot ?? resolveLockRoot({ env }) };
    const scope = createLockScope('full-suite');
    for (;;) {
      const res = acquireSync(scope, 'full-suite', params);
      if (res.result === 'acquired') {
        handle = res.handle;
        break;
      }
      const holder = holderText(lockHolders('full-suite', params));
      if (announced !== holder) {
        log(`run-tests: another full-suite run holds the machine-wide queue (${holder}) -- waiting. Set ${QUEUE_SWITCH_ENV}=off to skip the queue.`);
        announced = holder;
      }
      sleep(POLL_MS);
    }
  } catch (err) {
    throw withQueueHint(err);
  }
  if (announced !== null) log(`run-tests: queue acquired after ${Math.round((now() - waitStart) / 1000)}s.`);

  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    process.removeListener('exit', release);
    handle.release();
  };
  process.on('exit', release);
  return release;
}
