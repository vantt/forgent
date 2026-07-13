// events.mjs — append-only event log (truth per D3, ≡ changeset per R3).
//
// Zero-dep, Node builtins only. Callers pass an explicit log path; this module
// never resolves `.fgos/` itself — that resolution belongs to the CLI layer
// (cell phase-1-state-layer-4), so this lib stays testable against a temp dir.
//
// Physics (R1): log. Mức bền (R8): D2 (committed, permanent truth) once the
// caller writes the file under version control — this module only appends.

import fs from 'node:fs';
import path from 'node:path';

/**
 * Error raised by this module. `category` is a stable contract consumed by
 * the CLI's exit-code table (R4): 'corrupt-log' and 'validation' are the two
 * categories this module can raise.
 */
export class EventLogError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'EventLogError';
    this.category = category;
  }
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
 * Append exactly one event to `logPath` as a single JSON line: `{ seq, ts,
 * type, payload }`. `seq` is derived from the current last event (1 if the
 * log is empty/absent) — never supplied by the caller, so events cannot be
 * reordered or double-numbered. `ts` is set here, always ISO-8601 UTC.
 *
 * Reads the existing log first (via readEvents), so appending onto an
 * already-corrupt log fails loudly with the same 'corrupt-log' category
 * rather than silently continuing on top of unknown state.
 */
export function appendEvent(logPath, { type, payload = null } = {}) {
  if (typeof type !== 'string' || !type.trim()) {
    throw new EventLogError('validation', 'appendEvent: "type" is required and must be a non-empty string.');
  }

  const existing = readEvents(logPath);
  const last = existing[existing.length - 1];
  const seq = last ? last.seq + 1 : 1;

  const event = { seq, ts: new Date().toISOString(), type: type.trim(), payload };

  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `${JSON.stringify(event)}\n`, 'utf8');
  return event;
}
