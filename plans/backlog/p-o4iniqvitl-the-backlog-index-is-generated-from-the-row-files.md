---
id: p-o4iniqvitl
title: "plans/backlog.md becomes a generated index, never hand-edited (backlog, priority P1; owner choice A, 2026-11-25 15:20, via the manual supervisor and confirmed to the secretary 15:50)"
status: proposed
priority: P1
area: backlog
created: 2026-11-25
---

# Why

Backlog commits were the largest remaining writer on main since 14:40 (5 of 14), and every row rewrites the 538-line shared index, so the file is hot and conflicts.

# Done when

The index lines come from the row files in `plans/backlog/*.md` (ID, title, status, priority, area from the frontmatter) and the Citing column from the plans whose `source` cites the row. A script renders it, at land time or on demand. Adding a row lands exactly one new file. The old write path (session-write grants on `plans/backlog.md`) is retired in the same change.

# Notes

Reuse or retire: owner decision 2026-11-23 q-nudu6zlusf (row p-dw3h5wscns, done), owner decision 2026-11-24 q-3rhc6lroqc, `scripts/check-backlog-reconciliation.mjs`, `src/session-host/head-start.mjs`, `src/runner/merge.mjs`. Do not change the row file format. Do not move backlog into the event store here: that belongs to ds-ubqlutna6r.
