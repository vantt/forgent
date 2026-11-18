# Phase 7c: Integration and landing of the packages

A branch that passes alone does not prove the merge; this phase lands the integrated tree of this plan.
The lead already merged finished waves into one integration branch after waves 2 and 3 and ran the
combined crate-level and owning tests there (decision 14), so this phase is the last merge, not the first.

## Inputs

- The integration branch with the branches of phases 2 to 7.
- The board sections "Các luồng" and "File chung dễ va" of `plans/261017-1313-fgos-platform-program-board/plan.md` (open them now: this is the lane landing).

## Files it may write

`packages/git/contracts/mutation-census.v1.json` (the only phase of this plan that regenerates it) and this plan's directory.

## Steps

1. Merge `origin/main` into the integration branch, then rebuild `Cargo.lock` and re-run `npm run build:skills` (decision 21).
2. Check the lock: against merged `origin/main` it differs only by the edges phase 2 declared; verify with `cargo tree -p fgos-write-scope -p fgos-graph -p fgos-resource-referee`, not with a byte comparison.
3. Run the gates one after the other, never together: `cargo test --workspace` with `-j4` after checking `free -g`, then `npm test` (only `test/git/one-door.test.mjs` and `test/setup/git-mutation-census.test.mjs` may be red), then the plan-contract check through the runner of decision 20, scoped as decision 30 says: no error that names this plan and no overlap pair that involves it; record the other lanes' errors in `reports/close.md` and fix none of them.
4. Regenerate the mutation census as the last commit with `git-one-door-scan --write-census`. Before committing it, list the entries removed and added by name (the moved `write-scope` files, the new crates and addon modules) and record the list in `reports/close.md`; any entry not explained by a phase is a stop. Then land in the loop of decision 14: merge `origin/main`, rebuild `Cargo.lock`, run `npm run build:skills` and `cargo build --workspace --locked`, run the owning tests of every file the merge brought in, regenerate the census, run the two census tests, fast-forward; if the push is rejected, start again.
5. Confirm acceptance criteria 1 to 6 one by one and write the result in `reports/close.md`.
6. Record in `reports/close.md` the artifact digest of the release that was active before this landing, because `fgctl repair` steps back one activation only.
7. Update the board: the lane row and one line at the top of its `log.md`, naming the commit, what other lanes must know, and the lanes affected (those holding `Cargo.toml`, `packages/git`, `packages/supervision`).
8. Check that each of the three specs carries the decision history its phase wrote.
9. Record whether the release is activated. `fgos doctor` through the installed shim is the only gate; if the release is not activated, say so in `reports/close.md`: landing is not done. The door plan (`plans/261119-0528-resource-check-door-and-adapters`) may start once this plan is `done` and `owner-question-store` is `done`.

## Verify

Both suites green in sequence apart from the two named census tests before regeneration, the plan-contract check clean on every plan, the census matching the tree.

## Rollback

Revert the landing; each earlier phase is its own commit and can be reverted in the reverse order 7c, 7, 5, 4, 3, 2, 1, regenerating the census and rebuilding `Cargo.lock` at the end. If the door plan has landed, revert it first. If a release was activated, re-activate the digest recorded in step 6 (`fgctl repair` reaches only the immediately previous activation) and run `fgos doctor` through the shim; check that `apps/fgos-gateway` still builds from its own lock.
