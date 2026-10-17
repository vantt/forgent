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
// A borrowed child runs inside a job the helper creates (`borrow` request);
// its output goes to files the facade reads or tails, `cancel` ends its job.
//
// Release is TerminateProcess on the helper: the kernel frees the lock at
// once. `process.kill(pid, 0)` then tells when the helper is gone; the pid
// cannot be reused while libuv still holds the unreaped child handle.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
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
const RESULT_POLL_MS = 2;
/** Time the helper may spend before the child runs, beyond the kill wait: the
 * keeper's acknowledgement (2 s) and spawn slack. */
const STARTED_BASE_MS = 3000;
const MAX_LOG_BYTES = 16 * 1024 * 1024;
/** Extra time past a cancel and the kill wait before a borrow counts as stuck. */
const BORROW_SLACK_MS = 1000;
const TAIL_POLL_MS = 20;

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
  return { child, pid: child.pid, work, requests: 0 };
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

/** libuv sets these exactly when it has reaped the child and freed its
 * handle; from then on the pid may belong to someone else, so `pidAlive`
 * must not be asked about it. */
function reaped(child) {
  return child.exitCode !== null || child.signalCode !== null;
}

/** Is the helper process still running? */
function helperAlive(hold) {
  return !reaped(hold.child) && pidAlive(hold.pid);
}

/** One look at the helper: its answer, or null while it is still working.
 * Throws when it died without answering or answered with an error; the work
 * directory is removed first. */
