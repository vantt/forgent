---
id: p-vhjsoaicy5
title: Node scripts read process start time from `/proc/<pid>/stat` field 22 themselves (one door, priority low)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

`scripts/lib/mailbox-live-confined.mjs:364` (its `split(') ')` also breaks on a comm containing `) `) and `scripts/record-mailbox-hook-fixtures.mjs:437`, `:897` read start time outside the process door; the process-identity doors row has no Linux pattern, so they pass unseen.

# Done when

They take the start time from the process door's `observe`, and the process-identity row gains a Linux pattern with no debt for them.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
