# Phase 07: solo runs a supplied verify once, and does not settle before it

Depends on: 06 (the pin supplies `effective.loop` to `recordInlineRun`). Blocks: 10. Effort: 5h. Risk: Medium-High (a receipt-bearing path and two crash windows).

Run as (fgos-cook): one slice. Activity `implement-item`, capability `code:implement`, pattern `reviewed` (by hand), rigor `high` (it decides what a harness-verify receipt means), writes `run.mjs` (after phase 06; the case is serial). Parallel-safe with phase 08 (no shared file).

## Context links

- Spec section 11 (items 1-5; "Not claimed" paragraph), scenario S12, red-team RR-P6 (solo with no command still passes without a receipt, Part B's B6).
- Today: `loops/solo.mjs` accepts `verify` and never calls it (`solo.mjs:29`, since `abe6f2b3c`); `reviewed.mjs:34-48` `verifyCommandOf`/`hasVerifyCommand`, the verify block at `:277-310` (reuses a prior passing verify, result `{ seat: VERIFY_SEAT, round, outcome, findings }`); `run.mjs:1419-1440` run-level `verify` hook (`{ pass: true }` with no command at :1423; bounded by `runner.timeoutMs`, custody-borrowing); `recordInlineRun` (`run.mjs:1517`, settle block :1585-1590); `loops/history-outcome.mjs` `case 'solo'`; `case-projection.mjs:237-247` `receiptsFromResults` (a `verify`/`verifier` seat result with outcome `pass` becomes a `harness-verify` receipt).
- Reserved ids (phase 04) are why a worker cannot forge that seat key.
- Prior art reused: the reviewed loop's verify block and result shape, the existing bounded runner; nothing new is built beyond calling them from solo.

## Requirements

1. `verifyCommandOf` and `hasVerifyCommand` move to a leaf `loops/verify.mjs` that `reviewed.mjs`, `solo.mjs` and `run.mjs` import (one door; today `run.mjs:27` imports it from `reviewed.mjs`).
2. `runSolo` runs `hooks.verify(unit)` **once, after a passing producer, only when `verifyCommandOf(unit, cfg)` returns a command**. Result `{ seat: VERIFY_SEAT, round: 1, outcome: pass|findings, findings }`, appended to `results`. A failed verify returns `outcome: 'findings'` with the findings and **no repair loop**. A resume that finds a prior passing verify result reuses it; a crash before the result is durable is not a verified pass (the next resume runs verify again). With no command: no `verify` result, no receipt, behavior as today.
3. `recordInlineRun` applies the same `verifyCommandOf` test using the unit and runner snapshot read from `unit.json`: solo with a command sets `execution: { status: 'pending' }`, leaves `settlement` unset and does not publish the summary (a resume runs the verify through the loop); solo with no command settles as today. The loop is read from `unitJson.collaboration.effective.loop`, or `collaborationOfRecord` for an unpinned record (phase 06).
4. `patternHistoryOutcome` for solo: with a verify command the derived outcome is the producer's when it is not `pass`, else the verify result's outcome, else unknown while the verify result is missing; with no command, the producer's as today. The summary kind of the `verify` seat is already `verifier` (`unit-summary.mjs:81`).
5. Candidate-commit ordering is unchanged (commit before verify); a committed candidate in a linked worktree is reported separately from verified delivery (the existing commit field on the result).
6. `solo` seat launches do not count the verify (it is not a seat): `seatLaunchesOf` unchanged.

## Files (writes)

- `src/runner/execution/loops/verify.mjs` (new), `src/runner/execution/loops/solo.mjs`, `src/runner/execution/loops/reviewed.mjs`, `src/runner/execution/loops/history-outcome.mjs`
- `src/runner/execution/run.mjs` (`recordInlineRun`; import path of `verifyCommandOf`)
- Tests: `test/runner/execution/loops/solo.test.mjs` (owning proof for S12), `test/runner/execution/loops/reviewed.test.mjs` (import path only), `test/runner/execution/run.test.mjs` (`recordInlineRun` wiring), `test/runner/execution/unit-summary.test.mjs` (solo derived outcome), `test/runner/execution/run-posture.test.mjs` (check)
- `docs/architecture-manifest.json` (new leaf, `domain`), `packages/git/contracts/mutation-census.v1.json`

## Steps

1. Create `verify.mjs`; point the three importers at it; `git grep -n "verifyCommandOf\|hasVerifyCommand" -- src test` for the full list (callers at HEAD: `run.mjs:27,1423,1480`, `reviewed.mjs`, `reviewed.test.mjs`).
2. Extend `runSolo` and its history reuse; extend `history-outcome.mjs`; extend `recordInlineRun`.
3. Tests in `solo.test.mjs`, titled in plain words: verify runs once after a passing producer; pass yields a `verify` result and a harness receipt through `receiptsFromResults` (assert via the result shape, not by importing Workflow); fail yields findings and no second producer launch; resume reuses a prior passing verify; a producer result with no durable verify yields an incomplete history, not `pass`; no command yields no `verify` result. In `run.test.mjs`: an inline solo record with a command ends `execution: pending` with no settlement, and one without ends settled.
4. Do not add a `verify` hint for solo with no command (unresolved question U4: the spec amends only the "solo runs a supplied verify" sentence).
5. Census, manifest.

## Verify

`node scripts/run-tests.mjs test/runner/execution/loops/solo.test.mjs test/runner/execution/loops/reviewed.test.mjs test/runner/execution/run.test.mjs test/runner/execution/unit-summary.test.mjs test/runner/execution/run-posture.test.mjs test/workflow/workflow-runner.test.mjs`. Live replay of the P6 solo-verify crash windows is owed by the runtime verification engineer (spec section 14 note) and is not claimed.

## Risks and mitigations

| Risk | L x I | Mitigation |
|---|---|---|
| a solo unit stuck `pending` forever when its resume never comes | M x M | the existing pending-inline handling and `fgos run --resume`; the summary shows `execution: pending` rather than a false settle |
| a double verify after a crash between verify and its result write | M x L | verify is idempotent; a result is reused only when durable; test covers it |
| semantic change for every solo caller that passes `--verify` (it now runs) | H x L | intended; CHANGELOG line in phase 12; the P6 evidence is the reason |
| receipt without evidence of what was tested | M x M | stated non-claim: the digest is still computed at settle (Part B, B3); no wording elsewhere says otherwise |

## Rollback

Revert; solo returns to ignoring a supplied verify. No record format change in this phase.

## Acceptance (owned here)

S12 in `test/runner/execution/loops/solo.test.mjs`, wiring in `test/runner/execution/run.test.mjs`.
