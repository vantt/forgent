---
id: p-taifrvti2x
title: "Dispatch moves onto the write-scope package, so the door row `footprint-write-scope-overlap-rule` has an owner (execution, priority high; source: owner via the manual supervisor, 2026-11-24)"
status: proposed
priority: P1
area: execution
created: 2026-11-24
---

# Why

The door row `footprint-write-scope-overlap-rule` (severity high) says "dispatch moves onto the write-scope package" and names no owner, so the second copy of the overlap rule stays.

# Done when

Dispatch uses the write-scope package for the footprint overlap rule, the second copy is deleted, and the row is removed.

# Notes

Fast path: do not wait for phase 0 of `261124-1026-harden-next-round`. Check first whether `261122-2108-delete-dead-node-execution-closure` already deletes the dispatch code that holds the copy; if it does, point the row at that plan instead of doing the work here.
