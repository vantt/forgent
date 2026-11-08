---
phase: 11
title: "Workflow doors and verbs: one verb each for start, answer and resume with a detached option, a facade of production names only, named codes for not-found, and workflow status shows the bindings judgment and each seat's account"
status: pending
depends_on: [04, 05, 09]
parallel: "wave 3, with 10 and 12 (12's wiring step waits for this phase)"
effort: ~1d
net_size: "Node −80 / Rust 0 / tests −30 (estimate)"
---

# Phase 11 — Workflow doors and verbs (simplicity 12 + B-14, B-17 not-found, status sections)

## Context

Arbitration §1 Conductor entry ("the verbs `start`, `answer`, `resume` each take `{ detached }` instead of paired functions (simplicity 12, B-14)"), Doors ("`{ detached: !foreground }` into one verb each; ids checked by `runDirOf` before any path is built … ≤ 120 lines"), Admission doctor row (`workflow-case-bindings`' check becomes a read section of `fgos workflow status`), §2.1 B-5 (`seatProviders` shows `account`, done in P05; shown here), B-17 ("not found").

Code read on `595faa273`:
- Pairs: `startWorkflowDetached` `case-verbs.mjs:87` / `startWorkflow` `:125`; `answerWorkflow` `:223` / `answerWorkflowDetached` `:244`; `resumeWorkflow` `:294` / `resumeWorkflowDetached` `:319` (discards a hold it may win and reports a Playbook case as a conductor, B-14 `:326`); "not found" `:45` without a code.
- Facade `index.mjs` (31 lines, 24 names; production importers use 10: `startWorkflow`, `startWorkflowDetached`, `preflightWorkflowSeats`, `statusWorkflow`, `answerWorkflow`, `answerWorkflowDetached`, `closeWorkflow`, `gateWorkflow`, `resumeWorkflow`, `resumeWorkflowDetached`).
- Door: `bin/fgos.mjs` `case 'workflow'` `:2233-2380` (`foreground ? await f() : fDetached()` at start `:2281`, answer `:2300`, resume `:2352`; `resume --account` named refusal `:2343`).
- `statusWorkflow` `case-verbs.mjs:154`; `inspectCaseBindings` from P04; `seatProviders` with `account` from P05.

Not reproduced at arbitration, so **red first**: B-14 (a resume that wins the hold after a release must advance a Playbook case, not report it as a conductor; test with an injected lock sequence through the real hold API, no test-only branch), B-17 (`not found` code).

## Requirements

1. `startWorkflow`, `answerWorkflow`, `resumeWorkflow` take `{ detached }`; one shared roots/hold/conductor-check/result path; the `*Detached` functions go; B-14's discarded hold goes with the pair.
2. `index.mjs` exports production names only; tests import from the owning file.
3. Bin arm ≤ 120 lines: `{ detached: !foreground }` into one verb each; `resume --account` refusal kept; the arm calls `runDirOf`'s id check through the verbs (no path built in the arm).
4. `workflow status` (json and text) gains two read sections: the bindings judgment of the case's worktree (from `inspectCaseBindings`, never repairing) and each seat's account (from `seatProviders`). No new verb, no change to existing fields.
5. B-17: "not found" carries code `case-not-found`.

## Files

**Modify:** `src/workflow/case-verbs.mjs`, `src/workflow/index.mjs`, `bin/fgos.mjs` (workflow arm), `src/cli/command-registry.mjs` (`workflow status` text names the two sections), `CHANGELOG.md`, census.

Tests: `test/workflow/case-verbs.test.mjs`, `test/cli/fgos-workflow.test.mjs`, `test/cli/fgos-case-doors.test.mjs`, CLI cases of `test/workflow/workflow-runner.test.mjs` (`CLI:` titles near 367, 400, 447, 466, 767 at baseline), importers of removed facade names (`rg -l "from '../../src/workflow/index.mjs'" test`).

**Delete:** three `*Detached` functions; 14 test-only facade names; the per-verb `foreground ?` branches.

**Tests to retire:** paired-function cases that prove the same verb twice (one per function): behaviour kept, owner the single-verb case with `{ detached: true }` and `{ detached: false }` in `case-verbs.test.mjs`; CLI duplicates beyond one wiring proof per verb (keep the three that observe the detached child), owner `test/cli/fgos-workflow.test.mjs`.

**Retire gate:** the retired-title → owner table is written in the phase report and reviewed by the big lead before the deleting commit (plan acceptance 6).

**Cross-lane one-liners:** none.

## Net size

Node: verbs −55, facade −11, bin arm −25, sections +10, code +1 → about −80. Tests about −30.

## Steps

1. Board line: P11 holds `bin/fgos.mjs` workflow arm and `command-registry.mjs`.
2. Red tests (B-14, B-17).
3. Verb fold; bin arm; facade; test imports.
4. Status sections.
5. Tell P12's lead the landed SHA (its wiring step starts after).

## Validation (focused)

- FR `test/workflow/case-verbs.test.mjs test/cli/fgos-workflow.test.mjs test/cli/fgos-case-doors.test.mjs test/cli/subcommand-flag-drift.test.mjs test/cli/dir-differs-from-cwd.test.mjs test/workflow/workflow-runner.test.mjs test/workflow/playbook-proposer.test.mjs`
- `wc -l` of the arm (≤ 120); `rg -n "Detached\(" src bin` → nothing.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A skill or script calls `*Detached` names | L × M | `rg -n "WorkflowDetached" core domains scripts plugins .agents` before deletion |
| Status output grows | L × L | Two small sections; results already bounded by P05 (W-2) |

## Rollback

Revert; no on-disk change.

## Done when

Red then green; arm ≤ 120; landed with smoke: `fgos workflow start council-lite` (detached) then `status` shows progress, per-seat account and bindings section; guide section written.

## Lead brief essentials

Same behaviour behind one verb; status sections read only. All plan.md lead rules apply.
