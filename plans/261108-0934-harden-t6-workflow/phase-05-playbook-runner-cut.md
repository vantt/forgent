---
phase: 05
title: "Playbook runner cut: advanceWorkflowRun becomes a short loop over named steps, the ledger stops copying seat evidence, the account dry bind goes and status shows each seat's account, escaping throws fold into the unit, and resume reruns an infrastructure failure while refusing a verdict by name"
status: pending
depends_on: [03, "08 landed before the dry-bind deletion"]
parallel: "wave 2, with 04, 06, 07, 08, 09"
effort: ~2d
net_size: "Node −105 / Rust 0 / tests +35 (estimate)"
---

# Phase 05 — Playbook runner cut, slim ledger, resume (simplicity 1, B-16, W-2, B-5, R-5, Q4 a)

## Context

Arbitration §1 Playbook runner ("`advanceWorkflowRun` under the proposer's lifelong hold, a cycle loop over named steps … one `emit(type, payload)` and one `failStep`"), §2.1 rows simplicity 1 (+ B-16), W-2, B-5, B-3 = D1 = R-5; owner decision 71 (4a): "`resume` reopens a step that ended in an infrastructure failure (`execution-failure`, `not-started`) as a fresh admitted Unit; verdicts stay terminal and `resume` refuses them by name; no new automatic retry". P02 has already removed the integrate branch.

