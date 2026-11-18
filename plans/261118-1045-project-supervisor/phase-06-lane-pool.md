# Phase 6 — Lane pool at top-level worker seat start

A lane is a held machine-scope lock `<lockRoot>/lane/<k>.lock`. The run supervisor of a **top-level** worker seat takes
one before it launches the agent (waiting at most `workerSlots.laneWaitSec`) and keeps it until it exits. A head
session and a nested dispatch take none, so a seat that dispatches a child never waits on its own pool. Pool size is
`workerSlots.ceiling`; it stays null (unarmed) until phase 17 arms it with the old gate's removal (PS-12). The lock dies
with the process, so a crashed supervisor frees its lane (principle 5). Rust, plus the two Node launchers.

## Inputs
Step 0 first: re-grep every item. A finding that changes a plan decision stops the phase with `NEEDS_CONTEXT`.
- `packages/run-supervisor/rust/src/supervise.rs`: `supervise()` `:543`; envelope read `:547`; host split `host_of` `:569`; `locks.complete` `:583`; branch to `supervise_terminal` `:590`; `not_started(...)` `:660` publishes `start-refused.json` and ends the receipt `abandoned-not-started`; `publish_receipt_with` `:226-264`.
- Session attempts: `packages/run-supervisor/contracts/envelope.v3.json:47` (`session` present exactly for a head session).
- Lock API: `packages/holder-lock/rust/src/port.rs`: `Wait::{Try, Ms(u64)}` `:53-58`, `Resource::new` `:98`, `acquire(resource, Mode, Wait, kill_wait_ms)` `:763`, `holders(resource)` `:1565` (read only). Lock root `packages/holder-lock/rust/src/state_root.rs:77`.
- Registry: `packages/holder-lock/contracts/lock-registry.v1.json` (machine-scope rows such as `worker-session`, rank 80, mutex, `<lockRoot>/worker-session/<id>.lock`); spec `docs/platform/holder-lock/spec.md`.
- Nested dispatch: `FGOS_DISPATCH_DEPTH` (`src/runner/dispatch/adapters.mjs:81,95-99` `currentDispatchDepth`); every worker gets depth+1 (`src/runner/dispatch/confinement/authority.mjs:763`).
- Envelope builders: `src/runner/dispatch/assignment-runner.mjs:1086` (`buildEnvelope`), `:1147` (`startSupervisor`); `src/run-supervisor/direct-launch.mjs:209` (`buildEnvelope`), `:291`. Config keys `workerSlots.ceiling`, `workerSlots.laneWaitSec` (phase 4).
- Tests to imitate: `packages/run-supervisor/rust/tests/supervise_lifecycle.rs`, `supervise_crash.rs`, `supervise_guard.rs`, helpers in `tests/support`; envelope digests `tests/envelope_digest_vectors.rs`; Node launcher proofs `test/run-supervisor/direct-cutover.test.mjs`, contract proof `test/run-supervisor/contracts.test.mjs`.

## Footprint
`packages/run-supervisor/rust/src/lanes.rs`, `packages/run-supervisor/rust/src/supervise.rs`, `packages/run-supervisor/rust/src/lib.rs`, `packages/run-supervisor/rust/src/adopt.rs`, `packages/run-supervisor/rust/tests/lanes.rs`, `packages/run-supervisor/rust/tests/envelope_digest_vectors.rs`, `packages/run-supervisor/contracts/envelope.v3.json`, `src/runner/dispatch/assignment-runner.mjs`, `src/run-supervisor/direct-launch.mjs`, `test/run-supervisor/direct-cutover.test.mjs`, `test/run-supervisor/contracts.test.mjs`, `packages/holder-lock/contracts/lock-registry.v1.json`, `docs/platform/holder-lock/spec.md`, `docs/platform/run-supervisor/spec.md`.

