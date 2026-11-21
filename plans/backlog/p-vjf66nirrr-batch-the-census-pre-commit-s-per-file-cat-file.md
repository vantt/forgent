---
id: p-vjf66nirrr
title: "Batch the census pre-commit's per-file `cat-file` into one `cat-file --batch` (git, priority low); source: HARDEN plan review `plans/reports/review-261118-1850-harden-plan-review.md` Q2 (owner 2026-11-18: move the Additions to backlog); origin: root plan section \"Additions waiting for the owner\", found 2026-10-24"
status: proposed
priority: P3
area: git
created: 2026-11-18
---

# Why

One git child per staged covered file; a rename sweep of hundreds of files spawns that many.

# Done when

One git child per commit.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
