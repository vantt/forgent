# Phase 6: Integration gate, sweep rerun, changelog

## Context

- All phase branches, landed on main.
- Phase 5's rerun report and move table.

## Requirements

- The full gate is green on main.
- A user-visible line in the changelog.

## Files

`CHANGELOG.md`, `plans/261125-1631-agent-context-engine/reports/**`.

## Steps

1. Run `npm test` and `cargo test --workspace --no-fail-fast` on main. Fix nothing outside this phase; hand any red
   back to the phase that owns the file.
2. Run `fgos internal context-engine compile` on a project set up from a release built from this tree, and check that
   `rules.json` is present and its digest verifies (mission #1).
3. Add one line to `## [Unreleased]` in `CHANGELOG.md`: rules are checked when they are written (duplicates,
   conflicts, unknown `when:` keys), and agents read one checked rule set.
4. Run `rg -l "instruction-registry|instruction-composition" src scripts test bin` once more.

## Validation

`npm test` and `cargo test --workspace` are green; the release check of step 2 passes.

## Risk

Low. It changes only the changelog and reports.

## Rollback

Revert the changelog line. Reports are records and stay.
