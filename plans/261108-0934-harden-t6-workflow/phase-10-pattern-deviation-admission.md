---
phase: 10
title: "Pattern deviation at admission: the Execution Core sends the selected pattern, admission classifies a swap as an unlisted route, and the per-door activity lookup goes"
status: landed
depends_on: [04, 06, 08]
parallel: "wave 3, with 11 and 12 (bin/fgos.mjs: this phase edits the run arm only)"
effort: ~0.5d
net_size: "Node −10 / Rust 0 / tests +20 (estimate)"
---

# Phase 10 — Pattern deviation at admission (B-4 = `p-zpgzqdoy4z` = D4)

## Context

Arbitration §2.1 B-4 ("the core sends the selected pattern; `admitProposal` compares it with the declared one (`unlisted`); `activityUnitOf` and its `bin/fgos.mjs` read go"), §1 Admission ("`admitProposal` stays pure and compares the selected pattern with `activity.unit?.pattern`, classifying a swap as `unlisted` (reason required, deviation charged, refused at a listed-routes-only point)").

Code read on `595faa273`:
- The catalog refuses a swap without a reason only when the caller passes `activityUnit` (`src/runner/execution/patterns/catalog.mjs:112-118`); only `fgos run --case` does (`bin/fgos.mjs:2851` import, `:2905` `activityUnitOf({ mainRoot, caseId, activity })`).
- `activityUnitOf` `case-admission-port.mjs:57`.
- The catalog's `activityUnit` selector has two other jobs (plan fact 10): it picks the activity's pattern source and declared params (`catalog.mjs:97,110,220-228,348`), and the doctor's seat-binding check passes it (`src/setup/seat-binding-checks.mjs:117`); `unit-run-start.mjs:321` passes `options.activityUnit` to the catalog **before** `port.admit` (`:367`).
- The port receives the loop name as `pattern` (`unit-run-start.mjs:374` at baseline; P08 reordered the block) and ignores it; `routeKindOf` classifies by decision point only (`case-admission.mjs:84-95`), so a swap is `should`/`eligible`, `deviationsBeforeAsk` is not charged and a `listedRoutesOnly` point does not refuse.

Not reproduced at arbitration (code read), so **red first**: two cases in `case-admission.test.mjs` (a swap is `unlisted` and charged; a swap at a listed-routes-only point is refused) and one wiring case in `run-case-admission.test.mjs` (a `fgos run --case` with a different pattern and no reason is refused by admission, not by the catalog).

## Requirements

1. The core sends the selected pattern name in the proposal; `admitProposal` compares it with `activity.unit?.pattern` and classifies a difference as `unlisted` (reason required, deviation charged, refused at `listedRoutesOnly`), pure.
2. The catalog keeps its `activityUnit` selector (RT-26); only the swap-refusal branch (`catalog.mjs:112-118`) goes, because admission now owns the deviation rule. `activityUnitOf` and the bin `run` arm read go only if the activity unit can reach the catalog from the port without an interface break (the catalog runs before admission today); otherwise they stay and the report records why (the deviation rule still moves).
3. `CaseAdmissionPort` interface unchanged in shape for Work callers (`fanout-batch`, `work-dispatch`, `operation-choice`): an added optional field only, read by the core.

## Files

**Modify:** `src/workflow/case-admission.mjs`, `case-admission-port.mjs`, `src/runner/execution/unit-run-start.mjs`, `src/runner/execution/patterns/catalog.mjs` (swap-refusal branch only), `bin/fgos.mjs` (`run` arm `:2851,2905`, only if requirement 2's condition holds), `src/runner/execution/case-admission-port.mjs` (T5 port doc comment only if the answer shape is documented there), `CHANGELOG.md` (a pattern swap inside a case counts as a route deviation), census.

Tests: `test/workflow/case-admission.test.mjs`, `test/runner/execution/run-case-admission.test.mjs`, catalog tests that pass `activityUnit` (moved to the admission answer).

**Delete:** the catalog's swap-refusal branch; `activityUnitOf` and its bin read under requirement 2's condition.

**Tests to retire:** catalog cases that prove the swap refusal through `activityUnit`: behaviour moved; owner the two `case-admission.test.mjs` cases plus the wiring case.

**Cross-lane one-liners:** none; the `run` arm of `bin/fgos.mjs` is this phase's while P11 owns the `workflow` arm (different hunks; the later lander rebases).

## Net size

Node +6 −8 (swap branch) −8 (`activityUnitOf` if it goes) → about −10. Tests about +20, plus one `seat-binding-checks` case proving the doctor check still binds with the activity's pattern.

## Steps

1. Red tests (incl. the doctor check). 2. Core sends pattern; admission compares. 3. Catalog swap branch out; `activityUnitOf` per requirement 2. 4. Work-caller tests.

## Validation (focused)

- FR `test/workflow/case-admission.test.mjs test/workflow/case-admission-port.test.mjs test/runner/execution/run-case-admission.test.mjs test/runner/work-path-case-admission.test.mjs test/setup/seat-binding-dry-bind.test.mjs` plus the catalog test files (`rg -ln "activityUnit" test`).

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Work callers get a new refusal | L × M | Work activities declare no pattern swap; `work-path-case-admission.test.mjs` green |
| A swap with a reason now charges the frame and surprises a conductor | M × L | That is the approved rule (`deviationsBeforeAsk`); CHANGELOG |

## Rollback

Revert; no on-disk change (the `admission` event's route kind for a swap is `unlisted` in new ledgers; the old fold reads any route kind).

## Done when

Red then green; `rg -n "activityUnitOf" src bin` → nothing, or the reason recorded; landed with smoke `fgos run --case <id> --pattern <other>` refused without `--reason`; guide section written.

## Lead brief essentials

Pure predicate stays pure; no port interface break. All plan.md lead rules apply.
