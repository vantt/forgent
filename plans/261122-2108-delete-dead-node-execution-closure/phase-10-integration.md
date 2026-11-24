# Phase 10: Integration — merge and run the full gate

Capability: `code:test`.

## Inputs

- Every phase branch (2 to 9, and 11), merged into the integration worktree in wave order.
- The acceptance criteria of `plan.md`.
- The `reports/tests-*.md` tables.

## Footprint

`plans/261122-2108-delete-dead-node-execution-closure/reports/integration.md` only.

## Steps

1. Merge phases 2 to 7, then 9, then 8, then 11 onto current `main` in one worktree, and record the merged commit.
2. Rerun phase 1's graph method on the merged tree and confirm that acceptance criteria 1 and 2 hold.
3. Spot-check five retired rows chosen across the reports by running exactly the Rust test each one names
   (`cargo test -p <crate> <test name>`). Each must exist and pass.
4. Run `npm test` alone, then `cargo test --workspace` alone, in the same worktree.
5. Write the report: the merged commit, criteria 1 to 7 with their evidence, the spot-check results, and both suite
   counts.

## Verify

`reports/integration.md` shows all seven acceptance criteria met on one recorded commit, with `npm test` and
`cargo test --workspace` green.

## Rollback

Delete the report. The merges themselves are undone by reverting the phase commits as `plan.md` describes.
