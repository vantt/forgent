---
id: p-mfllw32ynj
title: "Data-loss risk: `fgos config set --dir <linked worktree>` writes a fresh project config over the tracked one, hidden from `git status` (config, priority high; source: `plans/261117-1435-solo-driving-trial/reports/measures-template.md` (phase 1 baseline))"
status: done
priority: P1
area: config
created: 2026-11-17
---

# Why

In a linked worktree made by `fgos worktree create`, `.fgos/config.yaml` is stripped and marked skip-worktree; on 2026-11-17 `fgos config set --dir <worktree>` wrote a new 12-line `.fgos/config.yaml` instead of editing the tracked 273-line file, and `git status` showed nothing, so a commit from that worktree would have deleted the project config. The installed `fgos` also refuses to run inside a linked worktree ("no .fgos/installation found"), which is what pushes callers to `--dir`. Friction: `worktree-stripped-config-set-writes-fresh-file`.

# Done when

`fgos config set` never creates a project config where a tracked one is stripped or skip-worktree: it edits the tracked content or refuses by name with the remedy; a test seeds a skip-worktree config and proves no write; the installed `fgos` either runs in a linked worktree against its owning project or says plainly which door to use; a commit that would delete the tracked project config is caught before it lands.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
