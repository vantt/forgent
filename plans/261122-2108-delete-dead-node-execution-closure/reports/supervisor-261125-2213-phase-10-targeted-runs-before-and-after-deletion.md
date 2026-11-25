# Phase 10 targeted runs: four tests on main and on the commit before the first deletion

Run by the unconfined `lead:SUPERVISOR` session on 2026-11-25, 22:0x to 22:13 (+07), one at a time, for supervisor event `ab3174ef50ef3973`. Release 33f462be active.

| Command | main 4165b1e5c (first run) | main 7c56de445 (second run) | f8974a757, before this plan's first deletion |
|---|---|---|---|
| `node scripts/run-tests.mjs test/git/scoped-commit.test.mjs` | 25 pass, 1 fail | 25 pass, 1 fail | 26 pass, 0 fail |
| `node scripts/run-tests.mjs test/rust-host/dev-host.test.mjs` | 9 pass, 1 fail | 10 pass, 0 fail | not rerun (passes on main) |
| `node scripts/run-tests.mjs test/git/one-door.test.mjs` | 9 pass, 1 fail | 9 pass, 1 fail | 10 pass, 0 fail |
| `cargo test -p fgos --test authority` | 6 pass, 0 fail | not rerun | not applicable |

## What the failures are

- **scoped-commit, caused by this plan.** The failing test is `ScopedCommit answers config and formats from the stamp-proven facts instead of probing per loan and after hooks`. Its worker `scripts/git/e3-bench.mjs scoped-census-worker` fails with `ERR_MODULE_NOT_FOUND`: `Cannot find module '/home/vantt/projects/forgent/src/runner/dispatch/write-scope.mjs' imported from .../legacy-unit-commit-baseline.mjs`. The file `write-scope.mjs` was deleted by the phase that removed the write-scope Node twin; the legacy baseline helper still imports it. The test passes (26 of 26) on f8974a757 where the file exists. The same test failed in the 21:41 full run too.
- **one-door and dev-host, not shown to be caused by this plan.** Both report `Refused: inspect-cursor-stale` from the git inspect door ("the Git read of the source set failed"). That refusal appears when main moves during the test, and other leads land code all evening. `dev-host` passed on the second run. `one-door` failed on both main runs with the same refusal and passed on f8974a757, but that worktree is a detached checkout whose HEAD does not move, so the comparison does not separate this plan from the moving main. The same `one-door` tests failed with `inspect-cursor-stale` at 18:34, before phases 9 to 11.
- **authority.** The six tests of `cargo test -p fgos --test authority` pass on main now, including the view check that failed at 22:00.

## Not proven

Whether `one-door` passes on main when main does not move; a rerun while no lead lands would show it. The cause of `inspect-cursor-stale` itself was not investigated.
