---
id: p-3sy6timboa
title: Move invocation faults onto the record contract (observe, priority low; L10 rest of the ops-metrics plan)
status: proposed
priority: P3
area: observe
created: 2026-11-21
---

# Why

`.fgos/logs/invocation-faults.jsonl` has two writers (Rust `invocation_fault.rs`, Node `invocation-fault-log.mjs`) and its own line shape; `metrics faults` reads it, and it is the side channel a failed friction write lands in.

# Done when

A fault is a declared kind written through the record door by the Rust writer; the Node writer retires with the last Node verb (its `doors` row); `metrics faults` reads records; the shared vector file stays the one proof of the argv shape.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
