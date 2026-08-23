---
name: fgos-fanout
user-invocable: false
description: >-
  Run N already-decomposed children of one item concurrently instead of one
  at a time. Given a parent id and a candidate set (children of that
  parent, or a milestone's targets), waves the candidates through
  computeSchedule, asks the engine for worker-slot room, then fires a
  batch of up to 5 Agents each running /fgOS:pick end to end, reads live
  state back (never an Agent's own narration), self-recovers from recoverable
  worktree-isolation races, and auto-approves each leaf that reaches
  awaiting-approval — except one whose title/description trips a hard-gate
  risk keyword, which still needs a person. Loops until no open child remains.
  Never touches the parent's own gate; that always still asks. Use when a
  decomposed item's children are independent (no unmet mutual deps) and worth
  running in parallel instead of the sequential default. Examples: "fan out these
  children", "run this parent item's split concurrently", "dispatch this
  candidate set".
---

This is a generated thin wrapper (tsk-1qi) -- do not edit directly, edit the source instead.
The real skill content lives at `../../../.agents/skills/fgos-fanout/SKILL.md`, this project's own canonical skill source.
Read that file and follow it directly.
