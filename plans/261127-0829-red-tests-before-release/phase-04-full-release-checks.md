# Phase 4: Full release checks on the combined tree

## Inputs

- `reports/phase-01/verdict.md`, `reports/phase-02/result.md`, `reports/phase-03/result.md`.
- `.fgos/config.yaml` `release.checks` (`npm test`, `cargo test --workspace`).

## Footprint

- `plans/261127-0829-red-tests-before-release/reports/phase-04/**`

## Steps

1. Land phases 2 and 3 (if they changed code), then create a clean linked worktree of main at its new tip and run
   `npm ci` in it.
2. Unconfined, in that worktree, run in order, each to its own log under `reports/phase-04/`:
   - the four listed files through `node scripts/run-tests.mjs` (`listed-files.log`);
   - `npm test` (`npm-test.log`);
   - `cargo test --workspace` (`cargo-test.log`).
3. Write `reports/phase-04/result.md`: tip sha, exit code of each run, and the failing tests if any.
4. If any red remains:
   - inside phase 2's or phase 3's footprint: reopen that phase.
   - outside the plan's footprint: run `fgos supervisor raise` with the test, its error and the log path. Leave the
     plan not `done`. Do not edit files outside the footprint.
5. When all three runs exit 0, set every phase `done` and the plan `status: done` in one `fgos land --paths` of the
   plan directory. Tell the supervisor that the release may rerun once (q-apqmci34ry) and that backlog row
   p-4nmomwje7j can close.

## Verify

`reports/phase-04/result.md` shows exit 0 for `npm test` and `cargo test --workspace` on a clean worktree of main,
with the tip sha.

## Rollback

Reports only: delete `reports/phase-04/` and remove the worktree with `fgos worktree remove`.
