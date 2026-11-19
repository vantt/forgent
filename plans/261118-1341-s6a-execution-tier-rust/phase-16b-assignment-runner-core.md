# Phase 16b: assignment runner

Wave 6. Depends on: 7b, 8b, 10, 11, 11b, 13b, 14, 16; plan 1045 phase 6 on `main` (met). Effort 2.5d. Library only (engine
module `assignment_runner`). Split from the old phase 16.

## Context

`src/runner/dispatch/assignment-runner.mjs` (1 554; `executeAssignment` `:1278-1554`, 277 lines; builds the envelope
at `:1093` (`buildEnvelope`) with 1045 P6's `lanes` field at `:1110`, `laneTransport(settings.lanes,
currentDispatchDepth())`; replay digest `:298-317`, codes `binding-replay-snapshot-missing`,
`binding-replay-config-mismatch`, S5 D3). 1045 P6 landed (`47165e3bf`, `e030632ca`, `52af20744`; Rust-only follow-up
`2dbabb340`): the lane settings come from config section `workerSlots` (`ceiling`, `laneWaitSec`) read by
`readLaunchSettings`, `src/run-supervisor/direct-launch.mjs:294-301`, and `laneTransport` `:308-311` gives the
envelope's `lanes` only at dispatch depth 0 (phase 05 ports `direct-launch.mjs`). It turns one Assignment into one supervised
attempt: plan, lease, prompt, confinement request, envelope, handover, settle.

## Requirements

- `packages/execution/engine/src/assignment_runner/` ports it over modules 7-16 and phase 05's controller.
- Replay digest unchanged in bytes.
- `lanes` field and lane config reads (`workerSlots`) as 1045 P6 landed them (D4); depth 0 only, as `laneTransport`.
- Integration tests: one direct-mode assignment end to end with a stub agent, one herdr-mode where herdr is present
  (capability-probed), replay, refusal paths (`DispatchError` codes).
- Golden vectors under `packages/execution/contracts/assignment-runner/` recorded by
  `test/golden-recorders/assignment-runner.recorder.mjs`.

- Attempt lock on Windows (decided 2026-11-19, review of 16b): no Windows handover is built and the controller does
  not hold the attempt lock for the child's lifetime. It releases its attempt copy right after the supervisor is
  spawned (`launch.rs` `start_and_bind`, `cfg(not(unix))`), and the Windows supervisor takes `attempt.lock` itself
  once it read the envelope, waiting up to `LOCK_WAIT_MS` (10 s) for the controller's release
  (`packages/run-supervisor/rust/src/supervise/windows.rs`, module doc and `Locks::complete`). This is what Node does
  (`assignment-runner.mjs` `startAndBind`: `if (process.platform === 'win32') attempt.locks.releaseAttempt()`;
  `direct-launch.mjs` `startSupervisor` hands over no descriptor on win32). Holding it for the child's lifetime would
  make the supervisor's own take wait out its 10 s and refuse. Proof: msvc `cargo check` of the `cfg(not(unix))`
  path; a runtime proof waits for a Windows runner (no Windows machine on the lane).
- Write-then-exec: the runner writes no script it executes. Tests that do write their stub agent/supervisor with
  `std::fs::write` (opened `O_CLOEXEC`, closed on return) and take `SCRIPT_EXEC` around the write and the exec, so a
  fork in a sibling test cannot hold the write descriptor at exec (ETXTBSY seen in the phase-8 smoke tests).
- Open (review 2026-11-19, blocking a mutating launch): the cwd lease does not reach the supervisor. Unix: the
  supervisor needs the lease as descriptor 4 (`supervise/unix.rs` `Locks::complete`), Node passes a shared copy
  (`spawnWithLocks([attempt, cwdLease])`, the controller keeps its own through commit); `start_and_bind` passes only
  descriptor 3, and `fgos-holder-lock` has no door that lends a held exclusive description to a child while the
  holder keeps it (`hand_over` moves). Windows: Node names the lease holder (`cwdLeaseOwner` = the helper's
  `domainEndpoint()`); `seat.rs` passes `cwd_lease_owner: None`, so the supervisor tries to take a lease the
  controller still holds. Fix needs a `fgos-holder-lock` door (lend a copy to a child on unix; a holder endpoint on
  Windows) and an end-to-end mutating test.
- Ports the host implements (named for phases 18/19): `ExecutePorts` + `SeatPorts` (the composite, no impl yet),
  `TerminalPrep` and `CredentialRenewal` (no impl yet); `CheckoutFacts` (`apps/fgos/src/wiring/dispatch_decide.rs`
  `HostWorkspace`), `Machine` (`apps/fgos/src/wiring/seat_binding.rs` `HostMachine`), `SettlementGit`
  (`settlement::ports::GitDoor`), `CheckoutRoots` (`inputs::GitCheckoutRoots`), `AdoptDoor`
  (`outcome::SupervisorAdoptDoor`), `GiveBack` (`attempt::MachineGiveBack`) exist.

## Steps

Read 1045 P6 as landed. Commit the recorder; record vectors; red `engine/tests/assignment_runner.rs`; port; green;
report.

## Validation

`cargo test -p fgos-execution-engine --test assignment_runner`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: the largest single file; drift in the envelope or replay digest. Vectors pin both. Rollback: revert.
