# Phase 5: Merge and full gate

## Inputs
The four phase branches of this plan.

## Files it may write
This plan's directory only (status and a short result note in `plan.md`).

## Steps
1. Merge the four branches (no overlap by design) and run the full gate on the combined tree.
2. Set `status: done` last, with the `cargo test` counts in the note.

## Verify
`cargo test --workspace`, `cargo clippy --workspace -- -D warnings`, `npm test`, `node scripts/plan-contract-check.mjs --all`.

## Rollback
Revert the merge commit; the phases are independent, so one can also be reverted alone.
