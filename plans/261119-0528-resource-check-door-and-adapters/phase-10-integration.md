# Phase 10: Integration and full gate

> This phase belongs to the door plan `plans/261119-0528-resource-check-door-and-adapters`. Phases 1 to 7 and 7c are in plan A (`plans/261119-0030-resource-referee-graph-write-scope-stack`), whose decisions 1 to 31 apply.

A branch that passes alone does not prove the merge; this phase lands the integrated tree of this plan.
The lead already merged finished waves into one integration branch after wave 1 and ran the combined
owning tests there (plan A decision 14), so this phase is the last merge, not the first.

## Inputs

- The integration branch with the branches of phases 8b, 8, 7b and 9, on top of the landed packages of plan A.
- The board sections "Các luồng" and "File chung dễ va" of `plans/261017-1313-fgos-platform-program-board/plan.md` (open them now: this is the lane landing).

## Files it may write

`packages/git/contracts/mutation-census.v1.json` (the only phase of this plan that regenerates it) and this plan's directory.

## Steps

1. Merge `origin/main` into the integration branch, then rebuild `Cargo.lock` and re-run `npm run build:skills` (plan A decision 21).
2. Check the lock: against merged `origin/main` it differs only by the edges phase 7b declared; verify with `cargo tree -p fgos`.
3. Run the gates one after the other, never together: `cargo test --workspace` with `-j4` after checking `free -g`, then `npm test` (only `test/git/one-door.test.mjs` and `test/setup/git-mutation-census.test.mjs` may be red), then the plan-contract check, which now loads the addon from a checkout, scoped as plan A decision 30 says; record other lanes' errors in `reports/close.md` and fix none.
4. Regenerate the mutation census as the last commit with `git-one-door-scan --write-census`; list the entries removed and added by name in `reports/close.md` and stop on any entry not explained by a phase. Then land in the loop of plan A decision 14: merge `origin/main`, rebuild `Cargo.lock`, run `npm run build:skills` and `cargo build --workspace --locked`, run the owning tests of every file the merge brought in, regenerate the census, run the two census tests, fast-forward; if the push is rejected, start again.
5. Confirm acceptance criteria 1 to 9 one by one and write the result in `reports/close.md`, including the one measured time of the door and of the colliding-pairs function on the largest real inputs (a trie is a separate item if it is too slow).
6. Record in `reports/close.md` the artifact digest of the release that was active before this landing.
7. Update the board: the lane row and one line at the top of its `log.md`, naming the commit, what other lanes must know, and the lanes affected (those holding `apps/fgos`, `packages/supervision`, `CHANGELOG.md`, the skill surfaces).
8. Record whether the release is activated. `fgos doctor` through the installed shim is the only gate; if the release is not activated, say so in `reports/close.md`: landing is not done.

## Verify

Both suites green in sequence apart from the two named census tests before regeneration, the plan-contract check clean for these plans, and `fgos doctor` through the installed shim clean after activation.

## Rollback

Revert the landing; each earlier phase is its own commit and can be reverted in the reverse order 10, 9, 7b, 8, 8b, regenerating the census and rebuilding `Cargo.lock` at the end. If a release was activated, re-activate the digest recorded in step 6 (`fgctl repair` reaches only the immediately previous activation) and run `fgos doctor` through the shim.
