---
phase: 05
title: "T4: Run Supervisor + Launch gate"
status: pending
depends_on: [04 closed]
effort: ~4d (rough)
---

# Phase 05 — T4: Run Supervisor + Launch gate

Template layer: follow the loop in [plan.md](plan.md#the-per-layer-loop).

## Context links

Spec [run-supervisor](../../docs/platform/run-supervisor/spec.md) (supervisor, gate, adopt door); [component-boundary](../../docs/platform/component-boundary.md) rows Run Supervisor and Launch gate; [audit 09-28](../reports/audit-260928-2318-dispatch-engine-stability-speed-simplicity-report.md) S1–S7 (re-verify, many sites moved); [TEST plan](../261020-1757-test-governance-port-inventory-and-slow-file-extraction/plan.md) phase 2 run-supervisor row (143 Node tests in 23 files vs 136 Rust).

## Components, crates, Node

| Component | Rust | Node around it |
|---|---|---|
| Run Supervisor + Launch gate | `packages/run-supervisor/rust` (9 353) | `src/run-supervisor/*` 15 files, 1 491 lines (`direct-launch.mjs`, `cancel-registry.mjs`, `legacy-sweep.mjs`, `gate-kill-grace.mjs`, `attempt-step.mjs`, `steps/*` …); attempt supervision still in `src/runner/dispatch` (`assignment-runner.mjs` 2 672, `run-lock.mjs` 452, `transport.mjs` 708, `terminal-slot.mjs`) |

Doctor rows (`src/setup/registrations.mjs`): `run-supervisor-route` :2345, `runtime-socket-dir` :2350, `run-attempts-stuck` :2355, `gate-kill-grace` :2360, `legacy-attempts-stuck` :2365, `units-awaiting-resume` :2370, `cancel-wait` :2375 (+ `process-containment` :2340 if T0 hands it here). Setup steps: fixes `runtime-socket-dir`, `run-attempts-stuck`, `legacy-attempts-stuck` :2379-2381. Seven rows for one component: gate 8 doctor table, fold candidate. `src/setup/run-supervisor-checks.mjs:36` reads `/proc/net/unix` (T0 hand-over).

## Constraints

- **SEAT:** `assignment-runner.mjs` and `settlement.mjs` are SEAT files; schedule T4 edits to them through the board (proposal §4.4). Pre-6.2 legacy paths (`legacy-sweep.mjs`, `legacy-attempts-stuck`) are delete candidates under the R4 policy.

## Files

Filled by the T4 sub-plan with Create / Modify / **Delete** / **Tests to retire**. Seed delete list to check: `src/run-supervisor/legacy-sweep.mjs` with row `legacy-attempts-stuck` and its fix (pre-supervisor runs; R4 policy), Node attempt-supervision code in `src/runner/dispatch` that the supervisor already owns (`run-lock.mjs` holder logic, `transport.mjs` process-group handling). Tests to retire: run-supervisor Node mirrors TEST phase 2 has not retired (143 Node tests vs 136 Rust), tests of deleted legacy paths.

## Net size

Estimate before council (HARDEN commits only): Node −500 to −1 500, Rust −200 to +300, tests −300 to −900. Layer total ≤ 0.

## Risks (layer-specific)

| Risk | L × I | Mitigation |
|---|---|---|
| Live runs during landing | H × H | Adopt door settles survivors; landing in the ask-1 slot. |

## Done when

Loop close criteria; Node decides nothing about attempt lifecycle beyond calling the supervisor routes; T4 net size ≤ 0.
