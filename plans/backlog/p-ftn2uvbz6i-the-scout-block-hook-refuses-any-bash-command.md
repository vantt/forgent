---
id: p-ftn2uvbz6i
title: "The scout-block hook refuses any Bash command that contains the word \"target\" (security, priority low; source: `plans/261117-1430-portfolio-driving-draft/reports/trial-261117-1705-solo-driving-trial.md`)"
status: proposed
priority: P3
area: security
created: 2026-11-17
---

# Why

The AgentKit `scout-block.cjs` hook wired in `.claude/settings.json` blocks every command whose text holds `target` (for example a `CARGO_TARGET_DIR=` prefix or an `rg` pattern), not only reads of a build output directory. Hit by the shaper and by the report writer on 2026-11-17 (friction `scout-hook-blocks-common-word`).

# Done when

The hook blocks only reads into a build output directory, not a command that merely mentions the word; `CARGO_TARGET_DIR=<path> cargo test` and an `rg` pattern containing the word pass.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
