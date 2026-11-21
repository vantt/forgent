---
id: p-56oslt7ejt
title: "The lead skill does not say how a lead picks the worker that fits each task (supervisor, priority medium; source: owner via Miu, 2026-11-21)"
status: proposed
priority: P2
area: supervisor
created: 2026-11-21
---

# Why

The owner's principle: a lead coordinates the whole plan and does not do the plan's work; it starts and stops workers (a sub-agent or a pane, either is fine) and must start the worker that fits each task it hands out; the aim is to save tokens and keep the lead clear-headed. What exists: the lead persona holds `run`, `land`, `worktree create` and `request result` and no `session start`; the skill starts each phase with `fgos run ... --provider <id> --capability <purpose>` and reviews with a `code-reviewer` subagent (`.agents/skills/fgos-lead/SKILL.md`, `src/session-host/head-grants.mjs`). What is missing: no rule or evidence for choosing `<id>` and `<purpose>` per phase (tier, family, task kind), so the choice is left to each lead's own guess; the persona text also frames the lead as a crew lead who runs the planned steps. Not decided: whether a lead may start a session or pane worker itself, or stays on `fgos run` units.

# Done when

The lead skill states how a worker is chosen per phase (from the task kind and tier of the plan, through the existing capacity selection, no new mechanism) and keeps the lead out of implementing; an owning test or a recorded live run shows a lead handing a phase to a worker chosen by that rule.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
