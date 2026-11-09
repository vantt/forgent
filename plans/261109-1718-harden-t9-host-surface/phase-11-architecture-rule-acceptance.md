---
phase: 11
title: "PROPOSED - AWAITING OWNER APPROVAL: architecture rule forbidding src/workflow from importing holder-lock and cwd-lock; three-seat council acceptance test on contract fields only"
status: pending
depends_on: ["05 landed (custody door; the imports are gone)", "07 landed (result fields)", "09 landed (retry flag read)", "owner approval of COOK's four-step split (decision 81)"]
parallel: "T6 (Workflow layer), last of the four; touches no bin/fgos.mjs range; may land before P10"
effort: ~0.5d
net_size: "Node 0; Rust 0; tests about +45 (estimate)"
---

# Phase 11 - Architecture rule and acceptance (COOK step 4) - proposed - awaiting owner approval

**Not started and not gating.** The rule's exact wording and the acceptance scenario cite COOK's `unit-run-result` contract text, which is not written yet.

## Context

Decision 81: after the custody door (P05), the result fields (P07) and the retry flag (P09), an architecture rule keeps Workflow from reaching back into Execution's internals. Today `docs/architecture-manifest.json` declares two rules (`one-directional-layer`, `domain-siloing`; `test/architecture.test.mjs:147` asserts the first exists) and classes the `src/workflow/case-*.mjs` files `infra` (`:322-338`). The guard added by P04 forbids imports from `src/cli`; this one forbids two named modules.

Layer names (decision 81): Execution, Workflow, Domain.

## Requirements

1. **The rule:** no file under `src/workflow` imports `src/holder-lock/**` or `src/run-supervisor/cwd-lock.mjs`. Expressed in the manifest's existing rule vocabulary if it can carry a "forbidden pair"; otherwise one named assertion in `test/architecture.test.mjs` (step 1 decides; no new rule engine). Exceptions are an explicit list in the manifest or test, empty if P05 covered every site (plan unresolved question 5).
2. **Acceptance test (one):** a three-seat council runs through Workflow using only fields of the `unit-run-result` contract: it launches three seats, one of which fails on infrastructure and is retried via the retry flag, one reaches a verdict, one is refused; the test asserts the case settles from contract fields alone and fails if Workflow code reads a field the contract does not name (the double returns results shaped by P07's fixtures with every non-contract field removed). It is the one wiring proof of the Unit contract (design principle 8); the per-outcome cases stay owned by P07's fixtures and P09's replay.

## Files

**Create:** one test file under `test/workflow/` named for the contract.

**Modify:** `docs/architecture-manifest.json` and/or `test/architecture.test.mjs`.

**Delete:** none.

**Tests to retire:** any existing Workflow test that only asserts the removed import shape; none known. If the new acceptance test duplicates a case of an existing council-through-workflow test, that case is retired and named.

## Red tests first

The architecture assertion fails if any of the eight import lines P05 removed is put back (recorded by temporarily restoring one on the branch, seeing red, reverting). The acceptance test is red until P05, P07 and P09 are on the branch (it is written against the contract, run on a branch without them first).

## Net size

tests about +45; Node 0. Charged to the Unit contract line.

## Steps

1. Re-read the contract text; confirm P05, P07, P09 landed; check `rg -n "holder-lock|cwd-lock" src/workflow` is empty.
2. Red; rule; acceptance test.
3. Run the acceptance test with the contract-only double, then once through a real built host on a three-seat scenario (`fgos workflow start` with a throwaway case) and report.

## Validation (focused)

FR `test/architecture.test.mjs` and the new test; land gate. COOK reviews against the text.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| The rule blocks a legitimate Workflow need discovered later | L x M | the exception list is explicit and reviewed; the rule names two modules only |
| The acceptance double drifts from the real result shape | M x M | the double is built from P07's fixtures, not hand-written |

## Rollback

Revert the merge commit; the three behaviour phases stay.

## Done when

Rule red-then-green; acceptance test green on contract fields only; COOK confirms.
