---
id: p-3ffeqh36dh
title: A code:review run whose agent exited cleanly with a valid result is settled as an infrastructure failure (runner, priority medium)
status: proposed
priority: P2
area: runner
created: 2026-11-18
---

# Why

Unit run `unit-run-1794987012087-5f3337a8` (2026-11-18 14:30, pi/openai seat, lead:SUPERVISION phase 06 re-review): `gate-exit.json` says `stoppedBy: agent`, `exitCode: 0`; `receipt.json` has `outboxPresent: true`, `outboxResult: result-1.json` (valid agent-result-claim v2, status done, two findings); yet `unit-summary.json` says `outcome: execution-failure`, `infrastructure: true`, `infrastructureReason: run-error`, with no error text in the run or unit-control files. The lead read the report by hand, so nothing was lost this time; a lead that trusts the summary would drop real findings. Also: the seat pane stays open as a bare shell after the agent exits.

# Done when

Settlement of such a run reads the outbox result (outcome done) or names the concrete error; a regression case from this run directory.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
