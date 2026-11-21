---
id: p-xpc327btjz
title: The Work arms and the Work REST and MCP argv still hold their own logic in `bin/fgos.mjs` (Host surface, priority low, left by decision 78)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

The Work verbs `return` (two near-copy branches), `take`, `pick`, `add`/`submit`, `ask`/`answer`, `cleanup` and `goal` decide inside their arms, and `src/verbs/state/edit.mjs:41,48` still carries a node hint. Found at the T9 close; Work is opened by its own council after T9.

# Done when

Each Work verb is a use case that the arm calls with one argument object, `return` has one settle path, and a unit proof owns each.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
