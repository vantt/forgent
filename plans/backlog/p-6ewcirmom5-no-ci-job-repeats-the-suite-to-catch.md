---
id: p-6ewcirmom5
title: No CI job repeats the suite to catch intermittent races (CI, priority medium; owner 2026-11-13)
status: proposed
priority: P2
area: platform-foundations
created: 2026-11-13
---

# Why

Races such as the mailbox-live-confined lock wait and the Event Store seal window surfaced one red at a time across many days. A self-hosted Windows runner was rejected (dirty state hides clean-runner facts, public-repo risk); a spare Windows box is fine for manual install and activate checks.

# Done when

A scheduled or manual stress job runs the full suite several times in one pass on clean runners and reports every failing test with its count, without blocking merges.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