function pollReady(hold, bin) {
  try {
    const line = readReady(hold, bin);
    if (line) return line;
    if (helperAlive(hold)) return null;
    // It may have answered and exited between the two looks.
    const last = readReady(hold, bin);
    if (last) return last;
    throw new HolderLockError('lock-route-bad-output', `${bin} lock-hold exited before it answered`, { pid: hold.pid });
  } catch (err) {
    removeWorkDir(hold.work);
    throw err;
  }
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
  while (helperAlive(hold)) {
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

// ---------------------------------------------------------------------------
// borrowing
// ---------------------------------------------------------------------------

/** Write `req-<n>.json` (temp file, then rename) and return `n`. */
function writeRequest(hold, body) {
  hold.requests += 1;
  const n = hold.requests;
  const tmp = path.join(hold.work, `req-${n}.json.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(body));
  fs.renameSync(tmp, path.join(hold.work, `req-${n}.json`));
  return n;
}

function readJsonIfPresent(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
  return JSON.parse(text);
}

const resultOf = (hold, n) => readJsonIfPresent(path.join(hold.work, `result-${n}.json`));
const startedOf = (hold, n) => readJsonIfPresent(path.join(hold.work, `started-${n}.json`));

function forget(hold, n, names) {
  for (const name of names) {
    try {
      fs.rmSync(path.join(hold.work, name.replace('<n>', String(n))), { force: true });
    } catch {
      // swept with the work directory
    }
  }
}

const BORROW_FILES = ['req-<n>.json', 'started-<n>.json', 'out-<n>.log', 'err-<n>.log', 'result-<n>.json'];

/** A log as text, at most `MAX_LOG_BYTES` of it, like the POSIX output cap. */
function readLog(hold, name) {
  let fd;
  try {
    fd = fs.openSync(path.join(hold.work, name), 'r');
    const size = Math.min(fs.fstatSync(fd).size, MAX_LOG_BYTES);
    const buffer = Buffer.alloc(size);
    fs.readSync(fd, buffer, 0, size, 0);
    return buffer.toString('utf8');
  } catch {
    return '';
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

/** The request that runs `spec` (`{ command, args, cwd, env }`) in a borrow
 * job. The helper adds git's `gc.auto` flags itself, so `args` stays as the
 * caller gave them; `env` replaces the child's environment entirely. */
function borrowRequest(spec) {
  const env = {};
  for (const [key, value] of Object.entries(spec.env ?? process.env)) {
    if (value !== undefined && value !== null) env[key] = String(value);
  }
  return { op: 'borrow', argv: [spec.command, ...(Array.isArray(spec.args) ? spec.args.map(String) : [])], cwd: spec.cwd ?? null, env, stdin: 'null' };
}

/** The helper ended while a borrow was in flight: nothing will answer. */
function helperGone(hold, n) {
  return new HolderLockError('borrow-helper-gone', `lock-hold helper ${hold.pid} ended before it answered borrow ${n}`, { pid: hold.pid });
}

/** Run one borrow and wait for its result, blocking. `spec.timeoutMs`, when
 * given, ends the child's job through a `cancel` request once it passes; the
 * call then waits up to `killWaitMs` more (plus slack) for the helper's
 * answer. Returns `{ result, stdout, stderr }`; the caller maps `result`. */
export function borrowSync(hold, spec, { killWaitMs }) {
  const n = writeRequest(hold, borrowRequest(spec));
  const startedAt = Date.now();
  let hardDeadline = null;
  for (;;) {
    const result = resultOf(hold, n);
    if (result) {
      const answer = { result, stdout: readLog(hold, `out-${n}.log`), stderr: readLog(hold, `err-${n}.log`) };
      forget(hold, n, BORROW_FILES);
      return answer;
    }
    if (!helperAlive(hold)) {
      // It may have answered and ended between the two looks.
      const last = resultOf(hold, n);
      if (last) continue;
      throw helperGone(hold, n);
    }
    const now = Date.now();
    if (hardDeadline === null && Number.isInteger(spec.timeoutMs) && now - startedAt >= spec.timeoutMs) {
      writeRequest(hold, { op: 'cancel', n });
      hardDeadline = now + killWaitMs + BORROW_SLACK_MS;
    }
    if (hardDeadline !== null && now >= hardDeadline) {
      throw new HolderLockError('borrow-stuck', `lock-hold helper ${hold.pid} did not answer borrow ${n} after a cancel`, { pid: hold.pid });
    }
    sleepSync(RESULT_POLL_MS);
  }
}

/** A `Readable` that follows one file as the helper's child appends to it. */
class Tail extends Readable {
  constructor(file) {
    super();
    this.file = file;
    this.offset = 0;
  }

  _read() {}

  /** Push what was appended since the last drain. */
  drain() {
    let fd;
    try {
      fd = fs.openSync(this.file, 'r');
    } catch {
      return;
    }
    try {
      const size = fs.fstatSync(fd).size;
      if (size > this.offset) {
        const buffer = Buffer.alloc(size - this.offset);
        const read = fs.readSync(fd, buffer, 0, buffer.length, this.offset);
        this.offset += read;
        if (read > 0) this.push(buffer.subarray(0, read));
      }
    } finally {
      fs.closeSync(fd);
    }
  }
}

/** The ChildProcess-shaped object of an async borrow: `pid`, `stdout` and
 * `stderr` streams, `'spawn'`, `'exit'`, `'close'` and `'error'` events,
 * `kill()` (a cancel request), `exitCode`, `signalCode`. It follows the
 * helper's files, so it works while the event loop turns. The pid is read
 * before this returns (within `STARTED_BOUND_MS`); `onResult(result)` is
 * called once with the helper's answer, after the final drain of the
 * streams, before `'exit'` is emitted. */
export function borrowAsync(hold, spec, { killWaitMs, onResult }) {
  const n = writeRequest(hold, borrowRequest(spec));
  const child = new EventEmitter();
  child.stdout = new Tail(path.join(hold.work, `out-${n}.log`));
  child.stderr = new Tail(path.join(hold.work, `err-${n}.log`));
  child.stdin = null;
  child.exitCode = null;
  child.signalCode = null;
  child.killed = false;
  child.pid = undefined;
  let finished = false;
  child.kill = () => {
    if (finished) return false;
    child.killed = true;
    try {
      writeRequest(hold, { op: 'cancel', n });
    } catch {
      return false;
    }
    return true;
  };

  const finish = (result) => {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    child.stdout.drain();
    child.stderr.drain();
    child.stdout.push(null);
    child.stderr.push(null);
    forget(hold, n, ['req-<n>.json', 'started-<n>.json', 'result-<n>.json']);
    const code = Number.isInteger(result.exit) ? result.exit : null;
    child.exitCode = code;
    onResult(result);
    child.emit('exit', code, null);
    let open = 2;
    const ended = () => {
      open -= 1;
      if (open === 0) {
        forget(hold, n, ['out-<n>.log', 'err-<n>.log']);
        child.emit('close', code, null);
      }
    };
    child.stdout.once('end', ended);
    child.stderr.once('end', ended);
    // A stream nobody reads would never end: let it flow.
    child.stdout.resume();
    child.stderr.resume();
  };
  const fail = (result) => {
    // No child ever ran: report through the events, like a failed spawn.
    finished = true;
    clearInterval(timer);
    child.stdout.destroy();
    child.stderr.destroy();
    forget(hold, n, BORROW_FILES);
    onResult(result);
    process.nextTick(() => child.emit('error', Object.assign(new Error(result.message ?? result.error), { code: result.error })));
  };

  // The pid: the helper writes started-<n>.json once the child runs in its job.
  const startBoundMs = STARTED_BASE_MS + killWaitMs;
  const startBound = Date.now() + startBoundMs;
  let timer = null;
  for (;;) {
    const started = startedOf(hold, n);
    if (started && Number.isInteger(started.pid)) {
      child.pid = started.pid;
      break;
    }
    const result = resultOf(hold, n);
    if (result) {
      // No child ever ran: report it like a failed spawn. Otherwise it ran to
      // the end already, and the first tick below reports that.
      if (result.error && !Number.isInteger(result.exit)) {
        fail(result);
        return child;
      }
      // A fast child can have written both files between the two looks.
      const late = startedOf(hold, n);
      if (late && Number.isInteger(late.pid)) child.pid = late.pid;
      break;
    }
    if (!helperAlive(hold)) throw helperGone(hold, n);
    if (Date.now() >= startBound) {
      // The borrow may still be starting: end it and wait for the helper's
      // answer, so the caller never frees the lock under a running child.
      writeRequest(hold, { op: 'cancel', n });
      const settleBy = Date.now() + killWaitMs + BORROW_SLACK_MS;
      while (!resultOf(hold, n) && helperAlive(hold) && Date.now() < settleBy) sleepSync(RESULT_POLL_MS);
      forget(hold, n, BORROW_FILES);
      throw new HolderLockError('borrow-start-timeout', `lock-hold helper ${hold.pid} did not start borrow ${n} within ${startBoundMs} ms`, { pid: hold.pid });
    }
    sleepSync(RESULT_POLL_MS);
  }
  const hardMs = killWaitMs + BORROW_SLACK_MS;
  let cancelledAt = null;
  timer = setInterval(() => {
    child.stdout.drain();
    child.stderr.drain();
    const result = resultOf(hold, n);
    if (result) {
      finish(result);
      return;
    }
    if (!helperAlive(hold)) {
      finish({ error: 'borrow-helper-gone', message: `lock-hold helper ${hold.pid} ended before it answered borrow ${n}` });
      return;
    }
    if (child.killed && cancelledAt === null) cancelledAt = Date.now();
    if (cancelledAt !== null && Date.now() - cancelledAt > hardMs) {
      finish({ error: 'borrow-stuck', message: `lock-hold helper ${hold.pid} did not answer borrow ${n} after a cancel` });
    }
  }, TAIL_POLL_MS);
  process.nextTick(() => child.emit('spawn'));
  return child;
}
