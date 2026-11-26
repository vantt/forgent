---
id: p-qu6inz54uz
title: "Rename the overloaded `kind` fields by subject: `workType` for the kind of work, and ACE's start `kind` split into `agentRole` and `agentLifecycle` (ACE, domain registry, Work; source: owner via shaper of ds-que32ftgg6, 2026-11-26 16:29 and 16:40)"
status: proposed
priority: P2
area: agent-context-engine
created: 2026-11-26
---

# Why

`kind` names many different things across the repo (136 contract files: executor, path, event, observation and start kinds), so a reader cannot tell which meaning a `kind` carries. The owner set the direction in discussion `ds-que32ftgg6` round 11:

- `workType` (agreed) names the kind of work: the ACE `when:` key and the Work item / initiative field.
- ACE's start `kind` (`head`, `worker`, `setup`, `hook`) mixes two categories and splits into `agentRole` (`head`, `worker`) and `agentLifecycle` (the moment: `setup`, `hook`, and presumably the session start). `launch` was rejected as unclear.
- `agentFamily` (owner, round 12, 17:00) replaces ACE's `cli` key (claude, codex, agy, pi, omp), matching the runner's existing word "family". Three levels stay apart: agentFamily (which agent CLI), executor (one concrete way to run that family, e.g. `claude-cli-bwrap`), model (the model the family uses at a tier).

`type` and `job` are taken (pkm `type`, JSON-schema `type`; authority door rows `job:` in 83 files), and `task` is a work-kind value and the `tsk-` prefix.

# Done when

A shaped decision fixes the new names and how `agentRole` sits beside ACE's existing `role` key (lead, producer, reviewer) and `persona` key, which may already cover it; then one change renames each field in its contract and moves every reader (L10).

# Notes

Source: `plans/discussions/ds-que32ftgg6-ready-plan-runs-unattended/DISCUSSION.md` §3 rows 15 and 17. It crosses ACE, the domain registry and the Work layer, so it is outside that discussion's scope and goes in its own item (RUL11 (mess seen outside the work in hand becomes a separate item)). The shaper raised it as a coordination-help event because it cannot write the backlog and could not reach the secretary.
