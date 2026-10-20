---
name: fgos-cook
user-invocable: false
description: >-
  Entry for delivering a whole plan written by AgentKit's `ak:plan` (a plan.md
  with phase files): reads all of it, opens a conductor case on the coding guide
  with a frame the owner approves, then picks slices one at a time, dispatches
  them through `fgos run` / `fgos workflow` naming the case, checks every result
  itself, judges review findings, adapts, integrates on one branch and reports.
  Use for "run this plan", "cook this plan", "deliver phases 1-3 of <plan>". Not
  for one ad-hoc task or a single phase to run as-is (use `fgos-run`), not the
  `/fgOS:deliver` Work-item command, and not AgentKit's own `ak:cook`, which
  runs inside a worker. Never edits product code itself and never merges.
---

This is a generated thin wrapper (tsk-1qi) -- do not edit directly, edit the source instead.
The real skill content lives at `../../../.agents/skills/fgos-cook/SKILL.md`, an assembled projection whose generated header identifies its canonical source.
Read that file and follow it directly.
