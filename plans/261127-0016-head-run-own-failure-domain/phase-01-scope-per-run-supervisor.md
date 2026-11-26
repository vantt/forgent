# Phase 1 — Scope per run supervisor

Capability: `code:implement`. Decisions honored: D1, D2, D3, D4, D5 of
`plans/discussions/ds-rig5dsai5l-head-run-own-failure-domain/DISCUSSION.md`.

## Inputs

- `packages/run-supervisor/rust/src/controller/launch.rs` (`start_supervisor`, `spawn_supervisor`, around line 815-893)
- `packages/run-supervisor/rust/src/controller/config.rs` (how the controller reads a key through `fgos-config`)
- `packages/run-supervisor/rust/src/supervise.rs` (binding writer, around line 791-841)
- `packages/run-supervisor/contracts/supervisor-binding.v1.json`
- `docs/platform/run-supervisor/spec.md` (§8-§9) and `docs/platform/agent-confinement/spec.md` (runtimeDir mask)
- `plans/261118-1045-project-supervisor/reports/spike-timer-head-start.md` (trial 7)

## Files it may write

`packages/run-supervisor/rust/src/controller/launch.rs`, `packages/run-supervisor/rust/src/controller/scope.rs` (new),
`packages/run-supervisor/rust/src/controller/mod.rs`, `packages/run-supervisor/rust/src/controller/config.rs`,
`packages/run-supervisor/rust/src/supervise.rs`, `packages/run-supervisor/rust/tests/controller_launch.rs`,
`packages/run-supervisor/contracts/supervisor-binding.v1.json`, `core/config-standard/runner.yaml`,
`core/config-schema/runner.schema.yaml`, `docs/platform/run-supervisor/spec.md`.

## Steps

1. Proof point first (D3): on fg-server2, outside any sandbox, wrap a process holding a lock as fd 3 with
   `systemd-run --user --scope --collect --unit=<name> -p OOMPolicy=stop -- <cmd>` after `setsid`, and confirm the fd
   and the lock survive. Record the result in `plans/261127-0016-head-run-own-failure-domain/reports/scope-wrap-proof.md`.
   If they do not survive, use the fallback: spawn as today, then attach the child pid to a new transient scope
   (`StartTransientUnit` with `PIDs`), same unit name and properties.
2. `controller/scope.rs`: decide the failure domain for one launch. Linux only: a user manager is reachable when
   `XDG_RUNTIME_DIR/systemd/private` (or the user bus) exists and `systemd-run` is on PATH; otherwise return
   `inherited` with a reason (`not-linux`, `no-user-manager`, `no-systemd-run`). Build the wrapped command: unit name
   `fgos-run-<attemptId>` (sanitised to unit-name characters), `--scope --collect --user -p OOMPolicy=stop`, and
   `-p MemoryMax=<cap>` only when the key is set. Pure command building is unit-testable without systemd.
3. `controller/config.rs`: read `runner.supervisorScope.memoryMax` (string, systemd size syntax such as `8G`; empty
   means no cap) the same way the `dispatch` keys are read.
4. `controller/launch.rs` `spawn_supervisor`: on unix, build the command through `scope.rs` and keep `setsid` and the
   `spawn_with_fds` handover unchanged. Pass the decided failure domain to the supervisor (envelope-adjacent env var
   or argument the supervisor already reads; no new file) so it can record it. Windows unchanged (`inherited`,
   `not-linux`).
5. `supervise.rs`: write `failureDomain: {kind: "systemd-scope", unit}` or `{kind: "inherited", reason}` into
   `supervisor-binding.json`; extend `supervisor-binding.v1.json` with the optional field (additive).
6. Config: add `runner.supervisorScope.memoryMax` to `core/config-standard/runner.yaml` with an `@fgos:doc` line
   (default empty, "pending owner question q-gg7if2fal2" is not written into the doc; say what it does) and to
   `core/config-schema/runner.schema.yaml`. Nothing else registers a default.
7. Owning proof in `tests/controller_launch.rs`: scope-wrapped command with and without `MemoryMax`; plain command and
   `inherited` reason when no manager is reachable; binding carries the field.
8. `docs/platform/run-supervisor/spec.md`: one short section on the failure domain of a supervised attempt, and the
   decision-history line pointing to the discussion.

## Verify

`cargo test -p fgos-run-supervisor` green, and `npm test -- test/config` (or the config schema check the suite runs)
green. Pass: the new proof asserts all three shapes (scope with cap, scope without cap, inherited).

## Rollback

Revert the phase commit; the binding field is optional and the key defaults to empty, so no stored data needs repair.
