// dispatch/dispatch-error.mjs — the one error type every executor adapter
// raises.
//
// It lives in its own module because more than one adapter now needs it and
// they must not import each other to get it: `transport.mjs` holds the
// cli-spawn and http adapters, `herdr-round.mjs` holds the interactive one,
// and a shared type owned by either of them would make the pair circular.
// `transport.mjs` re-exports the name, so every existing importer is
// unaffected.

/** Raised when spawning or running the executor itself fails at runtime.
 * `errorClass` deliberately reuses the vocabulary declared in
 * `recovery.mjs`'s `ERROR_CLASSES` (per the cell's key_link) so the runner
 * can feed it straight into `resolveAction` without a translation layer. */
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
