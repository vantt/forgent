---
id: p-nyqgn6nfwl
title: "`cargo clippy -D warnings` is already red on main in the supervision crate (supervision, priority P1; source: lead of plan 261122-0056 via the help queue, 2026-11-26; report `plans/261122-0056-orchestration-skeleton/reports/lead-261126-1653-wave-1-status.md`)"
status: proposed
priority: P1
area: supervision
created: 2026-11-26
---

# Why

The Keeper lead found two clippy errors on main that no phase of its plan owns: `packages/supervision/rust/src/land.rs:755` (collapsible_if) and `packages/supervision/rust/tests/queue.rs:413` (redundant clone). Every unit whose Verify list runs clippy with `-D warnings` on that crate now fails on code it did not touch, and the gate that let them land did not catch it.

# Done when

Clippy with `-D warnings` is clean on main for the supervision crate, and the land gate or CI runs the same clippy command so the next warning is refused before it lands.

# Notes

Raised by the Keeper lead (plan 261122-0056) as out of its plan scope in help event 3ad2caf1cb1c3171; recorded by the supervisor.
