---
contract: plan-v1
title: "Each run supervisor in its own systemd scope, and a head whose supervisor died is raised as session-gone"
status: running
lead: head:lead-forgent-261127-0016-head-r-5a922
priority: P0
blockedBy: []
base: b4188a34b023c3dfd159eec5284901a80722fbf6
footprint:
  - plans/261127-0016-head-run-own-failure-domain/**
  - packages/run-supervisor/rust/src/controller/launch.rs
  - packages/run-supervisor/rust/src/controller/scope.rs
  - packages/run-supervisor/rust/src/controller/mod.rs
  - packages/run-supervisor/rust/src/controller/config.rs
  - packages/run-supervisor/rust/src/supervise.rs
  - packages/run-supervisor/rust/tests/controller_launch.rs
  - packages/run-supervisor/contracts/supervisor-binding.v1.json
  - core/config-standard/runner.yaml
  - core/config-schema/runner.schema.yaml
  - docs/platform/run-supervisor/spec.md
  - apps/fgos/src/wiring/observe_sources/head_state.rs
  - apps/fgos/src/wiring/observe_sources/tests/mod.rs
  - core/watcher/definitions/session-gone.query.json
  - docs/platform/observe/spec.md
  - packages/distribution/rust/src/timer.rs
  - packages/distribution/contracts/doctor-registry.v1.json
  - apps/fgos/src/wiring/doctor/run_supervisor.rs
  - apps/fgos/src/wiring/doctor/mod.rs
source:
  - plans/discussions/ds-rig5dsai5l-head-run-own-failure-domain/DISCUSSION.md
  - p-6htu2ae64o
created: 2026-11-27
---

# Each run supervisor in its own systemd scope; a dead head supervisor is raised

Owner order (lead:SUPERVISOR, 2026-11-27): this plan goes first, ahead of every other plan, hence `P0`. Its
footprint stays clear of Keeper (`261122-0056-orchestration-skeleton`), which owns `src/session-host/head-stop.mjs`,
its test, `docs/platform/session-host/spec.md` and `packages/supervision/rust/tests/definitions.rs`; the
`stopHeadSession` part of the discussion (D7), the `session-gone` wiring proof and the changelog fragment
(`changelog.d/**` is held by plan `261126-2324`) therefore go to the sibling plan
[`261127-0018-dead-supervisor-head-stop`](../261127-0018-dead-supervisor-head-stop/plan.md), blocked by Keeper.

## Outcome

Every `fgos internal supervise` starts, through the one spawn door `spawn_supervisor`
(`packages/run-supervisor/rust/src/controller/launch.rs`), inside its own transient systemd user scope with
`OOMPolicy=stop` and an optional `MemoryMax`; a kernel OOM kill or the stop of one unit ends only that scope (D1-D3).
Where no user manager is reachable the supervisor starts as today and its binding says
`failureDomain: {kind: "inherited", reason}` (D4). The watcher's head-state source judges the supervisor recorded
in `supervisor-binding.json` as well as the pane, so a head whose pane lives without its supervisor reads a
distinct state and `session-gone` raises it (D6). The watcher unit no longer needs `KillMode=process` if the facts
step proves nothing else relies on it (D8). Doctor warns, on Linux only, when no user manager is reachable.

## Acceptance criteria

1. `cargo test -p fgos-run-supervisor`: the owning proof in `packages/run-supervisor/rust/tests/controller_launch.rs`
   shows the spawn builds the scope-wrapped command (unit name, `OOMPolicy=stop`, `MemoryMax` only when
   `runner.supervisorScope.memoryMax` is set) when a user manager is reachable, the plain command when not, and
   the binding records `failureDomain` with `kind` `systemd-scope` (+ `unit`) or `inherited` (+ `reason`).
   Discussion acceptance 1.
2. `cargo test -p fgos` (observe source tests in `apps/fgos/src/wiring/observe_sources/tests/mod.rs`): pane live and
   supervisor dead reads the state `supervisor-gone` with the placement's instant (one incident per placement);
   `core/watcher/definitions/session-gone.query.json` lists it. Discussion acceptance 2 (its wiring proof is in
   the sibling plan).
3. `cargo test -p fgos-distribution`: the watcher service text carries no `KillMode=process` (or, if the facts step
   finds a remaining need, the phase-3 file names it and the line stays); `fgos doctor` shows the row
   `systemd-user-scope` (warn-only, Linux only) in `packages/distribution/contracts/doctor-registry.v1.json`.
4. Live check on fg-server2 recorded in `reports/live-check.md` (discussion acceptance 4, minus the `session stop`
   step, which the sibling plan proves): two heads started from the watcher each sit in their own scope
   (`systemctl --user status`), none in `fgos-watcher-<id>.service`; `kill -9` of one supervisor and, separately,
   `systemctl --user stop fgos-watcher-<id>.service` leave the other head's request socket answering; the killed
   one appears as a `session-gone` event on the next tick.
5. `npm test` and `cargo test --workspace` green on the combined tree.

## Non-goals

Machine-wide memory pressure (swap, `systemd-oomd`, `oom_score_adj` of `user@.service`); scopes on macOS or
Windows; capping the watcher's own unit; keeping a head's conversation across a supervisor death; automatic head
restart; changing run-supervisor spec §9; the `stopHeadSession` change, the definitions wiring proof and the
changelog fragment (sibling plan).

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Scope wrap at the spawn door (`controller/scope.rs`, called from `spawn_supervisor`) | `run-supervisor` | extends the one spawn door; no second launch path (D1, D2) |
| `failureDomain` field of the supervisor binding | `run-supervisor/supervisor-binding.v1` | additive field on the existing contract (D4) |
| Config key `runner.supervisorScope.memoryMax` | `run-supervisor` | registered only in `core/config-standard` + `core/config-schema`; default empty pending `q-gg7if2fal2` (D5) |
| Head state `supervisor-gone` | `observe` | new value of the existing `fgos.head.state` attribute from the existing head-state source (D6) |
| Doctor row `systemd-user-scope` | `doctor-readiness-registry` | one warn-only row, judged by the run-supervisor doctor wiring |
| Retire `KillMode=process` on the watcher unit | `managed-timer` | survivor: per-supervisor scopes; retired: `KillMode=process` line in `packages/distribution/rust/src/timer.rs` (conditional, D8; launchd `AbandonProcessGroup` stays) |

## Prior art

Reused: the 2026-11-18 spike (`plans/261118-1045-project-supervisor/reports/spike-timer-head-start.md`, commit
`a27331b109`) showed `systemd-run --user --scope` keeps a head alive past unit exit (trial 7) and chose
`KillMode=process` for simplicity; this plan takes the scope it rejected. Reused the head-state source and
`session-gone` definition of plan `261124-2143`. Missing: any cgroup separation at spawn and any supervisor check
in head liveness.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Scope per run supervisor](phase-01-scope-per-run-supervisor.md) | - | packages/run-supervisor/rust/src/controller/launch.rs, packages/run-supervisor/rust/src/controller/scope.rs, packages/run-supervisor/rust/src/controller/mod.rs, packages/run-supervisor/rust/src/controller/config.rs, packages/run-supervisor/rust/src/supervise.rs, packages/run-supervisor/rust/tests/controller_launch.rs, packages/run-supervisor/contracts/supervisor-binding.v1.json, core/config-standard/runner.yaml, core/config-schema/runner.schema.yaml, docs/platform/run-supervisor/spec.md | 1 | done |
| 2 | [Head state judges the supervisor](phase-02-head-state-judges-supervisor.md) | - | apps/fgos/src/wiring/observe_sources/head_state.rs, apps/fgos/src/wiring/observe_sources/tests/mod.rs, core/watcher/definitions/session-gone.query.json, docs/platform/observe/spec.md | 1 | done |
| 3 | [Watcher unit and doctor row](phase-03-watcher-unit-and-doctor-row.md) | 1 | packages/distribution/rust/src/timer.rs, packages/distribution/contracts/doctor-registry.v1.json, apps/fgos/src/wiring/doctor/run_supervisor.rs, apps/fgos/src/wiring/doctor/mod.rs | 2 | ready |
| 4 | [Integration and live check](phase-04-integration-and-live-check.md) | 1, 2, 3 | plans/261127-0016-head-run-own-failure-domain/reports/** | 3 | ready |

lead:SUPERVISOR order 2026-11-27 02:4x (owner channel, typed to the lead): `apps/fgos/src/wiring/doctor/mod.rs` joins the footprint (phase 3) and phase 3 lands now. The supervisor wrote the footprint line because that order had not reached main. The two doctor docs files named in q-a5qeyr5g62 were not part of the order.

Hot files: `core/config-standard/runner.yaml` and `core/config-schema/runner.schema.yaml` (phase 1 only);
`packages/distribution/contracts/doctor-registry.v1.json` (phase 3 only). Generated surfaces: none touched.

## Owner questions

- `q-gg7if2fal2` — Cap memory per run supervisor's own systemd scope by default? (8G, none, or 4G). Non-blocking:
  phase 1 ships the key with an empty default; the answer changes one default value in
  `core/config-standard/runner.yaml` (phase 1, or a one-line follow-up if phase 1 has landed).

## Risks and rollback

- The descriptor handover (locks as fds 3+) may not survive the `systemd-run --scope` exec wrap. Proof point:
  phase 1's first step is a live check of the wrap with a held lock; on failure use the D3 fallback (attach the
  spawned pid with `StartTransientUnit` + `PIDs`), same names and binding field.
- A confined launch cannot reach the bus (agent-confinement runtimeDir mask): it falls back to `inherited` by
  design; the binding shows it.
- Retiring `KillMode=process` too early would kill heads at unit exit when scopes fall back to `inherited`
  (e.g. the user bus is unreachable from the watcher service). Phase 3 retires it only if heads started by the
  tick never fall back on systemd; otherwise it keeps the line and says why.
- Rollback: revert the phase commits; the binding field is additive and the config key defaults to empty.
