---
id: p-ol7sca34qj
title: "`withKillTimeout` in `provider-credential-probe.mjs` searches PATH by hand"
status: proposed
priority: P2
area: packaging
created: 2026-11-21
---

# Why

It needs the resolved path of the program it starts, so it keeps its own walk beside `findExecutableOnPath` (`src/runner/paths.mjs`) and `isCommandAvailable`. It should resolve the path through `findExecutableOnPath` so one door answers where a program lives (the other private twin, in the confinement policies, went in the neutral-defaults change).

# Done when

One PATH walk for the runner and the probe; `rg` for a hand-written PATH loop in `src/runner` finds none.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
