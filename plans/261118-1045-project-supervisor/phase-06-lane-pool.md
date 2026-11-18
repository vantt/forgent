# Phase 6 — Lane pool at worker seat start

A lane is a held machine-scope lock `<lockRoot>/lane/<k>.lock`. The worker's run supervisor takes one before it launches the agent and keeps it until it exits. A head session takes none. Pool size is `workerSlots.ceiling`. The lock dies with the process, so a crashed supervisor frees its lane (principle 5). Rust.

## Inputs
Step 0 first: re-grep every item. A finding that changes a plan decision stops the phase with `NEEDS_CONTEXT`.
- `packages/run-supervisor/rust/src/supervise.rs`: `supervise()` `:543`; envelope read `:547`; host split `host_of` `:569`; `locks.complete` `:583`; branch to `supervise_terminal` `:590`; `not_started(...)` `:660` publishes `start-refused.json` and ends the receipt `abandoned-not-started`; `publish_receipt_with` `:226-264`.
- Session attempts: `packages/run-supervisor/contracts/envelope.v3.json:47` (`session` present exactly for a head session).
- Lock API: `packages/holder-lock/rust/src/port.rs`: `Resource::new` `:98`, `acquire(resource, Mode, Wait, kill_wait_ms)` `:763` (`Wait::Try`), `holders(resource)` `:1565` (read only). Lock root `packages/holder-lock/rust/src/state_root.rs:77`.
- Registry: `packages/holder-lock/contracts/lock-registry.v1.json` (machine-scope rows such as `worker-session`, rank 80, mutex, `<lockRoot>/worker-session/<id>.lock`); spec `docs/platform/holder-lock/spec.md`.
- Config key: `workerSlots.ceiling` (phase 4). Old count: `src/state/worker-slots.mjs` (`countWorkerSlots`, `hasWorkerSlotRoom`; retired in phase 17, not here).
- Tests to imitate: `packages/run-supervisor/rust/tests/supervise_lifecycle.rs`, `supervise_crash.rs`, `supervise_guard.rs`, helpers in `tests/support`.

## Footprint
`packages/run-supervisor/rust/src/lanes.rs`, `packages/run-supervisor/rust/src/supervise.rs`, `packages/run-supervisor/rust/src/lib.rs`, `packages/run-supervisor/rust/tests/lanes.rs`, `packages/run-supervisor/rust/src/adopt.rs`, `packages/run-supervisor/contracts/envelope.v3.json`, `src/runner/dispatch/assignment-runner.mjs`, `src/run-supervisor/direct-launch.mjs`, `packages/holder-lock/contracts/lock-registry.v1.json`, `docs/platform/holder-lock/spec.md`, `docs/platform/run-supervisor/spec.md`.

## Ceiling transport (PS-18)
The run supervisor reads no config (`packages/run-supervisor/rust/Cargo.toml` has no `fgos-config`) and the envelope has no ceiling field. The Node launchers that build the envelope (`src/runner/dispatch/assignment-runner.mjs`, `src/run-supervisor/direct-launch.mjs`) read `workerSlots.ceiling` and write envelope field `lanes: {ceiling}` (absent or null means unarmed). Do not add a config dependency to the supervisor.

## Steps
1. Registry rows: `watcher` (repo scope, mutex, held by one watcher tick at a time, PS-8; owner `supervision`) and `lane`: kind mutex, scope machine, rank 80, v3Path `<lockRoot>/lane/<k>.lock`, note names the owner `run-supervisor`. Add a line to the holder-lock spec lock table.
2. `lanes.rs`:
   - `take(lock_root, ceiling) -> Result<Lane, LanePoolFull>`: for k in `0..ceiling` try `acquire(Resource::new("lane", path_k), Mode::Ex, Wait::Try, ..)`; first success returns `Lane` (owns the handle; drop frees). All held: `LanePoolFull { ceiling }`.
   - `snapshot(lock_root, ceiling) -> Snapshot { ceiling, live, free, seats }`: read-only via `holders()`, counts every held seat file including `k >= ceiling` after a lowered ceiling. This is what `fgos slots --json` shows as `lanes` (wired in phase 16 and 17).
   - `ceiling` null or absent: `take` returns an unarmed `Lane::None`; no file is touched.
3. `supervise.rs`: after `locks.complete(...)` and before the terminal/direct branch, for an envelope without `session`, call `lanes::take`. Keep the `Lane` in a local that lives to the end of `supervise()`. On `LanePoolFull`, `not_started(..., "lane-pool-full", "<ceiling> seats are held on this machine")`. A session attempt skips the call.
4. `lib.rs`: `pub mod lanes;` (only this phase edits it).
5. Specs: run-supervisor spec gets the lane rule and the new start-refusal code; holder-lock spec gets the row.
6. Tests, `tests/lanes.rs`, one proof each: with ceiling 2 and two held seats a third worker attempt ends `abandoned-not-started` with `lane-pool-full` in `start-refused.json`; a session attempt starts with every seat held; a supervisor killed with SIGKILL frees its lane (next `take` succeeds); lowering the ceiling below live seats keeps them counted in `snapshot`; null ceiling takes no lock.
7. Envelope: add optional `lanes: {ceiling}` to `envelope.v3.json`; both Node launchers write it from `workerSlots.ceiling` (null when unset); `supervise.rs` reads it.
8. Adopt: `adopt.rs` takes a lane through `lanes::take` when it re-owns a live worker domain, so `live` never undercounts; a full pool on adopt keeps the domain and records `lane-pool-over` in its adopt result (the worker is already running; it is never killed for a lane).
9. Tests also prove: an adopted worker holds a lane; the launchers write the ceiling (extend their owning Node tests in `test/**`).

## Verify
- `cargo test -p fgos-run-supervisor lanes` passes; `cargo test -p fgos-run-supervisor` passes (no lifecycle regression).
- `cargo clippy -p fgos-run-supervisor -- -D warnings`; compile checks for msvc and `aarch64-apple-darwin` (lock path is portable; Windows and macOS builds must not break).
- Lock registry test: `cargo test -p fgos-holder-lock` and any test reading `lock-registry.v1.json` passes.

## Rollback
Revert the phase commit. Worker seats then take no lane; the config key and `fgos slots` keep working on the old count until phase 17.
