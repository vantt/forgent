---
id: p-q2dn2cnzlq
title: "A head's write or plan land leaves a commit on local main that is never pushed, and every later land is refused `land-target-ahead` (git, priority high; source: owner via Miu, 2026-11-21; hit twice in one day)"
status: done
priority: P1
area: git
created: 2026-11-21
---

# Why

Commit 9ee4b097a (a lead's plan.md park, 2026-11-20 16:48) and commit 9469a4b57 (`docs(head:supervisor-forgent): write docs/backlog.md`, written through the head write door, 2026-11-21) both stayed on the main checkout's local main without reaching origin. Every `fgos land` after them was refused `land-target-ahead` (a work-data-model phase was parked for it, and the cores phase 4 land waited) until the supervisor pushed by hand. Cause not yet proven: which door leaves the commit (`session write`, `land --paths`, or the land door interrupted when the disk was full) and why its push step does not follow.

# Done when

The cause is proven by naming the door and the step. A head write, or a `land --paths`, either ends with the commit on origin/main or leaves local main unchanged, never ahead. A later head's `fgos land` succeeds with no hand push, and an owning test shows exactly that: a head write followed by another head's land. If a push can fail, the door reports it and its own verb retries it; nothing is left for a later land to trip on.

# Notes

Migrated from the legacy backlog table. Original status: done (plan 261121-0747-land-door-hygiene, commit e7701dcfc: a rejected paths land undoes its own unpublished commit and retries from a fresh sync).
