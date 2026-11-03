// The protocol of the host routes the run supervisor speaks (`supervise`, `gate`, `adopt`,
// `attempt-step`; packages/run-supervisor/rust/src/route.rs requires `--protocol 1`). It moves on its
// own, apart from the holder-lock routes' protocol (src/holder-lock/protocol.mjs).
export const RUN_SUPERVISOR_PROTOCOL = 1;

// How long one attempt step may run, and the most steps an envelope carries (settle-attempt,
// finalize-home and at most one extra step). The adopt route runs every step of an attempt in turn, so
// its own timeout is derived from both and stays above their sum.
export const ATTEMPT_STEP_TIMEOUT_MS = 10 * 60 * 1000;
export const MAX_ATTEMPT_STEPS = 3;
