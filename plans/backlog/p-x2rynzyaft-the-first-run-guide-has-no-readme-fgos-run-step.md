---
id: p-x2rynzyaft
title: The first-run guide has no README `fgos run` step to pin
status: done
priority: P2
area: packaging-distribution
created: 2026-11-12
---

# Why

`test/cli/first-run-guide.test.mjs` pins the install command, `fgctl init` and `fgos run "<prompt>"` across the `fgos` and `fgctl` no-argument guides, and the install command and `fgctl init` in `README.md`; the README does not yet show the `fgos run` step. Closed 2026-11-12: the README's first-contact rewrite added the run step and the README check now covers all three commands and the retired `fgos setup` and npm install.

# Done when

The three first-run guides (`fgos`, `fgctl`, README) cannot drift: one test fails when any differs.

# Notes

Migrated from the legacy backlog table. Original status: done.
