# Phase 6: Integration and full gate

## Inputs
`plan.md` acceptance criteria; the five phase commits or branches; `scripts/git-one-door-scan.mjs` header (census writer).

## Files this phase may write
`packages/git/contracts/mutation-census.v1.json` (regenerate, never hand-merge), `plans/261117-1553-run-verify-record-and-attention-view/reports/`
(an integration note). Source conflicts are resolved in the owning phase's files only, keeping that phase's intent.

## Steps
1. Merge phases 1 to 5 into one tree (wave order). Resolve a conflict on the census file by `node scripts/git-one-door-scan.mjs --write-census`.
2. Run the full gate on the combined tree, and also on a tree with only phases 1 and 2, and one with only phase 3 (the gate must hold on a partial tree).
3. Live check on this checkout: run one unit with `--verify` (a passing command) and one failing, read `unit-summary.json` (`verify`),
   then `npm run fgos:dev -- dispatch inspect --attention --since <today> --json` and confirm the failing run is listed with a next command that works.
4. Compare with the acceptance criteria one by one in `reports/integration.md`; name any criterion not proven.

## Verify
`npm test` and `cargo test --workspace` green; `node scripts/plan-contract-check.mjs --plan plans/261117-1553-run-verify-record-and-attention-view` exits 0;
`node --test test/setup/git-mutation-census.test.mjs` passes. Report any red test with its output; do not weaken a test.

## Rollback
Revert the merge; phases are independent commits (revert order 6, 5, 4, 3, 2, 1).
