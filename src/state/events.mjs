// events.mjs — append-only event log (truth per D3, ≡ changeset per R3).
//
// Zero-dep, Node builtins only (SCHEMA_VERSION is imported from work.mjs,
// itself zero-dep). Callers pass an explicit log path; this module never
// resolves `.fgos/` itself — that resolution belongs to the CLI layer
// (cell phase-1-state-layer-4), so this lib stays testable against a temp dir.
//
// Physics (R1): log. Mức bền (R8): D2 (committed, permanent truth) once the
// caller writes the file under version control — this module only appends.
//
// Schema evolution (per D7): every event appended by this module from Phase
// 2 onward carries `v: SCHEMA_VERSION` (D7c) — read from the single source
// in work.mjs, never re-declared here. Events committed before Phase 2 have
// no `v` field at all; readEvents below never requires it — it accepts
// whatever object each line parses to, so a pre-Phase-2 log line without
// `v` reads back exactly as it was written (D7a: never rewritten, never
// migrated in place).

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { SCHEMA_VERSION } from './work.mjs';
import { resolveWriterIdentity } from '../util/session-identity.mjs';

// Cross-process append lock. `appendEvent` reads the log's last seq then
// appends — a read-then-write window that, unguarded, lets two concurrent
// processes both read seq N and both write N+1 (spike-confirmed duplicate-seq
// corruption of the append-only log). A dedicated `.fgos/events.lock` beside
// the log makes that window exclusive across processes.
//
// This is a THIRD, wholly independent instance of the same wx-atomic-create +
// stale-pid-reclaim primitive already proven by loop.mjs's acquireRunnerLock
// and session.mjs's acquireSessionsLock — deliberately NOT imported from
// either (this module stays zero-dep, Node builtins only) and touching
// neither runner.lock nor sessions.lock.
//
// POLICY: it mirrors acquireSessionsLock's BLOCKING retry-with-timeout, NOT
// acquireRunnerLock's non-blocking "tries twice then backs off". appendEvent
// is the single door every mutating verb funnels through and must EVENTUALLY
// succeed — a non-blocking back-off would silently skip writing an event,
// which is never acceptable here.
//
// HOT-PATH SIZING: appendEvent runs on every single mutation, often in a tight
// automated-dispatch loop, and holds the lock only for one read-parse + one
// appendFileSync (sub-millisecond to low-ms). So the retry interval is short
// (10ms — responsive without hot-spinning) and the timeout is 2s — deliberately
// NOT acquireSessionsLock's 10s session-lifecycle default. 2s is generous
// headroom for genuine contention (dozens of serialized sub-ms holders) or a
// slow disk, yet short enough that a truly stuck/deadlocked path surfaces as a
// clear 'lock-timeout' error instead of hanging a CLI command indefinitely.
const EVENTS_LOCK_FILE = 'events.lock';
const EVENTS_LOCK_TIMEOUT_MS = 2000;
const EVENTS_LOCK_RETRY_MS = 10;

/**
 * Error raised by this module. `category` is a stable contract consumed by
 * the CLI's exit-code table (R4): 'corrupt-log', 'validation', and
 * 'lock-timeout' are the categories this module can raise. 'lock-timeout' is
 * distinct on purpose: it means another process held the append lock past the
 * timeout (retry the whole operation), NOT that the log is corrupt or the
 * caller's input was invalid — a caller must be able to tell live contention
 * apart from a real data problem.
 */
export class EventLogError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'EventLogError';
    this.category = category;
  }
}

