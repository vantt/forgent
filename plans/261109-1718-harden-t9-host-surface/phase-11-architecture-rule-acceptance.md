---
phase: 11
title: "Architecture rule forbidding src/workflow from naming the worktree custody mechanisms; tier field per file; three-seat council acceptance test on contract fields only"
status: landed
depends_on: ["05 landed (custody door; the custody imports are gone)", "07 landed (result fields)", "09 landed (Workflow reads them)"]
parallel: "T6 (Workflow layer), after P09; beside P23 (file-disjoint); touches no bin/fgos.mjs range; may land before P10"
effort: ~0.75d
net_size: "Node 0; Rust 0; tests about +45; manifest data about +360 lines if Requirement 3 is taken (estimate)"
---

# Phase 11 - Architecture rule and acceptance (COOK step 5; authority audit AU-06, AU-23) - landed 2026-11-12 (approved by owner decision 85)

**Landed.** The rule's wording and the acceptance scenario cite COOK's `unit-run-result` text (§7, §8 on branch `cook/unit-run-result`).

**Authority guarded:** worktree custody is T4's; the rule keeps Workflow from taking it again. Tier map (Requirement 3) makes "an upper layer never decides a lower layer's fact" checkable in the manifest.

## Context

After the custody door (P05), the result fields (P07) and the Workflow readers (P09), an architecture rule keeps Workflow from reaching back into Execution's custody internals. Today `docs/architecture-manifest.json` declares two rules (`one-directional-layer`, `domain-siloing`; `test/architecture.test.mjs:147` asserts the first exists) and classes the `src/workflow/case-*.mjs` files `infra` (`:322-338`). P04's guard forbids imports from `src/cli`.

**Narrowed by decision 83 (ii), audit AU-06:** the rule forbids only the custody mechanisms. `src/workflow/case-lock.mjs:9,28-59` takes Workflow's own `advance` lock on its own ledger through the T1 holder-lock door, a correct downward dependency; forbidding `src/holder-lock` wholesale would push that lock into a run-supervisor door it does not belong to.

**AU-23:** the manifest classes 358 files by hexagonal role but records no tier (T0-T9) or product layer (Execution, Workflow, Domain), so rules like this one are added one at a time. Versioned blocks use three shapes; COOK §2 adopts `contract: { id, version }` for every cross-layer block.

## Requirements

1. **The rule:** no file under `src/workflow` imports `src/run-supervisor/cwd-lock.mjs` or names the custody scopes `unit-custody` or `workflow-worktree`. `src/holder-lock` imports stay allowed (`case-lock.mjs`'s `createLockScope('advance')`). Expressed in the manifest's existing rule vocabulary if it can carry a "forbidden pair"; otherwise one named assertion in `test/architecture.test.mjs` (step 1 decides; no new rule engine). Exception list: empty.
2. **Acceptance test (one):** the COOK §8 scenario through Workflow: three seats, one forced into an infrastructure failure by a fixture executor registered in the test's own config (never a product flag or env switch) and rerun through `infrastructure`, one reaching a verdict, one refused; the case settles from contract fields alone and the test fails if Workflow code reads a field the contract does not name (the double returns results shaped by P07's fixtures with every non-contract field removed). It is the one wiring proof of the Unit contract (design principle 8); the per-outcome cases stay owned by P07's fixtures and P09's replay.
3. **Tier field (AU-23; the owner chooses it with this phase's approval).** Each manifest row (or directory row) gains `tier`; one rule "a file of tier N imports only tiers <= N, except named ports"; one test. It adds about +360 data lines to the manifest, so it is listed separately: if the owner approves P11 without it, AU-23 goes to the ideas list of the close report (RUL104).

## Files

**Create:** one test file under `test/workflow/` named for the contract.

**Modify:** `docs/architecture-manifest.json` and/or `test/architecture.test.mjs`.

**Delete:** none.

**Tests to retire:** any existing Workflow test that only asserts the removed import shape; none known. If the acceptance test duplicates a case of an existing council-through-workflow test, that case is retired and named.

## Red tests first

The architecture assertion fails if any custody import P05 removed is put back (recorded by temporarily restoring one on the branch, seeing red, reverting) and passes with `case-lock.mjs`'s holder-lock import present. The acceptance test is red on a branch without P05, P07 and P09.

## Steps

1. Re-read the contract text; confirm P05, P07, P09 landed; `rg -n "cwd-lock|unit-custody|workflow-worktree" src/workflow` is empty.
2. Red; rule; acceptance test; tier field if approved.
3. Run the acceptance test with the contract-only double, then once through a real built host on a three-seat scenario (`fgos workflow start` with a throwaway case) and report.

## Validation (focused)

FR `test/architecture.test.mjs` and the new test; land gate. COOK reviews against the text.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| The rule blocks a legitimate Workflow need discovered later | L x M | the rule names one module and two scope strings; the exception list is explicit and reviewed |
| The acceptance double drifts from the real result shape | M x M | the double is built from P07's fixtures, not hand-written |

## Rollback

Revert the merge commit; the behaviour phases stay.

## Done when

Rule red-then-green; acceptance test green on contract fields only; COOK confirms.
