---
id: p-5zazr53vd2
title: The process scan's exec-window retry is per process and the scan is serial (Process, priority low)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-13
---

# Why

`read_cmdline` in `packages/process/rust/src/platform/linux.rs` re-reads `/proc/<pid>/cmdline` for up to 250 ms when a live process with a readable exe shows an empty argv, so N such same-user processes cost N x 250 ms in one scan. Found landing the quiesce-scan CI fix (OPC review, 2026-11-13). The same settle now also rereads an empty environment (`read_settled` covers `environ`), so a live process started with an empty environment (`env -i`) costs one settle window per scan whenever the filter asks for environment keys (2026-11-13).

# Done when

One per-scan deadline bounds the retries, or a second pass over the empty ones runs after the first full pass; a scan with many empty-argv processes waits at most one settle window; a unit proof owns it.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
