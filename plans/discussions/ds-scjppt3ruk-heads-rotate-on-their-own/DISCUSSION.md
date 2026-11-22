---
id: ds-scjppt3ruk
title: "Heads rotate on their own: a background task, an account quota and a quarantined account no longer stop a head rotating"
status: settled
source:
  - p-fwdxupc6fx
  - p-njgws5wsex
created: 2026-11-22
---

discussion: settled

## Hand-off to the planner

Seeded by head:supervisor-forgent from backlog row `p-fwdxupc6fx` on the coordination-handoff event of 2026-11-22 23:05. The owner approved the row and a plan separate from `261122-0118-heads-stable-and-able` at 23:10; the row already holds Why, Done when and Notes, so no shaping round is needed.

- **Outcome:** a head rotates by itself, with no manual `fgos session rotate`, when (1) a session cron or background task is running, (2) its account nears the weekly quota, and (3) its launch would otherwise pick a quarantined account.
- **Causes, from the row:** (1) `packages/session-host/rust/src/rotation/decide.rs:168` refuses with `background-work-running` at every level; direction: carry `session_crons` into the handoff and let the successor recreate them, so crons no longer block. (2) Rotation measures only context, never the account's weekly quota, and no `context-sidecar.jsonl` writer exists, so every measure is transcript-based and stale. (3) A head launch's seat ranking picked quarantined `claude/tetcu` (`secretary-miu` `rotation.log`, start refused `provider-capacity.lease-conflict`) although `rank.rs` filters `quarantined_until`.
- **Constraints:** priority P1. Confirm cause 3 first: the suspicion is that the account view given to head launches lacks the quarantine, not the ranking. Footprint must not overlap the running plan `261122-0118-heads-stable-and-able` (notably `src/session-rotation/rotate.mjs`, `apps/fgos/src/wiring/session_rotation_hook.rs`, `packages/session-host/contracts/rotation-files.v1.json`); sequence with `blockedBy` where it must. Prior art before design (AGENTS.md): `git log -S` on `background-work-running`, `quarantined_until`, `context-sidecar`. L10: extend the existing rotation decision and seat ranking doors, no second door.
- **Non-goals:** a new seat judge; changing the soft/hard context thresholds; the phase 12 rotation reliability work already done in `261122-0118`.
- **Acceptance criteria:** one owning test per cause at the lowest layer that observes it (design principle 8): a running cron no longer blocks rotation and the successor recreates it; a weekly quota near its limit triggers rotation; a head launch never leases a quarantined account. `npm test` and `cargo test --workspace` green. `p-njgws5wsex` closes with this plan.
- **Open points:** none blocking. The quota threshold value is chosen at plan time and lives in `core/config-standard`.
- **Source ids:** `p-fwdxupc6fx`, `p-njgws5wsex`.
