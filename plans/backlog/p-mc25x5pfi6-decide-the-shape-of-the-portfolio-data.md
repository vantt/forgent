---
id: p-mc25x5pfi6
title: "Decide the shape of the portfolio data (supervisor, priority medium; source: owner 2026-11-19, `docs/discussions/secretary-supervisor-powers/DISCUSSION.md` §3 row 13, branch shape/secretary-supervisor-powers)"
status: done
priority: P2
area: supervisor
created: 2026-11-19
---

# Why

Today docs/backlog.md is one 356 KB table of 277 rows with about 18 Status spellings, and the 134 plan dirs use about 17 status spellings. Questions: should each backlog row be its own file with uniform frontmatter and a generated index, what fixed status list to use, how to check plan status against the plan-v1 enum, and where authored state lives versus the Event Store. Prior art: `plans/261117-1430-portfolio-driving-draft` (parked by the owner 2026-11-17 because it touches Work) and its `reports/council-final-recommendation.md`.

# Done when

A shaper discussion with the owner settles the data shape and the status list, with a written advice; any follow-up work (split, migration, status check) becomes its own row; the decision on plan 261119-1615-secretary-capabilities phase 4 follows from it.

# Notes

Migrated from the legacy backlog table. Original status: done (settled as D-ADR0082 (the portfolio data model), 9aaf712f8).
