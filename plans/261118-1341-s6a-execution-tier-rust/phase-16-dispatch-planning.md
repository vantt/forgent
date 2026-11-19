# Phase 16: dispatch planning, admission, recovery and reconciliation planners, bind facade

Wave 5. Depends on: 6, 6c, 9, 13. Effort 2.25d. Library only (engine module `planning`). Split from the old phase 16
(3 578 Node lines); 16b (the assignment runner) follows in wave 6. Since phase 00 (`f031ab0c8`) it also ports the bind
facade `bind.mjs` and `dry-bind.mjs`, moved here from phase 18 to keep 18 under 2 500 lines (P20): 16 = 2 264, 18 = 2 298.

## Context

`src/runner/dispatch/` `plan.mjs` (696, `compileDispatchPlan`; bind-free selectors kept as S5 D5 twins
`retiredBy: S6a`, `purposeSeatOf`), `resolve.mjs` (362), `run-admission.mjs` (325), `recovery-planner.mjs` (303),
`reconciliation-planner.mjs` (347; its `.fgos` joins through `fgosDirFromRoot` since `691255ad0`); and from
`src/runner/execution/`: `bind.mjs` (159, the facade every seat bind goes through, `:1-6`; `plan.mjs:22` imports
`bindWorkSeat`, `viaSeatRoute` from it; it calls `src/seat-binding/client.mjs:11`) and `dry-bind.mjs` (72,
`simulateUnitBindings`). 2 264 lines. `bind.mjs` is deleted by phase 21 (Node dispatch imports it), `dry-bind.mjs` by
phase 20.
Binding goes through S5's Rust `bind` (`fgos-execution`), not a route. The decider already exists in Rust:
`packages/execution/rust/src/decide.rs` (`purpose_seat` `:628`), the allowed owner of door row "decide a dispatch"
(`retiredBy: S6a`, debt `plan.mjs`: the bind-free selectors, same vectors); the planning module calls it, never a
second selector. `plan.mjs` and `resolve.mjs` are also debt of "derive executor facts" (`resolve.mjs`) and allowed
callers of "the Node bind facade has only its named callers" (`plan.mjs`).

## Requirements

- `packages/execution/engine/src/planning/` ports them; selectors that bind ask `fgos-execution::bind` in process (the
  S5 D5 twin ends here; the door rows "choose an executor ... purposeSeatOf", "decide a dispatch" and the bind-facade row are edited by
  phase 21, which deletes `plan.mjs`).
- `packages/execution/engine/src/planning/bind_facade.rs` (inside this module's directory) ports `bind.mjs` and
  `dry-bind.mjs` over `fgos-execution::bind` in process; `unit_run` (18) and `assignment_runner` (16b) call it. Door
  row "the Node bind facade has only its named callers" keeps its Node paths until 20/21 delete them.
- Recovery and reconciliation planners keep their purity contract (component-boundary: `recovery-planner.mjs` stable
  stringify of hash outputs); the Rust port uses canonical JSON only if bytes match, else keeps the documented
  exception (report).
- Golden vectors under `packages/execution/contracts/planning/` recorded by `test/golden-recorders/planning.recorder.mjs`,
  incl. `DispatchError` codes of each refusal, the adopt fixture of the corpus, and the bind facade's results and
  refusals (`simulateUnitBindings` included).

## Footprint

`packages/execution/engine/src/planning/**`, `packages/execution/engine/tests/planning.rs`,
`packages/execution/contracts/planning/**`, `test/golden-recorders/planning.recorder.mjs`.

## Steps

Commit the recorder; record vectors; red `engine/tests/planning.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test planning`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: drift in error codes the Work and Workflow callers branch on. Phase 00 census lists the codes; vectors assert
them. Rollback: revert.
