# Phase 10: Integration and full gate

> This phase belongs to the door plan `plans/261119-0528-resource-check-door-and-adapters`. Phases 1 to 7 and 7c are in plan A (`plans/261119-0030-resource-referee-graph-write-scope-stack`), whose decisions 1 to 28 apply.

A branch that passes alone does not prove the merge; this phase lands the integrated tree of this plan.
The lead already merged finished waves into one integration branch after wave 2 and ran the combined owning
tests there (plan A decision 14), so this phase is the last merge, not the first.

## Inputs

- The integration branch with the branches of phases 7b, 8 and 9, on top of the landed packages of plan A.
- The board sections "Các luồng" and "File chung dễ va" of `plans/261017-1313-fgos-platform-program-board/plan.md` (open them now: this is the lane landing).

## Files it may write

`packages/git/contracts/mutation-census.v1.json` (the only phase of this plan that regenerates it), `test/e2e/**` only if the single wiring proof needs a place, and this plan's directory. `Cargo.lock` must come out of the merge with only the edges phase 7b declared.

## Steps

1. Merge `origin/main` into the integration branch (rebuild `Cargo.lock` and re-run `npm run build:skills` after it, plan A decision 21).
2. Run the gates one after the other, never together: `cargo test --workspace` with `-j4` after checking `free -g`, then `npm test` (only `test/git/one-door.test.mjs` may still be red), then `node scripts/plan-contract-check.mjs --all`.
3. Regenerate the mutation census once with `git-one-door-scan --write-census` as the last commit. Before committing it, list the entries removed and added by name (the door module, the adapter, the addon modules of plan A already landed) and record the list in `reports/close.md`; any entry not explained by a phase is a stop. Immediately before the fast-forward, merge `origin/main` once more and re-run the census and `test/git/one-door.test.mjs`.
4. Confirm acceptance criteria 1 to 7 one by one and write the result in `reports/close.md`, including the one measured time of the door and of the colliding-pairs function on the largest real inputs (a trie is a separate item if it is too slow).
5. Update the board: the lane row and one line at the top of its `log.md`, naming the commit, what other lanes must know, and the lanes affected (those holding `apps/fgos`, `CHANGELOG.md`, the skill surfaces).
6. Record whether the release is activated. `fgos doctor` through the installed shim is the only gate; if the release is not activated, say so in `reports/close.md`: landing is not done.

## Verify

Both suites green in sequence, the plan-contract check clean on every plan, and `fgos doctor` through the installed shim clean after activation.

## Rollback

Revert the landing; each earlier phase is its own commit and can be reverted in the reverse order 10, 9, 8, 7b, regenerating the census and rebuilding `Cargo.lock` at the end. If a release was activated, re-stage and re-activate the previous release and run `fgos doctor` through the shim.
