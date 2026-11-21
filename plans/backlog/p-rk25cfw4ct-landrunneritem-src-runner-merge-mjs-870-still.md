---
id: p-rk25cfw4ct
title: "`landRunnerItem` (`src/runner/merge.mjs:870`) still lands through its own path instead of the landing use case (runner, supervision; priority medium; L10 debt left by plan 261118-1045)"
status: proposed
priority: P2
area: runner
created: 2026-11-21
---

# Why

`fgos land` composes the Git ports in `packages/supervision/rust/src/land.rs`; the runner's Work-item merge keeps a second landing path.

# Done when

`landRunnerItem` calls the landing use case and its own path is deleted in the same change, with every caller moved.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
