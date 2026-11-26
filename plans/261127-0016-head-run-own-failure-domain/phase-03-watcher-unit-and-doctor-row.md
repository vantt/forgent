# Phase 3 — Watcher unit and doctor row

Capability: `code:implement`. Decision honored: D8 and the doctor line of the discussion's constraints.
Depends on phase 1 (scopes must exist before `KillMode=process` can go).

## Inputs

- `packages/distribution/rust/src/timer.rs` (`leaves_started_processes_running`, `render_systemd`, `render_launchd`,
  the test around line 1705-1730)
- `packages/distribution/contracts/doctor-registry.v1.json` and
  `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` §3
- `apps/fgos/src/wiring/doctor/run_supervisor.rs` (the `run-supervisor-route` row)
- phase 1's `controller/scope.rs` (the reachability decision to reuse)

## Files it may write

`packages/distribution/rust/src/timer.rs`, `packages/distribution/contracts/doctor-registry.v1.json`,
`apps/fgos/src/wiring/doctor/run_supervisor.rs`.

## Steps

1. Facts: list what `fgos watcher tick` starts that must outlive the tick (grep the tick path for detached spawns:
   head start, `fgos run`, mailbox, gateway). Record the list in
   `plans/261127-0016-head-run-own-failure-domain/reports/killmode-facts.md`.
2. If every such process is spawned through `spawn_supervisor` (so it lands in its own scope), drop `KillMode=process`
   from the systemd service and narrow `leaves_started_processes_running` to launchd only (keep
   `AbandonProcessGroup`); update the timer test. If anything else must outlive the tick, keep the line and name it in
   the facts report and in a comment-free test assertion.
3. Doctor row `systemd-user-scope`: Linux only, warn (never fail) when no user manager is reachable or `systemd-run` is
   missing, saying supervisors will share their starter's cgroup. Judge it with phase 1's reachability function from
   `run_supervisor.rs`; add the row to the registry (`inRust` rows and the row list) after `run-supervisor-route`. No
   fix registered.

## Verify

`cargo test -p fgos-distribution` and `cargo test -p fgos doctor` green; `npm run fgos:dev -- doctor --json` shows the
row. Pass: the service text matches the facts decision and the row is present and warn-only.

## Rollback

Revert the phase commit; installed units are re-rendered by `fgos setup` from the reverted renderer.
