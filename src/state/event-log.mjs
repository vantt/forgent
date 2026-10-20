// Explicit legacy inventories and independent journals share strict JSONL parsing.
// New Work and porting events are written only through their consumer gates.
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
// has. Used by readEvents (whole-file;
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
