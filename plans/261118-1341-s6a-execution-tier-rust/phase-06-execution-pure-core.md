# Phase 06: Execution pure core, unit, run request, patterns

Wave 3. Depends on: 3. Effort 1.5d. Library only. Split from the old phase 6 (2 695 + 1 413 Node lines, over the
2 500 rule); siblings 6b and 6c run in the same wave on disjoint module directories fixed by phase 3.

## Context

`fgos-execution` (`packages/execution/rust`, S5) is pure: executor model, bind, decide, explain, agents, tools, hook,
runner check. This phase ports `src/runner/execution/unit.mjs` (321, `validateUnit`, `normalizeStanceOptions`),
`run-request.mjs` (373, `planFromFlags`, `existingPlanRef`, `foldRunSetting`, request from flags; the
`confinedWriteRefusal`/`activityUnitOf` calls at `:321-328,351` stay port calls), `patterns/{catalog,catalog-entries,retired-keys}.mjs`
(1 025, `loopOf`, `resolveCollaboration`, `checkCatalog`). 1 719 lines. Effects stay behind traits.

## Requirements

- Modules `packages/execution/rust/src/{unit,run_request,patterns}/` (stubs from phase 3).
- Golden vectors under `packages/execution/contracts/core-unit/` recorded by
  `test/golden-recorders/core-unit.recorder.mjs` (committed); Rust tests `packages/execution/rust/tests/core_unit.rs`.
- No new dependency beyond phase 3's (`fgos-write-scope` for write-scope canonicalisation).

## Steps

1. Commit the recorder; record vectors. 2. Red Rust tests. 3. Port. 4. Report which Node functions are now twinned and
which Node consumers (`addon` class, phase 00 §2) will call them in phase 20.

## Validation

`cargo test -p fgos-execution --test core_unit`; clippy, msvc, aarch64-apple-darwin; no `std::process`, `std::fs`,
`SystemTime` in the new modules (grep in the report).

## Risk and rollback

Risk: run request built differently from argv (the `fgos run` flag table). Vectors cover every flag shape phase 19
copies. Rollback: revert.
