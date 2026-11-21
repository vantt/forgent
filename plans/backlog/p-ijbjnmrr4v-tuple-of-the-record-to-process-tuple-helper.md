---
id: p-ijbjnmrr4v
title: "`tuple_of`, the record-to-process-tuple helper, exists in three places (one-door, priority low; needs OPC review)"
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

`apps/fgos/src/wiring/gateway_control.rs`, `packages/git/node-addon/src/process.rs:89` and a looser one in `run-supervisor` `terminal.rs:464`.

# Done when

One `facts::Record::tuple_here()` (or equivalent) in `fgos-process`; all three callers use it; a `doors` row on the body.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
