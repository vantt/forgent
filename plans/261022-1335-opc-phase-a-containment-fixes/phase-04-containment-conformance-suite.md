# Phase 04: one containment conformance suite (A5)

## Context

The owner's mandate: one conformance suite every driver must pass, so a sandbox driver can be replaced. Today each driver has its own file, and several cases repeat across them:

- `packages/process/rust/tests/containment_bwrap.rs` (265 lines);
- `containment_pgroup.rs` (190);
- `containment_macos.rs` (140);
- `containment_windows.rs` (268);
- `containment_spawn_timeout.rs` (93);
- `spawn_fds_leak.rs` (185).

The simplicity seat's §3.5 cut the behaviour list to one owning proof each. CI runs these on Linux, macOS and Windows only for pushes to `run-supervisor/**`, `terminal-mode/**` and `controller-death/**` (`.github/workflows/process-containment.yml`).

## Requirements

These requirements follow TEST's review of 2026-10-22 (`forgent-f8`): four objections and three conditions, all accepted.

1. **One test body per behaviour**, generic over `&dyn ContainmentDriver`, in one new module. Its per-driver copies are retired in the same change. The duplicated behaviours that move:

   | Behaviour | Today's copies |
   |---|---|
   | (T) a tree including a `setsid` child ends | `containment_pgroup.rs:70`, `containment_macos.rs:70`, `containment_bwrap.rs:96`, `containment_windows.rs:204` (job close ends child, grandchild and detached child) |
   | (R) the record alone judges and ends the domain | `containment_pgroup.rs:105`, `containment_macos.rs:96` |
   | (F) a hundred fast exits are normal spawns | `containment_pgroup.rs:133`, `containment_macos.rs:131`, `containment_bwrap.rs:245` |

   New behaviours join the same module: (A) exact argv, env, cwd and stdio reach the child, and its exit reaches the caller; (D) `kill_all(grace)` is SIGTERM, then SIGKILL after the grace, then empty; (G) `guarantee()` names the driver, its level and its escapes.
2. **Quirks as properties.** A per-driver property table is read by the shared body, with no `if driver == …` branch inside a body. Rows:
   - SIGTERM to a pid-1 child without a handler is dropped on `bwrap-pidns`;
   - the exit encoding: `128+n` on bwrap, no code on `linux-pgroup`.

   Each row has one test that observes it, so the table cannot drift from reality.
3. **Instances exist only where their driver can.** Per-OS instances are compiled with `cfg(target_os)`. A macOS or Windows instance never shows as a passing skip on the Linux job. On Linux, a host where the bwrap probe fails reports the `bwrap-pidns` instance as not run, naming the probe reason, never as passed.
4. **`spawn_fds_leak.rs` stays its own owner.** It proves the descriptor rule of `spawn_with_fds`, which is not a driver behaviour. It is not instantiated per driver and not consolidated.
5. **Driver-specific tests stay in their driver files, and must not be consolidated:**
   - `containment_bwrap.rs:76` (the gate is pid 1, `NSpid`);
   - `containment_bwrap.rs:178` and `:187` (the gate outlives, or dies with, a killed supervisor);
   - `containment_bwrap.rs:196` and `:221`;
   - `containment_pgroup.rs:117` (grace snapshot);
   - `containment_pgroup.rs:171` (no subreaper);
   - `containment_windows.rs:235` and `:250`.
6. **Net test lines ≤ 0** across the containment test files. Phase 05's report carries an inventory listing every retired test with its new owner, and a mutation spot-check: break one driver on purpose in a scratch branch, never committed, and show that only that driver's instance fails.
7. **CI:** the `process-containment` workflow also runs on pull requests and on pushes to `main` that touch `packages/process/**`.

## Files

- `packages/process/rust/tests/`: one new conformance module, the per-driver instantiation, and the retired duplicates in `containment_{bwrap,pgroup,macos,windows}.rs`. `spawn_fds_leak.rs` is not touched.
- `.github/workflows/process-containment.yml`.

## Steps

1. Map every existing case to a behaviour (a)–(g) or to "driver-only".
2. Send the map to TEST (`forgent-f8`) and wait for its review.
3. Write the bodies, move the instantiations, delete the duplicates.
4. Run `cargo test -p fgos-process` on this host (bwrap and pgroup both instantiated; the pgroup driver is constructed directly).
5. Trigger the workflow on a branch for macOS and Windows (`workflow_dispatch`).

## Owning proof

The suite is the proof. Each body is the single owner of its behaviour.

## Gates

- Green on Linux locally, and on the three CI runners.
- TEST approval.
- Net lines ≤ 0, counted with `git diff --stat` on the tests directory.

## Risk and rollback

- **Risk:** a generic body weakens a driver-specific assertion. TEST's review checks each retired case against its new owner.
- **Rollback:** revert.
