---
id: p-s5mliyp335
title: An attempt's token `usage` is always `null` (Execution, Run Supervisor, priority low)
status: done
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

The `unit-run-result` contract declares `usage` on the attempt (the Attempt shape, version 3 of `RunResult`) but no layer produces it: nothing in `src/runner/execution` reads or writes it, and the supervisor's receipt keeps no token count from the provider CLI. `durationMs` was filled because Execution times the dispatch itself. Found at the T9 close; the owner asked for it to be filed.

# Done when

First a survey of where each CLI (codex, claude, omp, pi, agy) prints its token counts and in what form, then the receipt carries them, `runResult.usage` reads from the receipt, and one unit proof owns the field; a CLI that prints none stays `null` by name.

# Notes

Migrated from the legacy backlog table. Original status: done (main `80d1349a1`, `725522d1e`, `36445e48f`, plan `plans/261118-0936-ops-metrics`: every settled attempt in `unit-summary.json` carries `accountId`, `durationMs` and `usage`, which holds token counts or a named `reason`; the parsers live in Rust, one module per CLI in `packages/run-result/rust/src/usage/` (addon `runResult.parseUsage`), and `src/runner/dispatch/usage-parsers.mjs` is deleted; the survey is `plans/261118-0936-ops-metrics/reports/usage-survey.md`; the attempts reach queries as `fgos.run.attempt` records).
