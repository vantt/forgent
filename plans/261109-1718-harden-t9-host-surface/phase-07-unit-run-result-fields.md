---
phase: 07
title: "PROPOSED - AWAITING OWNER APPROVAL: additive unit-run-result fields with a fixture per outcome"
status: pending
depends_on: ["04 landed or 05 landed (layer order)", "COOK's unit-run-result contract text written", "owner approval of COOK's four-step split (decision 81)"]
parallel: "T5 (Execution layer); beside P06 (file-disjoint); touches no bin/fgos.mjs range"
effort: ~0.75d
net_size: "Node about +20; Rust 0; tests about +40 (estimate)"
---

# Phase 07 - Additive result fields (COOK step 1) - proposed - awaiting owner approval

**Not started and not gating** until the owner approves and COOK's `unit-run-result` text exists. The field names, their meanings and the per-outcome table come from that text; this phase cites it and invents nothing. If the text and the code disagree, step 1 stops and reports.

## Context

Execution settles a unit run into an outcome (`execution-failure`, `not-started`, a verdict `pass`/`findings`, `refused`, `undetermined`...). Workflow cannot tell from the result whether it may run the unit again, so it keeps its own list: `INFRASTRUCTURE_OUTCOMES = new Set(['execution-failure', 'not-started'])` and `isRerunnable` (`src/workflow/store.mjs:262-264`), which also checks `outOfScope` and whether any seat `reachedVerdict`. That knowledge is Execution's (it produced the outcome and the seat results); Workflow re-derives it.

Where the outcome and result are produced (rg on `26d42ca98`): `src/runner/execution/run.mjs` (retry and fallback state: `:528-531`, `:750-769`), `src/runner/execution/unit-run-history.mjs`, `src/runner/execution/unit-sync.mjs`, `src/runner/execution/loops/{solo,reviewed,debate,panel,index,history-outcome}.mjs`, `src/runner/fanout-batch.mjs`, and the read model `src/runner/execution/unit-summary.mjs` (`UNIT_SUMMARY_CONTRACT = { id: 'unit-summary', version: 2 }`, `UNDETERMINED_OUTCOME`). The result record is versioned like the summary contract.

## Requirements

1. **Additive fields only** (no existing field changes meaning or disappears; a reader of the old shape keeps working): the fields COOK's text names, among them the retry flag Workflow will read (P09), computed where the outcome is settled, never re-derived by a reader.
2. **A fixture per outcome**: one fixture file or table with one case per outcome of the text (including the refused, the undetermined and the not-started ones), each asserting every new field. The fixtures are the contract's evidence; P09 and P11 read them.
3. **Version note** on the contract constant if the text asks for one; no migration (the fields are additive).

## Files

**Create:** a fixture table file under `test/runner/execution/` named for the contract (name from the text).

**Modify:** the settle site(s) in `src/runner/execution/run.mjs` / `unit-run-history.mjs` / `loops/*` found in step 1 (the one that writes the settled result; not every loop), the contract constant's module, `test/runner/execution/*` owner of the settle path, `docs/platform/runner/` area spec section that states the result shape (settled fact; DOC told) is P16's.

**Delete:** nothing in this phase; P09 deletes the reader's own list.

**Tests to retire:** none; if an existing test asserts the exact key set of a settled result (not a subset), it is widened to the new keys and named.

## Red tests first

The fixture table, run against today's code, fails on the new fields for every outcome (the evidence that they do not exist yet).

## Net size

Node about +20; tests about +40. These lines are the Unit contract's, reported on their own line in the close.

## Steps

1. Re-read the contract text; locate the single settle site per outcome class with `rg` and `file:line`; confirm no second writer of a settled result (one door). Stop on a mismatch.
2. Red fixtures; field computation at the settle site; fixtures green.
3. `rg` every reader that asserts a result's exact keys; widen.

## Validation (focused)

FR the fixture table and the execution tests it touches, `test/runner/execution/unit-summary*.test.mjs`; land gate. COOK reviews against the text.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A field is computed from state not available at settle time | M x M | fixtures include a crash-recovered run (the settled record written by recovery) |
| A strict reader rejects unknown keys | L x M | step 3 scan; the summary reader is checked first |

## Rollback

Revert the merge commit; fields vanish, readers of them (P09) must not have landed (P09 depends on this phase).

## Done when

Red then green on every fixture; COOK confirms the fields against the text.
