---
phase: 4
title: "Stage A: baselines and 5 runs of every cell"
status: pending
live_invocations: 200
---

# Phase 4: Stage A

<!-- Updated: Red team 1 - stop rules consistent with the cell cap; host check by planted sentinels and the login source only; absolute gate to stage B -->

## Preconditions

- **Owner question 1 answered** with option A (this phase and phase 5), B (only the PT cells), C (only the Claude Code cells now) or D (this phase only, then stop and ask). Without an answer nothing here runs.
- Gates G-SAFE (phase 1) and phase 3 green; `pin` written; the suite runs from the pinned worktree; `free -g` 8 or more.
- W2 present for the Codex cells; otherwise only the Claude Code cells run and the report says so.

## Runs

`run-stage A`: the 10 Q0 runs (5 per CLI) first, then 5 valid runs of each of the 38 cells (190), in the interleaved order of phase 3. Expected 200 invocations; extra attempts only from exclusions and errors, each cell capped at its 25 attempts, all under the approved ceiling. One CLI at a time.

`timeout 36000 node test/live/mailbox-behaviour.live.mjs run-stage A 2>&1 | tee ${TMPDIR:-/tmp}/fgos-work/mailbox-v6/p4-stage-a.log` then `echo "exit=$?"`. The stage resumes from its ledger when restarted.

## Automatic stop rules (pre-registered in phase 2; evaluated after each round and at the end)

The stage stops, writes the reason and waits for the controller when any of these holds:

1. **Safety**: after a run, a planted sentinel outside the run directory (one in the base, one in a sibling run directory, one in a scratch host directory, and the repository's tracked files by `git status --porcelain` of the pinned worktree) changed. Files other writers on this machine change (the owner's `~/.claude` history, caches) are not checked: the sandbox cannot write them, which phase 1's tests prove.
2. **Login**: the login guard set a copy aside, or the source stayed stale for 2 hours.
3. **Pins**: a CLI version, the host binary or a frozen file changed.
4. **Systematic delivery failure**: after stage A, more than half of one CLI's ST cells, or any PT cell, have exclusions above 20 percent of their attempts. ST alone failing stops only the ST cells of that CLI, and the controller reports it to the owner (option B of question 1 becomes the fallback). A single cell that reaches its 25-attempt cap is not a stop: it ends "under N".
5. **Baseline**: any Q0 run acted (the LR oracle is then not valid for that CLI).
6. **Oracle**: in this stage's human-readable sample, the controller marks more than one run `disagree`.
7. **Memory**: available memory under 8 GB before a run (wait up to 30 minutes, checking every minute, then stop).
8. **Ceiling**: the ledger reaches the approved ceiling.

A harmful or negative acted run is **not** a stop rule: it is the measured result, and the cell continues to 20 so the rate is known. It is reported at once to the controller in the stage summary.

## Stage A summary (written by `report --stage A`)

Per cell: attempts, valid, acted, outcome counts, Wilson interval (labelled "N=5, no verdict"); Q0 results; measured wall time per run for each CLI; Claude Code and Codex token ranges per run from the recorded usage (the first measured Codex numbers); ST exclusion rates; a projection of stage B's wall time and invocations from these measured numbers; the sample file for the controller.

## Gate to phase 5

No stop rule fired, and the owner's answer to question 1 covers phase 5 (A or B). With option D, stop here and send the stage A summary to the owner with a new budget question. Stage B starts only when its projected invocations stay within the approved ceiling and its projected wall time from the measured per-run times stays at or below 24 hours; otherwise stop and ask (leaving the approved frame).

## Sync

Start and end: merge `origin/main` on the branch (the pinned worktree is not touched). Commit `results.jsonl`, the stage summary and the sample file under `plans/261023-0049-mailbox-v6-behaviour-through-real-hook/reports/` on the branch.
