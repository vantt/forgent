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
import { SCHEMA_VERSION } from './work.mjs';

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
 */
export function repairTruncatedLastLine(logPath) {
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
}

/**
 * Append exactly one event to `logPath` as a single JSON line: `{ seq, ts,
 * type, payload, v }`. `seq` is derived from the current last event (1 if
 * the log is empty/absent) — never supplied by the caller, so events cannot
 * be reordered or double-numbered. `ts` is set here, always ISO-8601 UTC.
 * `v` is always the current `SCHEMA_VERSION` (per D7c) — every event this
 * module writes from now on carries it; there is no way to append an event
 * without one.
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

  const event = { seq, ts: new Date().toISOString(), type: type.trim(), payload, v: SCHEMA_VERSION };

  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `${JSON.stringify(event)}\n`, 'utf8');
  return event;
}
