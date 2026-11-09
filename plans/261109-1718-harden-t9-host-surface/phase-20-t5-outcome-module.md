---
phase: 20
title: "T5 fix: one Execution outcome module (closed table, classes, predicates, exit codes) replaces the loop copies and the two rerun lists"
status: pending
depends_on: ["05 landed if approved, else 04 (layer order; run.mjs writer order)", "18 landed (loops/reviewed.mjs)"]
parallel: "T5 slot, first wave: beside P06 and P22 (file-disjoint)"
effort: ~0.75d
net_size: "Node about -40; Rust 0; tests about 0 (loop tests keep their cases) (estimate)"
---

# Phase 20 - T5 fix: one outcome module (authority audit AU-08, AU-11 Execution half, AU-19 outcome half)

**Authority moved:** the closed outcome table, its classes and its predicates are decided in one Execution module (COOK `unit-run-result` §5), beneath which the Rust `run-result::derive_outcome` stays the category authority. The five loop copies, the four `ERROR_OUTCOMES` copies and `outcome-exit.mjs` fold into it.

## Context

- `VALID_OUTCOMES` five times: `src/runner/execution/loops/{solo,reviewed,debate,panel,index}.mjs`; `ERROR_OUTCOMES` four times: `debate`, `panel`, `reviewed` (exported, imported by `run.mjs`), `history-outcome`; `unit-summary.mjs` validates against the copy in `panel.mjs`.
- Outcomes outside the table: `not-started` (`run.mjs` settle), `undetermined` and `unknown` (`unit-summary.mjs`), `refused` (Workflow `src/workflow/runner.mjs`), `partial-writes` (only in the exit table; `run.mjs` produces it as a `fallbackExhausted.reason`, not as an outcome).
- Two rerun lists (AU-11): `run.mjs` `seatStateOf` re-binds every seat whose last outcome is in `ERROR_OUTCOMES`; Workflow `isRerunnable` uses its own list (P09 switches it).
- Outcome exit codes already moved to `src/runner/execution/outcome-exit.mjs` in P01 (`39c0ebfbc`).
- The same-named `VALID_OUTCOMES` in `src/runner/dispatch/confinement/attestation-store.mjs` is a different domain (P22 renames it).

## Requirements

1. One module (`src/runner/execution/outcome.mjs`, or `outcome-exit.mjs` grown and renamed with `git mv`; step 1 picks; no second file) holds: the closed list; the classes (verdict: `pass`, `findings`; infrastructure: `execution-failure`, `not-started`; provider: `provider-limit`; policy: `policy-refusal`; `blocked`); `undetermined` as the read-model value; the predicates `isVerdict`, `isInfrastructure`, `rebindsOnResume(seatOutcome)`, `infrastructure(unitResult)` as COOK §5 names them; the outcome exit codes.
2. Every copy becomes an import: five loops, `history-outcome`, `unit-summary.mjs`, `run.mjs` (`seatStateOf` calls `rebindsOnResume`), `src/cli/verb-exit.mjs`. No behaviour change: `rebindsOnResume` keeps today's `ERROR_OUTCOMES` list exactly.
3. `partial-writes`: deleted from the exit table if `rg` finds no producer of it as an outcome and no user doc promises exit 12 (lead decision recorded in the report); kept and named otherwise. Workflow's `refused` stays Workflow's acceptance value and is not added to Execution's table (named in the module comment as "not an Execution outcome").

## Files

**Create:** none if `outcome-exit.mjs` is grown; else one module (manifest row) and `outcome-exit.mjs` deleted.

**Modify:** `src/runner/execution/loops/{solo,reviewed,debate,panel,index,history-outcome}.mjs`, `src/runner/execution/unit-summary.mjs`, `src/runner/execution/run.mjs` (import and `seatStateOf`), `src/cli/verb-exit.mjs` (import), `src/runner/execution/outcome-exit.mjs`, `docs/architecture-manifest.json` (if a file moves), the module's owning test (the existing outcome exit-code test grows; `rg -l "exitCodeForOutcome|ERROR_OUTCOMES" test`).

**Delete:** the five `VALID_OUTCOMES` and four `ERROR_OUTCOMES` copies.

**Tests to retire:** none; the loop tests keep their cases and import the table.

## Steps

1. `rg -n "VALID_OUTCOMES|ERROR_OUTCOMES|OUTCOME_EXIT_CODES|'partial-writes'|'undetermined'|'not-started'" src bin scripts test`; list every reader with `file:line`.
2. Red: the module's test enumerates every class and predicate (fails: no module); a scan recorded failing: `rg -c "const (VALID|ERROR)_OUTCOMES" src/runner/execution` is 9.
3. Module; imports; copies gone; `partial-writes` decision.

## Validation (focused)

FR `test/runner/execution/loops/*`, `test/runner/execution/unit-summary*`, the outcome exit-code test, `test/cli/verb-exit.test.mjs`. Land gate. COOK told (its §5 names this module).

## Risks and rollback

| Risk | L x I | Mitigation |
|---|---|---|
| A loop relied on a slightly different copy | L x M | step 1 diffs the nine copies before merging them; a difference is reported, not silently unified |

Rollback: revert the merge commit.
