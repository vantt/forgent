---
id: p-l5qm6qo5zu
title: Retire the v1 `Observation` and `ObservationSource` once `WorkSource` moves (observe, priority low; when the Work layer resumes)
status: proposed
priority: P3
area: observe
created: 2026-11-21
---

# Why

Observe has two read shapes: the v1 `observe.observation.v1` with `ObservationSource` (`packages/observe/rust/src/contract.rs`), still used by `WorkSource` and the older `metrics` verbs, and the v2 record with `RecordSource`. The run sources already reach queries as v2 records.

# Done when

`WorkSource` and every v1 reader project v2 records through `RecordSource`; `Observation`, `ObservationSource` and `observe.observation.v1.json` are deleted in the same change with their tests (L10); `cargo test --workspace` and `npm test` are green.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
