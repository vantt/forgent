// event-log.mjs — the lock-free half of the append-only event log (truth per D3, ≡ changeset per R3).
//
// Reading and parsing. Locking lives in events.mjs (infra), which re-exports
// everything here; this file is kernel so domain modules can read the log
// without reaching up to the lock.
//
// Zero-dep, Node builtins only. Callers pass an explicit log path; this module never
// resolves `.fgos/` itself — that resolution belongs to the CLI layer
// (cell phase-1-state-layer-4), so this lib stays testable against a temp dir.
//
// Legacy files are only read here (migration inventory, retired-reader callers);
// new events are appended only through the Event Store consumer gate.

import fs from 'node:fs';

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
