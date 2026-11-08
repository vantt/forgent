---
phase: 08
title: "Execution Core seams: a writing Unit takes worktree custody before admission, a Workflow run-level pin that no seat takes runs the unit unpinned at the door, a unit-run report is read from its own seat only, and admitProposal becomes six pure guards with no unread output"
status: pending
depends_on: [03]
parallel: "wave 2, with 04, 05, 06, 07, 09; lands first in the wave (04's release and 05's dry-bind deletion rely on it)"
effort: ~0.5d
net_size: "Node −20 / Rust 0 / tests +15 (estimate)"
---

# Phase 08 — Execution Core seams (B-2 reorder, run-level pin at the door, W-3, `admitProposal` shape)

## Context

Arbitration §1 Admission ("a writing reservation's liveness is the worktree custody lease `runUnit` already holds, taken before `port.admit` (T5 file, reorder only)"; "`admitProposal` ≤ 110 as six pure guards"; delete "the unread `bindings` output of `admitProposal`"), §2.1 W-3 ("`resolveUnitRunRef` reads only the wanted seat's directory (`readSeatDirectory` exported)"), §3 (T5 files, HARDEN owns T5; no `CaseAdmissionPort` interface change).

Code read on `595faa273`:
- `unit-run-start.mjs:360-387`: comment "Admission, then custody, then the unit directory"; `port.admit` `:367`; `scope.custody = admitSuccessor(createLockScope('unit-custody'), …)` `:387`; the resume path takes custody at `:300`.
- W-3: `resolveUnitRunRef` `handoff-refs.mjs:101-121` calls `readUnitRunHistory(unitDir)` (`unit-run-history.mjs:99`), parsing every seat's result to find one report; `readSeatDirectory(unitDir, seatId)` `:54` is private.
- Door pin check: `assertDoorChoicesBeforeRun` `unit-run-start.mjs:158-196` throws "the pinned account applies to no seat of this unit" (`:192`) for any override that pins an account no seat takes; Workflow's seat-scoped overrides carry `origin: 'workflow'` (`src/workflow/unit-handoff.mjs:189`), P05 adds it to the unscoped fallback (plan fact 6).
- `admitProposal` `case-admission.mjs:118-281` (164 lines); `bindings` built `:196-207`, returned `:263`, never read by the port (`case-admission-port.mjs:280,311` re-derive the binding).

Not reproduced at arbitration, so **red first**: the admit-before-custody window (a writing `fgos run --case` admitted while another holder has the worktree's custody: today it is admitted and then refused at custody, leaving a live reservation — red test in `run-case-admission.test.mjs`); W-3 (structure: count of result files parsed for one ref, recorded).

## Requirements

1. **Custody first.** A writing standalone or case run takes the worktree custody lease before `port.admit`; a refusal by custody happens before any reservation exists; the comment states the new order. A read-only run is unchanged. A failed admission releases the custody it took.
2. **Run-level pin at the door (plan fact 6, RT-9).** When every override that pins an account carries `origin: 'workflow'` and no seat takes it, `assertDoorChoicesBeforeRun` lets the unit run unpinned (each seat's provenance keeps its skip reason) instead of throwing; an explicit `fgos run --account` (no such origin) keeps the refusal. Red test: a unit with only a Workflow-origin pin that no seat takes passes the door; the same pin from `--account` is refused.
3. **W-3.** `readSeatDirectory` exported; `resolveUnitRunRef` reads only the wanted seat; result unchanged.
4. **`admitProposal`** ≤ 110 lines as six pure guards (lead names them from the existing blocks); the `bindings` output and its build go; still pure (no file, no clock).

## Files

**Create:** none.

**Modify:** `src/runner/execution/unit-run-start.mjs`, `handoff-refs.mjs`, `unit-run-history.mjs`, `src/workflow/case-admission.mjs`, census.

Tests: `test/runner/execution/run-case-admission.test.mjs` (custody-before-admit), `test/runner/execution/run-pre-admission.test.mjs` (pin origin at the door), `test/runner/execution/handoff-refs.test.mjs` (one-seat read), `test/workflow/case-admission.test.mjs`.

**Delete:** the `bindings` output; the whole-unit parse in `resolveUnitRunRef`.

**Tests to retire:** a `case-admission.test.mjs` assertion on the `bindings` output, if any: behaviour removed (no reader); binding behaviour is owned by `case-admission-port.test.mjs`.

**Cross-lane one-liners:** none (P06 touches `case-admission.mjs`'s `RIGOR_ORDER` import; rebase).

## Net size

Node: reorder ±0, pin origin +5, W-3 −3, guards −10, bindings −12 → about −20. Tests: +20 −5 → +15.

## Steps

1. Red tests; W-3 record.
2. Reorder; failed-admission release.
3. Pin origin at the door.
4. W-3.
5. `admitProposal` guards.
6. Land first in wave 2; tell P04's and P05's leads the landed SHA.

## Validation (focused)

- FR `test/runner/execution/run-case-admission.test.mjs test/runner/execution/run-pre-admission.test.mjs test/runner/execution/run-resume-order.test.mjs test/runner/execution/handoff-refs.test.mjs test/runner/execution/legacy-seat-read.test.mjs test/runner/execution/unit-summary.test.mjs test/workflow/case-admission.test.mjs test/workflow/case-admission-port.test.mjs test/runner/work-path-case-admission.test.mjs` (`readUnitRunHistory` has no own test file; its readers' tests above own it).

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Taking custody first changes a Work caller's error code order (`fanout-batch`, `work-dispatch`) | M × M | Work callers go through `runUnit`; their refusal tests (`work-path-case-admission.test.mjs`) run in this phase |
| Custody leaked on an admission refusal | M × H | Requirement 1 release path; test asserts custody free after refusal |

## Rollback

Revert; no on-disk change. If P04's release landed, revert P04's release commit first (it relies on this order).

## Done when

Red tests recorded then green; landed before P04's release; smoke: a `fgos run --case` writing run on a worktree another process holds is refused with no reservation left; guide section written.

## Lead brief essentials

Reorder only; no interface change to `CaseAdmissionPort`. All plan.md lead rules apply.
