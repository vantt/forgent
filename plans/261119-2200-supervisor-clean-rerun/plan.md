---
contract: plan-v1
title: "Throwaway: clean rerun of the supervisor live run (plan 261118-1045 phase 19 step 5), zero interventions; one phase writes one scratch file"
status: draft
priority: P3
blockedBy: []
footprint:
  - plans/261119-2200-supervisor-clean-rerun/**
base: 7c9ce1c46525c8666d13f9b517899d677b7b4fea
source:
  - plans/261118-1045-project-supervisor/phase-19-integration.md
created: 2026-11-19
---

# Throwaway: supervisor live run

## Outcome
The watcher raises `plan-became-ready` for this plan, the supervisor admits it and starts one lead, the lead runs
phase 1 and lands it with `fgos land`, and the plan ends `done` with nobody typing a command. Removed afterwards.

## Acceptance criteria
- `plans/261119-2200-supervisor-clean-rerun/reports/live-run-scratch.md` exists on `main`, landed by the lead (`git log -- plans/261119-2200-supervisor-clean-rerun/reports`).
- This plan's `status` is `done` on `main`; `fgos supervisor queue --json` is empty afterwards.

## Non-goals
Any code, test or doc outside this plan directory.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Write the scratch file](phase-01-write-scratch.md) | - | plans/261119-2200-supervisor-clean-rerun/reports/live-run-scratch.md | 1 | ready |

Checked with `node scripts/plan-contract-check.mjs --plan plans/261119-2200-supervisor-clean-rerun`.

## Owner questions
None.

## Risks and rollback
A stuck run is ended with `fgos session stop`; the plan directory is removed with one `fgos land --paths`.
