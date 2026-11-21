// dispatch-error.mjs — the one error type every executor adapter raises. The class is declared once in
// Execution's Node seam (`src/native/execution-door.mjs`) and re-exported here, so `instanceof` holds across every
// importer and for an error rethrown from a native unit run.
export { DispatchError } from '../native/execution-door.mjs';
