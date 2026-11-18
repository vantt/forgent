# Phase 13: assignment model

Wave 4. Depends on: 6, 6b, 7, 9. Effort 2d. Library only (engine module `assignment`). Split from the old phase 13
(4 305 Node lines incl. `config.mjs`, which moved to 6c); 13b follows in wave 5.

## Context

The data side of one Assignment, before the runner: `src/runner/dispatch/` `assignment.mjs` (934),
`assignment-normalizer.mjs` (188), `assignment-layout.mjs` (116, `isWithinDir`), `brief.mjs` (181), `write-scope.mjs`
(190, `canonicalizeWrites`, `globsMeet`, `writeScopesOverlap`), `run-timeout.mjs` (21), `tier-cell.mjs` (64,
`parseTierCell`), `executor-governance.mjs` (81), `work-item-input.mjs` (22), `shipped-catalog.mjs` (30),
`tool-providers.mjs` (130; S5 `tools.rs` may already own it). 1 957 lines. Exact list: phase 00 §1. S5 D7 twins named
`retiredBy: S6a` in these files are retired by their cutover phase, not here.

## Requirements

- `packages/execution/engine/src/assignment/` ports the effectful parts (layout on disk, assignment read/write); the
  pure parts (write scope, timeout, tier cell, governance) go to `fgos-execution` only if phase 00 classed them `addon`
  (Node consumers need them), else they live here. Write-scope canonicalisation reuses `fgos-write-scope`
  (`packages/git/write-scope`), never a third copy.
- Runner config through phase 6c's `runner_config`; no second loader.
- Assignment readers replay the phase 00 corpus (pre-`seatSchema` records, open Node-era attempt; F13); an assignment
  Rust writes is read by the previous Node release (reverse-read fixture for phase 22, F12).
- Golden vectors under `packages/execution/contracts/assignment/` (normalised assignment, brief text, layout) recorded
  by `test/golden-recorders/assignment.recorder.mjs`.

## Steps

Commit the recorder; record vectors; red `engine/tests/assignment.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test assignment`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: an assignment written by Node is misread after cutover. Corpus replay; landing precondition nothing in flight
in this repo; CHANGELOG upgrade line for other projects (phase 22). Rollback: revert.
