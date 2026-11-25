# Phase 6: Integration and live proof

Capability: `code:test`.

## Inputs

- The branches of phases 1 to 5, merged in wave order.
- `plans/261125-1557-shaper-worktree/plan.md` acceptance criteria.

## Footprint

- `plans/261125-1557-shaper-worktree/reports`

## Steps

1. Merge the phase branches on one integration worktree; run `fgos resource-check --plan plans/261125-1557-shaper-worktree`
   and record its answer.
2. Run `npm test` and `cargo test --workspace` on the combined tree.
3. Activate the combined tree in a scratch project copy (never this repo's main checkout), create a scratch discussion
   directory there, and start a shaper on it with `fgos session start shaper --name <scratch>`. From the shaper, save
   two rounds with `fgos session save`. Check the scratch main checkout's `git status` stays clean and its main tip does
   not move; check `fgos questions` and the mailbox hook answer from inside the worktree; rotate the shaper once and
   check the successor runs in the same worktree.
4. Land the branch with `fgos land --branch discussion/<scratch>`; check main gained exactly one commit touching only
   `plans/discussions/<scratch>`.
5. Write the evidence (commands, outputs, commit ids) to `reports/integration.md`.

## Verify

Both suites green; the live run meets acceptance criterion 6, with evidence in `reports/integration.md`.

## Rollback

Nothing to roll back in this phase; a failure reopens the phase that owns the failing behaviour.
