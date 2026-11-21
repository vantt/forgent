---
id: p-u4gmg3dqfx
title: "Old plans fail `plan-contract-check --all`: 89 plan directories are unreadable to the supervisor (plans, priority medium; source: owner via Miu, 2026-11-21, from the work-data-model lead's criterion 7 question)"
status: proposed
priority: P2
area: plans
created: 2026-11-21
---

# Why

`fgos supervisor plans` lists 89 unreadable plans: some lack front matter (260925-documentation-authority-unification), many carry status values the reader rejects (`complete`, `completed`, `pending`). The owner chose to count criterion 7 of work-data-model as met without these. Fix: list the unreadable plans, map each odd status to the plan-v1 value, repair front matter, and rerun `plan-contract-check --all` green; or retire plans nobody needs.

# Done when

M

# Notes

Migrated from the legacy backlog table. Original status: proposed.
