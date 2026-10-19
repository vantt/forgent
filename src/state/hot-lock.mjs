// hot-lock.mjs — the hot mutex of the state store (contract:
// packages/holder-lock/contracts/hot-lock.v1.json).
//
// Fast path: write the holder's record to a temp file, `link()` it onto
// `<fgosDir>/locks/<resource>.hot`; release is `unlink`. `link` only ever
// exposes a fully written record, so a competitor never reads half of one.
//
// A record whose holder died is cleaned only by a process that holds the
// kernel lock `<resource>.reclaim` (the holder-lock facade): it reads the
// record again, compares bytes with what the judge saw, and only then
// unlinks. Two cleaners can therefore never both unlink and then both link,
// and a fresh holder's record is never taken for the dead one's. A record that
// does not parse, or whose holder the judge cannot prove dead, is never
// cleaned: the waiter times out and an owner runs `fgos lock fence`.
//
// Inside the critical section the process may not start a child and may not
// take a hot mutex again; both throw at once. Every write inside goes through
// the transaction object, which is revoked when the callback returns.
//
// Imports from runner/ are limited to the process-identity leaf.

import fs from 'node:fs';
import path from 'node:path';
import { judge, getBootId, getPidNs, getProcessStartTime, observeProcess, pidExists } from '../runner/dispatch/process-identity.mjs';
import { acquireSync, createLockScope, runProcessObserveRoute } from '../holder-lock/index.mjs';
import { noteLockHeld, noteLockReleased, resolveWriterIdentity } from '../util/session-identity.mjs';
import { HotLockError, hotLockDepth, enterHotLock, leaveHotLock } from '../holder-lock/hot-guard.mjs';
export { HotLockError, hotLockDepth } from '../holder-lock/hot-guard.mjs';

import { uniqueTmpTag } from '../util/unique-tmp-tag.mjs';
import { appendEventCore } from './event-log.mjs';

const RESOURCES = Object.freeze(['state', 'porting-events']);
const WAIT_TIMEOUT_MS = 5000;
const POLL_MS = 10;
const RECLAIM_WAIT_MS = 1000;
const WINDOWS_RETRYABLE = new Set(['EPERM', 'EBUSY']);
/** How long a host reading of a live holder is reused while a waiter polls. */
const HOST_OBSERVE_TTL_MS = 250;

// --- paths, record, judge ------------------------------------------------

function assertResource(resource) {
  if (!RESOURCES.includes(resource)) throw new HotLockError('hot-lock-resource-unknown', `unknown hot resource ${JSON.stringify(resource)}`);
}

/** The record path and the temp-file directory of `resource` under `fgosDir`. */
export function hotPaths(fgosDir, resource = 'state') {
  assertResource(resource);
  const dir = path.join(path.resolve(fgosDir), 'locks');
  return { dir, record: path.join(dir, `${resource}.hot`) };
}

/** One look at `pid` through the host's process facts: the creation time
 * Windows keeps in the process object, which Node cannot read itself. A pid
 * that does not exist is absent without asking. A host that cannot be run or
 * answers badly is `unreadable`, never absent: the record stays unjudged. */
export function observeViaHost(pid, { fgosDir } = {}) {
  if (!pidExists(pid)) return { kind: 'absent' };
  try {
    const line = runProcessObserveRoute({ fgosDir, pid });
    if (line.state === 'live') return { kind: 'live', startTime: line.startTime };
    if (line.state === 'zombie') return { kind: 'zombie' };
    if (line.state === 'absent') return { kind: 'absent' };
    return { kind: 'unreadable', cause: line.cause ?? 'driver-missing' };
  } catch {
    return { kind: 'unreadable', cause: 'driver-missing' };
  }
}

const liveReadings = new Map();

