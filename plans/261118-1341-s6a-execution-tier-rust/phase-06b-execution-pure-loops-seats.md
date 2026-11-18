# Phase 06b: Execution pure core, outcome, loops, seats, records, admission contract

Wave 3. Depends on: 3. Effort 2d. Library only. Split from the old phase 6.

## Context

Ports the rest of the pure half of `src/runner/execution/**` (P2): `outcome.mjs` (115), `loops/*` as state machines
(solo, reviewed, panel, debate, verify, role-tasks, history-outcome, index; 811), `seat-resolver.mjs` (380,
`checkDeclaredSeats`, `assertNoSeatTier`, `assertNoUnitTier`, `seatLaunchesOf`), `legacy-seat-read.mjs` (172),
`case-run-paths.mjs` (31), `handoff-refs.mjs` (289), the pure parts of `unit-summary.mjs`, `unit-state.mjs`,
`seat-ledger.mjs`, `unit-control.mjs`, and `case-admission-port.mjs` (contract part: the `CaseAdmission` trait,
`unitRunSettle`/`releasedUnitRunSettle` shapes, `CaseAdmissionRefusedError` code). About 2 200 lines. The exact list is
phase 00 §1.

## Requirements

- Modules `packages/execution/rust/src/{outcome,loops,seat_resolver,case_paths,handoff,unit_record,admission}/`
  (stubs from phase 3).
- Loops are pure transition functions (state + event -> state + commands); the engine (phase 18) runs the commands.
- `CaseAdmission` trait with the six operations the peer protocol carries (P17): `resolveBinding`, `admit`,
  `recheckEffect`, `settle` with their payloads exactly as the Node port documents them
  (`src/runner/execution/case-admission-port.mjs:6-13`), plus `activityUnitOf` and `confinedWriteRefusal` as Workflow
  answers them today (`src/workflow/case-admission-port.mjs:124,250`, injected at `bin/fgos.mjs:2544`); no adapter here.
- Legacy seat reads accept every generation in the phase 00 corpus (F13).
- Golden vectors under `packages/execution/contracts/core-loops/` recorded by
  `test/golden-recorders/core-loops.recorder.mjs` (committed); Rust tests `packages/execution/rust/tests/core_loops.rs`.

## Steps

1. Commit the recorder; record vectors. 2. Red Rust tests (vectors plus corpus replay). 3. Port. 4. Report twinned
functions and their phase-20 consumers.

## Validation

`cargo test -p fgos-execution --test core_loops`; clippy, msvc, aarch64-apple-darwin; no `std::process`, `std::fs`,
`SystemTime` in the new modules.

## Risk and rollback

Risk: loops ported as effectful code. Review rule above. Risk: a seat read rejects a pre-`seatSchema` record. Corpus
replay. Rollback: revert.
