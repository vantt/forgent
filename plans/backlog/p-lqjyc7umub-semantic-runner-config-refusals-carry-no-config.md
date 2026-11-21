---
id: p-lqjyc7umub
title: "Semantic runner-config refusals carry no `config-*` code except retired pattern keys, so the dispatch hook allows a call the config refuses (runner/dispatch, priority medium; needs an owner decision before work; source: `plans/261115-2328-execution-read-door/reports/phase-261117-1351-erd-p01-executor-model.md`, backlog candidate 1)"
status: proposed
priority: P2
area: runner-dispatch
created: 2026-11-21
---

# Why

`fgos dispatch decide` refuses a project config that breaks, for example, a `prefer` target, but the dispatch hook allows the guarded call.

# Done when

Owner decides whether every semantic refusal carries a `config-*` code and blocks the hook; then each such refusal carries its code and the hook and `decide` agree.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
