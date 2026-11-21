---
id: p-ekqtvofdoh
title: "The supervisor's admission marks a plan running without `base` or `lead`, so plan-contract-check fails (supervision, priority medium; source: supervisor, 2026-11-20, plan 261119-1730-supervision-powers-cores admitted in 2bc1ed73f)"
status: proposed
priority: P2
area: supervision
created: 2026-11-20
---

# Why

Step 1 of "Admit ready plans" in `core/skills/fgos-supervisor/SKILL.md` lands only `status: running`. plan-v1 requires a `base` sha for a ready or running plan and names its lead with `lead:`; main then fails the contract check until the lead writes them, and a `running` plan with no `lead` reads as `leadUnnamed`, which the same skill says never to restart.

# Done when

The admission writes `status: running`, `lead: <the head role it starts>` and `base: <the trunk sha it admits at>` in one land, so the admitted plan passes plan-contract-check; an owning check on the supervisor's admission (or the land door's plan check) proves it.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
