---
id: p-gfdhojihyf
title: "The session write door lands a backlog edit that breaks the citation-drift check (session-host, priority high; source: lead:S6A, 2026-11-19, its land was refused because main went red)"
status: proposed
priority: P1
area: session-host
created: 2026-11-19
---

# Why

The secretary's `fgos session write docs/backlog.md` committed and pushed a row that cites discussion-local decision ids (commit 9bab98eb0), which `test/scripts/check-decision-citation-drift.test.mjs` refuses. The door runs no content check, so main turned red and every lead's `fgos land` was refused until the supervisor fixed the row (f61426b92).

# Done when

The write door runs the checks that own the written path (for docs/backlog.md, the citation-drift check) before it commits, and refuses with the findings named; an owning test writes a row citing a local id and shows the door refuses and main is unchanged.

# Notes

Migrated from the legacy backlog table. Original status: proposed.

Recurred 2026-11-26 through the other portfolio door: the supervisor's `fgos land --paths` of
`plans/backlog/p-qu6inz54uz-...md` (a32ae981c) ran no gates (`gatesRun: []`) and cited RUL11 with no gloss, so the
citation-drift gate turned red for every branch land until 29059c9a8 glossed it. The fix should cover both doors
(`session write` and `land --paths`) for the paths a content check owns.