// Shared core (tsk-49e): splits `raw` into JSON Lines and parses each one,
// throwing the same EventLogError('corrupt-log') shape readEvents always
// has. Used by readEvents (whole-file) and readEventsFromByte (partial,
// incremental-snapshot read) below — one parsing implementation, never two.
export function parseEventLines(raw, logPath) {
  if (raw === '') return [];

  const lines = raw.split('\n');
  // A well-formed log always ends with a trailing newline, which split()
  // turns into one final empty string — drop that artifact only. Any other
  // empty/partial line is a real corruption and must surface below.
  if (lines[lines.length - 1] === '') lines.pop();

  const events = [];
  for (let i = 0; i < lines.length; i++) {
    let parsed;
    try {
      parsed = JSON.parse(lines[i]);
    } catch (err) {
      throw new EventLogError(
        'corrupt-log',
        `Corrupt or truncated event log line ${i + 1} of ${lines.length} in ${logPath}: ${err.message}`,
      );
    }
    events.push(parsed);
  }
  return events;
}

/**
 * Read every event from the append-only log at `logPath`, in append order.
 *
 * Returns `[]` when the log does not exist yet (uninitialized log — not an
 * error). Throws `EventLogError('corrupt-log')` the moment any line fails to
 * parse as JSON — a corrupt or truncated line (e.g. a crash mid-append) is
 * never silently skipped or auto-repaired.
 */
