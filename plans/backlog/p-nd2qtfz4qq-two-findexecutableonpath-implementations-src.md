---
id: p-nd2qtfz4qq
title: Two `findExecutableOnPath` implementations (`src/state/tool-registry.mjs`, `src/runner/paths.mjs`) answer the same question
status: done
priority: P2
area: config
created: 2026-11-15
---

# Why

Found by the Node door cutover. Closed 2026-11-15: the capability-reads change deleted `src/state/tool-registry.mjs` with the `fgos tool` verb, so only `src/runner/paths.mjs` defines it, and tool presence is probed through it by `toolProvidersOf`.

# Done when

One implementation behind one door that both Node callers use; the duplicates and their tests are deleted with it.

# Notes

Migrated from the legacy backlog table. Original status: done.
