# Phase 2e: Retire the dead Node agy sub-home finder (door row `execution-doctor-judgments`)

## Inputs
- Row `packages/component-authority/model/doors/execution-doctor-judgments.yaml`. Survivor: `find_sub_homes` in `packages/execution/rust/src/checks.rs`. Debt: `src/setup/agy-permissions.mjs` (`findAgySubHomes`), last changed in 6b37add13.
- No product code imports it. References: `test/setup/agy-permissions.test.mjs` (two `findAgySubHomes` cases, one of them the gemini pool of `runner.llmAccounts`), and a synthetic path in the guard test at `test/architecture.test.mjs:2149`.
- This file is outside `261122-2108-delete-dead-node-execution-closure`'s directories, so this phase retires it and does not wait for that plan.

## Files it may write
src/setup/agy-permissions.mjs, test/setup/agy-permissions.test.mjs, packages/execution/rust/src/checks.rs, test/architecture.test.mjs, test/suite-baseline.json, packages/git/contracts/mutation-census.v1.json, packages/component-authority/model/doors/execution-doctor-judgments.yaml

## Rules every retirement step follows
- No twin (CA-D2, discussion §3 row 3d): every caller moves to the survivor and the copy is deleted in the same commit. The commit message names the survivor, the deleted path and the last SHA that still had it. The owning area spec's "Lịch sử quyết định" line goes in the phase report for phase 11 to place.
- Before deleting, find the test that owns the behaviour the copy gave its callers. If none does, record vectors from the copy and replay them on the survivor, in the survivor's own test file (design principle 8; the 488d3ab28 pattern).
- A caller outside this phase's files: stop, write Status BLOCKED with the file named, and change nothing. Do not widen.
- Re-read the door row first. A running plan may already have removed some debt; a row with no `debt` left needs only the check below.

## Execution
Every writing unit runs with `--provider claude` (owner order, D6 step 0). If claude is unavailable the unit parks and reports. It never falls back to another provider.

## Steps
1. Replay the two `findAgySubHomes` cases on `find_sub_homes` in `checks.rs`'s tests, unless an existing test there already owns them (name it).
2. Delete the Node file and its test. Point the synthetic guard case at `test/architecture.test.mjs:2149` at a path the row still governs, so it keeps proving the same thing.
3. Remove the debt entry, regenerate the census, drop the retired test from `test/suite-baseline.json`.

## Verify
`node --test test/architecture.test.mjs test/setup/git-mutation-census.test.mjs` green, no `debt` in the row; `cargo test -p fgos-execution` green.

## Rollback
Revert the phase commit.
