---
id: p-3ha3yzzsdl
title: "Move the remaining `spawn_with_fds` callers (gate agent spawn, steps runner, herdr driver) to `spawn_mapped` (process, priority low); source: HARDEN plan review `plans/reports/review-261118-1850-harden-plan-review.md` Q2 (owner 2026-11-18: move the Additions to backlog); origin: root plan section \"Additions waiting for the owner\", found 2026-10-24"
status: proposed
priority: P3
area: process
created: 2026-11-18
---

# Why

They still fork; their callers are small so the gain is small.

# Done when

One spawn door instead of two (one-door rule); the old door is deleted in the same change.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
