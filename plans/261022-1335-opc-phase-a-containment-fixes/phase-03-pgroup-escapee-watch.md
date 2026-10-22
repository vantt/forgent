# Phase 03: pgroup escapee watch for contained children (A4)

## Context

Git spec §15 E4 claims a descendant drain "through the Process containment driver of each platform".

- **On `linux-pgroup`.** The contained branch has no escapee watch. The environment marker is planted only on the borrowed path: holder-lock `port.rs` ≈ :1111 calls `fgos_process::containment::environment_marked`. A `setsid` escapee of user code run by a contained read survives, and the read reports success (correctness F2).
- **The route in.** A superproject `status` runs a submodule's clean filter even though `check_config` refuses repository filters (correctness F3, verified on Git 2.53). `user_code_may_run` returns false for `Inspect` (`driver.rs` ≈ :956), so it misses this case.
- **Owner decisions this phase applies:**
  - 2026-10-20, unit 22: on `linux-pgroup`, never report plain success past a marked survivor. Return `containment-unproven` as recovery-required and do not kill the survivor.
  - 2026-10-22, Q3 a: reads stay in a pid namespace on `bwrap-pidns` hosts. There, the kernel drains every escapee, so the watch is not needed.

## Requirements

1. On a driver with `level == best-effort` (`linux-pgroup`), a contained child is spawned with the per-run marker when user code may run. After the domain's own cleanup, live processes carrying the marker turn a successful result into `containment-unproven`, the same mapping as the borrowed path.
2. "User code may run" for contained children = today's predicate, or the repository has a submodule. A submodule means a `.gitmodules` file in the worktree, or a non-empty `<common-dir>/modules`. This is the smallest predicate that closes the verified route. The general submodule-aware `check_config` stays a GIT item.
3. Watch cost: measure `environment_marked` (a `/proc/*/environ` scan) on this host, both with no submodules and with a submodule-bearing repository. If it exceeds 5 ms per child, stop and ask the owner (decision-question template). It may run only on `linux-pgroup` hosts, never on `bwrap-pidns`.
4. No new mechanism: reuse `environment_marked` and the marker name and token scheme of the borrowed path. If they are private to holder-lock, move them down to `fgos-process` and point holder-lock at them. Only one copy remains.

## Files

- The contained branch of `packages/git/rust/src/driver.rs`, plus `user_code_may_run` or a sibling predicate.
- `packages/process/rust/src/containment/linux.rs`, only if the marker helpers move.
- `packages/holder-lock/rust/src/port.rs`, only to use the moved helper.
- The owning test lives in `packages/git/rust` (crate test). It builds the `GitDriver` with a `LinuxPgroup` containment driver. The `containment` field is crate-private, so a crate test can set it with no env switch and no test-only branch (AGENTS.md DoD 5). The test runs a contained read in a superproject whose submodule's clean filter double-forks a `setsid` child, then asserts `containment-unproven`.
  - Git has no driver-selection seam today: `GitDriver::new` calls `select(&Default::default())`, and `SelectEnv` only names a bwrap path. So the existing `test/git/scoped-commit.test.mjs` escapee tests keep their natural selection and are not duplicated.

## Steps

1. Run impact analysis on `invoke_context` and `user_code_may_run`.
2. Add the predicate and the marker on contained children for best-effort drivers.
3. Map survivors to `containment-unproven`.
4. Write the test, then measure the watch cost.

## Owning proof

The new crate test in `packages/git/rust` owns the behaviour. Process's `environment_marked` keeps its own existing proof.

## Gates

- The crate test is green.
- `test/git/scoped-commit.test.mjs` is green on this host's natural driver.
- HARDEN's criteria (see phase 01).

## Review

HARDEN.

## Risk and rollback

- **Risks:**
  - False `containment-unproven` from an unrelated process that inherited the marker. Mitigation: the token is per run.
  - Scan cost. Mitigation: the requirement 3 gate.
- **Rollback:** revert.