Code read on `595faa273` (runner lines before P02's deletion; the lead re-reads after rebase):
- `advanceWorkflowRun` `runner.mjs:77-597`: open legacy case `:93-98`; `reread` `:102-110` (P03 swapped it); ready set `:120-128` (drops `failed` at `:123`); gate park `:165-189`; unit worktree and base `:284-317`; account dry bind `:367-404` (emits `unit.account-unpinned` `:393`); `runUnit` `:420`; custody-unknown recovery `:421-451`; admission refusal `:453-483`; out-of-scope `:493-503` (throws when the branch is gone, B-16); `unit.complete` `:505-520` (`results: unitRunResult.results` whole, W-2); `step.fail`+`workflow.fail` pairs (`:212-216`, `:243-245`, `:543-558`); settle `:584-594`; 14 hand-built `recordEvent` wrappers.
- Fold: `projectWorkflowState` `store.mjs:246-440` (195 lines); `step.start` `:301-305`; step and run `failed` `:382-397`.
- Resume: `resumeWorkflow` `case-verbs.mjs:294-317` returns the failed state silently; resume of a known run reuses `uState.worktreePath` `runner.mjs:293-298` only for a known run id (R-5 window between `unit.scheduled` and `unit.started`, `:324-341` vs `:409-416`).
- B-5: `unitOverridesOf` `unit-handoff.mjs:180-208` (pin on every seat plus an unscoped override); `seatProviders` `seat-providers.mjs:24-37` (no account).
- W-2 readers of `results` (keep their fields): `seat-providers.mjs:21`, `unit-handoff.mjs:67,147,427`, `case-admission-port.mjs:90-106`, `scripts/backfill-unit-summaries.mjs` (`store` importer); fields read: `seat`, `role`, `round`, `outcome`, `binding`, `commit`, `refused`, `runResult.executorId`, `runResult.policy`, `runResult.agentClaim.summary`, `runResult.settleReports`, `runResult.settledAt`, verify and verdict markers (speed seat W-2).
- Duplicate env constant `ADVANCE_DETACHED_ENV` `dir-guard.mjs:11` (the other is `case-lock.mjs:14`).

Not reproduced at arbitration, so **red first**: R-5 crash window (a `unit.scheduled` with a worktree and no `unit.started`, then resume), B-16 (out-of-scope throw on a missing branch leaves the run `running` with no event), W-2 (structure: size of one `unit.complete` line in a panel fixture).

## Requirements

1. **Cut** `advanceWorkflowRun` to ≤ 150 lines: `emit(type, payload)` and `failStep(step, outcome, reason)` in `runner.mjs`; `isReady(step, state)`; `parkGate` and `prepareUnitWorktree` and `foldUnitOutcome` move beside their owners in `unit-handoff.mjs` (`renderGateQuestion`, `writeBaseOf`, `outOfScopeWrites`); `runUnitWithRecovery` and `admissionRefusalOutcome` in `runner.mjs`. No helper over 80 lines. Behaviour unchanged except the items below.
2. **B-16.** The two throws that escape the loop (cleanup inside the admission-refusal catch; `outOfScopeWrites` on a missing branch) fold into the unit's failure like every other.
3. **W-2.** The one writer of `unit.complete` stores each result without `runResult.evidence`; every field a reader uses stays; old ledgers read as before (new shape is a subset). Before the change, `rg -n "evidence" src bin scripts packages` over every ledger reader (the failure-mode reviewer found no reader outside `src/workflow`; re-check).
4. **B-5 (RT-9, plan fact 6).** The unscoped fallback override that carries the run-level account gets the existing `origin: 'workflow'` marker (seat-scoped entries already carry it, `unit-handoff.mjs:189`); P08 makes the door run a unit unpinned when its only account pin is a Workflow one and no seat takes it. After P08 lands: delete the per-unit dry bind (`:367-404`) and `unit.account-unpinned` (emit and its `progressLine` text `:61`); the per-seat binding provenance is the one record; `seatProviders` adds `account` (the pinned account or the skip reason) per seat. Red test first: a `--units` run with `--account` where no seat is in the pool runs every unit unpinned (today it does so only through the dry bind). Whether a pin may move a seat is P09's crate rule.
5. **Q4 (a), RT-2, RT-8 (plan fact 7).** A unit whose `unit.complete` outcome is `execution-failure` or `not-started` with no settled seat verdict is rerunnable; `findings`, `refused`, admission refusal and out-of-scope writes are verdicts and terminal. Only `resume` reopens, under the hold, by appending the existing `step.start` for each step that has a rerunnable unit (no new event kind). The fold: `step.start` clears the step's and the run's `failed`, marks the step's rerunnable units `pending` again (keeping `worktreePath`, `branch`, `unitRunId` of the failed attempt as the predecessor), and clears `workflow.worktrees` so the end settles again (`runner.mjs:584`). The runner: the skip at `runner.mjs:262` skips only units the fold left `completed`; a rerun unit is a fresh Unit run admitted again (frame and seat ceiling count it); a writing rerun reuses the recorded worktree and branch when they exist (the predecessor path `runner.mjs:421-451`), never `createWorkflowWorktree` on an existing branch. At most one rerun per `resume` call; no automatic retry. `resumeWorkflow` refuses a run whose failing step ended in a verdict with `nothing-to-resume: step <id> ended <outcome>` instead of returning silently (`case-verbs.mjs` resume only). An `answer` never reopens.
6. **R-5.** A unit with `unit.scheduled` + `worktreePath` and no `unit.started` reuses `uState.worktreePath` on resume whatever the run id.
7. `projectWorkflowState` ≤ 150 lines (fold cases unchanged); duplicate env constant gone (`dir-guard.mjs` imports `case-lock.mjs`'s).

## Files

**Create:** none.

**Modify:** `src/workflow/runner.mjs`, `unit-handoff.mjs`, `seat-providers.mjs`, `dir-guard.mjs`, `units-source.mjs`/`seats.mjs` (only if a moved helper lands there), `store.mjs` (fold), `case-verbs.mjs` (`resumeWorkflow` refusal only), `CHANGELOG.md` (resume reruns infrastructure failures, refuses verdicts; status shows per-seat account; ledger smaller), census.

Tests: `test/workflow/workflow-store-ledger.test.mjs` (fold: `step.start` reopens rerunnable units only and clears `worktrees`; old-ledger subset), `test/workflow/workflow-runner.test.mjs` (resume wiring: the `d1` scenario without an agent, about 1 s, read-only **and** writing unit; verdict refused; R-5; B-16; run-level pin no seat takes), `test/workflow/seat-evidence.test.mjs` or `seats.test.mjs` (`seatProviders` account), `test/workflow/units-runner.test.mjs` (dry-bind assertions retired).

**Delete:** 14 event wrappers, three fail pairs, the dry bind, `unit.account-unpinned`, the duplicate env constant, the raw `results` copy of `evidence`.

**Tests to retire:**
- `units-runner.test.mjs` cases asserting `unit.account-unpinned` and the dry-bind pin (about `:473-610` at baseline): behaviour removed; owners: T5's binding provenance cases (`test/runner/execution/account-pin.test.mjs`, the golden vectors after P09) plus the new `seatProviders` account case.
- Fold cases in `workflow-runner.test.mjs` that only append and project: moved by P13 to `workflow-store-ledger.test.mjs` (not here).

**Cross-lane one-liners:** none.

## Net size

Node: cut −100 (+30 moved into `unit-handoff.mjs`), dry bind −38, W-2 +3, B-16 +4, R-5 +4, Q4 +12 (fold 6, skip 2, worktree reuse 1, resume refusal 3), fold cut −15, env −1, origin marker +1 → about −100 to −105. Tests: Q4 +40 (read-only and writing), R-5 +15, B-16 +10, W-2 +10, seatProviders +10, pin-not-taken +10, dry-bind −50 → about +35. The Playbook-runner budget (≤ 1 300) binds: if the phase lands above it, continue the cut in `unit-handoff.mjs` or report the gap as `DONE_WITH_CONCERNS`.

## Steps

1. Red tests: R-5, B-16, Q4 verdict-refused and infra-rerun (read-only and writing), pin-not-taken, W-2 size scan.
2. `emit`/`failStep` and the named helpers (pure moves, tests green after each).
3. B-16; W-2 writer; origin marker; B-5 deletion after P08 lands.
4. Q4 fold, ready, resume refusal; R-5.
5. `projectWorkflowState` cut; function-length scan.
6. Message COOK lead the Q4 rule text (plan cross-lane table) the day this lands.

## Validation (focused)

- FR `test/workflow/workflow-store-ledger.test.mjs test/workflow/workflow-runner.test.mjs test/workflow/units-runner.test.mjs test/workflow/playbook-proposer.test.mjs test/workflow/unit-handoff.test.mjs test/workflow/unit-handoff-raise-door.test.mjs test/workflow/seat-evidence.test.mjs test/workflow/seats.test.mjs test/workflow/case-verbs.test.mjs test/runner/execution/account-pin.test.mjs`
- Function-length scan: `advanceWorkflowRun` ≤ 150, `projectWorkflowState` ≤ 150, no helper over 80.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Resume becomes retry-until-pass (RT-2) | M × H | Requirement 5; verdict refused test; one rerun per call; admission counts it |
| A ledger reader needs `evidence` (the failure-mode reviewer found no reader outside `src/workflow`; re-check) | L × M | `rg` sweep first; keep any field read |
| The cut changes event order a preset relies on | M × M | `playbook-observable-order.test.mjs` (golden order) green before landing |
| Old release after rollback misreads a reopened run | M × M | Plan on-disk table; guide step |

## Rollback

Revert; old release keeps a reopened run `failed`; new ledgers (subset) read fine.

## Done when

Red tests recorded then green; budgets met; COOK messaged; landed with smoke: a `--units` run whose seat launch fails (no commit in a scratch repo), fixed, then `resume` reruns it; a verdict run's `resume` refused by name; `fgos workflow status` shows per-seat account; guide section written.

## Lead brief essentials

Move code to its owner, do not invent modules; the order of events must not change except reopen. All plan.md lead rules apply.
