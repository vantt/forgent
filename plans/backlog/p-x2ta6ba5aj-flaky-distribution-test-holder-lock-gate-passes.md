---
id: p-x2ta6ba5aj
title: "Flaky distribution test: `holder_lock_gate_passes_on_a_local_mount_with_the_real_git` fails a wall-clock budget near 1 s on shared CI runners (packaging-distribution, priority medium; source: lead:WINCUSTODY, 2026-11-21)"
status: proposed
priority: P2
area: packaging-distribution
created: 2026-11-21
---

# Why

On ubuntu-22.04 focused tests, packages/distribution `init::tests::holder_lock_gate_passes_on_a_local_mount_with_the_real_git` panicked with "gate took 1098.8 ms" (run 44878105727) and "gate took 1039.0 ms" (run 44884158383). The test asserts that the gate finishes inside about 1 s of wall clock, which a loaded shared runner exceeds.

# Done when

The test proves the gate's behaviour without a tight wall-clock budget, or the budget comes from the real requirement with margin and its source is named. No retry loop that hides a real slowdown. It passes in 20 consecutive CI runs.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
