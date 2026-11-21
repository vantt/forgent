---
id: p-mw7tpl7rky
title: "Three copies of the Windows Toolhelp process-snapshot loop (process, priority medium; source: lead:OPC review of the Windows Git custody plan, relayed by lead:WINCUSTODY, 2026-11-21 21:06)"
status: proposed
priority: P2
area: process
created: 2026-11-21
---

# Why

The same CreateToolhelp32Snapshot / Process32FirstW / Process32NextW walk over TH32CS_SNAPPROCESS lives in `packages/process/rust/src/platform/windows.rs` `process_ids()` (line 233), `packages/process/rust/src/platform/windows_job.rs` (about line 703) and `packages/holder-lock/rust/src/route/hold.rs` (about line 485). That is one door with three copies. The test helper `apps/fgos/tests/windows_support/mod.rs` and `tools/platform-probe` carry a fourth and a fifth copy; check whether they can share it too.

# Done when

One process-snapshot function in the process crate serves every Windows caller, the copies are deleted in the same change, and the Windows CI job stays green.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
