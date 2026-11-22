---
id: p-xmpheuduez
title: "Plan statuses held to the plan-v1 enum (portfolio, priority medium); source: p-mc25x5pfi6, `docs/discussions/work-data-model/DISCUSSION.md` §7 `#task-plan-status`"
status: done
priority: P2
area: portfolio
created: 2026-11-21
---

# Why

Migrate legacy statuses, make `plan-contract-check --all` fail on a bad one, and require `source:` for new plans. The owner still decides the two legacy plans whose status is partial and deferred.

# Done when

`node scripts/plan-contract-check.mjs --all` exits 0.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
