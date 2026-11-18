# Phase 10 — Transcript source on the contract

## Inputs
- `packages/observe/rust/src/sources/claude_transcripts.rs`. It already reads `model`, but nothing groups by it.
- The statusline sidecar format, in `plans/261117-1856-secretary-session-spine/reports/spike-rotation.md` and
  `src/session-rotation/measure.mjs`.
- Phase 1 (`RecordSource`).

## Footprint
`packages/observe/rust/src/sources/**`, `packages/observe/rust/transcript-kinds.json`,
`packages/observe/rust/tests/transcript_*.rs`.

## Steps
1. Declare two kinds, embedded in the crate:
   - `fgos.session.usage`: one record per session, model and hour bucket, with a session ref, the model attr and
     token measures;
   - `fgos.session.activity`: the last activity instant per session, taken from the transcript or the sidecar.
2. Move `ClaudeTranscriptsSource` to `RecordSource`. Its constructor keeps its signature, so `metrics_sources.rs` does
   not change. `metrics harness` totals must stay equal before and after.
3. Tests:
   - a transcript with two models gives two groups;
   - a sidecar record moves the activity instant.

## Verify
`cargo test -p fgos-observe` passes.

## Rollback
Revert the phase commit.
