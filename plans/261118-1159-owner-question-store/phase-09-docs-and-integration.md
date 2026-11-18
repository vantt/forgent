# Phase 9: Docs, backlog, integration gate

## Inputs
- Every landed phase branch.
- `docs/reading-map.md` (line 191 names `fgos questions --open`).
- The area map in `docs/platform/system-overview/spec.md`.
- The `## [Unreleased]` section of `CHANGELOG.md`.
- `docs/backlog.md`. Row `p-wgbzcazoak` was added with the plan.

## Footprint
See the phase table in `plan.md`, row 9.

## Steps
1. Merge the phase branches onto a fresh integration worktree. Regenerate the generated files: the command manifest,
   the census and the skill surfaces. Never hand-merge them.
2. Add the Questions area to `system-overview/spec.md` and the reading map. Replace the `questions --open` line.
3. Write the CHANGELOG `[Unreleased]` entries for the new verb `fgos questions ask|answer|show|ack|cancel`, the
   removal of `--open`, the receipt hook, and the S04 questions.
4. Run the full gate:
   - `npm test` and `cargo test --workspace`;
   - `cargo clippy --workspace -- -D warnings`;
   - the msvc and `aarch64-apple-darwin` compile checks;
   - the gateway tests;
   - `node scripts/plan-contract-check.mjs --plan plans/261118-1159-owner-question-store`.
   Read both the run-tests ERROR lines and the fail count.
5. Write `reports/integration.md` with the gate output, the CLIs left without the hook, and the ids of migrated
   questions.

## Verify
Every command in step 4 is green on the combined tree.

## Rollback
Revert the integration merge. The phase commits revert individually.
