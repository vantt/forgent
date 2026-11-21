---
id: p-hcwmgb6gkg
title: "Drop holder-lock's unix refusal of `BorrowStdio::Files` at `port.rs:951` (holder-lock, priority low); source: HARDEN plan review `plans/reports/review-261118-1850-harden-plan-review.md` Q2 (owner 2026-11-18: move the Additions to backlog); origin: root plan section \"Additions waiting for the owner\", found 2026-10-24"
status: proposed
priority: P3
area: holder-lock
created: 2026-11-18
---

# Why

The no-fork spawn door now accepts caller-given stdio files, so the refusal is stale.

# Done when

One refusal less; borrowers can redirect output; one owning proof.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
