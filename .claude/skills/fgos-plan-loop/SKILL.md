---
name: fgos-plan-loop
user-invocable: false
description: >-
  Drive a Work-independent, plan-driven implementation track (one that
  matches docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md's
  audit -> cell -> review -> red-team -> fix -> close loop) entirely
  through the real `fgos coordination` CLI doors (`chain`/`run`/`show`)
  and the `standalone-master-coordination-loop` FlowDefinition -- never
  fgOS Work items, claims, `fgos pick/cook/submit`, or a fgos-runner loop.
  Use when a Lead session needs to resume/open/authorize/close a cell on
  a track that a plan.md/phase-NN-*.md pair drives, and independence
  (separate Doer/Reviewer/Red-Team/Fixer dispatches, resumable by a fresh
  process with zero hand-fed chat history) matters. Examples: "resume
  <track> and tell me what's next", "open the next cell for <track>",
  "authorize a fix round for cell <id>", "close cell <id> and report the
  commit".
---

This is a generated thin wrapper (tsk-1qi) -- do not edit directly, edit the source instead.
The real skill content lives at `../../../.agents/skills/fgos-plan-loop/SKILL.md`, this project's own canonical skill source.
Read that file and follow it directly.
