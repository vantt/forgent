# Phase 10: Integration and full gate

A branch that passes alone does not prove the merge; this phase merges the branches and proves the combined tree.

## Inputs

- The branches of phases 2 to 9.
- The board sections "Các luồng" and "File chung dễ va" of `plans/261017-1313-fgos-platform-program-board/plan.md` (open them now: this is the lane landing).

## Files it may write

`packages/git/contracts/mutation-census.v1.json` (the only phase that regenerates it), `test/e2e/**` only if the single wiring proof needs a place, and this plan's directory. `Cargo.lock` must come out of the merge unchanged from phase 2; a diff means a phase added a dependency it should not have.

## Steps

1. Merge `origin/main` into the integration branch first (rebuild `Cargo.lock` and re-run `npm run build:skills` after it, decision 21), then the phase branches in wave order.
2. Regenerate the mutation census once with `git-one-door-scan --write-census`. Before committing it, list the entries removed and added by name (the moved `write-scope` files, the new crates and addon modules) and record the list in `reports/close.md`; any entry that is not explained by a phase is a stop.
3. Run the gates one after the other, never together: `cargo test --workspace` with `-j4` after checking `free -g`, then `npm test`, then `node scripts/plan-contract-check.mjs --all`.
4. Confirm acceptance criteria 1 to 10 one by one and write the result in `reports/close.md`, including the measured time of the door on the largest plan in `plans/`.
5. Update the board: the lane row and one line at the top of its `log.md`, naming the commit, what other lanes must know, and the lanes affected (those holding `Cargo.toml`, `main.rs`, `CHANGELOG.md`, `packages/git`).
6. Check that each of the three specs carries the decision history its phase wrote.
7. Record whether the release is activated. `fgos doctor` through the installed shim is the only gate; if the release is not activated, say so in `reports/close.md`: landing is not done.

## Verify

Both suites green in sequence, the plan-contract check clean on every plan, and `fgos doctor` through the installed shim clean after activation.

## Rollback

Revert the merge commit; each earlier phase is its own commit and can be reverted in the reverse order 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, regenerating the census at the end.
