# Phase 10: Integration and full gate

A branch that passes alone does not prove the merge; this phase merges the branches and proves the combined tree.

## Inputs

- The branches of phases 2 to 9.
- The board sections "Các luồng" and "File chung dễ va" of `plans/261017-1313-fgos-platform-program-board/plan.md` (open them now: this is the lane landing).

## Files it may write

`packages/git/contracts/mutation-census.v1.json` (the only phase that regenerates it), `test/e2e/**` only if the single wiring proof needs a place, and this plan's directory. `Cargo.lock` must come out of the merge unchanged from phase 2; a diff means a phase added a dependency it should not have.

## Steps

1. Merge `origin/main` into the integration branch first, then the phase branches in wave order.
2. Regenerate the mutation census once with `git-one-door-scan --write-census` and commit it; this is the first point where `test/git/one-door.test.mjs` is expected to pass.
3. Run the gates one after the other, never together: `cargo test --workspace` with `-j4` after checking `free -g`, then `npm test`.
4. Confirm acceptance criteria 1 to 9 one by one and write the result in `reports/close.md`, including the measured time of the door on the largest plan in `plans/`.
5. Update the board: the lane row and one line at the top of its `log.md`, naming the commit, what other lanes must know, and the lanes affected (those holding `Cargo.toml`, `main.rs`, `CHANGELOG.md`, `packages/git`).
6. Record the settled decisions in the three specs' decision history.
7. Check that the release is activated before calling the lane done; landing is not done.

## Verify

Both suites green in sequence, `fgos doctor` clean through the installed shim after activation, and the planner door passing on this plan.

## Rollback

Revert the merge commit; each earlier phase is its own commit and can be reverted in reverse order.
