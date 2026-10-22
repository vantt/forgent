// event-log.mjs — parsing of an explicit legacy event inventory, and the error type the state layer raises.
//
// Zero-dep, Node builtins only. New events are appended and read only through the Event Store consumer gate; the
// legacy files this parser sees are the migration inventory and nothing else.

/**
 * Error raised by the state layer. `category` is a stable contract consumed by
 * the CLI's exit-code table (R4): 'corrupt-log' (an event inventory failed to
 * parse) and 'validation' (invalid caller input) are the categories this class
 * raises. Live contention on the state gate is not one of them: the gate raises
 * `HotLockError` (`hot-lock-timeout`), whose category is also `lock-timeout`.
 */
export class EventLogError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'EventLogError';
    this.category = category;
  }
}

// Splits `raw` into JSON Lines and parses each one, throwing EventLogError('corrupt-log') on the first line
// that does not parse: a corrupt or truncated line is never skipped or repaired.
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
