---
id: p-ls4tuvflrd
title: The opt-in shell integration still runs a project's own `.fgos/installation/bin/fgos`
status: proposed
priority: P2
area: packaging-distribution
created: 2026-11-09
---

# Why

`scripts/fgos-shell-integration.sh` (sourced by hand from a source checkout's rc file) resolves tier 0 to `$root/.fgos/installation/bin/fgos` and runs it when its real path stays under `.fgos/installation`; a cloned repository can commit that file with its exec bit. The `fgos` launcher on PATH stopped doing this on 2026-11-09.

# Done when

Tier 0 runs the release the machine store holds for the project's activation (the launcher's rule: strict digest, absolute state root) or is removed, and a committed shim is refused with one test in `test/scripts/fgos-shell-integration.test.mjs`

# Notes

Migrated from the legacy backlog table. Original status: proposed.
