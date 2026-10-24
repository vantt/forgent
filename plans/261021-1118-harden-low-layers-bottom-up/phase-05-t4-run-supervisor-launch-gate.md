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

## Received from other lanes (record here, never lose)

- **Worker session-server start (HARDEN T2 [arbitration](../reports/council-261023-0402-harden-t2-arbitration.md) §2.3, §5, 2026-10-23).** `src/runner/dispatch/worker-session-boot.mjs:79-116` spawns `herdr --session <name> server` raw; T2 keeps it raw and names it in the terminal-control spec as the one exception, and fixes only the liveness judgment in front of it (CF01). T4 decides whether the run supervisor owns the session lifecycle.
- **R5: seat launch cost (TEST → HARDEN T4, 2026-10-22 00:44).** Each real seat launch through the host costs ≈ 1.2 s: host supervisor, bwrap, two Node child processes for `attempt-step` (`src/run-supervisor/attempt-step.mjs`, 150–250 ms each) and ≈ 15 confined git calls. 466 launches across `run`, `workflow-runner`, `run-provider-failover`, `advisory-m-contracts`, `units-runner`, `playbook-observable-order` tests (411 at best without losing proofs); the seat path blocks the event loop, so in-file concurrency gives nothing (44 s vs 42 s). TEST's estimate: `attempt-step` in-process or in the host (Rust `packages/run-supervisor/rust/src/attempt_step.rs` already exists) cuts each seat-running file by ≈ 25–35% and the user's unit cost too. T4 council measures it and decides the shape; the confined git share is R2 (T2). Evidence: [TEST phase 3 exec report](../reports/phase-lead-261021-2137-test-governance-p3-exec.md), main `b9e354f15`.
- **Windows hold transport (owner decision 17, 2026-10-22):** T1 kept `src/holder-lock/hold-transport.mjs` (498 lines) and `packages/holder-lock/rust/src/route/hold.rs` (554) because `supervise/windows.rs:53-107` receives the controller's `dispatch-cwd` domain through `cwdLeaseOwner`/`declare-domain` (T1 red-team RT-M3). The T4 council weighs whether the supervisor can receive a domain another way so the helper goes; evidence in [T1 red-team](../reports/council-261021-2338-harden-t1-seat-redteam.md) RT-M3.

- **Agent outcome wiring (HARDEN T3-04a [arbitration](../reports/council-261024-1947-harden-t3a-arbitration.md) §5, owner decision 30, 2026-10-24).** Wire the direct `classify` verdict into the receipt and call the protocol's reason renderer from the supervisor (≤ +20 lines). Delete `src/run-supervisor/steps/settle-attempt.mjs:84-129` (`paneScreenOf`, `SCREEN_LIMIT_PATTERNS`, `screenSaysProviderStop`, the reason regexes) in favour of a name→outcome table; retire the screen cases in `test/run-supervisor/attempt-steps.test.mjs`. Lands after the 04a contract change (`blocked(usage-limit)` in terminal mode). The RT-01 red test for the settle step is written in 04a.
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
