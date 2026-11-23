# Phase 2: Integration and close

Capability: `code:test`.

## Inputs (read first)

- `plans/261123-0821-runner-recheck-replays-account-view/plan.md`, the Acceptance criteria and the Cross-plan
  footprint note
- phase 1's result and branch

## Files it may write (footprint)

plans/261123-0821-runner-recheck-replays-account-view/ (reports go in its `reports/`)

## Steps

1. Merge phase 1's branch onto current `main` in a linked worktree, then run the full gate on the combined tree.
2. Run every check in acceptance criteria 1-5 and record the output in
   `plans/261123-0821-runner-recheck-replays-account-view/reports/`.
3. Land the merge through the plan's normal land path.
4. Hand these to the supervisor, in the report and in the result summary:
   - the `CHANGELOG.md` `## [Unreleased]` line quoted in plan.md, to add once `261121-2110-component-authority-doors`
     releases `CHANGELOG.md`.
   - the note for draft plan `261122-2108-delete-dead-node-execution-closure`: when it retires
     `test/golden-recorders/assignment-runner.recorder.mjs`, it must keep the Rust-owned legality cases.
   - that backlog `p-drfxqdzzon` closes with this plan.
5. Record the live check of acceptance 6 when it happens: the next writing unit bound under a quarantine, with its
   attempt's `accountState`.

## Verify

```bash
cargo test --workspace
npm test
node scripts/plan-contract-check.mjs --plan plans/261123-0821-runner-recheck-replays-account-view
```

The phase passes when all three are green on the merged tree.

## Rollback

Revert the merge commit on `main`.
