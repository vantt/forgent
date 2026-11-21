---
id: p-h2bwtllngz
title: A claude headless invocation that gets the outbox `--add-dir` grant without `acceptEdits` is refused at config check (Dispatch, priority low)
status: proposed
priority: P3
area: general
created: 2026-11-21
---

# Why

`withRunDirAccess` (`src/runner/dispatch/cli.mjs`) grants a headless claude its outbox directory, but claude refuses the write unless the invocation also carries `--permission-mode acceptEdits`; an operator-defined `cli-spawn` claude invocation without it gets a grant that silently does nothing and the seat ends `no-report`. Today only the shipped standard pairs the two (proved in `test/runner/execution/run-herdr.test.mjs`). Surfaced by the OPC review of the confined claude outbox change.

# Done when

A config or doctor check (owner picks the door) names any `cli-spawn` claude invocation lacking `acceptEdits`; one proof.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
