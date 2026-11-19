// dispatch/runner-config-error.mjs — the error every runner-config and dispatch-admission refusal raises.
// The class is declared once in Execution's Node seam (`src/native/execution-door.mjs`) and re-exported here, so
// `instanceof` holds across every importer and for an error rethrown from a native unit run.
export { RunnerConfigError, commonDottedParent } from '../../native/execution-door.mjs';
