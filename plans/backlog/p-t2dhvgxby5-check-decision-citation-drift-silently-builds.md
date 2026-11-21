---
id: p-t2dhvgxby5
title: "`check-decision-citation-drift` silently builds Rust into the default output dir (test, priority low; source: `plans/261117-1430-portfolio-driving-draft/reports/trial-261117-1705-solo-driving-trial.md`)"
status: proposed
priority: P3
area: test
created: 2026-11-17
---

# Why

`scripts/check-decision-citation-drift.mjs` calls `ensureAddonForScript()`, which compiles the addon with cargo into the checkout's default output dir when `CARGO_TARGET_DIR` is unset, with no message; in a fresh worktree this is a long, unannounced build on the shared disk (friction `cargo-output-dir-unset`, 2026-11-17).

# Done when

The script says when it builds and where, and honours the same output-dir rule as `npm run fgos:dev`; a run in a fresh worktree prints the build line before compiling.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
