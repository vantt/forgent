---
phase: 06
title: "T5: Execution Core, Dispatch Transport & Confinement, Seat Binding, Run Result Evaluator"
status: pending
depends_on: [05 closed, SEAT landed]
effort: ~7d (rough; largest Node block)
---

# Phase 06 — T5: Execution Core, Dispatch & Confinement, Seat Binding, Run Result (end component)

Template layer: follow the loop in [plan.md](plan.md#the-per-layer-loop). From T5 up, the Rust move uses the "gain in simplicity / cost of the move" criterion (proposal §4.3), not "move everything".

## Context links

[runner spec](../../docs/specs/runner.md), [confinement-authority](../../docs/specs/confinement-authority.md), [seat-binding spec](../../docs/specs/seat-binding.md) (after SEAT lands), [component-boundary](../../docs/platform/component-boundary.md); [audit 09-28](../reports/audit-260928-2318-dispatch-engine-stability-speed-simplicity-report.md) C1 (five shadow binders), C3, C4; SEAT plan [`plans/261020-2132-seat-binding-component/`](../261020-2132-seat-binding-component/plan.md) and its landing report.

## Received from other lanes (record here, never lose)

- **From HARDEN T2 ([arbitration](../reports/council-261023-0402-harden-t2-arbitration.md) §5, 2026-10-23).** (1) The class-B herdr caller inventory of the T2 simplicity seat E-18 (`herdr-round.mjs`, `terminal-slot.mjs`, `assignment-runner.mjs:2009-2206`, `confinement/*`, `cli.mjs:1013-1048`, `run.mjs:107-115`, `legacy-sweep.mjs:54-57`) and its class-C stale comments. (2) `settlement.mjs:774` name-sniffing fallback; `usage-parsers.mjs:138-167` `parseHerdrUsage` returns all nulls. (3) `herdrSpawnAdapter` (`transport.mjs:676-707`): its refusal is the contract of a direct call; T5 decides. (4) E-3 consumer sites that re-parse the Git addon error outside T2 (`src/runner/merge.mjs:115,1236`, `src/runner/worktree.mjs:1098`, `src/verbs/merge/approve.mjs:165`, `src/verbs/events/migrate.mjs:242`, `src/event-store/native.mjs:33`) if T2 does not move them. (5) One `fgos doctor` run spawns 558 `internal seat-binding bind` host children (T2 speed seat F-D2).
- **H20 (HARDEN T1 arbitration, 2026-10-22):** `src/runner/lock-wait.mjs:22-24` is one default behind a module; callers `bin/fgos.mjs:3217,3291`; `test/runner/lock-wait.test.mjs` (53 lines) proves a function is called once. Inline the default at the CLI flag parsing and retire the module and test. Evidence: [T1 simplicity seat](../reports/council-261021-2338-harden-t1-seat-simplicity.md) S-E8.

## Components, crates, Node

| Component | Rust | Node around it |
|---|---|---|
| Execution Core (Unit, `runUnit`, `bind()`, Pattern) | — | `src/runner/execution/*` 24 files, 5 162 lines |
| Dispatch Transport & Confinement | — | `src/runner/dispatch/*` 64 files, 28 579 lines (largest Node block; `assignment-runner.mjs` 2 672, `config.mjs` 1 842, `run-result.mjs` 1 379, `provider-credential-renewal.mjs` 1 250, `cli.mjs` 1 100), of which `confinement/*` 10 files, 6 011 lines |
| Seat Binding | `packages/seat-binding/rust` (on `seat-binding-wave`, not on main yet) | `src/seat-binding/client.mjs` (SEAT) |
| Run Result Evaluator | `packages/run-result/rust` (2 468) | `src/runner/dispatch/run-result.mjs` (1 379) — twin candidate |

Doctor rows in scope (many; gate 8 is the main lever here): runner/model/tier/executor rows `src/setup/registrations.mjs:1440-1518`, `dispatch-decide-hook-wired` :1600, `bwrap-available` :1746, `provider-capacity-state` :2287, executor rows :4698-4812, confinement rows :5351-5985, `runner-coordination-orgPolicy-shape` :6148, plus SEAT's rows after landing. The exact count comes from the layer's own baseline (loop step 1).

## Constraints

- Starts only after SEAT lands; takes SEAT's measured Node/test Δ (review §3 checkpoint after SEAT phase 08) as input.
- T0–T4 carry items that live in T5 files (e.g. liveness and atomic writes inside `assignment-runner.mjs`, `run.mjs`, `unit-summary.mjs`) must already be closed; T5 does not inherit them.
- One-door job owned here: config read (every `config.json` reader in `src/runner/**` through one door); T0/T1 hand-over sites in confinement probes and `recovery-planner.mjs` TTL liveness (phase 01 §A).

## Files

Filled by the T5 sub-plan with Create / Modify / **Delete** / **Tests to retire**. Delete candidates to check first: audit C1 shadow binders, `run-result.mjs` vs `fgos-run-result`, legacy seat reads SEAT leaves behind.

## Net size

Estimate before council (HARDEN commits only; SEAT's own Δ excluded): Node −2 000 to −6 000, Rust −300 to +300, tests −1 000 to −3 000. Layer total ≤ 0.

## Risks (layer-specific)

| Risk | L × I | Mitigation |
|---|---|---|
| Scope explosion in a 28 k-line block | H × H | Council ranks by gain/size; sub-plan may split T5 into tracks by file set, still one layer close. |
| Overlap with WORK, AGENT-WF callers | M × M | Board shared-file list; Work and Workflow internals stay out of scope. |

## Done when

Loop close criteria; parallel paths per job in T5 = 1; T5 net size ≤ 0.
