# Phase 2 — The dev-host leak into the real store

Capability: `code:implement`. Honors the discussion constraint: the fix is in production code or the fixture, never
an env switch or a test-only branch that skips the check.

## Inputs

- `plan.md` of this plan, section "Facts found while planning", item 4.
- `.fgos/runtime/tmp/keeper-final-gate/npm-test.log` on fg-server2, around line 10008 (the leak line).
- `test/rust-host/help-routes.test.mjs` (around line 62-70: the `fgos:dev` door case spawns
  `REPO_ROOT/scripts/run-rust-dev-host.mjs`).
- `scripts/run-rust-dev-host.mjs` (`pruneRunDirs`, `main()` around line 130-150).
- `test/rust-host/dev-host.test.mjs` (how a copied checkout fixture runs the dev door away from the real store).
- `scripts/run-tests.mjs` (`diffFgosWrites`, the leak check).

## Files it may write

`test/rust-host/help-routes.test.mjs`, `scripts/run-rust-dev-host.mjs`,
`plans/261127-0832-red-tests-before-release/reports/phase-02-dev-host-leak.md`.

## Steps

1. Reproduce. In a worktree of main, unconfined, create `.fgos/runtime/dev-host/run-stale-probe/` with one file and
   an mtime older than 10 minutes (`touch -d '-20 min'`). Run
   `node scripts/run-tests.mjs test/rust-host/help-routes.test.mjs` and confirm the leak line names that
   directory. If it does not, search the witness log for which test deleted it, then fix that test instead and
   record the finding.
2. Fix. The test must not write the real checkout's `.fgos` store. First choice: run the `fgos:dev` case from a
   copied checkout fixture, as `test/rust-host/dev-host.test.mjs` does. Change `scripts/run-rust-dev-host.mjs` only
   if that cannot work, and keep its prune behaviour for real users.
3. Rerun step 1 with the stale directory present: exit 0, no leak line, and the directory still exists. Then remove
   the probe directory, write the report and land.

## Verify

With a stale `run-*` directory present under `.fgos/runtime/dev-host/`,
`node scripts/run-tests.mjs test/rust-host/help-routes.test.mjs` exits 0, prints no leak line, and leaves the
directory in place.

## Rollback

`git revert` of the phase's land commit.
