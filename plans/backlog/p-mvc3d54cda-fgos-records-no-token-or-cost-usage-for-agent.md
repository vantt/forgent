---
id: p-mvc3d54cda
title: fgOS records no token or cost usage for agent runs through omp, pi or agy, so cost by tier cannot be measured
status: done
priority: P2
area: general
created: 2026-10-22
---

# Why

Seen in COOK P6 (2026-10-22, `plans/reports/measure-261022-1758-cook-p6-pane-launch.md`): every one of 11 dispatches had `usage` `null` or `"unsupported"` — gemini/omp producers, deepseek reviewers, xai grok red-team, claude read-only seats — so P6's cost-by-tier question had no answer and model or tier choices cannot be compared by spend.

# Done when

Each settled run records the usage its CLI reports (input/output tokens, and cost when the provider gives it) for omp, pi and agy runs in the run result, or records a named reason when the CLI exposes none; a test per CLI parses a recorded usage fixture; one live run per CLI on `fg-server` shows non-null usage in the run result

# Notes

Migrated from the legacy backlog table. Original status: done (main `725522d1e`, plan `plans/261118-0936-ops-metrics`: pi and omp usage is read from each assistant `message_end` on stdout, codex from its `tokens used` stderr footer (total only), claude from the seat's transcript or `--output-format json`; agy exposes no counts and records `agy-exposes-no-counts`, a pane run with no structured output `no-structured-output`, an all-zero report `reported-zero`; one parser test file per CLI in `packages/run-result/rust/tests/`; cost in money is not recorded (deferred, row p-sx2aps3heh); the live run per CLI on `fg-server` was not repeated for this row).
