---
id: p-tpqddlbsk6
title: A SafeRestore verb for a stranded paths land (supervision, git; priority low; lead:OPC review of plan 261118-1045 phase 7, 2026-11-18)
status: dropped
priority: P3
area: git
created: 2026-11-18
---

# Why

`fgos land --paths` refuses `land-paths-push-rejected` when the remote moved after its local commit, and its message tells a human to run raw `git fetch` and `git reset --keep <remote>/<target>`.

# Done when

fgos has one verb that restores the main checkout's trunk to the fetched remote tip after showing the stranded commit, and the refusal names that verb instead of raw git.

# Notes

Migrated from the legacy backlog table. Original status: declined (superseded by p-q2dn2cnzlq: a paths land no longer strands its commit, 2026-11-21).
