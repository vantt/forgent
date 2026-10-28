// event-log.mjs — the error type the state layer raises.
//
// Zero-dep, Node builtins only. Events are appended and read only through the Event Store consumer gate.

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
