---
id: p-l342hyqutt
title: A pin or prefer entry that names an undeclared invocation is not refused at load, so a rename leaves a dead pin unnoticed (runner, priority medium)
status: proposed
priority: P2
area: config
created: 2026-11-17
---

# Why

Found 2026-11-17 while renaming the herdr invocation ids to `*-herdr-bwrap` (D-ADR0077 (invocation names state their confinement)): the committed `.fgos/config.yaml` still pinned `omp-herdr` in three `prefer` entries, and nothing at config load or in doctor flagged it.

# Done when

A `prefer` entry or a pin whose `invocation` is not declared by its executor is refused by name at config load (or reported by a doctor row), naming the file, line, executor and the missing id.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
