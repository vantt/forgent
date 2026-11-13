// store-error.mjs -- the error class Work and its callers throw, with no imports. store.mjs re-exports it, so every
// existing importer keeps working. `categoryOf` reads it back. The category -> exit status map is src/cli/exit-codes.mjs.

/** Error raised by this module. `category` is a key of the CLI exit-code table. `faultClass`, when given, names the
 * malformed-call class the shell records for an invocation that never reached its verb. */
export class StoreError extends Error {
  constructor(category, message, { faultClass } = {}) {
    super(message);
    this.name = 'StoreError';
    this.category = category;
    if (faultClass) this.faultClass = faultClass;
  }
}

/**
 * Runs `fn` and, when it throws (or its promise rejects) an error that names no fault class of its own, marks that
 * error with `faultClass`: the class of the malformed-call stage `fn` is, recorded where the fault is detected
 * instead of by a position the shell tracks. An error that already carries a class keeps it; a null class marks
 * nothing.
 */
export function withFaultClass(faultClass, fn) {
  const mark = (err) => {
    if (faultClass && err !== null && typeof err === 'object' && !err.faultClass) err.faultClass = faultClass;
    return err;
  };
  try {
    const result = fn();
    return result instanceof Promise ? result.catch((err) => { throw mark(err); }) : result;
  } catch (err) {
    throw mark(err);
  }
}

/**
 * Classify an error by its own `.category` string rather than an instanceof chain, so a new error class only has to
 * set `.category` to take part. Anything without one is 'unexpected' (callers map that to exit 1).
 */
export function categoryOf(err) {
  return err && typeof err.category === 'string' ? err.category : 'unexpected';
}
