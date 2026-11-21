---
id: p-fdw5nlu3ev
title: The bwrap gate-pid report is read by polling (Process, priority low)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-13
---

# Why

Since the report goes into a memfd (`packages/process/rust/src/containment/linux.rs`, `read_child_pid`), the driver rereads the file every 500 us until the pid parses or bwrap exits; nothing wakes it when bwrap writes. Raised by OPC reviewing the memfd fix, 2026-11-13.

# Done when

The driver waits on a wake (for example a pidfd of bwrap, or an eventfd bwrap signals) instead of a fixed poll, with the same timeout and the same `bwrap ended without reporting a gate pid` error; the containment proof that kills the caller before the report still passes.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
