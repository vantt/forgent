// dispatch-error.mjs — the one error type every executor adapter raises. The class is declared once in the Tier 0 leaf
// `src/native/dispatch-error.mjs` (which loads nothing) and re-exported here, so `instanceof` holds across every importer
// and for an error rethrown from a native unit run.
export { DispatchError } from '../native/dispatch-error.mjs';
