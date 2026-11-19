# Phase 16b: assignment runner

Wave 6. Depends on: 7b, 8b, 10, 11, 13b, 14, 16; plan 1045 phase 6 on `main` (met). Effort 2.5d. Library only (engine
module `assignment_runner`). Split from the old phase 16.

## Context

`src/runner/dispatch/assignment-runner.mjs` (1 554; `executeAssignment` `:1278-1554`, 277 lines; builds the envelope
at `:1093` (`buildEnvelope`) with 1045 P6's `lanes` field at `:1110`, `laneTransport(settings.lanes,
currentDispatchDepth())`; replay digest `:298-317`, codes `binding-replay-snapshot-missing`,
`binding-replay-config-mismatch`, S5 D3). 1045 P6 landed (`47165e3bf`, `e030632ca`, `52af20744`; Rust-only follow-up
`2dbabb340`): the lane settings come from config section `workerSlots` (`ceiling`, `laneWaitSec`) read by
`readLaunchSettings`, `src/run-supervisor/direct-launch.mjs:294-301`, and `laneTransport` `:308-311` gives the
envelope's `lanes` only at dispatch depth 0 (phase 05 ports `direct-launch.mjs`). It turns one Assignment into one supervised
attempt: plan, lease, prompt, confinement request, envelope, handover, settle.

## Requirements

- `packages/execution/engine/src/assignment_runner/` ports it over modules 7-16 and phase 05's controller.
- Replay digest unchanged in bytes.
- `lanes` field and lane config reads (`workerSlots`) as 1045 P6 landed them (D4); depth 0 only, as `laneTransport`.
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
