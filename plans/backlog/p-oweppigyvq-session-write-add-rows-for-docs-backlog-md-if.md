---
id: p-oweppigyvq
title: "Session write add-rows for docs/backlog.md, if the portfolio keeps one backlog file (session-host, priority medium; source: plan 261119-1615 phase 4, withdrawn at close 2026-11-19, waiting on the work-data-model discussion)"
status: dropped
priority: P2
area: session-host
created: 2026-11-19
---

# Why

The secretary adds backlog rows through `fgos session write`, which replaces the whole file; a stale copy can drop newer rows. Phase 4 of plan 261119-1615 designed an add-rows mode of the write route (`plans/261119-1615-secretary-capabilities/phase-04-add-rows.md`). It only makes sense if the work-data-model discussion keeps docs/backlog.md as one file.

# Done when

When work-data-model settles the portfolio data shape: either the secretary adds rows without whole-file replace (add-rows mode with an owning test that a concurrent newer row survives), or this row is declined because each row becomes its own file.

# Notes

Migrated from the legacy backlog table. Original status: declined (D-ADR0082 (the portfolio data model) makes each backlog item its own file, so add-rows is not needed; the follow-up is "session write creates one item file", docs/discussions/work-data-model/DISCUSSION.md §7).
