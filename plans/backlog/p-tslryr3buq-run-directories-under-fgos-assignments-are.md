---
id: p-tslryr3buq
title: Run directories under `.fgos/assignments` are never removed
status: proposed
priority: P2
area: workflow
created: 2026-11-04
---

# Why

Every `fgos run` and dispatch leaves an `asgn_*` or `unit-*` directory; 912 on fg-server2 at the T5 baseline (2026-11-04), 526 on 2026-11-06. `fgos dispatch inspect --cwd .` lists every run and then filters, so its cost grows with the count (5.0 s at 912). Routed by the HARDEN T5 [arbitration](../plans/reports/council-261104-1854-harden-t5-arbitration.md) §4 to Workflow, which owns how long a run's record is needed.

# Done when

A retention rule (age, settled state, still resumable, still referenced by a case) removes only directories nothing can resume or read; it never removes a run whose attempt lock is held; `dispatch inspect --cwd .` stays under 1 s on a machine with that many runs; tests for the rule and for the held-lock case

# Notes

Migrated from the legacy backlog table. Original status: proposed (partly: `fgos workflow prune` and pruning at case close landed on main `ec7d41b43`, `2e3d97acc` and remove finished cases with the Unit runs their ledger names; 2026-11-08: prune removes a case's Unit runs only when the whole case goes; still open: Unit runs of plain `fgos run` (no case) are never removed (waits for the owner's numbers from the measurement recipe in the T6 owner guide), and the `dispatch inspect --cwd .` under 1 s clause is not measured).
