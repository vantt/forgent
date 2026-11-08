---
phase: 15
title: "Spec, measure, close: Part A shapes and the settled rules into the Workflow spec, stale text gone, contract and help text fixed, backlog rows settled, re-measure on the activated release, Vietnamese guide finished, layer closed with net size at or below zero"
status: pending
depends_on: ["01-14 landed"]
parallel: "close"
effort: ~1d
net_size: "Node 0 / Rust 0 / tests 0"
---

# Phase 15 — Spec, measure, close

## Context

Per-layer loop steps 7-9 ([HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md#the-per-layer-loop)); arbitration §2.1 row "stale text" (simplicity 17 = D9 + red-team spec table), §3 rows DOC, T1, COOK; owner decision 71 (6a: shapes written into the spec).

Spec read on `595faa273` (`docs/platform/workflow/spec.md`, 756 lines): §5 `:185` (component and authority), pattern `debate` paragraph `:206` naming the unregistered row `workflow-pools-satisfy-independence`, §9 rework table `:413-432` (`plan-source.mjs` `:422`), consent row `consent-before-merge` `:532`, §17 decision history `:689`, §18 pointers `:746-756` (`integrate.mjs`, `plan-source.mjs`). Other text: `packages/holder-lock/contracts/lock-registry.v1.json:52` ("v1 source: src/workflow/runner.mjs ADVANCE_LOCK_FILE"); `ref-digests.mjs:5` ("case-inbox.mjs", fixed by P03 if touched, else here); `command-registry.mjs:2384+` workflow description ("pure git integration"); `docs/platform/component-boundary.md:69` (Workflow row).

## Requirements

1. **DOC first:** message the DOC lead with the spec and boundary paths and the change list; wait for an ack line or one working day before merging (plan rule).
2. **Spec Part A:** each component's authority, contract and ports, Node budget and size target from arbitration §1 as settled by decision 71 (Node, no Rust move; Playbook proposer in the one case model); the settled rules: answers (owner only, asked gates, never delivery milestones), gate runs the declared verify, no Playbook integrate (merge at the approve door), reservations released when quiet, resume reruns infrastructure failures once per call and refuses verdicts, pin never moves a seat (pointer to the Seat Binding spec), prune and its A1 rules, `advance.log` progress only; one trust line: a project YAML unit `verify` runs on the host like `capabilities.*.verify`, and project config chooses the `verify` a gate runs; one limit line: an unconfined process of the owner's OS user can still answer at depth 0 or write the case directory (plan Outcome; owner decisions 55/56 own the channel that closes it); decision-history entry for decision 71 in §17 (narrative, glossed ids).
3. **Stale text out:** `integrate.mjs`, `plan-source.mjs`, `workflow-pools-satisfy-independence` (deleted, not replaced; `test/setup/seat-binding-dry-bind.test.mjs:110` keeps it gone), the §9 rework table, "before cutover" wording; `consent-before-merge` named as enforced by the approve door; `lock-registry.v1.json:52` source → `src/workflow/case-lock.mjs` (OPC reviews); workflow description in `command-registry.mjs` (no "pure git integration"); component-boundary row.
4. **Backlog:** `p-d2dc4f2e` (resume), `p-zpgzqdoy4z` (pattern deviation), `p-3ydqquajy2` (receipts), `p-tslryr3buq` (retention) marked done with commits; and, if the lead decides, the A5 run-output size cap as T5's backlog row (arbitration §2.4) and the plain-`fgos run` retention gap (lead question Q-3); ids from `fgos identity mint backlog`.
5. **Cross-lane checks:** COOK's `coordination-driver.md` Step 6 edit landed or recorded open on COOK's board row; WORK line about the P09 Workflow half present; doctor track told the pointer row can be registered.
6. **Re-measure** on the activated release, fg-server2, load class of the baseline (note load): `fgos workflow propose` p50/p95 over 20 runs (one slice, this checkout); `workflow status` p50 on a small and the largest ledger; size of a fresh panel run's ledger (`council-lite` or `delphi`, one unit) against the old ledger of the same preset; `advance.log` of that run; the 40 baseline test files' test time (FR, low load); `wc -l` per component and the function-length scan; `fgos doctor --json` rows of the layer.
7. **Net size:** `git show --numstat` over HARDEN T6 commits (from `f16e2e983` and the answer-gate branch through P14) per language; ≤ 0 each, else every increase names its paying deletion.
8. **Closing report** (`fgos convention name --kind report --type closing --slug harden-t6-workflow --json`): before/after table, acceptance criteria 1-8 with evidence, what moved where, open items handed off; HARDEN plan layer row and board line.
9. **Guide** finished (Vietnamese, every phase section, the prune dry-run step, the rollback notes from the on-disk table).
10. Citations: run `test/scripts/check-decision-citation-drift.test.mjs` and `test/scripts/doc-health.test.mjs`.

## Files

**Modify:** `docs/platform/workflow/spec.md`, `docs/platform/component-boundary.md`, `packages/holder-lock/contracts/lock-registry.v1.json`, `src/cli/command-registry.mjs` (description), `docs/backlog.md`, `CHANGELOG.md` (only if a phase missed a line), the HARDEN plan's T6 row (`plans/261021-1118-harden-low-layers-bottom-up/plan.md`), board `log.md` line.

**Create:** closing report; guide (if not created at the first landing).

**Delete:** stale spec text listed above.

**Tests to retire:** none.

## Steps

1. DOC message. 2. Spec and contract text. 3. Backlog. 4. Measure. 5. Net size. 6. Report, guide, board, HARDEN plan row.

## Validation

- FR `test/scripts/doc-health.test.mjs test/scripts/check-decision-citation-drift.test.mjs test/setup/seat-binding-dry-bind.test.mjs test/holder-lock/registry-contract.test.mjs`, then the full suite.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Spec edit collides with DOC | M × L | DOC told first; rebase-only |
| Measurement under load misleads | M × M | Load recorded; repeat at low load; arithmetic estimates labelled as such |

## Rollback

Revert the docs commit; no code.

## Done when

Acceptance criteria 1-8 of plan.md each shown with evidence in the closing report; layer net Δ ≤ 0; owner-machine guide linked on the board; HARDEN plan T6 row closed.

## Lead brief essentials

Write what was settled, gloss every id, link don't copy. All plan.md lead rules apply.
