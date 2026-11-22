// dispatch-error.mjs — the one error type every executor adapter raises, declared once in this Tier 0 leaf (no imports
// at all) so a module that only needs the class never loads the Execution door and its process spawn.
// `src/native/execution-door.mjs` and `src/run-supervisor/dispatch-error.mjs` re-export it, so `instanceof` holds across
// every importer and for an error rethrown from a native unit run.

/**
 * Raised when spawning or running the executor itself fails at runtime. `errorClass` reuses the vocabulary of
 * `recovery.mjs`'s `ERROR_CLASSES`, so the runner feeds it straight into `resolveAction`.
 */
export class DispatchError extends Error {
  constructor(errorClass, message, details = {}) {
    super(message);
    this.name = 'DispatchError';
    this.errorClass = errorClass;
    this.code = details.code ?? errorClass;
    this.data = details;
    Object.assign(this, details);
  }
}
