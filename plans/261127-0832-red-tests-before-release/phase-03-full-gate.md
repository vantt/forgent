# Phase 3 — Full release gate on main

Capability: `code:test`. Proves the outcome of the discussion: an unconfined `npm test` on main has none of the
listed reds, and the release checks pass.

## Inputs

- `plan.md` of this plan (Outcome, Acceptance criteria, Risks).
- The two release checks in `.fgos/config.yaml` `release.checks`: `npm test` and `cargo test --workspace`.
- Reports of phases 1 and 2.

## Files it may write

`plans/261127-0832-red-tests-before-release/reports/phase-03-full-gate.md`.

## Steps

1. After phases 1 and 2 have landed, make a clean worktree of main at its tip, with no stale `.fgos/runtime/dev-host`
   entries copied in.
2. Unconfined (a worker unit), run `npm test`, then `cargo test --workspace`. Save both logs under the worktree's
   `.fgos/runtime/tmp/`.
3. Both exit 0: write the report (commit, both exit codes, the summary lines of each log) and land it.
4. A red: handle it as the plan's Risks section says. Inside this footprint, hand it back to the owning phase. In
   another running plan's footprint, tell that plan's lead. Otherwise open a backlog row and raise
   `coordination-help`. Do not mark the phase done while a release check is red.

## Verify

The report shows `npm test` exit 0 and `cargo test --workspace` exit 0 on one named commit of main.

## Rollback

Report only; nothing to undo.
