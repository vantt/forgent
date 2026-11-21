---
id: p-35qnlm4om2
title: "`resolve_repo` runs the floor probe before it checks whether the directory is a repository at all (Git, priority low)"
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

For an installed release directory (9 `exec` calls today) and any non-repository path the topology check could answer first and spawn nothing; `require_floor` runs before it. Found in the latency research (`research-261115-0255-f0-version-latency-ab.md`). Needs `lead:OPC` review: it touches `fgos-git`.

# Done when

`resolve_repo` checks the topology before `require_floor`; a path that is not a repository spawns no process; the refusal text and fault class stay the same; one proof owns the order.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
