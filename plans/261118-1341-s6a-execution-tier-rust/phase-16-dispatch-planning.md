# Phase 16: dispatch planning, admission, recovery and reconciliation planners

Wave 5. Depends on: 6, 6c, 9, 13. Effort 2d. Library only (engine module `planning`). Split from the old phase 16
(3 578 Node lines); 16b (the assignment runner) follows in wave 6.

## Context

`src/runner/dispatch/` `plan.mjs` (696, `compileDispatchPlan`; bind-free selectors kept as S5 D5 twins
`retiredBy: S6a`, `purposeSeatOf`), `resolve.mjs` (362), `run-admission.mjs` (325), `recovery-planner.mjs` (303),
`reconciliation-planner.mjs` (346). 2 032 lines. Binding goes through S5's Rust `bind` (`fgos-execution`), not a route.

## Requirements

- `packages/execution/engine/src/planning/` ports them; selectors that bind ask `fgos-execution::bind` in process (the
  S5 D5 twin ends here; the door row "choose an executor ... purposeSeatOf" is edited by phase 21, which deletes
  `plan.mjs`).
- Recovery and reconciliation planners keep their purity contract (component-boundary: `recovery-planner.mjs` stable
  stringify of hash outputs); the Rust port uses canonical JSON only if bytes match, else keeps the documented
  exception (report).
- Golden vectors under `packages/execution/contracts/planning/` recorded by `test/golden-recorders/planning.recorder.mjs`,
  incl. `DispatchError` codes of each refusal and the adopt fixture of the corpus.

## Steps

Commit the recorder; record vectors; red `engine/tests/planning.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test planning`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: drift in error codes the Work and Workflow callers branch on. Phase 00 census lists the codes; vectors assert
them. Rollback: revert.