/** The process table the judge reads for `fgosDir`: /proc where there is
 * one, the host's process facts on Windows. A live reading is reused for a
 * moment, since a waiter judges the same holder every few milliseconds; the
 * existence check still runs every time, so a holder that dies is seen at
 * once. A cached reading can outlive a holder whose pid was reused, so it may
 * only ever be used to keep a record (`alive`), never to reclaim one: the
 * reclaim judges with `cache: false`. */
export function hotObserver(fgosDir, { platform = process.platform, cache = true } = {}) {
  if (platform !== 'win32') return (pid) => observeProcess(pid);
  return (pid) => {
    if (!pidExists(pid)) {
      liveReadings.delete(pid);
      return { kind: 'absent' };
    }
    const cached = cache ? liveReadings.get(pid) : undefined;
    const now = Date.now();
    if (cached && now - cached.at < HOST_OBSERVE_TTL_MS) return cached.seen;
    const seen = observeViaHost(pid, { fgosDir });
    if (seen.kind === 'live') liveReadings.set(pid, { at: now, seen });
    else liveReadings.delete(pid);
    return seen;
  };
}

/** Judge a hot record's holder: `alive`, `dead` or `unknown`. The one door
 * the store, the reclaim and the doctor check read the table through. */
export function judgeHotRecord(record, fgosDir, options) {
  return judge(record, { observe: hotObserver(fgosDir, options) });
}

let selfRecord = null;
const recordText = new Map();

/** This process's record as the bytes written to disk, built once per writer.
 * Without a readable start time (no /proc, no host) the start time and
 * namespace are left out and the judge answers `unknown` for a live pid.
 * On Windows the start time is the creation time the host reads, asked once
 * per process, here, before any critical section. */
function recordOfSelf(writer, fgosDir) {
  const key = writer ? String(writer) : '';
  let text = recordText.get(key);
  if (text === undefined) {
    if (!selfRecord) {
      const bootId = getBootId();
      const startTime = process.platform === 'win32' ? hostStartTimeOfSelf(fgosDir) : getProcessStartTime(process.pid);
      const pidNs = getPidNs();
      selfRecord = {
        v: 1,
        pid: process.pid,
        ...(startTime ? { startTime } : {}),
        ...(bootId !== 'unknown-boot' ? { bootId } : {}),
        ...(pidNs !== 'unknown' && pidNs !== 'none' ? { pidNs } : {}),
      };
    }
    text = JSON.stringify(key ? { ...selfRecord, writer: key } : selfRecord);
    recordText.set(key, text);
  }
  return text;
}

function hostStartTimeOfSelf(fgosDir) {
  const seen = observeViaHost(process.pid, { fgosDir });
  return seen.kind === 'live' ? seen.startTime : null;
}

/** One look at the record file: `{state: 'absent'}`, `{state: 'unreadable',
 * raw}` or `{state: 'ok', raw, record}`. A record that is not a JSON object
 * with a positive pid is unreadable, never cleaned. */
