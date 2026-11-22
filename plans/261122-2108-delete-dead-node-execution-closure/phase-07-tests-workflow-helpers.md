# Phase 7: Rewire the workflow tests and the shared helpers

Capability: `code:implement`.

## Inputs

- `plans/261122-2108-delete-dead-node-execution-closure/reports/closure.md` (phase 1): the test-importer table rows whose owning phase is 7, and the dead table.
- Design principle 8 (`core/instructions/design-principles.md`): one owning proof per behaviour at the lowest
  layer. Retiring a test whose behaviour another named test owns is not weakening.
- The Rust owners. Use the `"recorded from <node module>"` note of each corpus fixture in
  `packages/execution/contracts/**` and `packages/run-supervisor/contracts/**` to find the fixture, then find
  the Rust test that reads it (`rg -l '<fixture file name>' packages/*/rust packages/execution apps/fgos/tests`).
  For behaviour with no fixture, use `rg` over the Rust crate the S6a phase file names for that module
  (`plans/261118-1341-s6a-execution-tier-rust/phase-*.md`).
- Keep every exported name and shape of `test/helpers/declared-assignment.mjs`, `test/helpers/work-seat-config.mjs`, `test/helpers/executor-model-vectors.helper.mjs` and `test/helpers/packaged-definitions.mjs` unchanged. Phases 2 to 6 run at the same time and import them. Change only their internals.
- The workflow tests borrow `src/run-supervisor/cwd-lock.mjs`, `src/runner/dispatch/shipped-catalog.mjs`, `src/runner/execution/seat-resolver.mjs` and `unit-control.mjs`. Expect rewire throughout. For example, the shipped catalog can be read from its data file, and the cwd lock comes from whatever live door the workflow code under test uses.

## Footprint

`test/workflow/**`, `test/helpers/**`, and `plans/261122-2108-delete-dead-node-execution-closure/reports/tests-workflow-helpers.md`.

## Steps

1. For each row this phase owns, read the test and say what behaviour it proves.
2. **retire**: the test only proves a dead Node module. Find the Rust test (or the existing live Node test) that
   owns the same behaviour and write its crate, file and test name in the report. If the behaviour is gone from the
   product (for example the Node-only lifecycle of a retired door), write `behaviour removed` and the reason. Then
   delete the test file, or only the cases that test dead code when the file also tests live code.
3. **rewire**: the test proves live behaviour and borrows a dead module as a helper or fixture. Replace that import
   with the live module that now owns the job, or with a small fixture inside the test. Do not change what the test
   asserts. If no live replacement exists and the borrowed code is more than a few lines, stop and report it as
   `NEEDS_CONTEXT`. Never move dead code into `test/`.
4. Write the report table: `test file | cases | disposition (retired/rewired) | owning proof or reason`.
5. Confirm that no file this phase owns still imports a path from the dead table:
   `git grep -nE '<dead paths>' -- <this phase's footprint>` returns nothing.

## Verify

Run the touched test files that remain, one run at a time: `node --test <remaining files of this footprint>`. Pass
condition: green, the grep in step 5 is empty, and every row of the closure table owned by this phase appears in the
report.

## Rollback

`git revert` the phase commit. The source files are still present until phase 8, so the restored tests run as before.
