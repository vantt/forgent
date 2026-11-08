---
phase: 13
title: "Test owners and split: each behaviour proven by its owning pure function, one real-seat wiring proof per engine path, the pure fold in the ledger test, definition cases in their own file, fixed waits replaced by the ledger event, and the 2 300-line runner test split by fixture cluster"
status: pending
depends_on: [02, 05, 06, 11]
parallel: "wave 4 (alone among test owners); P12's wiring step may still be open (disjoint files)"
effort: ~1.5d
net_size: "Node 0 / Rust 0 / tests −325 (estimate)"
---

# Phase 13 — Test owners and split (W-10 + the four tests tables)

## Context

Arbitration §2.1 W-10 ("each behaviour moves to its owning pure function (`buildUnitHandoff` gets its own tests; seat expansion to `seats.test.mjs`; options to `unit-handoff-raise-door.test.mjs`); one real-seat wiring proof per engine path; the pure fold leaves the 154 s file for `workflow-store-ledger.test.mjs`; fixed waits become waits on the ledger event; `workflow-runner.test.mjs` split by fixture cluster (HARDEN does it: TEST is closed, as decision 69 did for H-T5a). Each retired test names its new owner"), simplicity 2 (nine definition tests move to `test/workflow/definition.test.mjs`). Not taken: A4 (injected Unit runner for the order guard) — `playbook-observable-order.test.mjs` keeps real seats.

Baseline (`research-261108-0831` §3.2): 40 files, 420 tests, 686 s; seven files 543 s: `workflow-runner` 153.8 s (66 tests, 2 326 lines), `units-runner` 85.8, `playbook-observable-order` 78.8 (3 tests), `advisory-m-contracts` 78.0, `discussion-workflows` 57.6, `playbook-proposer` 52.5, `run-case-admission` 36.1. Speed seat W-10 by behaviour (line numbers at baseline; the lead re-finds by title after P02/P05/P11):
- Unit hand-off (`buildUnitHandoff`, pure): `workflow-runner.test.mjs` 304, 873, 938, 985, 1044, 1346, 1702 (≈ 48 s); keep 873 as the wiring proof.
- Persona and seat expansion: 1899, 1957, 1981, 2084, 2149, 2170 (≈ 38 s); owner `seats.test.mjs`; keep the two real-CLI `--seats` cases.
- Option flow (`--effort`, `--timeout`, `--account` reach the Unit): about 10 of `units-runner.test.mjs`'s 24; owner `unit-handoff-raise-door.test.mjs` (`unitOverridesOf`, pure) + one wiring run.
- Pure fold cases (append then project) at the head of `workflow-runner.test.mjs`: owner `workflow-store-ledger.test.mjs`.
- Nine definition cases (119, 147, 1115, 1271, 1279, 1292, 1299, 1497, 1603): owner `definition.test.mjs` (created by P06).
- Fixed waits: `playbook-proposer.test.mjs:247` (fixed 3.5 s after a 2.5 s worker sleep) → wait for the reservation to go quiet or the ledger event; `workflow-runner.test.mjs:419,442` 200 ms status polls → wait on the ledger's terminal event.
- Lock and status cases 517-660: one per observable (second advance refused, killed holder frees, deleted run dir, status reads no lock).
- Preset end-to-end duplicates: `playbook-observable-order` (golden order of every preset) is the owner of "same order as the stored runs" (spec §11 item 12); `discussion-workflows`, `group-cognition-debate`, `business-discussion-workflow`, `architecture-advisory-workflow`, `advisory-m-contracts` keep only what the order guard does not assert (each file's kept cases listed with why).

## Requirements

1. Every moved case keeps every assertion (text assertions move with it); a retired case names the case that now owns each of its assertions (phase report table: retired title → owner title).
2. `buildUnitHandoff` gets direct tests (pure, over a hand-built state) in `test/workflow/unit-handoff.test.mjs`.
3. `workflow-runner.test.mjs` split into files by fixture cluster (names by `fgos convention`-free kebab-case: e.g. `workflow-runner-resume.test.mjs`, `workflow-runner-gates.test.mjs`, `workflow-runner-cli.test.mjs`); no file over about 50 s by the per-test sums.
4. No new test-only code path, env switch or injected port (A4 not taken).
5. Report the test-time change of the 40 baseline files (FR timings at low load, load noted) and retired files for TEST's baseline (never hand-edit `test/suite-baseline.json`).

## Files

**Create:** the split files of `workflow-runner.test.mjs` (names in the report).

**Modify:** `test/workflow/workflow-runner.test.mjs` (split, then deleted or kept as one cluster), `units-runner.test.mjs`, `playbook-proposer.test.mjs`, `playbook-observable-order.test.mjs` (only if a duplicate moves in), `discussion-workflows.test.mjs`, `group-cognition-debate.test.mjs`, `business-discussion-workflow.test.mjs`, `architecture-advisory-workflow.test.mjs`, `advisory-m-contracts.test.mjs`, `seats.test.mjs`, `unit-handoff.test.mjs`, `unit-handoff-raise-door.test.mjs`, `workflow-store-ledger.test.mjs`, `definition.test.mjs`.

**Delete:** duplicate real-seat runs whose assertions moved (listed in the report with owners).

**Tests to retire:** each listed in the phase report with its owner (requirement 1).

## Net size

Tests about −250 to −400 (estimate −325); Node 0.

## Steps

1. Inventory: every test of the seven slow files → behaviour → owner (table in the report); the big lead reviews it before any test is deleted (plan acceptance 6).
2. Pure owners first (hand-off, seats, options, fold, definition); each move green alone.
3. Wiring proofs kept; duplicates retired.
4. Fixed waits.
5. Split `workflow-runner.test.mjs`.
6. Timings.

## Validation (focused)

- FR over the 40 baseline files (in two or three batches, low load), timings recorded; then the full suite.
- `rg -n "setTimeout\(|sleep\(" test/workflow` → only polls on a ledger condition.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| An assertion lost in a move | M × H | Requirement 1 table; reviewer checks titles one by one |
| Split files share fixtures by copy | M × L | Shared helpers stay in the existing test helper module (lead names it); no copied fixtures |

## Rollback

Revert; tests only.

## Done when

Inventory table in the report; owners named; test time of the 40 files down by at least 70 s (P15 confirms on the activated release); landed.

## Lead brief essentials

Find the owner first; move, never weaken; no injected runner. All plan.md lead rules apply.
