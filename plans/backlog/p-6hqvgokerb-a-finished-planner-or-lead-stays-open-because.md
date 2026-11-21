---
id: p-6hqvgokerb
title: "A finished planner or lead stays open because the stop rule waits for a status the plan never reaches (supervisor, priority medium; source: owner, 2026-11-21 22:50, \"những gì xong sao không đóng vậy?\")"
status: proposed
priority: P2
area: supervisor
created: 2026-11-21
---

# Why

`core/skills/fgos-supervisor/SKILL.md` stops a planner "once its plan is `ready`", but planners now land their plan as `draft` for the owner's approval, so the stop never fires: `head:planner-component-authority` stayed idle after both of its draft plans landed (261121-2109, 261121-2110) until lead:SUPERVISOR stopped it at 22:50. Leads started by hand (for example lead:WINCI, plan 261121-1456 done at 27f530a3f) hold a short role, not a `head:` role, so `session stop` refuses them and nothing closes their tab.

# Done when

A planner is stopped as soon as its plan lands, whether as `draft` or `ready`, and every lead whose plan is `done` is closed by the same door whatever role name it holds; a fixture shows both closed within one wake.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
