---
id: p-f367pplkhu
title: "`fgos-cook` and `fgos workflow propose` never run the plan-contract check when fgOS takes over a foreign plan (workflow, priority medium; source: the workflow-engine discussion's audit, owner via Miu, 2026-11-21)"
status: proposed
priority: P2
area: workflow
created: 2026-11-21
---

# Why

The plan contract `core/skills/_shared/plan-contract.md` is injected before planning, and `scripts/plan-contract-check.mjs` verifies it, but nothing calls the check when fgOS takes a plan over (`src/portfolio/plan-sections.mjs` is read only by the check script). A foreign plan that breaks the contract is caught only if someone runs the script, or by a propose refusal (`plan-missing`, `write-overlap`, `slice-cycle`, `guide-activity-missing`) that does not say "contract" or tell the foreign planner what to adjust. See docs/discussions/workflow-engine/DISCUSSION.md §1 (12:00).

# Done when

The takeover path runs the existing plan-contract check (one door, no second checker) before slicing, and a contract failure names the broken rule and what the plan must change. An owning test feeds propose a plan that breaks the contract and gets that answer.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
