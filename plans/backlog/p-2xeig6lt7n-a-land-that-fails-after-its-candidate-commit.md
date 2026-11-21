---
id: p-2xeig6lt7n
title: A land that fails after its candidate commit but before its WAL chain leaks the candidate (git, priority medium; OPC review of the land-cleanup fix, 2026-11-19)
status: proposed
priority: P2
area: git
created: 2026-11-19
---

# Why

`prepare_land` cleans a pre-commit failure (conflict aborted, HEAD = target); once the --no-ff candidate commit exists a plain removal is refused (HEAD not reachable from a non-fgos ref), so a failure between that commit and `wal.begin` (census, admission) keeps a candidate no chain names and `fgos git recover` never settles it.

# Done when

With no chain for the operation id, the candidate commit is unpublished scratch and is discarded through a no-chain removal path; proven by a Git test that fails prepare between the commit and `wal.begin`.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
