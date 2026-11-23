# Phase 1: Record the bind-time account state and replay it in the recheck

Capability: `code:implement`. Run it in a linked worktree.

## Inputs (read first)

- `plans/261123-0821-runner-recheck-replays-account-view/plan.md`, the Facts and Approach sections
- `plans/reports/debugger-261123-0805-runner-recheck-ignores-account-view.md`
- `packages/execution/engine/src/assignment_runner/legality.rs:254-366`, the recheck
- `packages/execution/engine/src/planning/bind_facade.rs:66-76,169-200`, `AccountStateSource`, `BindContext` and
  `overlay_of`
- `packages/execution/engine/src/unit_run/host.rs:183`, the `Host::bind` port
- `packages/execution/engine/src/unit_run/run.rs:1227-1255` (`bind_with`) and `:1700-1760` (where the attempt is
  recorded)
- `apps/fgos/src/wiring/unit_run_host/accounts.rs:85-116` and `apps/fgos/src/wiring/unit_run_host/host.rs:388`, the
  real host bind
- `packages/execution/rust/src/bind.rs:707-720`, where `accountView` and `accountViewDigest` are computed
- `packages/execution/engine/tests/assignment_runner.rs` and `packages/execution/contracts/assignment-runner/legality.v1.json`
- `docs/platform/runner/contracts/executor-model.md:130-150`
- `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`, the RUL106 write-gate passage

## Files it may write (footprint)

packages/execution/engine/src/assignment_runner/, packages/execution/engine/src/unit_run/,
packages/execution/engine/src/planning/bind_facade.rs, packages/execution/engine/tests/assignment_runner.rs,
packages/execution/engine/tests/unit_run.rs, packages/execution/contracts/assignment-runner/legality.v1.json,
apps/fgos/src/wiring/unit_run_host/, docs/platform/runner/contracts/executor-model.md,
docs/platform/runner/subcomponents/h-6979005beaf7/spec.md

If a caller or test fake of `Host::bind` sits outside this footprint, stop and report. Do not widen the footprint.

## Steps

1. Widen the return of `Host::bind`. Besides the binding, it returns the account overlay the bind read and the `now`
   (epoch ms) it read the overlay at. A `None` overlay means no overlay was read. Keep one port and change every
   implementation in the same change: the real host in `apps/fgos/src/wiring/unit_run_host/` and the test fakes in
   `packages/execution/engine/tests/unit_run.rs` or the engine's own `unit_run` module. The real host reads the overlay
   once, passes it to the bind as data, and returns it. It does not read the lease state twice.
2. In `Run`, carry the returned overlay to where the attempt is recorded. When the overlay is non-empty, write
   `accountState: { at, overlay }` next to `boundAt`. Write nothing for an empty overlay. A resumed attempt that keeps
   its recorded binding keeps its recorded `accountState`.
3. In `legality.rs`, read `accountState` from the `recorded` attempt the recheck already finds. With the record, bind
   with `accounts: Some(source)`, where the source is a small `AccountStateSource` in the engine that returns the
   recorded overlay, and with `now = at`. Without it, keep `accounts: None, now = 0`.
4. Still in `legality.rs`, check the digest before the binding comparison. When the recorded
   `binding.bindingInput.accountViewDigest` is present and differs from the recomputed binding's
   `bindingInput.accountViewDigest`, return a `RunnerConfigError::coded` refusal. Use code
   `binding-replay-account-view-mismatch` when the attempt had `accountState`, and
   `binding-replay-account-view-missing` when it did not. Word the messages like the two existing replay refusals.
   Skip the check when no digest was recorded.
5. Add cases to `legality.v1.json`, following the shape of the existing mutating cases, and make sure the driver
   replays them:
   - (a) The recorded overlay quarantines gemini's only account, the carried binding is deepseek/thehive, and the
     recorded digest is the real one. The case is accepted. Set `quarantinedUntil` later than `at` and earlier than
     any real wall clock.
   - (b) Like (a), but the recorded overlay no longer reproduces the digest. Refused with
     `binding-replay-account-view-mismatch`.
   - (c) Like (a), but without `accountState`. Refused with `binding-replay-account-view-missing`.

   Produce the digests by running the real bind, not by hand. Mark the cases as Rust-owned, for example with a name
   prefix or a note field the driver ignores, because the Node recorder cannot produce them. Do not rerun the Node
   recorder.
6. Give `tests/unit_run.rs` one owning case, inside the existing writing-seat test where one fits: under a non-empty
   overlay the attempt records `accountState { at, overlay }`, and under an empty overlay it records nothing. Extend
   the existing test instead of copying it (design principle 8).
7. Docs:
   - In `executor-model.md:139-141`, replace "which is what a replay and `explain` read". `explain` reads the config
     alone. The write gate replays the overlay recorded on the attempt, at its recorded time, and refuses by name when
     the digest does not reproduce.
   - In `h-6979005beaf7/spec.md`, add the settled fact next to the write-gate sentence of RUL106 ("`walkStateOf` is the
     one door ..."). Name the two refusal codes and the evidence (this plan, the debugger report).

## Verify

```bash
cargo test -p fgos-execution-engine --test assignment_runner
cargo test -p fgos-execution-engine --test unit_run
cargo test --workspace
npm test
```

The phase passes when all four are green and the three new legality cases run and assert the outcome stated in
step 5. If the honest digest does not reproduce in case (a), stop and report the difference. Do not loosen the check.

## Rollback

Revert the phase's commit. The old recheck ignores `accountState` on attempts that carry it.
