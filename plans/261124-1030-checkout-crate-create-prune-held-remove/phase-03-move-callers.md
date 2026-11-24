# Phase 3: Move the four callers and delete the copies

Capability: `code:implement`.

## Inputs

- `reports/facts.md` (phase 1), including its list of tests to retire.
- The phase 2 branch (its new `worktree.mjs` exports).
- `packages/component-authority/model/doors/checkout-make-provision-remove.yaml`, `test/architecture.test.mjs`
  (`NAMED_DOOR_DEBT`, the entry `make, provision and remove a checkout`).

## Files it may write

src/runner/repo-locks.mjs, src/workflow/unit-handoff.mjs, src/runner/merge.mjs, scripts/lib/git-ports.mjs,
scripts/run-tests.mjs, scripts/lib/test-file-watchdog.mjs, test/workflow/unit-handoff.test.mjs,
test/runner/repo-locks-multiprocess.test.mjs, test/runner/merge.test.mjs, test/runner/merge-land.test.mjs,
test/scripts/run-tests.test.mjs, packages/component-authority/model/doors/checkout-make-provision-remove.yaml,
test/architecture.test.mjs, packages/git/contracts/mutation-census.v1.json, test/suite-baseline.json,
docs/platform/git/spec.md, docs/platform/runner/spec.md

## Steps

1. `src/workflow/unit-handoff.mjs`: create its `wf/<run>/<unit>` checkout through the new create export.
2. `src/runner/repo-locks.mjs`: delete `createWorktreeCheckoutSync`, `addWorktreeSync` and `addWorktree` (their one
   production caller was unit handoff); keep `withMainCheckout` and `withWorktreeAdmin`, which other modules use.
3. `src/runner/merge.mjs`: Land's catch-up create and its remove under the held custody go through the new exports;
   drop its `createGitWorktree` import.
4. `scripts/lib/git-ports.mjs`: replace `pruneMissingCheckouts` with the new prune export and move its two callers
   (`scripts/run-tests.mjs`, `scripts/lib/test-file-watchdog.mjs`) onto it; delete the copy.
5. Retire the tests that proved only a copy, each named in the report with the crate test that now owns it, and
   rewire the tests that only borrowed a copy.
6. Remove the four `debt` entries and the `retiredBy` line from the door row; remove the job from `NAMED_DOOR_DEBT`.
   Regenerate the census (`node scripts/git-one-door-scan.mjs --write-census`) and update `test/suite-baseline.json`.
7. Write one decision-history line in `docs/platform/git/spec.md` and `docs/platform/runner/spec.md` naming each
   deleted function and its last SHA.
8. If any step meets a boundary question, stop and report it (D26); do not decide it here.

## Verify

- `node --test test/architecture.test.mjs test/setup/git-mutation-census.test.mjs test/workflow/unit-handoff.test.mjs test/runner/merge.test.mjs test/runner/merge-land.test.mjs test/scripts/run-tests.test.mjs`
  passes.
- Acceptance criterion 2 of `plan.md` (the `rg` search) finds nothing.

## Rollback

Revert the phase commit; the copies and their debt entries come back together.
