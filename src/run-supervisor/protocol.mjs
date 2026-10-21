// The protocol of the host routes the run supervisor speaks (`supervise`, `gate`, `adopt`,
// `attempt-step`; packages/run-supervisor/rust/src/route.rs requires `--protocol 1`). It moves on its
// own, apart from the holder-lock routes' protocol (src/holder-lock/protocol.mjs).
export const RUN_SUPERVISOR_PROTOCOL = 1;
