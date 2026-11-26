---
id: p-kvqp2ih4mf
title: "How many heads and workers run at once follows the machine's measured capacity, through one capacity gate, not a fixed count (supervision, priority high; source: owner decision that concurrency follows measured capacity, in ds-ipvis4jkpc, 2026-11-26 12:18)"
status: proposed
priority: P1
area: supervision
created: 2026-11-26
---

# Why

Owner decision of `plans/discussions/ds-ipvis4jkpc-release-chain-command/DISCUSSION.md` (2026-11-26 12:18): the number of running threads, heads and workers together follows the machine's measured capacity; a fixed number leaves the machine idle when it could work and lets too much start at once at other times. Today `supervisor.maxLeads` is soft (only reported, `supervisor.rs:190`, obeyed from skill prose) and lanes are a fixed `workerSlots.ceiling`. A load guard (loadavg, free memory) was proposed on 2026-11-18 (`7655f4f3e`) and never built. The earlier home of this work, p-tyowvhthul, closed `done` through its other option (a lead waiting on open owner questions holds no slot), so raising concurrency from measured capacity has no row.

# Done when

Admission of a plan and the start of a seat ask one capacity gate, whose inputs (at least provider seats, free memory and free disk, read through the one `/proc` door `packages/process/rust/src/platform/linux.rs`), thresholds and counting of heads are written in the supervision spec; no fixed count decides concurrency; one owning test shows a start refused under measured pressure and allowed when capacity frees.

# Notes

Interface fixed by the ds-ipvis4jkpc decision that concurrency follows measured machine capacity, and §3 row 4 (task-run-cap waits on this row). Incidents that motivate it: OOM kill of head request sockets (p-6htu2ae64o), full root disk (q-pmhxzsfpr7). Related: p-tyowvhthul (done), p-fel4zoytbn, p-4uqiyjwrtd, p-iatzcg2gee.
