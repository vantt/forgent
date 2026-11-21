---
id: p-y4jpw2klyi
title: "A test lock-holder helper survived 26 hours after its worktree was deleted (tests, priority medium; source: owner 2026-11-18, process 636582 seen while reviewing the OPC lane)"
status: proposed
priority: P2
area: tests
created: 2026-11-18
---

# Why

It was a `node` process running `acquireSync` for the `event-seal` holder lock under `/tmp/fgos-test-run-*`, started from the deleted worktree `watch-p1`, parent init (PID 1), asleep on `setInterval`.

# Done when

A test that starts a lock-holder child always kills it when the test ends, even when the run is interrupted or its worktree is removed; one owning proof; no orphan remains after a killed run.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
