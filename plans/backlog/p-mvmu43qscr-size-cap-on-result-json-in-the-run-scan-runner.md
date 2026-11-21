---
id: p-mvmu43qscr
title: "Size cap on `result.json` in the run scan (runner, priority low); source: HARDEN plan review `plans/reports/review-261118-1850-harden-plan-review.md` Q2 (owner 2026-11-18: move the Additions to backlog); origin: root plan section \"Additions waiting for the owner\", found 2026-10-24"
status: proposed
priority: P3
area: runner
created: 2026-11-18
---

# Why

The scan reads worker-written files with no bound; the unit-summary reader caps at 1 MiB (T3-04a speed S-2).

# Done when

The worst case is bounded under the doctor's 5 s host timeout; one owning proof.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
