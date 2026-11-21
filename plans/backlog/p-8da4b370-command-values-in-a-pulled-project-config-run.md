---
id: p-8da4b370
title: Command values in a pulled project config run without anyone approving them
status: proposed
priority: P2
area: security
created: 2026-11-06
---

# Why

`worktreeSetup.commands`, `invariantChecks.commands` and executor command/args come from the committed project file and run on the next `fgos run` or merge gate (`src/runner/worktree.mjs:142-150`, `src/runner/merge.mjs:1208-1246`). Proposed by the YAML/Config security review (additions 1 and 2): a per-machine approval of the command values' digest (like direnv `allow`), and parking a candidate for a person when its diff touches a `command` key. Runner policy, not part of the Config component. 2026-11-06: widened by the HARDEN T5 red-team finding R-3 (the same pulled file could also turn confinement off and replace executor commands, [report](../plans/reports/council-261104-1840-harden-t5-seat-redteam.md)). The confinement half is closed: a project file may only tighten confinement (`x-fgos-merge: tighten`, `config-confinement-lowered`, `runner.confinementPolicies` global-only; `e0e2e2851`, `8bf114ed4`). Executor `command`/`args` become global-only after each machine moves its values (HARDEN decision 64; branch `harden/t5-p04b`). The digest approval of `worktreeSetup`/`invariantChecks` commands stays open.

# Done when

Changed command values do not run until approved on that machine; a candidate touching a command key is parked, not auto-landed; tests for both.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
