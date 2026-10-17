// event-log.mjs — the lock-free half of the append-only event log (truth per D3, ≡ changeset per R3).
//
// Reading, parsing and the unlocked append core. Locking lives in events.mjs
// (infra), which re-exports everything here; this file is kernel so domain
// modules can read the log without reaching up to the lock.
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

export function parsesAsJson(line) {
  try {
    JSON.parse(line);
    return true;
  } catch {
    return false;
  }
}

/**
 * The unlocked core of `appendEvent` — same seq derivation and write, minus
 * lock acquisition. For a caller that already holds the `events.lock` via
 * `withEventsLock` and wants to append inside that same held lock, without
 * `appendEvent`'s own (non-reentrant) acquire/release around it.
 *
 * `fgosDir` (Tầng A/T2 follow-up): the real `.fgos`-shaped directory whose
 * `sessions.json` registry `resolveWriterIdentity` consults to confirm an
 * env-supplied writer id (see session-identity.mjs). Defaults to
 * `path.dirname(logPath)` — correct for every caller that still appends
 * straight to baseline-0 (`<fgosDir>/events.jsonl`, e.g. dispatch/cli.mjs
 * and loop.mjs), but WRONG once `logPath` is a per-writer file under
 * `<fgosDir>/events/` (TA-D2/TA-D11): `path.dirname` of THAT path is the
 * `events/` subdirectory itself, not `.fgos/`, silently pointing the
 * registry confirmation at `<fgosDir>/events/sessions.json` (never exists)
 * instead of `<fgosDir>/sessions.json`. store.mjs's per-writer callers pass
 * their own already-known `dir` explicitly to close that gap. This never
 * changes the resolved `src` value itself (resolveWriterIdentity's `id` does
 * not depend on `fgosDir` — only whether `source` reports REGISTRY or ENV,
 * a value this function never reads) — it only fixes which file gets probed.
 *
 * `tx` (optional): the state transaction the append runs inside; the line is
 * written through `tx.appendLine` instead of straight to disk.
 */
export function appendEventCore(logPath, { type, payload = null } = {}, fgosDir = path.dirname(logPath), tx = null) {
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
  // Inside a transaction the writer was resolved before the lock was taken.
  const src = String(tx?.writer ?? resolveWriterIdentity(fgosDir).id);
  const unhashed = { seq, ts: new Date().toISOString(), type: type.trim(), payload, v: SCHEMA_VERSION, src };
  // h: 16-hex SHA-256 of the unhashed line content (TA-D1) — the event's
  // content-addressed identity, order-independent, deterministic.
  const h = crypto.createHash('sha256').update(JSON.stringify(unhashed)).digest('hex').slice(0, 16);
  const event = { ...unhashed, h };

  // Inside a state transaction the line goes through `tx`, which refuses it
  // once the transaction is revoked or when the log is outside its .fgos.
  const line = `${JSON.stringify(event)}\n`;
  if (tx) {
    tx.appendLine(logPath, line);
  } else {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, line, 'utf8');
  }
  return event;
}

export { appendEventCore as appendEventLocked };
