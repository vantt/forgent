---
id: p-l54vuzupa5
title: "test-select-mutate leaves a 7 GB mutation checkout under the cargo target of every worktree that runs the full suite (tests, priority high; source: lead:S6A, 2026-11-22 16:20)"
status: proposed
priority: P1
area: tests
created: 2026-11-22
---

# Why

On 2026-11-22 the root disk reached 95-100% three times. In S6A's worktree, `scripts/test-select-mutate.mjs` re-created `mutation-checkout` (about 7.4 GB) under `CARGO_TARGET_DIR` on each full-suite run and never removed it. Together with incremental builds, that worktree grew from 23 to 60 GB in 50 minutes. Every worktree that runs the full suite carries the same copy.

# Done when

The mutation checkout lives in one place, outside every worktree target (or is removed when the run ends), and a second full run reuses or replaces it rather than adding a copy. A test shows the directory gone, or kept at one copy, after a full run.

# Notes

Related: p-6sd4fslxv7 (the land door removes a landed worktree), p-ces4w7vbsi (no reaping verb for target directories outside any worktree), p-qkrdwo5xj6 (nightly mutation workflow selector).
