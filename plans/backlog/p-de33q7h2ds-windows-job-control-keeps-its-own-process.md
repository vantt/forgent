---
id: p-de33q7h2ds
title: Windows job control keeps its own process-handle open and creation-time read (one door, priority low)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

`packages/process/rust/src/windows_job.rs` has `open_for_wait` and `creation_time`, a second copy of what `WaitHandle` on the crate's `ProcessHandle` now does (`windows.rs`). Merging was too large for the process-facts phase.

# Done when

`windows_job.rs` uses `WaitHandle`/`ProcessHandle`; the copies are deleted; Windows CI runs the job tests green.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
