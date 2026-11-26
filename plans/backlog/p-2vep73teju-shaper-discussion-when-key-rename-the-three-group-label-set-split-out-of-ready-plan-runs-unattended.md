---
id: p-2vep73teju
title: "Shaper discussion `when-key-rename`: the three-group label set (workType, sessionType, agentFamily, agentCli, agentLifecycle) split out of ds-que32ftgg6 so a planner can run on it (agent-context-engine, priority high; source: owner via Miu, 2026-11-26 18:2x)"
status: done
priority: P1
area: core
created: 2026-11-26
---

# Why

Discussion ds-que32ftgg6-ready-plan-runs-unattended section 6 ("the new shape of the `when:` label set", its two decisions on the key names and the grouping) renames the keys: `workType` replaces the Work item `kind`, `sessionType` and `agentLifecycle` split today's `kind`, `agentCli` replaces `cli`, `agentFamily` is new, and the `role:` line of `core/agents/*.yaml` becomes `summary`. The owner wants it done soon, but it sits inside a larger discussion whose rule units (U1 to U7) are not settled. ACE (261125-1631) is done on the other machine, so the key registry `when-keys.v1.json` it fixed is now a shipped contract that the rename changes.

# Done when

A separate discussion states the rename on its own: the final key list and values, every caller that moves in the same change (rule units' `when:` lines, `when-keys.v1.json`, the Work item field, `core/agents/*.yaml`, the agent-start-context plan 261122-1946 that cites the keys), and the order against ASC (ASC `blockedBy` the rename). It is settled so a planner can start on it. The old discussion keeps only a reference to the new one.

# Notes

The owner's choice: a new discussion first, the planner runs on it, the old one only points to it. Seed from ds-que32ftgg6 section 6 and its two decisions on the key names and the grouping. The platform rule applies that a change moves every caller and deletes the old names in the same change, and the rule that the result must be better, not bigger.
