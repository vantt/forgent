# Phase 2: Integration gate, changelog

## Context

- Phase 1 landed on main, with its move table and the independent rerun report under this plan's `reports/`.

## Requirements

- The full gate is green on main.
- A user-visible line in the changelog: other projects get the gathered rules through the compiled set.

## Files

`CHANGELOG.md`.

## Steps

1. Run `npm test` and `cargo test --workspace --no-fail-fast` on main. Fix nothing outside this phase; hand any red
   back to phase 1.
2. Run `fgos internal context-engine check` and `fgos internal context-engine compile` on main; the set's digest
   verifies and every row of `reports/gather-table.md` is in `rules.json`.
3. Add one line to `## [Unreleased]` in `CHANGELOG.md`, after ACE's line: every fgOS rule has one owner, and the
   measured duplicates and conflicts are gone.

## Validation

`npm test` and `cargo test --workspace` are green; step 2 passes.

## Risk

Low. It changes only the changelog.

## Rollback

Revert the changelog line.
