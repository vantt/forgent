---
id: p-7y75kf54rh
title: Delete the legacy ledger reader once no ledger entry on disk still needs it
status: proposed
priority: P2
area: workflow
created: 2026-11-21
---

# Why

`src/workflow/legacy-ledger-read.mjs` answers for `unit.complete` entries written before Execution handed up `infrastructure`, and `store.mjs` (`isRerunnable`) falls back to it when the entry has no such field. A newer release does not retire old records: case ledgers already on disk keep their old-shape `unit.complete` entries, and a resumed case reads them. Delete only when a scan of every machine's case ledgers finds no entry without `infrastructure` (or every such case is closed and pruned); then delete the file, its manifest row, `test/workflow/legacy-ledger-read.test.mjs`, the fallback in `isRerunnable`, and the old-shape cases in `test/workflow/workflow-store-ledger.test.mjs` that only it serves.

# Done when

A ledger entry has one shape and Workflow keeps no derivation of Execution's infrastructure fact.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
