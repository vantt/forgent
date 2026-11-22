---
id: p-g3btj3bpqc
title: "fgctl init or repair in a scratch clone or fixture installs live per-project watcher and mailbox timers that wake supervisor heads (packaging-distribution, priority high; source: lead:S6A canary, 2026-11-22 20:25)"
status: proposed
priority: P1
area: packaging-distribution
created: 2026-11-22
---

# Why

During S6A's phase-22 canary on 2026-11-22, fgctl init and repair in a scratch full clone ran `doctor --fix`, which installed per-project systemd user timers for the watcher and the mailbox sync. The watcher then woke a supervisor head in the clone three times, each cancelled within seconds, and the agent had to remove the timers, units and processes by hand. The same thing is live right now for the fixture project /home/vantt/projects/doors-audit-fixture: unit fgos-watcher-e2b8b5cc.timer runs `watcher tick` there every minute, although that fixture has had no commit since 2026-11-21 09:09.

# Done when

A scratch clone, a canary or a fixture can be onboarded without arming live timers. For example, doctor --fix arms the watcher and mailbox timers only when asked, or init takes a flag that marks the checkout scratch. Removing a project, or deleting its checkout, disarms its timers through the same door. `fgos doctor` shows a pointer row for any armed timer whose project path is gone or marked scratch.

# Notes

Related: p-ces4w7vbsi (target reaping), p-6sd4fslxv7 (landed worktree removal).
