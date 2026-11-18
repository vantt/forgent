# Phase 06: Execution pure core

Wave 2. Depends on: 0. Effort 3d (phase 00 may split it in two serial halves). Library only.

## Context

`fgos-execution` (`packages/execution/rust`, S5) is pure: executor model, bind, decide, explain, agents, tools, hook,
runner check. The pure half of `src/runner/execution/**` joins it (P2): `unit.mjs` (321, `validateUnit`,
`normalizeStanceOptions`), `run-request.mjs` (373, `planFromFlags`, `existingPlanRef`, `foldRunSetting`, request from
flags), `patterns/{catalog,catalog-entries,retired-keys}.mjs` (1 025, `loopOf`, `resolveCollaboration`,
`checkCatalog`), `loops/*` as state machines (solo, reviewed, panel, debate, verify, role-tasks, history-outcome,
index; 811), `outcome.mjs` (115), `seat-resolver.mjs` (380, `checkDeclaredSeats`, `assertNoSeatTier`,
`assertNoUnitTier`, `seatLaunchesOf`), `legacy-seat-read.mjs` (172), `case-run-paths.mjs` (31), `handoff-refs.mjs`
(289), `unit-summary.mjs`, `unit-state.mjs`, `seat-ledger.mjs`, `unit-control.mjs`, `case-admission-port.mjs`
(contract part: the `CaseAdmission` trait, `unitRunSettle` shape, `CaseAdmissionRefusedError` code). Effects (file
reads, spawns, clocks) stay behind traits. The exact list is phase 00 section 1.

## Requirements

- New modules in `packages/execution/rust/src/` (`unit`, `run_request`, `patterns`, `loops`, `outcome`,
  `seat_resolver`, `case_paths`, `handoff`, `unit_record`, `admission` trait) with `pub mod` lines in its `lib.rs`.
- Golden vectors under `packages/execution/contracts/core/` (`unit.v1.json`, `patterns.v1.json`, `outcome.v1.json`
  and the others phase 00 names) recorded from Node; Rust tests read them.
- Loops are pure transition functions (state + event -> state + commands); the engine (phase 18) runs the commands.
- `CaseAdmission` trait with the four operations and their payloads exactly as the Node port documents them
  (`case-admission-port.mjs:6-13`); no adapter here.
- No new dependency beyond what `fgos-execution` has, plus `fgos-write-scope` for write-scope canonicalisation.

## Steps

1. Record vectors from Node (phase 00 section 7). 2. Red Rust tests. 3. Port. 4. Report which Node functions are now
twinned and which Node consumer classes (`addon` in phase 00 section 2) will call them in phase 20.

## Validation

`cargo test -p fgos-execution`; clippy, msvc, aarch64-apple-darwin; the crate still has no process or fs dependency
(`cargo tree -p fgos-execution`).

## Risk and rollback

Risk: loops ported as effectful code. Review rule: no `std::process`, `std::fs`, `SystemTime` in the crate (grep in
the report). Rollback: revert.
