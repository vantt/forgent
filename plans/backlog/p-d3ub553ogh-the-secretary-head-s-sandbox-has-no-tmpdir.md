---
id: p-d3ub553ogh
title: The secretary head's sandbox has no TMPDIR (agent confinement, priority low)
status: done
priority: P3
area: agent-confinement
created: 2026-11-19
---

# Why

Seen 2026-11-19 on Miu gen 10/11 (release b50f36be): TMPDIR is unset inside the head shape, so she staged files in her scratchpad; tools that need a temp dir may fail. Evidence: supervisor live acceptance of plan 261118-0947.

# Done when

A head launch sets TMPDIR to a private writable temp dir inside its sandbox; a test on the head shape proves it.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
