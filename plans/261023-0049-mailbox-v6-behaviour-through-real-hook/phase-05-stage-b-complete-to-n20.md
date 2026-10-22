---
phase: 5
title: "Stage B: every cell to 20 valid runs"
status: pending
live_invocations: "570 expected, ceiling as approved"
---

# Phase 5: Stage B

<!-- Updated: Red team 1 - 38 cells, no curtailment, runs from the pinned worktree -->

## Preconditions

Phase 4's gate passed; the owner's answer to question 1 is A or B; the pinned worktree, frozen hashes and CLI versions are those of stage A (a change means a new stage, reported separately, never merged into these cells); `free -g` 8 or more.

## Runs

`run-stage B`: each cell continues from its stage A runs to 20 valid runs (15 more each: 570 expected for 38 cells, 300 under option B's 20 PT cells), stopped early only by its 25-attempt cap ("under N"). Stage A runs count toward N because the pins guarantee nothing measured changed between the stages.

`timeout 86400 node test/live/mailbox-behaviour.live.mjs run-stage B 2>&1 | tee ${TMPDIR:-/tmp}/fgos-work/mailbox-v6/p5-stage-b.log` then `echo "exit=$?"`. The stage may span several sessions; it resumes from its ledger. Every phase 4 stop rule applies unchanged.

## Gate

Every cell at 20 valid runs or flagged "under N"; the human-readable sample of the whole matrix marked by the controller; no stop rule fired, or each one that fired is resolved by the controller and written in the stage summary.

## Sync

Start and end: merge `origin/main` on the branch. Commit the updated `results.jsonl`, stage summary and samples on the branch.
