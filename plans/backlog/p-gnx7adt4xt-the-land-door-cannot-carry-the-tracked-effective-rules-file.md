---
id: p-gnx7adt4xt
title: "The land door refuses every branch that carries the tracked `.fgos/instructions/effective/rules.json`, so rule-unit phases land only by hand (git / write-scope, priority P1; source: lead of plan 261127-0151, 2026-11-28)"
status: proposed
priority: P1
area: git
created: 2026-11-28
---

# Why

A phase that adds or changes a rule unit regenerates `.fgos/instructions/effective/rules.json`, a tracked file. The land door refuses such a branch with `land-outside-footprint`, because `packages/write-scope/src/lib.rs` (around line 167) puts every `.fgos` path outside any write scope, even when the plan's footprint names the file. Inside a worker worktree the file is also skip-worktree, so a confined unit cannot commit it at all. Plan 261127-0144 phase 1 and plan 261127-0151 phase 1 could land only after lead:SUPERVISOR committed the file and landed the branch by hand.

# Done when

A lead lands a branch whose footprint names `.fgos/instructions/effective/rules.json` through the normal land door, with the regenerated file committed by the unit, and no hand landing is needed.

# Notes

Related: plans `261127-0144-when-to-ask-owner-rule` and `261127-0151-ready-plan-runs-unattended` (both phase 1 landed by hand).
