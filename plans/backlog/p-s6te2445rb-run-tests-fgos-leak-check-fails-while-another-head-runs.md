---
id: p-s6te2445rb
title: "The leak check of `scripts/run-tests.mjs` for files left in `.fgos` fails a clean run while another head is working (tests, priority high; source: owner via the manual supervisor, 2026-11-24)"
status: done
priority: P1
area: tests
created: 2026-11-24
---

# Why

The check that files left in `.fgos` after a test run fails the run even when no test failed, because other heads write live runtime files at the same time. Evidence: a land from a non-confined session went red three times with 0 failures, each time because of files in `observe/records`, `mail-taken`, `invocation-faults.jsonl` and `land-*.log.partial`. It blocks every land from a session that is not confined.

# Done when

The leak check leaves the live runtime directories out of its comparison (`runtime/land`, `runtime/mailbox`, `observe/records`, `logs`, `cache`) and also leaves out the log of the land that is running. A real leak by a test still fails the check. The owner asked for a small plan: if it is small enough, one phase with a footprint of `scripts/run-tests.mjs` and its test; then tell the supervisor, who approves it as ready.

# Notes

Seeded discussion: `plans/discussions/ds-ti2vip43kp-run-tests-fgos-leak-check/DISCUSSION.md`.
