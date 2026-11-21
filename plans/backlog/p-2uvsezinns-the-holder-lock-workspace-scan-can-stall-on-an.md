---
id: p-2uvsezinns
title: "The holder-lock workspace scan can stall on an unreachable network share (holder-lock, priority low; source: lead:OPC review of the Windows Git custody plan, relayed by lead:WINCUSTODY, 2026-11-21 21:06)"
status: proposed
priority: P3
area: holder-lock
created: 2026-11-21
---

# Why

`within()` in `packages/holder-lock/rust/src/route.rs` (line 569) canonicalizes every scanned process cwd once per workspace directory. A process whose cwd sits on an unreachable network share makes each canonicalize wait for the network timeout, so the scan becomes slow. It stays safe: the result is still correct.

# Done when

The scan canonicalizes each cwd at most once, and a cwd that cannot be resolved quickly does not hold up the scan; a test proves the bound.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
