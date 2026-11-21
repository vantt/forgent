---
id: p-bkmh4egqlv
title: Retire the doctor row `shell-integration-sourced` when the `fgos setup` fallback window closes
status: done
priority: P2
area: packaging-distribution
created: 2026-11-16
---

# Why

The row checks the rc source line that deprecated `fgos setup` writes; the doctor readiness-only change kept it only until that window ends (a release install runs through the `fgos` launcher that `project-fgos-launcher` owns, and a source checkout uses the sourced helper). Closed 2026-11-16: `fgos setup` is retired and the row is gone (S4).

# Done when

The row and its inventory entries are removed in the same change that removes the legacy `fgos setup` shell integration; `fgos doctor` reports nothing about rc files afterwards

# Notes

Migrated from the legacy backlog table. Original status: done.
