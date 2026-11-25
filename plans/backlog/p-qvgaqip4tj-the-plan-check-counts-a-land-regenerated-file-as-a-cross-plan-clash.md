---
id: p-qvgaqip4tj
title: "The plan check counts a file the land door regenerates as a cross-plan footprint clash (plan contract; source: owner answer q-zw4htizjz2, 2026-11-25)"
status: proposed
priority: P2
area: plan-contract
created: 2026-11-25
---

# Why

`node scripts/plan-contract-check.mjs` refused `ready` for the P1 land-gate fix
(`plans/261124-1945-run-tests-fgos-leak-check`) only because it and a running plan both named
`packages/git/contracts/mutation-census.v1.json`. The land door regenerates that file before
its gates (`land.regenerate.files` in `.fgos/config.yaml`), so two plans naming it never
conflict on a merge. Every plan that edits `scripts/` meets the same refusal.

# Done when

The cross-plan overlap check leaves out the files listed in `land.regenerate.files`, read
from the effective config, and still counts every other shared path; the plan contract
states it. Plan: `plans/261125-1259-plan-check-regenerated-census/plan.md`.

# Notes

The owner chose this option in q-zw4htizjz2. The land-gate fix itself no longer waits on it:
it dropped the census from its footprint, since the land regenerates it anyway.
