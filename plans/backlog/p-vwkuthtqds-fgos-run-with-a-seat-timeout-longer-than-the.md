---
id: p-vwkuthtqds
title: "`fgos run` with a seat timeout longer than the login's remaining access-token life fails silently as a run-error instead of a named refusal (execution, priority medium; source: lead:WINCUSTODY, 2026-11-21)"
status: proposed
priority: P2
area: execution
created: 2026-11-21
---

# Why

`fgos run --provider claude --timeout 3h` failed twice within 2 s: outcome execution-failure, infrastructureReason run-error, no worker started, empty gate-exit.json and capture logs, empty stdout JSON, exit 1. The only hint was on stderr: `login-expires-before-seat-timeout: 173 min of access-token life left and the seat may run 180 min ... refresh-ahead skipped live-seat-owns-renewal`. The same brief with `--timeout 2h` ran fine. Runs: unit-run-1795244216891-435b2d32 and unit-run-1795244196791-92171694.

# Done when

A seat whose timeout outlives the login is either renewed before launch or refused by name before the unit run exists (for example `login-expires-before-seat-timeout`, with the minutes left and the fix), and the reason lands in the run record and the JSON result, never only on stderr. An owning test drives a seat timeout past the token life and gets the named refusal.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
