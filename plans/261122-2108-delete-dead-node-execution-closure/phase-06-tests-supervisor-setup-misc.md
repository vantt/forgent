# Phase 6: Retire or rewire the run-supervisor, golden-recorder, setup and other tests

Capability: `code:implement`.

## Inputs

- `plans/261122-2108-delete-dead-node-execution-closure/reports/closure.md` (phase 1): the test-importer table rows whose owning phase is 6, and the dead table.
- Design principle 8 (`core/instructions/design-principles.md`): one owning proof per behaviour at the lowest
  layer. Retiring a test whose behaviour another named test owns is not weakening.
- The Rust owners. Use the `"recorded from <node module>"` note of each corpus fixture in
  `packages/execution/contracts/**` and `packages/run-supervisor/contracts/**` to find the fixture, then find
  the Rust test that reads it (`rg -l '<fixture file name>' packages/*/rust packages/execution apps/fgos/tests`).
  For behaviour with no fixture, use `rg` over the Rust crate the S6a phase file names for that module
  (`plans/261118-1341-s6a-execution-tier-rust/phase-*.md`).
- A golden recorder whose source module is dead is deleted. The fixtures it recorded stay, because their Rust tests own them now; the report names each fixture and its Rust reader. A recorder whose source is live stays.
- `test/session-host/head-start.test.mjs` was in the footprint of `261122-0118`. Start only after that plan is done, and rebase first.

## Footprint

`test/run-supervisor/**`, `test/golden-recorders/**`, the `test/setup`, `test/session-host`, `test/seat-binding`, `test/convention`, `test/state`, `test/util` and `test/session-identity` files listed for phase 6 in `plan.md`'s phase table, and `plans/261122-2108-delete-dead-node-execution-closure/reports/tests-supervisor-setup-misc.md`.

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
