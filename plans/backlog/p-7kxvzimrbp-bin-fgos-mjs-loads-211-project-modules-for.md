---
id: p-7kxvzimrbp
title: "`bin/fgos.mjs` loads 211 project modules for every call, `--help` included (Host surface, performance, priority low)"
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

At the T9 close the entry still pulls the whole static import closure (baseline 207 project files); the CPU profile at the baseline put about 60 to 80 ms of an 85 ms import in unused loading. Lazy imports per arm would cut it but change the import shape of every verb.

# Done when

`fgos --help` loads no arm's modules, a unit proof counts the modules, and the change is measured on one load class; owner chooses whether to do it.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
