---
id: p-x6xff73pgh
title: "A unit started in a worktree that already has uncommitted changes never commits: the runner credits the pre-launch changes to nobody and answers verdict-inconclusive (runner, priority P1; source: lead of plan 261122-0056 via the help queue, 2026-11-26; report `plans/261122-0056-orchestration-skeleton/reports/lead-261126-1653-wave-1-status.md`)"
status: proposed
priority: P1
area: runner
created: 2026-11-26
---

# Why

Keeper phase 1: the first worker hit the 10 MB output limit mid-run and left its edits uncommitted. Every later unit in that worktree got verdict-inconclusive with `evidence.changedFiles` empty, because the runner attributes dirt present at launch to no unit, so a passing round never commits. The lead had to save the diff as a patch and plan a fresh worktree to resume. Any interrupted unit leaves its worktree in this state, so the cost repeats on every crash or limit stop.

# Done when

A unit started over pre-existing uncommitted changes in its declared `writes` either takes them over explicitly (recorded in the unit's evidence and committed after a passing round) or is refused at launch with a named code that tells the lead how to resume; it never runs to a verdict that can never commit.

# Notes

Raised by the Keeper lead (plan 261122-0056) as out of its plan scope in help event 3ad2caf1cb1c3171; recorded by the supervisor.