## Ceiling transport (PS-18)
The run supervisor reads no config (`packages/run-supervisor/rust/Cargo.toml` has no `fgos-config`). The Node launchers
write envelope field `lanes: {ceiling, waitMs}` only when `currentDispatchDepth()` is 0 and the attempt is not a
session; a nested or session attempt carries no `lanes` field and takes no lane. Absent or `ceiling: null` = unarmed.

## Steps
1. Registry rows: `watcher` (repo scope, mutex, held by one watcher tick at a time, PS-8; owner `supervision`) and
   `lane`: kind mutex, scope machine, rank 80, v3Path `<lockRoot>/lane/<k>.lock`, owner `run-supervisor`. Add both to
   the holder-lock spec lock table.
2. `lanes.rs`:
   - `take(lock_root, ceiling, wait_ms) -> Result<Lane, LanePoolFull>`: for k in `0..ceiling` try
     `acquire(Resource::new("lane", path_k), Mode::Ex, Wait::Try, ..)`; first success returns `Lane` (owns the handle;
     drop frees). All held: sleep a short fixed step and retry until `wait_ms` elapsed, then `LanePoolFull { ceiling }`.
   - `snapshot(lock_root, ceiling) -> Snapshot { ceiling, live, free, seats }`: read-only via `holders()`, counts every
     held seat file including `k >= ceiling` after a lowered ceiling. This is what `fgos slots --json` shows (phase 16).
   - No `lanes` field or `ceiling` null: `take` returns `Lane::None`; no file is touched.
3. `supervise.rs`: after `locks.complete(...)` and before the terminal/direct branch, for an envelope with `lanes`,
   call `lanes::take`. Keep the `Lane` in a local that lives to the end of `supervise()`. On `LanePoolFull`,
   `not_started(..., "lane-pool-full", "<ceiling> seats are held on this machine")`.
4. `lib.rs`: `pub mod lanes;` (only this phase edits it).
5. Envelope: add optional `lanes: {ceiling: integer|null, waitMs: integer}` to `envelope.v3.json`; both Node launchers
   write it per "Ceiling transport"; update `envelope_digest_vectors.rs` for the new optional field.
6. Adopt: `adopt.rs` takes a lane with `Wait::Try` when it re-owns a live worker domain whose envelope has `lanes`, so
   `live` never undercounts; a full pool on adopt keeps the domain and records `lane-pool-over` in its adopt result
   (the worker is already running; it is never killed for a lane).
7. Specs: run-supervisor spec gets the lane rule (top-level seats only), the wait and the start-refusal code;
   holder-lock spec gets the rows.
8. Tests, `tests/lanes.rs`, one proof each: with ceiling 2 and two held seats a third top-level attempt waits
   `waitMs` and ends `abandoned-not-started` with `lane-pool-full`; a seat freed during the wait lets it start; a
   session attempt and an envelope without `lanes` start with every seat held; a supervisor killed with SIGKILL frees
   its lane; lowering the ceiling keeps live seats counted in `snapshot`; null ceiling takes no lock; an adopted worker
   holds a lane and a full pool on adopt reports `lane-pool-over`.
9. Node: extend `direct-cutover.test.mjs` with one proof that a launcher at depth 0 writes `lanes` and at depth 1
   writes none; `contracts.test.mjs` accepts the field.

## Verify
- `cargo test -p fgos-run-supervisor --test lanes` passes; `cargo test -p fgos-run-supervisor` passes (no lifecycle regression).
- `node scripts/run-tests.mjs test/run-supervisor/direct-cutover.test.mjs test/run-supervisor/contracts.test.mjs` passes.
- `cargo clippy -p fgos-run-supervisor -- -D warnings`; compile checks for msvc and `aarch64-apple-darwin`.
- `cargo test -p fgos-holder-lock` and any test reading `lock-registry.v1.json` passes.

## Rollback
Revert the phase commit. Worker seats then take no lane; nothing is armed before phase 17 anyway.