export function readHotRecord(recordPath) {
  let raw;
  try {
    raw = fs.readFileSync(recordPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { state: 'absent' };
    if (WINDOWS_RETRYABLE.has(err.code)) return { state: 'absent' };
    throw err;
  }
  let record;
  try {
    record = JSON.parse(raw);
  } catch {
    return { state: 'unreadable', raw };
  }
  if (!record || typeof record !== 'object' || !Number.isInteger(record.pid) || record.pid <= 0) return { state: 'unreadable', raw };
  return { state: 'ok', raw, record };
}

/** Unlink `recordPath` only when it still holds exactly `raw`. Returns
 * whether it was removed. Callers hold the reclaim kernel lock. */
export function unlinkRecordIfUnchanged(recordPath, raw) {
  const current = readHotRecord(recordPath);
  if (current.state === 'absent' || current.raw !== raw) return false;
  try {
    fs.unlinkSync(recordPath);
  } catch (err) {
    if (err.code === 'ENOENT' || WINDOWS_RETRYABLE.has(err.code)) return false;
    throw err;
  }
  return true;
}

/** Clean the record of a dead holder under the kernel lock `<resource>.reclaim`.
 * `observed` is the record read (and judged dead) by the caller. Returns
 * `'cleaned'`, `'changed'` (somebody else got there, or a fresh holder
 * arrived) or `'busy'` (another cleaner holds the kernel lock). */
export function reclaimDeadHolder(fgosDir, resource, observed) {
  const { record } = hotPaths(fgosDir, resource);
  const attempt = acquireSync(createLockScope(`hot-reclaim:${resource}`), resource, { fgosDir }, { waitMs: RECLAIM_WAIT_MS });
  if (attempt.result !== 'acquired') return 'busy';
  try {
    const again = readHotRecord(record);
    if (again.state !== 'ok' || again.raw !== observed.raw) return 'changed';
    if (judgeHotRecord(again.record, fgosDir, { cache: false }) !== 'dead') return 'changed';
    return unlinkRecordIfUnchanged(record, observed.raw) ? 'cleaned' : 'changed';
  } finally {
    attempt.handle.release();
  }
}

/** Remove the record a person has confirmed is dead weight (`fgos lock fence`):
 * under the reclaim kernel lock, and only while it still holds exactly `raw`,
 * so a holder that arrived since is never cleared. Returns whether it was removed. */
export function clearHotRecord(fgosDir, resource, raw) {
  const { record } = hotPaths(fgosDir, resource);
  const attempt = acquireSync(createLockScope(`hot-clear:${resource}`), resource, { fgosDir }, { waitMs: RECLAIM_WAIT_MS });
  if (attempt.result !== 'acquired') return false;
  try {
    return unlinkRecordIfUnchanged(record, raw);
  } finally {
    attempt.handle.release();
  }
}

// --- acquire / release ---------------------------------------------------

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function tryLinkRecord(paths, recordBytes) {
  const tmp = path.join(paths.dir, `.hot.tmp-${uniqueTmpTag()}`);
  fs.writeFileSync(tmp, recordBytes, 'utf8');
  try {
    fs.linkSync(tmp, paths.record);
    return true;
  } catch (err) {
    if (err.code !== 'EEXIST' && !WINDOWS_RETRYABLE.has(err.code)) throw err;
    return false;
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch (err) {
      if (err.code !== 'ENOENT' && !WINDOWS_RETRYABLE.has(err.code)) throw err;
    }
  }
}

function acquireRecord(fgosDir, resource, recordBytes) {
  const paths = hotPaths(fgosDir, resource);
  fs.mkdirSync(paths.dir, { recursive: true });
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  let seen = { state: 'absent' };
  for (;;) {
    if (tryLinkRecord(paths, recordBytes)) return paths;
    seen = readHotRecord(paths.record);
    if (seen.state === 'ok' && judgeHotRecord(seen.record, fgosDir) === 'dead') {
      // After a cleanup the next pass tries the link at once.
      if (reclaimDeadHolder(fgosDir, resource, seen) === 'cleaned') continue;
    }
    if (seen.state === 'absent') continue;
    if (Date.now() >= deadline) {
      const unreadable = seen.state === 'unreadable';
      throw new HotLockError(
        'hot-lock-timeout',
        `timed out after ${WAIT_TIMEOUT_MS}ms acquiring ${resource} at "${paths.record}"`
          + (unreadable ? ' — the record cannot be read; confirm the holder is gone and run `fgos lock fence`' : ` (held by pid ${seen.record?.pid})`)
          + '; retry the operation.',
        { resource, path: paths.record, holderPid: seen.record?.pid ?? null, ...(unreadable ? { reason: 'lock-record-unreadable' } : {}) },
      );
    }
    sleepSync(POLL_MS);
  }
}

function releaseRecord(paths) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      fs.unlinkSync(paths.record);
      return;
    } catch (err) {
      if (err.code === 'ENOENT') return;
      if (WINDOWS_RETRYABLE.has(err.code)) {
        sleepSync(5);
        continue;
      }
      throw err;
    }
  }
}

