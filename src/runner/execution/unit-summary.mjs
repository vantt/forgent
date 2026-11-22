// The stored Unit summary as a session-host caller reads it: one call of the native addon's `execution` namespace,
// through the Execution door. Building and publishing a summary is the host's (the unit-run settle in
// `apps/fgos/src/wiring/unit_run_host/records.rs`).
export { readStoredUnitSummary } from '../../native/execution-door.mjs';
