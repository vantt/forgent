---
id: p-dkkodseo63
title: "A sandboxed `fgos run` seat cannot run any Node test, so a solo seat cannot verify Node work (runner, priority high; source: `plans/261117-1430-portfolio-driving-draft/reports/trial-261117-1705-solo-driving-trial.md`)"
status: proposed
priority: P1
area: runner
created: 2026-11-17
---

# Why

On 2026-11-17 a solo seat on a Node phase could not run one Node test: every file failed with `git-addon-not-shipped`, also with `FGOS_HOST_BIN` set. The seat claimed done; outside the sandbox 2 of its new cases failed, and a subagent fixed them (`4816d0583`). The planner seat could not run `scripts/plan-contract-check.mjs` either (`git-addon-unavailable: addon not shipped on this channel`).

# Done when

A solo seat in a linked worktree can run `node --test` on a test that loads the Git addon and the YAML door; a live `fgos run` on a Node phase with `--verify "node --test <file>"` reports the real pass or fail. Note (plan 261118-1045 close): landing gates now run Node tests outside the sandbox through `fgos land --test`; a sandboxed seat still cannot run them, so this row stays open.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
