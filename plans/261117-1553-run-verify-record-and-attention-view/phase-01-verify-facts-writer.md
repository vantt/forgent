# Phase 1: Verify facts into the settlement, summary and run result

## Inputs (read first)
- `plan.md` here: "Decision taken" gives the exact `verify` shape.
- `src/runner/execution/custody-door.mjs:79-125` (`runVerify`, `answerOfVerify`): the facts already measured.
- `src/runner/execution/run.mjs`: `verifyUnit` (~540), `runCollaboration` (~548-582, the `unverified` `verify:{ran:false}`),
  `finishUnit` (~460), `settleUnitRun` (~366, writes `unitRecord.settlement`).
- `src/runner/execution/unit-summary.mjs` `buildUnitSummary` (copies `settlement.infrastructure*`, `refused`).
- `src/runner/execution/loops/solo.mjs`, `reviewed.mjs` (how the verify hook answer is used; do not change their contract).
- `docs/platform/runner/contracts/unit-run-result.md` sections 3 and 7 (Workflow reads `verify`).

## Files this phase may write
`src/runner/execution/run.mjs`, `src/runner/execution/unit-summary.mjs`, `test/cli/run-verb.test.mjs`. Also regenerates
`packages/git/contracts/mutation-census.v1.json` in its commit (hot file, see plan.md).

## Steps
1. List every reader of `verify` before changing it: `rg -n "\.verify\b|verify:" src/workflow src/runner src/verbs bin | rg -v "unit.verify|options.verify"`.
   Note each one that treats "a `verify` key is present" as "verify did not run"; those move in this phase.
2. In `verifyUnit`, keep the facts `runVerify` returns beside the loop answer: store on the run context
   (`ctx.verifyFacts = { command, outcome, exit, passed, durationMs, how, outputDigest }`, overwritten each call so the last
   verify wins). `exit` = `verified.status`; `outcome` = `verified.verdict` or `verified.infrastructure`
   (`pass|findings|timeout|not-run`); `passed` = `verdict === 'pass'`. Return the loop answer unchanged.
3. In `finishUnit`, when `ctx.verifyFacts` is set, put `verify: { ran: true, ...facts }` in the settlement
   (`settleUnitRun` argument and `unitRecord.settlement.verify`) and in the returned result (`...rest` already carries the
   `ran:false` form; the two are mutually exclusive: ran:true wins when verify ran).
4. In `buildUnitSummary`, copy `settlement.verify` when it is an object with a boolean `ran` (else omit the key; never
   write `verify: null`). Keep `UNIT_SUMMARY_CONTRACT` at version 3.
5. Extend the one owning proof, `test/cli/run-verb.test.mjs` (find its existing verify case with `rg -n verify test/cli/run-verb.test.mjs`):
   pass, findings and timeout each assert `ran`, `passed`, `outcome`, `exit`, `durationMs`, and that `unit.json`
   `settlement.verify` and `unit-summary.json` `verify` equal the result's. Title names the behaviour in words. If a Workflow
   reader changed in step 1, its owning test (`rg -l "foldUnit|receiptsFromEvaluations" test`) gets one case.
6. `node scripts/git-one-door-scan.mjs --write-census`, then stage the census file with the phase.

## Verify
- `node --test test/cli/run-verb.test.mjs test/runner/run-result-v3-reader.test.mjs` passes.
- `node --test test/workflow` passes (Workflow reads `verify`).
- `node --test test/setup/git-mutation-census.test.mjs` passes.

## Rollback
`git revert` the phase commit; no stored data needs migration (extra `verify` keys in existing files are ignored by readers).
