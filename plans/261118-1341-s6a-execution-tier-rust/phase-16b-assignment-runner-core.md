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

- Attempt locks at the handover (decided 2026-11-19, OPC). Unix, as Node's `spawnWithLocks([attempt, cwdLease])`
  (`direct-launch.mjs` `startSupervisor`, handles marked handed-over at `src/holder-lock/index.mjs` `spawnWithLocks`):
  `Handle::lend` gives the supervisor a copy of the attempt lock as descriptor 3 and, for an attempt that writes, of
  the cwd lease as descriptor 4. The controller keeps both handles, lent: the attempt copy closes once the binding
  is known, the cwd lease at `closeAttempt` after its custody record; closing a lent handle never waits on the
  supervisor or ends it. `lend` replaced `hand_over` (one handover primitive; holder-lock spec rule 9). Proof:
  `packages/holder-lock/rust/tests/handle_file.rs` and the engine end-to-end test of an assignment that writes
  passing the supervisor's descriptor 3 and 4 check.
- Windows. A read-only attempt launches as Node does: the controller releases its attempt copy right after the
  spawn and the supervisor takes `attempt.lock` itself (`supervise/windows.rs`, `LOCK_WAIT_MS` 10 s); holding it for
  the child's lifetime would make that take time out. A mutating attempt is refused before admission with
  `windows-cwd-lease-holder-missing` (`execute::mutating_launch_refusal`): Node holds the cwd lease in a lock-hold
  helper and names it as `cwdLeaseOwner`, and the Rust controller has no holder endpoint to name, so Windows
  mutating launches stay on the Node launch route until a Windows lease design exists (a later item). Proof: msvc
  `cargo check` and the refusal's unit test; a runtime proof waits for a Windows runner.
- Write-then-exec: the runner writes no script it executes. Tests that do write their stub agent/supervisor with
  `std::fs::write` (opened `O_CLOEXEC`, closed on return) and take `SCRIPT_EXEC` around the write and the exec, so a
  fork in a sibling test cannot hold the write descriptor at exec (ETXTBSY seen in the phase-8 smoke tests).
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
