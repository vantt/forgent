---
id: p-qkrdwo5xj6
title: The nightly mutation workflow (`selector-nightly`, job "Nightly Fault Injection and Coverage") has failed at its "Run mutation tests" step every night since 2026-11-11 (CI, priority medium)
status: proposed
priority: P2
area: platform-foundations
created: 2026-11-11
---

# Why

The failing runs are 62eda3ac6 (11-11), 645f9c116 (11-12), e25203919 (11-13) and ba500c323 (11-14). In the 11-14 log the first mutant (`m-edit-1`, `src/verbs/state/edit.mjs`) fails before any test runs: `createVerifyCheckout` (`src/runner/worktree.mjs:1390`, called from `scripts/test-select-mutate.mjs:60`) throws `WorktreeError` `git worktree add --detach /tmp/fgos-worktrees/verify-* HEAD failed` on the runner. The cause is not yet proven (the log is cut at the Git error). No regression gate watches it, so a red night looks like noise.

# Done when

The nightly passes, or the cause is named in this row and the workflow is fixed or retired by decision; a red night then blocks the next release cut.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
