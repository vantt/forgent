# Phase 10: Docs, backlog, integration gate

## Inputs
- Every landed phase branch.
- `docs/reading-map.md` (line 191 names `fgos questions --open`).
- `CHANGELOG.md` `## [Unreleased]`.
- `docs/backlog.md`, row `p-wgbzcazoak`, added with the plan.

## Footprint
See the phase table in `plan.md`, row 10.

## Steps
1. Merge the phase branches on a fresh integration worktree. Regenerate the command manifest, the census and the
   skill renders; never hand-merge them.
2. In the reading map, add the Questions area spec and the `fgos questions` line.
3. Write the CHANGELOG `[Unreleased]` entries:
   - the new verb `fgos questions ask|answer|show|ack|cancel`;
   - `--open` removed (the bare verb that `head-start` already printed now works);
   - the head socket verbs;
   - the receipt hook;
   - S04 lists every question and answers store questions.
4. Run the full gate:
   - `npm test` and `cargo test --workspace`;
   - `cargo clippy --workspace -- -D warnings`;
   - the msvc and `aarch64-apple-darwin` compile checks;
   - the gateway tests;
   - the plan-contract check on the main checkout.
   Read the run-tests ERROR lines as well as the fail count.
5. Write `reports/integration.md` with:
   - the gate output;
   - the CLIs without the hook;
   - the migrated question ids;
   - the ids handed to other planners.

## Verify
Every command in step 4 is green on the combined tree.

## Rollback
Revert the integration merge. The phase commits revert one by one.
