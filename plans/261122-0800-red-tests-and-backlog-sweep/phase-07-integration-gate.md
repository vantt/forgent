# Phase 7: Integration gate

Capability: `code:test`.

## Inputs

- The landed commits of phases 1 to 6, merged on one tree.
- plan.md "Non-goals" and "Handed to other plans": the reds this plan does not own.

## Footprint

`plans/261122-0800-red-tests-and-backlog-sweep/reports/integration-gate.md`.

## Steps

1. On the merged tree, run `npm test` and `cargo test --workspace --no-fail-fast`, and keep both logs.
2. List every failing test. Mark each one as owned by a phase here (that phase is not done: reopen it), handed
   (name the owner from plan.md), non-goal (S6a seam), environmental (phase 6 verdict), or new. For a new red,
   bisect it to a commit and open a backlog row.
3. Write the report: the commit, both totals, the table above, and the `rg` check from acceptance criterion 6.

## Verify

Every red in the report has an owner other than this plan, and no row is marked "owned by a phase here".

## Rollback

Nothing to revert. The report is the only output.