export function readEvents(logPath) {
  let raw;
  try {
    raw = fs.readFileSync(logPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  return parseEventLines(raw, logPath);
}

/**
 * tsk-49e: reads a bounded window of raw bytes ending exactly at `atByte`
 * and returns the raw text of the LAST COMPLETE line in that window (the
 * line ending immediately before `atByte`) — or `null` if the window holds
 * no complete line at all (defensive; should never happen for an `atByte`
 * that was itself a prior valid file length, since every write here is
 * line-terminated). Never throws on a missing file — callers treat `null`
 * as "snapshot fast path unavailable, fall back to a full read".
 */
export function readLastLineBefore(logPath, atByte, windowBytes = 8192) {
  if (typeof atByte !== 'number' || atByte <= 0) return null;
  let fd;
  try {
    fd = fs.openSync(logPath, 'r');
  } catch {
    return null;
  }
  try {
    const start = Math.max(0, atByte - windowBytes);
    const length = atByte - start;
    if (length <= 0) return null;
    const buffer = Buffer.alloc(length);
    fs.readSync(fd, buffer, 0, length, start);
    const text = buffer.toString('utf8');
    if (!text.endsWith('\n')) return null; // atByte did not land on a line boundary -- not a byte length this module ever wrote
    const trimmed = text.slice(0, -1);
    const lastNewline = trimmed.lastIndexOf('\n');
    return lastNewline === -1 ? trimmed : trimmed.slice(lastNewline + 1);
  } catch {
    return null;
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * tsk-49e: reads raw bytes from `fromByte` to EOF and parses them as JSON
 * Lines via the same `parseEventLines` core `readEvents` uses — the
 * incremental counterpart to a full-file read. Same fail-closed corrupt-log
 * throw; never silently skips a bad line just because it is in the "new"
 * range.
 */
export function readEventsFromByte(logPath, fromByte) {
  const fd = fs.openSync(logPath, 'r');
  let raw;
  try {
    const stat = fs.fstatSync(fd);
    const length = stat.size - fromByte;
    if (length <= 0) return [];
    const buffer = Buffer.alloc(length);
    fs.readSync(fd, buffer, 0, length, fromByte);
    raw = buffer.toString('utf8');
  } finally {
    fs.closeSync(fd);
  }
  return parseEventLines(raw, logPath);
}

function parsesAsJson(line) {
  try {
    JSON.parse(line);
    return true;
  } catch {
    return false;
  }
}

/**
 * Operator-invoked repair, scoped ONLY to the common crash-mid-append shape:
 * every line parses except the last. Any other corruption shape (mid-file,
 * multiple bad lines) is refused with `EventLogError('corrupt-log')` — this
 * function never widens the fail-closed guarantee `readEvents` enforces.
 *
 * The original log is always backed up (to `<logPath>.corrupt-<ts>`) before
 * the malformed trailing line is dropped, and the repaired file is
 * re-validated through `readEvents` before returning — a repair that somehow
 * left the log still unreadable surfaces as a thrown error, never a silent
 * "fixed" result.
 *
 * The whole read → validate → backup → write sequence runs inside
 * `withEventsLock` (tsk-3wq: this used to be an unlocked whole-file rewrite,
 * so a concurrent `appendEvent` landing between the read and the
 * `writeFileSync` was silently overwritten/dropped — the same
 * read-then-write TOCTOU `withEventsLock`/`appendEventLocked` already close
 * for `addWork`/`editWork`/`moveWork`/`moveStage` in store.mjs). Folding this
 * function into the SAME cross-process lock `appendEvent` holds means a
 * concurrent append can no longer land mid-repair — it either lands before
 * this call acquires the lock (repair then reads the up-to-date file) or
 * after this call releases it (the append reads the just-repaired file).
 */
export function repairTruncatedLastLine(logPath) {
  return withEventsLock(logPath, () => {
    let raw;
    try {
      raw = fs.readFileSync(logPath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new EventLogError('validation', `repair: no event log at ${logPath} — nothing to repair.`);
      }
      throw err;
    }

    const lines = raw.split('\n');
    if (lines[lines.length - 1] === '') lines.pop();

    if (lines.length === 0) {
      throw new EventLogError('validation', `repair: event log at ${logPath} is empty — nothing to repair.`);
    }

    for (let i = 0; i < lines.length - 1; i++) {
      if (!parsesAsJson(lines[i])) {
        throw new EventLogError(
          'corrupt-log',
          `repair: line ${i + 1} of ${lines.length} in ${logPath} is corrupt (not just a truncated final line) — refusing to repair.`,
        );
      }
    }

    const lastLine = lines[lines.length - 1];
    if (parsesAsJson(lastLine)) {
      throw new EventLogError('validation', `repair: event log at ${logPath} already parses cleanly — nothing to repair.`);
    }

    const backupPath = `${logPath}.corrupt-${Date.now()}`;
    fs.copyFileSync(logPath, backupPath);

    const repaired = lines.slice(0, -1).map((line) => `${line}\n`).join('');
    fs.writeFileSync(logPath, repaired, 'utf8');

    // Re-validate: readEvents throws if the repaired file is somehow still
    // unreadable, so this call never returns a falsely-reported "fixed" state.
    const events = readEvents(logPath);

    return { backupPath, droppedLine: lastLine, eventCount: events.length };
  });
}

/** Signal-0 liveness probe (mirrors loop.mjs/session.mjs's isPidAlive). EPERM
 * means the pid exists under another user — still alive, still a holder. */
function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

/** Synchronous backoff — keeps this module synchronous (no async lock window
 * for the lock to leak), without a busy spin. */
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

let lockTmpCounter = 0;

/** One attempt at the link-atomic-create lock, mirroring acquireRunnerLock /
 * acquireSessionsLock's stale-pid-reclaim shape. On EEXIST: a live-pid holder
 * backs off; a dead/garbage-pid leftover is re-read right before the unlink
 * (the liveness probe is the slow window — changed content is a fresh holder
 * we must not touch) then cleaned. It NEVER creates the lock in the same
 * attempt that deleted a stale one (that delete-then-create was the TOCTOU
 * the sibling locks' doc comments call out); a reclaim yields and the next
 * attempt does the bare create.
 *
 * Creation itself writes the pid to a per-attempt temp file THEN
 * `fs.linkSync`s it onto `lockPath` (spike-confirmed fix, tsk-3ld): the
 * earlier `fs.openSync(lockPath, 'wx')` + separate `fs.writeSync` created a
 * window where the lock file existed but was still empty, so a competing
 * process reading it mid-write saw unparseable (NaN) content, fell through
 * to the "dead/garbage holder" branch, and unlinked a lock a live process
 * legitimately held — letting two processes both believe they held it
 * (reproduced directly: ~30% of runs at 20 concurrent processes, see
 * `docs/history/events-lock-concurrency-race/CONTEXT.md`). `link()` only
 * ever exposes `lockPath` fully-written or not-yet-existing — never
 * partially written — so that window is closed structurally, not papered
 * over with a retry. */
function tryAcquireEventsLockOnce(lockPath, pid) {
  const dir = path.dirname(lockPath);
  lockTmpCounter += 1;
  const tmpPath = path.join(dir, `.events.lock.tmp-${pid}-${Date.now()}-${lockTmpCounter}`);
  fs.writeFileSync(tmpPath, String(pid), 'utf8');
  try {
    fs.linkSync(tmpPath, lockPath);
    return { acquired: true };
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  let raw;
  try {
    raw = fs.readFileSync(lockPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { acquired: false, holderPid: null }; // released in between — retry create
    throw err;
  }
  const holderPid = parseInt(raw.trim(), 10);

  if (Number.isInteger(holderPid) && holderPid > 0 && isPidAlive(holderPid)) {
    return { acquired: false, holderPid };
  }
  if (!Number.isInteger(holderPid) || holderPid <= 0) {
    // Unparseable content should not happen now that creation is link-atomic
    // (a visible lockPath is always fully written) — but stay defensive: an
    // ambiguous holder is never positively dead, so never reclaim it here.
    return { acquired: false, holderPid: null };
  }

  let current;
  try {
    current = fs.readFileSync(lockPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { acquired: false, holderPid: null }; // already cleaned
    throw err;
  }
  if (current !== raw) {
    const freshPid = parseInt(current.trim(), 10);
    return { acquired: false, holderPid: Number.isInteger(freshPid) && freshPid > 0 ? freshPid : null };
  }
  try {
    fs.unlinkSync(lockPath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return { acquired: false, holderPid: null }; // cleaned and yield; next attempt creates
}

/** Blocking exclusive acquire of `.fgos/events.lock` (derived from
 * `path.dirname(logPath)`, so a caller passing a different log dir — e.g.
 * porting-store.mjs — automatically gets its own dedicated lock). Retries the
 * single-attempt primitive with a synchronous backoff until it wins or the
 * timeout elapses, then throws `EventLogError('lock-timeout')`. Returns a
 * handle with `release()`; the caller MUST release in a finally. */
function acquireEventsLock(logPath, { pid = process.pid, timeoutMs = EVENTS_LOCK_TIMEOUT_MS, retryMs = EVENTS_LOCK_RETRY_MS } = {}) {
  const dir = path.dirname(logPath);
  fs.mkdirSync(dir, { recursive: true });
  const lockPath = path.join(dir, EVENTS_LOCK_FILE);
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    const res = tryAcquireEventsLockOnce(lockPath, pid);
    if (res.acquired) {
      return {
        lockPath,
        release() {
          try {
            fs.unlinkSync(lockPath);
          } catch (err) {
            if (err.code !== 'ENOENT') throw err;
          }
        },
      };
    }
    if (Date.now() >= deadline) {
      throw new EventLogError(
        'lock-timeout',
        `appendEvent: timed out acquiring events.lock at "${lockPath}" after ${timeoutMs}ms` +
          (res.holderPid ? ` (held by pid ${res.holderPid})` : '') +
          ' — another process is writing; retry the operation.',
      );
    }
    sleepSync(retryMs);
  }
}

/**
 * Run `fn` while holding the same cross-process `events.lock` `appendEvent`
 * uses (derived from `path.dirname(logPath)`), releasing in a `finally` on
 * every exit path. Exported so a caller with its own precondition check
 * ahead of an append — store.mjs's addWork/editWork/moveWork/moveStage —
 * can widen the exclusive window to cover that whole read-check-append
 * sequence as ONE critical section, instead of only the append itself: the
 * precondition read and the append share the lock's single scope, so a
 * second process can no longer read a precondition that's about to go stale
 * out from under a first process still deciding.
 */
export function withEventsLock(logPath, fn) {
  const lock = acquireEventsLock(logPath);
  try {
    return fn();
  } finally {
    lock.release();
  }
}

/**
 * The unlocked core of `appendEvent` — same seq derivation and write, minus
 * lock acquisition. For a caller that already holds the `events.lock` via
 * `withEventsLock` and wants to append inside that same held lock, without
 * `appendEvent`'s own (non-reentrant) acquire/release around it.
 */
function appendEventCore(logPath, { type, payload = null } = {}) {
  if (typeof type !== 'string' || !type.trim()) {
    throw new EventLogError('validation', 'appendEvent: "type" is required and must be a non-empty string.');
  }

  // seq is derived per-file (below), so once a writer's own file is one of
  // several under .fgos/events/ (TA-D2), it is a within-file ordinal only —
  // never a cross-file identity. `h` (next) is the content-hash identity;
  // seq stays for display/ordering-within-file only.
  const existing = readEvents(logPath);
  const last = existing[existing.length - 1];
  const seq = last ? last.seq + 1 : 1;

  // src: writer id (TA-D9), stamped before hashing so the hash covers it —
  // two real events from different writers are never byte-identical.
  // String(): resolveWriterIdentity's id is a number for a PID-fallback
  // writer (no env/registry identity available) -- stringified here so
  // `src` always matches the type store.mjs's resolveWriterLogPath uses to
  // build the `<writer-id>-<openTs>.jsonl` filename for the SAME writer.
  const src = String(resolveWriterIdentity(path.dirname(logPath)).id);
  const unhashed = { seq, ts: new Date().toISOString(), type: type.trim(), payload, v: SCHEMA_VERSION, src };
  // h: 16-hex SHA-256 of the unhashed line content (TA-D1) — the event's
  // content-addressed identity, order-independent, deterministic.
  const h = crypto.createHash('sha256').update(JSON.stringify(unhashed)).digest('hex').slice(0, 16);
  const event = { ...unhashed, h };

  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `${JSON.stringify(event)}\n`, 'utf8');
  return event;
}

export { appendEventCore as appendEventLocked };

/**
 * Append exactly one event to `logPath` as a single JSON line: `{ seq, ts,
 * type, payload, v, src, h }`. `seq` is derived from the current last event
 * (1 if the log is empty/absent) — never supplied by the caller, so events
 * cannot be reordered or double-numbered within one file (per-file only,
 * TA-D1: cross-file identity is `h`, not `seq`). `ts` is set here, always
 * ISO-8601 UTC. `v` is always the current `SCHEMA_VERSION` (per D7c) — every
 * event this module writes from now on carries it; there is no way to append
 * an event without one. `src` is the writer id from `resolveWriterIdentity`
 * (TA-D9). `h` is a 16-hex SHA-256 of the line content up to and including
 * `src` (TA-D1/TA-D9) — the event's content-addressed, order-independent
 * identity, used downstream for cross-file dedupe. A log line written before
 * this field existed has no `h`/`src` and still reads back exactly as
 * written (D7a: never rewritten, never migrated in place).
 *
 * Reads the existing log first (via readEvents), so appending onto an
 * already-corrupt log fails loudly with the same 'corrupt-log' category
 * rather than silently continuing on top of unknown state.
 *
 * The read-seq/compute/append sequence runs under `withEventsLock` (released
 * in a finally on every exit path), so two concurrent processes never both
 * read the same last seq and write a duplicate.
 *
 * SCOPE: called bare like this, it closes ONLY the duplicate/out-of-order seq
 * race at the append itself — a caller with its own precondition read ahead
 * of the append (store.mjs's addWork existing-id check, moveWork's
 * expectedStatus compare-and-swap, editWork, moveStage) needs that read
 * inside the SAME held lock to avoid acting on a precondition that's already
 * gone stale; those callers use `withEventsLock` + `appendEventLocked`
 * directly instead of this function, so their whole read-check-append
 * sequence is one critical section.
 */
export function appendEvent(logPath, opts) {
  return withEventsLock(logPath, () => appendEventCore(logPath, opts));
}
