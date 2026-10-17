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
import childProcess from 'node:child_process';
import nodeModule from 'node:module';
import { judge, getBootId, getPidNs, getProcessStartTime } from '../runner/dispatch/process-identity.mjs';
import { acquireSync, createLockScope } from '../holder-lock/index.mjs';
import { noteLockHeld, noteLockReleased, resolveWriterIdentity } from '../util/session-identity.mjs';
import { uniqueTmpTag } from '../util/unique-tmp-tag.mjs';
import { appendEventCore } from './event-log.mjs';

const RESOURCES = Object.freeze(['state', 'porting-events']);
const WAIT_TIMEOUT_MS = 5000;
const POLL_MS = 10;
const RECLAIM_WAIT_MS = 1000;
const WINDOWS_RETRYABLE = new Set(['EPERM', 'EBUSY']);

/** Error raised by this module. `code` is the contract name; `category` feeds
 * the CLI's exit-code table (a timeout is `lock-timeout`, the rest are
 * caller-correctable `precondition`s). */
export class HotLockError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'HotLockError';
    this.code = code;
    this.category = code === 'hot-lock-timeout' ? 'lock-timeout' : 'precondition';
    Object.assign(this, details);
  }
}

// --- critical-section depth and the child-process guard ------------------

let depth = 0;

/** Whether this process is inside a hot critical section right now. */
export function hotLockDepth() {
  return depth;
}

function failIfInside(what) {
  if (depth > 0) {
    throw new HotLockError('exec-under-hot-lock', `${what} was called inside a hot-lock critical section; resolve it before taking the lock and pass it in`);
  }
}

function guarded(name, original) {
  const wrapper = function guardedChildProcessCall(...args) {
    failIfInside(`child_process.${name}`);
    return Reflect.apply(original, this, args);
  };
  // util.promisify.custom and friends live on the original as symbols.
  for (const key of Reflect.ownKeys(original)) {
    if (!(key in wrapper) || typeof key === 'symbol') {
      Object.defineProperty(wrapper, key, Object.getOwnPropertyDescriptor(original, key));
    }
  }
  wrapper.__hotLockGuard = true;
  return wrapper;
}

/** Wrap every child-process entry once per process, then re-sync the ESM
 * namespace so `import { execFileSync } from 'node:child_process'` that was
 * linked before this module loaded sees the wrapper too. */
function installChildProcessGuard() {
  for (const name of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) {
    if (typeof childProcess[name] === 'function' && !childProcess[name].__hotLockGuard) {
      childProcess[name] = guarded(name, childProcess[name]);
    }
  }
  const proto = childProcess.ChildProcess?.prototype;
  if (proto && !proto.spawn.__hotLockGuard) proto.spawn = guarded('ChildProcess.prototype.spawn', proto.spawn);
  nodeModule.syncBuiltinESMExports();
}

installChildProcessGuard();

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

let selfRecord = null;
const recordText = new Map();

/** This process's record as the bytes written to disk, built once per writer
 * (fs-only: no exec). Without /proc the start time and namespace are left out
 * and the judge answers `unknown` for a live pid. */
function recordOfSelf(writer) {
  const key = writer ? String(writer) : '';
  let text = recordText.get(key);
  if (text === undefined) {
    if (!selfRecord) {
      const bootId = getBootId();
      const startTime = getProcessStartTime(process.pid);
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
    if (judge(again.record) !== 'dead') return 'changed';
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
    if (seen.state === 'ok' && judge(seen.record) === 'dead') {
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

function createTx(fgosDir, { mainFgosDir = null, head = null, writer = null, extraRoots = [] } = {}) {
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
  if (depth > 0) {
    throw new HotLockError('hot-lock-reentry', `${resource}: this process already holds a hot mutex; a transaction may not open another`);
  }
  const writer = prefetched.writer ?? resolveWriterIdentity(fgosDir).id;
  const paths = acquireRecord(fgosDir, resource, recordOfSelf(writer));
  depth += 1;
  noteLockHeld();
  const { tx, revoke } = createTx(fgosDir, { ...prefetched, writer });
  let result;
  try {
    result = fn(tx);
  } finally {
    revoke();
    depth -= 1;
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
