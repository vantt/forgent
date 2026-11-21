---
id: p-xqkchdr6iy
title: A live same-user process whose argv cannot be read counts as not fgOS in the quiesce gate (Process, holder-lock, priority medium, gate-contract change)
status: proposed
priority: P2
area: platform-foundations
created: 2026-11-13
---

# Why

`could_be_fgos(Some([]))` in `packages/holder-lock/rust/src/route.rs` returns false, so an argv that stays empty after the exec settle window makes the scan report the workspace clean, a fail-open. Found landing the quiesce-scan CI fix (OPC review, 2026-11-13). The same policy applies to the environment: a live same-user process whose environment stays empty after the settle window is unknown for a check that reads an environment marker, not "no marker" (2026-11-13).

# Done when

The packages/process spec says such a process is unreadable/unknown, not 'not fgOS'; the quiesce route reads it as unreadable (counted in `unreadable`, not clean); one route proof owns it.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
