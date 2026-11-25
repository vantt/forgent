---
id: p-gh4e2vqm64
title: "`spawnWithLocks` in `src/holder-lock/index.mjs` loses its only caller when the dead Node execution closure is deleted"
status: proposed
priority: P3
area: holder-lock
created: 2026-11-25
---

# Why

The lead of plan 261122-2108 reported that the phase 8 deletion on branch `delete-dead-node-execution-closure/p08` removes the only caller of `spawnWithLocks` in `src/holder-lock/index.mjs`. The function is outside that plan's footprint, so it stays as dead code.

# Done when

Once phase 8 lands, `rg -n spawnWithLocks src test` shows no caller. The function and the tests that only prove it are then deleted in one change (L10), or a live caller is named here.

# Notes

Found by the lead of plan 261122-2108 during the phase 8 review. Act only after phase 8 lands.