// --- the transaction -----------------------------------------------------

function underDir(fgosDir, target) {
  const rel = path.relative(path.resolve(fgosDir), path.resolve(target));
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function createTx(fgosDir, { mainFgosDir = null, head = null, writer = null, eventStore = null, extraRoots = [] } = {}) {
  let live = true;
  const roots = [fgosDir, ...extraRoots];
  const guard = (target) => {
    if (!live) throw new HotLockError('state-tx-revoked', 'the state transaction was used after its callback returned');
    if (target !== undefined && !roots.some((root) => underDir(root, target))) {
      throw new HotLockError('state-tx-path-outside', `"${target}" is not under ${fgosDir}; a state transaction touches only its own .fgos`);
    }
  };
  const tx = {
    fgosDir: path.resolve(fgosDir),
    mainFgosDir,
    eventStore,
    head,
    writer,
    /** Append one event; same seq/hash derivation as the plain append. */
    append(logPath, opts) {
      guard(logPath);
      return appendEventCore(logPath, opts, fgosDir, tx);
    },
    /** One already-built log line (the primitive `append` writes through). */
    appendLine(logPath, line) {
      guard(logPath);
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
      fs.appendFileSync(logPath, line, 'utf8');
    },
    writeJson(target, value) {
      tx.writeText(target, `${JSON.stringify(value, null, 2)}\n`);
    },
    /** Replace `target` with `text` atomically (temp file, then rename). */
    writeText(target, text) {
      guard(target);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const tmp = `${target}.tmp-${uniqueTmpTag()}`;
      fs.writeFileSync(tmp, text, 'utf8');
      fs.renameSync(tmp, target);
    },
    readJson(target) {
      guard(target);
      try {
        return JSON.parse(fs.readFileSync(target, 'utf8'));
      } catch (err) {
        if (err.code === 'ENOENT') return null;
        throw err;
      }
    },
    /** Move `from` onto `to` (rename; both paths under the transaction's roots). */
    rename(from, to) {
      guard(from);
      guard(to);
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.renameSync(from, to);
    },
    unlink(target) {
      guard(target);
      try {
        fs.unlinkSync(target);
        return true;
      } catch (err) {
        if (err.code === 'ENOENT') return false;
        throw err;
      }
    },
  };
  return { tx, revoke: () => { live = false; } };
}

/**
 * Run `fn(tx)` while holding the hot mutex `resource` of `fgosDir`.
 *
 * `fn` must be synchronous. `prefetched` carries what needs a child process
 * to compute — `mainFgosDir`, `head`, `writer` — resolved by the caller before
 * the lock; the writer identity is resolved here, before the lock, when the
 * caller did not pass it. A reentrant call throws `hot-lock-reentry` at once.
 * `prefetched.extraRoots` lists further directories the transaction may write
 * under (a log directory that is not the lock's own `.fgos`).
 */
export function withStateTx(fgosDir, fn, { resource = 'state', prefetched = {} } = {}) {
  assertResource(resource);
  if (hotLockDepth() > 0) {
    throw new HotLockError('hot-lock-reentry', `${resource}: this process already holds a hot mutex; a transaction may not open another`);
  }
  const writer = prefetched.writer ?? resolveWriterIdentity(fgosDir).id;
  const paths = acquireRecord(fgosDir, resource, recordOfSelf(writer, fgosDir));
  enterHotLock();
  noteLockHeld();
  const { tx, revoke } = createTx(fgosDir, { ...prefetched, writer });
  let result;
  try {
    result = fn(tx);
  } finally {
    revoke();
    leaveHotLock();
    try {
      releaseRecord(paths);
    } finally {
      noteLockReleased();
    }
  }
  if (result && typeof result.then === 'function') {
    result.then(undefined, () => {});
    throw new HotLockError('state-tx-async', `${resource}: the transaction callback returned a promise; it must be synchronous (the lock is already released)`);
  }
  return result;
}
