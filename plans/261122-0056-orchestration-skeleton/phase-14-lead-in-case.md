# Phase 14: Lead runs phases inside cases; one harness

Decision: OS-D21 (2) and (4): each phase is mapped at execution into one or more guide cases through
`fgos workflow propose` (domain table plus the lead's judgement), the owner approves the mapping and frame once, cases
inherit the plan approval (`--inherit`); the lead is the case's judge and does not run phases outside a case.

## Inputs

- `core/skills/fgos-lead/SKILL.md` (today step 2 runs each phase with a bare `fgos run ... --writes`).
- `packages/execution/rust/src/run_request/` (the rule "a writing run needs a worktree no case owns").
- `fgos run --help` (`--case`, `--activity`, `--route`); `fgos workflow --help` (`propose`, `start --frame`,
  `--inherit`).
- `domains/coding/slice-kinds.yaml`; discussion §3 4p (the walk-through of a coding plan).

## Footprint

`packages/execution/rust/src/run_request/`, `packages/execution/rust/tests/run_request_case.rs` (new),
`core/skills/fgos-lead/SKILL.md`.

## Steps

1. Run door: a writing run whose caller role is a lead (`head:lead-*`, from Identity) and has no `--case` is refused
   with `lead-run-outside-case`, naming `fgos workflow propose` and `fgos run --case`. Read-only runs stay allowed.
2. Lead skill: per wave, write the slice list for its phases, run `fgos workflow propose --plan <dir>`, ask the
   approval question it returns (one per plan), `fgos workflow start --frame ... --inherit`, then run each activity
   with `fgos run --case <id> --activity <a>`; on a deviation past the frame, stop and raise (no self-widening). Land
   and phase-table updates stay as today. Do not run `npm run build:skills`; phase 15 regenerates.

## Verify

`cargo test -p fgos-execution --test run_request_case`. Pass: a lead's writing run without `--case` is refused with
`lead-run-outside-case`; the same run with `--case` and `--activity` is admitted by the case rules; a non-lead writing
run in its own worktree is unchanged.

## Rollback

Revert the phase commit; the skill and the refusal change together.
