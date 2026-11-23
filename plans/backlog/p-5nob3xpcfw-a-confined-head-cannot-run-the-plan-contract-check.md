---
id: p-5nob3xpcfw
title: "A confined head cannot run the plan contract check: the script door always builds the addon into a read-only target (scripts, priority high; source: owner 2026-11-23, plans/reports/planner-261123-0724-contract-check-blind-in-confined-heads.md)"
status: proposed
priority: P1
area: scripts
created: 2026-11-23
---

# Why

A planner head is told to run `node scripts/plan-contract-check.mjs` before a plan is `ready`. In a confined head this
crashes before it reads any plan, because `ensureAddonForScript` always runs `cargo build` into `target/`, which is
read-only there. The same happens to six other repository scripts. The land gate that would catch a broken plan is
held off as well (`14287de27`). Together this means plans written by confined heads go unchecked. The owner called it
out on 2026-11-23: "plan mù à, việc này phải nghiêm túc coi lại".

# Done when

A confined head with a fresh staged addon runs the plan contract check with no env set by hand and gets a real answer.
A stale addon that cannot be rebuilt fails with a named cause. There is one reuse-or-build door in
`scripts/lib/git-addon-stage.mjs`, and an owning test covers both cases.

# Notes

Plan: `plans/261123-0726-contract-check-in-confined-heads`. The land gate restore stays with
`261122-0118-heads-stable-and-able` phase 3 and follows this fix.
