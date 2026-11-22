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

## Status note (2026-11-22, 11:40)

The host run at 0044018d1 (lead:SUPERVISOR, answering q-vgwalbohwj) is classified in `reports/integration-gate.md`. One
red was this plan's: the phase 1 secretary case lost the line that created `docs/`. Fix 634fd7121 on branch
`red-tests-and-backlog-sweep/p01r` passed on the host inside its land gate, but the land was refused by two reds already
on main in the gate's fixed list (`check-decision-citation-drift` real-repo CLI since 68420ee14/bddb4fe0d/edd3e4486, and
the stale git mutation census). Plan-file lands are refused by the plan-contract gate, which receives a literal
`{plans}`. When both clear: land p01r with `--test test/runner/dispatch-confinement-backend-p03.test.mjs`, then set this
phase and the plan done.

Done 2026-11-22 11:40: p01r landed as 0f76f09df with the secretary case passing in its host land gate; no red on main is owned by this plan.
