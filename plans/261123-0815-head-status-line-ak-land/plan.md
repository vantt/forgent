---
contract: plan-v1
title: "Review and land the head status line branch (ak layout and colors)"
status: ready
priority: P1
blockedBy: []
footprint:
  - plans/261123-0815-head-status-line-ak-land/**
  - apps/fgos/src/wiring/session_rotation_hook.rs
  - plans/reports/implementation-261123-0720-head-status-line-ak-layout.md
source:
  - p-7nmpo2zr3d
created: 2026-11-23
---

# Review and land the head status line branch (ak layout and colors)

## Outcome
The owner's order of 2026-11-23 (supervision event `a031c65b06063c8f`): review and land design-lap's branch
`head-status-line-ak-layout` (commits `16af9206e`, `8ffa33a7d`, `cee8e5470`) on main, then tell the owner it is on main.
The implementation already exists; this plan only reviews it, fixes what the review finds inside the footprint, and lands it.

## Acceptance criteria (from the owner's order and backlog p-7nmpo2zr3d)
1. The context and quota figures on the head status line stay exact (same values as before the change).
2. The rotation sidecar record (`docs/platform/session-host/spec.md`, status-line sidecar writer) is byte-for-byte unchanged in shape and content.
3. The existing proof for the status-line output and the sidecar record still holds; `cargo test` for the touched crate and the land gates are green.
4. The branch is on main; the backlog row p-7nmpo2zr3d is marked done; the owner is told (through the supervisor's report and Miu).

## Non-goals
No new status-line fields beyond the branch, no sidecar contract change, no change outside the footprint.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | Review the branch against the acceptance criteria (read-only review unit), fix findings, land on main | - | apps/fgos/src/wiring/session_rotation_hook.rs, plans/reports/implementation-261123-0720-head-status-line-ak-layout.md | 1 | ready |

## Owner questions
None. A review finding that would change the sidecar contract or the exactness of ctx/quota is escalated, not fixed.

## Risks and rollback
- Risk: `heads-stable-and-able` phase 12 (done) also wrote `session_rotation_hook.rs`; rebase onto current main before landing.
- Rollback: `git revert` of the landing commit.
