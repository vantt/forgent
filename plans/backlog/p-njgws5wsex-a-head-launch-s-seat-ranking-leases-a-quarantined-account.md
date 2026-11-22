---
id: p-njgws5wsex
title: "A head launch's seat ranking leases a quarantined account, so a head rotation is refused (execution, priority high; source: lead:supervisor via mail, 2026-11-22 22:50)"
status: proposed
priority: P1
area: execution
created: 2026-11-22
---

# Why

The secretary rotation was refused `provider-capacity.lease-conflict` because the seat ranking chose the account claude/tetcu although it was quarantined (`.fgos/runtime/session-rotation/secretary-miu/rotation.log`, line 43). `rank.rs` filters on `quarantined_until`, so the account view given to head launches most likely lacks the quarantine. Workaround in use: tetcu was disabled in `accounts.yaml` until the 00:00 reset.

# Done when

A head launch never ranks or leases a quarantined account, proven by one test at the layer that builds the account view for head launches. The cause is confirmed first (the view lacks the quarantine, not the ranking).

# Notes

Raised by the supervisor through the mailbox; the owner approved adding this row on 2026-11-22.
