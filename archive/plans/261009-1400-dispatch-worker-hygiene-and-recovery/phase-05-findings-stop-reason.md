---
phase: 5
title: "Findings stop reason"
status: done
budget: "<= 10 added src lines; 0 new files; no state"
stop: 2026-10-14
---

# Phase 05: findings stop reason

## Context

- [plan.md](plan.md). `src/runner/operation-choice.mjs:1745-1751`: a settled `findings` verdict on non-verdict (mutating) work stops with `assignment-<op>-insufficient-confidence`, which reads as an evidence problem.
- Reason vocabulary in the same function: `-no-evidence`, `-failed`, `-blocked`, `-insufficient-confidence`, `-unsupported-operation`.
- Consumers of the string outside the file: none (`grep -rn insufficient-confidence src bin core`); tests only (`test/runner/operation-choice.test.mjs`, `test/runner/assignment-runresult.test.mjs`).

## Leftovers decided (group 4)

| Item | Decision | Trigger to revisit |
|---|---|---|
| (a) misleading reason | Fix here | - |
| (b) `settlement.mjs:313` `inconclusive`/`blocked`/`not-applicable` -> `pass` | Defer (owner Q4) | A non-answer seat counted as a vote in a real run |
| (c1) launch-before-brief recovery | Drop (state machine, kill signal) | Idle worker after kill seen again after P02+P03 |
| (c2) receipt collection | Defer | R1 or a resume hits `run-unreconciled` |
| (c3) private home lifetime | Moved into P03 (early pane binding) | - |
| startup-dialog capture | Drop (exists: `herdr-diagnosis.mjs:33`) | Diagnosis file missing after a dialog kill |

## Requirements

- Stop stays a stop; only the reason changes to `assignment-<op>-findings` when the outcome is a settled `findings` verdict. Other cases keep `-insufficient-confidence`.

## Files

- Modify: `src/runner/operation-choice.mjs`. Tests: `test/runner/operation-choice.test.mjs` (T5), adjust `assignment-runresult.test.mjs` only if it asserts this case.

## Steps

1. Impact analysis on `interpretAssignmentRunResult`.
2. Branch before the generic stop; T5.

## Done

T5 green, run by Lead, plus `npm test`. No review (no consumer of the string).

## Risks / rollback

- Hidden consumer outside the grep scope (skills prose) -> re-grep `.agents/`, `plugins/` before merge. Rollback: revert.
