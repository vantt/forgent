---
id: p-be6b5abe
title: "`fgos setup` writes this repository's own test command as the invariant check into every project"
status: done
priority: P2
area: config
created: 2026-10-22
---

# Why

`DEFAULT_INVARIANT_CHECK_COMMANDS` (`src/config/shared-config-file.mjs`, since deleted) is `node --test test/architecture.test.mjs`; setup writes it into `invariantChecks.commands` of any project, and `src/runner/merge.mjs:1216` and `:1246` run it before merge. In a project without that file the command exits 1 (checked 2026-10-22), so the merge gate fails. Found by the config inventory (`plans/reports/research-261021-2221-config-access-inventory.md`).

# Done when

The registered default is an empty list; doctor passes an absent `invariantChecks` section and still fails a malformed one; this repository keeps its own command in its own config; one test proves a fresh project's merge gate passes with no invariant command.

# Notes

Migrated from the legacy backlog table. Original status: done (2026-10-22: setup writes an empty list; doctor shares one command-list check with `worktreeSetup`; projects already set up keep the old command until removed by hand — none fails on the owner's main machine).
