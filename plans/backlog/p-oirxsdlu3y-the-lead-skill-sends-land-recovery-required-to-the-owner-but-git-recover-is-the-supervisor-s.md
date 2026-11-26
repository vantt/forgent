---
id: p-oirxsdlu3y
title: "The lead skill sends `land-recovery-required` to the owner, but `git recover` is granted to the supervisor (skills; source: supervisor via mail, 2026-11-26)"
status: proposed
priority: P1
area: supervision
created: 2026-11-26
---

# Why

core/skills/fgos-lead/SKILL.md line 80 says to ask the owner to run fgos git recover on land-recovery-required. The grant for git recover is the supervisor's, so a lead following the skill asked the owner (q-bvvdct5edg) and the system waited on a question the supervisor could answer.

# Done when

land-recovery-required routes to the supervisor and the generated skill surfaces are rebuilt with npm run build:skills; no skill text sends this refusal to the owner. Source-code edit: for the supervisor or a lead, not the secretary.

# Notes

Relayed by the supervisor from the when-to-ask shaper; the secretary has not read the shaper's round directly. Owner order "ghi backlog", 2026-11-26.
