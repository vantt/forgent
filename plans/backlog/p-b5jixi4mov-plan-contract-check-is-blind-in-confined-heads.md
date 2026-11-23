---
id: p-b5jixi4mov
title: "Plans written or reviewed by a confined head are checked by no machine: the plan contract check crashes in a confined head, and the land gate's plan check was taken out and not put back (plan contract, priority P1; source: owner order 2026-11-23, report `plans/reports/planner-261123-0724-contract-check-blind-in-confined-heads.md`)"
status: done
priority: P1
area: plan-contract
created: 2026-11-23
---

# Why

Two gaps combine (details in the source report):

1. `node scripts/plan-contract-check.mjs` crashes in a confined head before it reads any plan: `ensureAddonForScript` runs a cargo build into the read-only `target/`. The same crash hits every script that calls it (`plan-contract-check`, `project-agents`, `check-decision-citation-drift`, `check-backlog-reconciliation`, `build-skill-wrappers`, `check-decision-supersession`, `build-domain-registry`).
2. The land gate's plan check was taken out on 2026-11-22 and not put back, although the condition for putting it back is now met.

The planner brief and the plan contract tell a planner to run the check before `ready`, so a confined planner cannot follow its own rule.

# Done when

A confined head can run the plan contract check and every script that shares the addon staging, and the land gate checks plans again, each with one owning proof. The owner asked for a plan to be opened now.

# Notes

Owner order 2026-11-23, confirmed by the owner to the secretary at 07:28.

Also carries p-mtqil2rpyy (Original id counted by the backlog checks; `check-backlog-reconciliation.mjs` is red on main today), folded in by owner approval 2026-11-23 07:4x: same planner and lead. Its reference worktrees and constraints are in that row.
