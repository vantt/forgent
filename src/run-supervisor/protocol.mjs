// The protocol of the host routes the run supervisor speaks (`supervise`, `gate`, `adopt`, `attempt-step`;
// packages/run-supervisor/rust/src/route.rs requires `--protocol 1`), apart from src/holder-lock/protocol.mjs.
export const RUN_SUPERVISOR_PROTOCOL = 1;

// How long one attempt step may run, and the most steps an envelope carries (settle-attempt, finalize-home
// and at most one extra). The adopt route runs every step in turn, so its timeout is derived from both.
export const ATTEMPT_STEP_TIMEOUT_MS = 10 * 60 * 1000;
export const MAX_ATTEMPT_STEPS = 3;
