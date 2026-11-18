# Phase 3 — Run record facts and plan key

This phase connects existing Node writers (OM-D3 allows Node here, because these files are Node today). It adds no new
logic beyond copying facts that are already known.

## Inputs
- DISCUSSION §6 A and B.
- `src/runner/execution/unit-summary.mjs:97-113` (`project(attempt)`).
- `src/runner/execution/run.mjs:421,471,862,866` (the binding `durationMs` and the account selection that is already
  read).
- `src/runner/dispatch/settlement.mjs:699,743` (`durationMs` is never passed).
- `src/runner/execution/unit.mjs:48-61` (the `workflow` link).
- `src/runner/execution/run-request.mjs:231-237`.
- `src/cli/command-registry.mjs:1675` (`run`) and `:2541` (`workflow start`).
- `packages/run-result/contracts/unit-summary.read.v3.json` (`verify` is the additive pattern to copy).

## Footprint
`src/runner/execution/run-request.mjs`, `src/runner/execution/unit.mjs`, `src/runner/execution/unit-summary.mjs`,
`src/runner/execution/run.mjs`, `src/runner/dispatch/settlement.mjs`, `src/cli/command-registry.mjs`,
`packages/run-result/contracts/unit-summary.read.v3.json`, `test/runner/execution/**`.

## Steps
1. Add optional `--plan <dir>` and `--phase <id>` to `fgos run` and `fgos workflow start`. A units file may carry
   `plan` and `phase` per Unit.
   - Validate `--plan` through the Convention door: the path is an existing `plans/<dir>`.
   - Store `unit.plan {dir, phase}` in `unit.json`. A run without a plan stays valid.
2. In `unit-summary.mjs`, each attempt gains the optional fields `accountId` (from the selection `run.mjs:866`
   already reads), `durationMs` (from the binding) and `usage` (passed through from the run result as it is). The
   summary gains `plan {dir, phase}`. Extend `unit-summary.read.v3.json` additively, as `verify` was.
3. Settlement takes its `durationMs` from the timer it already has, so `result.json.durationMs` stops being null. If
   that timer is the same value as the binding, keep one source and remove the null field instead.
4. Tests extend the owning files `test/runner/execution/unit-summary.test.mjs` and `run-request.test.mjs`. Add no new
   test file.

## Verify
- Run the focused tests through `node scripts/run-tests.mjs test/runner/execution/unit-summary.test.mjs
  test/runner/execution/run-request.test.mjs`.
- One live `npm run fgos:dev -- run "echo" --plan plans/261118-0936-ops-metrics --phase 3` writes `plan`, `accountId`
  and `durationMs` into its `unit-summary.json`.

## Rollback
Revert the phase commit. The new fields are optional and readers ignore their absence.
