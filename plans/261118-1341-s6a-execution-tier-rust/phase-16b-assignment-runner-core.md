# Phase 16b: assignment runner

Wave 6. Depends on: 7b, 8b, 10, 11, 13b, 14, 16; plan 1045 phase 6 on `main`. Effort 2.5d. Library only (engine
module `assignment_runner`). Split from the old phase 16.

## Context

`src/runner/dispatch/assignment-runner.mjs` (1 546; `executeAssignment` at most 300 lines, builds the envelope at
`:1086` with 1045 P6's `lanes` field; replay digest `:300-314`, S5 D3). It turns one Assignment into one supervised
attempt: plan, lease, prompt, confinement request, envelope, handover, settle.

## Requirements

- `packages/execution/engine/src/assignment_runner/` ports it over modules 7-16 and phase 05's controller.
- Replay digest unchanged in bytes.
- `lanes` field and lane config reads as 1045 P6 landed them (D4).
- Integration tests: one direct-mode assignment end to end with a stub agent, one herdr-mode where herdr is present
  (capability-probed), replay, refusal paths (`DispatchError` codes).
- Golden vectors under `packages/execution/contracts/assignment-runner/` recorded by
  `test/golden-recorders/assignment-runner.recorder.mjs`.

## Steps

Read 1045 P6 as landed. Commit the recorder; record vectors; red `engine/tests/assignment_runner.rs`; port; green;
report.

## Validation

`cargo test -p fgos-execution-engine --test assignment_runner`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: the largest single file; drift in the envelope or replay digest. Vectors pin both. Rollback: revert.
