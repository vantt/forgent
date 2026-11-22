---
id: p-fwdxupc6fx
title: "Heads rotate on their own: a background task, an account quota and a quarantined account each stop a head rotating without a manual step (session rotation, priority high; source: lead:SUPERVISOR via mail, owner-approved 2026-11-22 23:10)"
status: proposed
priority: P1
area: session-rotation
created: 2026-11-22
---

# Why

Three causes found on 2026-11-22:

1. A session cron or background task blocks rotation at every level (`packages/session-host/rust/src/rotation/decide.rs:168`, decision `background-work-running`). Miu sat at 0.15 to 0.187 of context from 21:39 to 22:23 and never rotated. Fix direction: carry `session_crons` into the handoff and let the successor recreate them, so crons no longer block.
2. Rotation measures only context, never the account's weekly quota. Tonight's Miu and supervisor rotations were for quota and needed a manual rotate. No `context-sidecar.jsonl` writer exists, so every measure is transcript-based and stale.
3. A head launch's seat ranking picked the quarantined account claude/tetcu (`secretary-miu` `rotation.log`, start refused `provider-capacity.lease-conflict`) although `rank.rs` filters `quarantined_until`. This also covers p-njgws5wsex.

# Done when

A head rotates by itself for each of the three causes, each proven by one test at the lowest layer that observes it. Cause 3 is confirmed first (the account view given to head launches lacks the quarantine, not the ranking). This is a plan separate from heads-stable.

# Notes

Owner approved this row and a separate plan on 2026-11-22 23:10. Supersedes p-njgws5wsex in scope; that row stays until this one lands.
