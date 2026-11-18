# Phase 16: assignment runner

Wave 5. Depends on: 8, 10, 11, 13, 14; plan 1045 phase 6 on `main`. Effort 2.5d. Library only (engine module
`assignment_runner`).

## Context

`src/runner/dispatch/assignment-runner.mjs` (1 546; `executeAssignment` at most 300 lines, builds the envelope at
`:1086` with 1045 P6's `lanes` field), `run-admission.mjs` (325), `resolve.mjs` (362), `plan.mjs` (696,
`compileDispatchPlan` bind-free selectors kept as S5 D5 twins `retiredBy: S6a`, `purposeSeatOf`), `recovery-planner.mjs`
(303), `reconciliation-planner.mjs` (346), `run-admission`, `dispatch-error` (`DispatchError`). It turns one
Assignment into one supervised attempt: plan, lease, prompt, confinement request, envelope, handover, settle. Binding
goes through S5's Rust `bind` (`fgos-execution`), not a route.

## Requirements

- `packages/execution/engine/src/assignment_runner/` ports them over modules 07-14 and phase 05's controller; selectors
  that bind ask `fgos-execution::bind` in process (the S5 D5 twin ends here).
- Replay digest (`assignment-runner.mjs:300-314`, S5 D3) unchanged in bytes.
- `lanes` field and lane config reads as 1045 P6 landed them (D4).
- Recovery and reconciliation planners keep their purity contract (component-boundary: `recovery-planner.mjs` stable
  stringify of hash outputs); the Rust port uses canonical JSON only if bytes match, else keeps the documented
  exception (report).
- Integration tests: one direct-mode assignment end to end with a stub agent, one herdr-mode where herdr is present
  (capability-probed), replay, refusal paths (`DispatchError` codes).

## Steps

Read 1045 P6 as landed. Record vectors; red `engine/tests/assignment_runner.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test assignment_runner`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: the largest single port; drift in error codes the Work and Workflow callers branch on. Phase 00 census lists
the codes; vectors assert them. Rollback: revert.
