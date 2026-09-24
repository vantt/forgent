# Phase 05 — Long-tail sweep

## Context

`plan.md` § Dependencies: this phase starts after Phases 01–04 land (or are
explicitly deferred with a named reason). Its job is to re-categorize
whatever remains once the four named clusters are gone, and either fix or
scope-document the rest — this repo's own CI signal should end this track
in one of two states: genuinely green on all three OSes, or every remaining
red test individually named and justified (not a silent 400-test gap).

## Requirements

1. Run Phase 00's snapshot procedure again against current `main`.
2. For every remaining failure, attribute it to one test file and one
   apparent cause (even a tentative one) — the goal is a complete map, not
   necessarily complete fixes.
3. Group into new sub-clusters by shared file, shared subsystem, or shared
   error shape. Fix the ones with a clear single cause. For everything else,
   this phase's exit criterion is a decision, not silence: either commit to
   fixing it (spin off a `phase-06-...` etc. with the same evidence
   standard as 01-04), or bring the user a scoped decision the way this
   session brought "build Rust on Windows or not" — do not leave a test
   red without SOMEONE having decided that's acceptable.

## Files

Unknown until this phase runs.

## Validation

Every test in the suite is accounted for on all three OSes: green, or
explicitly skipped with a named, reviewed reason (matching this track's
existing `mockHerdr`/Windows-symlink-privilege precedents), or the user has
explicitly accepted a documented residual gap.

## Risks

If Phases 01–04's fixes shift `main` significantly, this phase's baseline
(the "~450 remaining" estimate in `plan.md`) could be stale by the time it
starts — always re-run Phase 00's snapshot fresh rather than trusting the
plan's original numbers.
