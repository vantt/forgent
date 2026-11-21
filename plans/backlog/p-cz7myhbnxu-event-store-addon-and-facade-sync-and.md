---
id: p-cz7myhbnxu
title: Event Store addon and facade `sync` and `exportJsonl` have no production Node caller left after the native `events` port (Event Store, priority low; needs OPC review)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

Addon `status` and `seal` still have production callers (`seal-coalescing.mjs`, `consumer-event-gate.mjs`, `merge.mjs`; the doctor rows now read the crate in the host); only `sync` and `exportJsonl` are dead. The `clearHotRecord` Node function and its addon binding `hotRecordClear` are dead after the native `lock fence`.

# Done when

The dead addon entries, facade methods and Node wrappers are deleted together with their contract rows, in one change.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
