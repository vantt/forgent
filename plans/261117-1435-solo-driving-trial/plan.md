---
title: "Solo driving trial: drive 1-2 real items through the role model by hand"
description: "Run shaper, planner, supervisor, leader, workers and watcher by hand on 1-2 small real backlog items, measure every step, land through HARDEN, and report the numbers and gaps to the portfolio-driving draft."
status: in-progress
priority: P2
effort: 6h
branch: plan/solo-driving-trial
tags: [driving, trial, measurement, solo, cook, supervisor]
blockedBy: []
blocks: []
created: 2026-11-17
---

# Solo driving trial

## Goal

The draft `plans/261117-1430-portfolio-driving-draft/plan.md` ("Meanwhile: drive solo, observe, measure") needs
numbers from real driving before any record shape, board or automation is designed. This trial drives 1-2 small real
items through the role model **by hand** (supervisor level 0) with today's doors, and measures each step.

Inputs read: the draft plan and `reports/council-final-recommendation.md` (D-ADR0079: planning data is the project's
source of truth; generic, uniform, no UI-specific shape; Work is a replaceable UX layer); the prototype on
`origin/plan-supervisor-prototype` (head `0ca1f3856b45`): `tools/plan-supervisor/{README,RUNBOOK,SKILL}.md`,
spec `plans/reports/spec-261116-1042-plan-supervisor.md` §2 (roles), §4 (index sources), §12 (observation), §13
(state after pilot; §13.3 the seven measures).

## Roles and who plays them

| Role | Played by | Output |
|---|---|---|
| boss | owner | frame approvals, answers |
| shaper | interactive owner session, `fgos-coding-shaping`, stops at "plan-ready" | `DISCUSSION.md` |
| planner | one short subagent or `fgos run --pattern solo`, `ak-plan` | item `plan.md`, `status: ready` set last |
| supervisor | HARDEN, one manual tick (level 0); optional read-only `plan-board.mjs check` / `eligible` | tick note, owner queue |
| leader | one short subagent per item following `fgos-cook` | proposal, case, one solo run per slice, self-verify, branch to HARDEN |
| workers | `fgos run` solo seats: claude, openai (pi or codex), gemini (agy) | slice commits |
| watcher | prototype `watchdog.sh` run by hand, or `fgos workflow status` | alerts / status |

## Phases

| # | Phase | Status | Depends on | Owns (writes) |
|---|---|---|---|---|
| 1 | [Baseline and setup](phase-01-baseline-and-setup.md) | completed | none | this plan dir `reports/measures-template.md` |
| 1b | [Shaper without Work and the plan contract](phase-01b-shaper-without-work-and-plan-contract.md) | completed (landed 6ec9da752, a6f22e0f6) | 1 | (a) shaper skill paths of its agent; (b) `core/skills/_shared/plan-contract.md`, `scripts/plan-contract-check.mjs`, its test, `planner-brief-template.md`, this plan dir |
| 2 | [Shape and plan the items](phase-02-shape-and-plan-items.md) | ready (Q1 answered) | 1b, Q1 | per item: `DISCUSSION.md`, item plan dir |
| 3 | [Drive and land](phase-03-drive-and-land.md) | pending (Q2 answered; gate key effective once this branch lands) | 2, Q2 | per item: case worktree + branch; item `reports/measures.md` |
| 4 | [Trial report](phase-04-trial-report.md) | pending | 3 | draft plan `reports/trial-*.md`, draft plan `notes.md` |

Phases run in order (1, 1b, 2, 3, 4; the two parts of 1b run at once); items inside phases 2-3 may run one after the other or side by side (disjoint files).

## Constraints

- No new mechanism: no new verb, no new state store, no new config key. Only existing doors.
- Prototype per-machine state (`~/.local/state/plan-supervisor/forgent/`) is throwaway trial notes, never truth;
  the truth is git (plans, measure sheets, commits) and fgOS stores (Workflow case, `fgos friction`, `fgos metrics`).
- Do not run `install.sh`, enable the systemd timer, or `claim`/`lock`/`queue` with `plan-board.mjs` (that is level 1+).
- Plan-first: each item's `DISCUSSION.md` and `plan.md` are committed before its first worker slice and are the base
  of its case.
- Nothing touches the Work layer: no `fgos edit/pick/claim`, no `fgos decision --id <item>`, no `fgw/<id>` branch.
  Where `fgos-coding-shaping` asks for those, skip the step and record a friction (layer `skill`).
- Nobody but HARDEN lands; nobody pushes to main.

## Measures (per item, in the item's `reports/measures.md`)

1-7: the seven measures of spec §13.3 (completion; lead time split worker / failed runs / verification / owner wait;
interventions by kind and wait; scope fidelity; plan defects found by validate; detection latency; gates at first
independent check). Plus: retries and resumes per seat (family, attempts, outcome class), every intervention with
kind and wait time, every friction via `fgos friction record --layer ...`, and lessons. Template: phase 1.

## Owner questions (one batch)

- **Q1 (blocks phase 2): which 1-2 items?** Default: `p-2r54ft6njh` (fold the eight Windows plain-path copies onto
  `fgos_process::path`; Rust, mechanical, needs OPC review). Second candidate if two: `p-d3vxsgz6to` items 2-4
  (probe-account loose ends; item 1, the `--leg` help, is done). Options, cost and recommendation: phase 2.
- **Q2 (blocks phase 3 start): the whole-tree gate.** `runner.capabilities.code:implement.verify` is unset in this
  project (`fgos config explain` shows `current: null`), so `fgos workflow propose` refuses `gate-command-missing`.
  Default for Rust-only items: `cargo test --workspace`; the full `npm test` stays HARDEN's land gate. Details: phase 3.

## Owner answers

Given 2026-11-17 ~14:43 (Asia/Saigon) by the owner in HARDEN's window; relayed to the phase-1 session.

| Q | Answer | Effect |
|---|---|---|
| Q1 | First item `p-2r54ft6njh` (fold the Windows plain-path copies). Second item `p-d3vxsgz6to` items 2-4, started only after the first lands cleanly. | Phase 2 unblocked; items run one after the other, not side by side. |
| Q2 | Set `runner.capabilities.code:implement.verify` to `cargo test --workspace` for the trial. | Set through `fgos config set` in the project `.fgos/config.yaml` on branch `trial/solo-phase-1`. It is a `command` key, read only from the main checkout (`docs/platform/config/spec.md` section 5 rule 6), so it takes effect when HARDEN lands the branch. Rollback: `fgos config unset`. |

## Exit (measurable)

- Each chosen item landed on main through HARDEN's gate (commit sha recorded in its measure sheet).
- Each item has a filled measure sheet: all seven measures plus retries/resumes, interventions, friction ids.
- Every friction met has an `fgos friction record` entry (ids listed in the sheet).
- `plans/261117-1430-portfolio-driving-draft/reports/trial-<stamp>-solo-driving-trial.md` holds the numbers and the
  gaps found; lessons appended to the draft plan's `notes.md`.

## Rollback

Trial branches are deleted with `fgos worktree remove`; a landed item reverts with one `git revert` of its commit; the
gate key (if set for the trial) is removed with `fgos config unset`; the throwaway prototype state dir is deleted.
Nothing on main depends on the trial's notes.

## Related backlog

`p-24dxhwq7zr` (council instability): the per-seat retry/resume numbers here are the same measure for solo seats;
cite them in that row's evidence, do not fix there.
