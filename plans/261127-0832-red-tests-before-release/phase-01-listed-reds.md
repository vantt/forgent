# Phase 1 — Listed reds through the real runner

Capability: `code:implement`. Honors the discussion hand-off of
`plans/discussions/ds-hfdlzko5kh-red-tests-before-release/DISCUSSION.md`: fix the cause in production code or its
fixture, never weaken or skip a test.

## Inputs

- `plan.md` of this plan, section "Facts found while planning", items 1 and 2.
- `test/runner/provider-per-cli-credential-sources.test.mjs`, `test/workflow/guide-schema.test.mjs`.
- `git show 410f9ab4af` (the fix already on main for both files).
- `.fgos/runtime/tmp/keeper-final-gate/npm-test.log` and `npm-reds-recheck.log` on fg-server2 (earlier failures).
- `scripts/run-tests.mjs` (how the runner stages the addon and the host binary).

## Files it may write

`src/runner/dispatch/provider-capacity.mjs`, `src/runner/dispatch/provider-credential-probe.mjs`,
`src/runner/dispatch/provider-credential-renewal.mjs`, `src/runner/dispatch/confinement/drivers/bwrap.mjs`,
`test/runner/provider-per-cli-credential-sources.test.mjs` (fixture only), `test/workflow/guide-schema.test.mjs`
(fixture only), `plans/261127-0832-red-tests-before-release/reports/phase-01-listed-reds.md`.

## Steps

1. In a worktree of main (not the main checkout), run the two files through the real runner, unconfined (a worker
   unit), never with plain `node --test`:
   `node scripts/run-tests.mjs test/runner/provider-per-cli-credential-sources.test.mjs test/workflow/guide-schema.test.mjs`.
2. Green: write the report (commit, command, exit code, pass/fail counts) and stop; there is nothing to fix.
3. Red: for each failing case, prove the cause from the assertion and the code path first, and write it in the
   report. Then fix it in the production file that owns the behaviour. Change a test file only when the fixture
   itself is wrong (for example a count of registered workflows), and say why in the report.
4. Rerun step 1 until it exits 0, then land.

## Verify

`node scripts/run-tests.mjs test/runner/provider-per-cli-credential-sources.test.mjs test/workflow/guide-schema.test.mjs`
exits 0 with no `.fgos` leak line; the report records it.

## Rollback

`git revert` of the phase's land commit.
