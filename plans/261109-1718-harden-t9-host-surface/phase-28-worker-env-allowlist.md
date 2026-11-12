---
phase: 28
title: "Worker env allowlist: a seat starts from named ambient variables, not the runner's whole environment"
status: landed
depends_on: []
parallel: "file-disjoint from P07 (run.mjs, unit-handoff, unit-run-start, settle); P27 (confinement authority, bwrap driver, herdr-round, trust-store) is not touched"
---

# Phase 28 - Worker env allowlist - Execution (T5)

**Authority moved:** none moved. Execution (`workerBaseEnv`, `src/runner/dispatch/adapters.mjs`) is the one owner of what a seat's ambient environment holds.

## Context

[Debug report](../reports/debug-261112-1101-pane-seat-env-leak.md): `workerBaseEnv` removed 17 names and returned the rest, and the gate applies that side-file environment after `env_clear`, so every seat got the runner's whole environment (a parent Claude session's messaging socket and token, `CLAUDE_CODE_CHILD_SESSION`, any API key). Backlog row `p-ti7prrwace` (on branch `harden/t9-p27-claude-seat-store`; P27 lands it).

## Requirements

1. `workerBaseEnv` keeps only an explicit allowlist (each name carries its reason in the source) plus the `FGOS_STATE_ROOT` pin; the denylist is deleted.
2. No ambient `CLAUDE_CODE_*`, `*_TOKEN` or `*_KEY` variable reaches a seat; provider variables come from the executor's declared `env` or its credential store.
3. The controller's own herdr endpoint (`HERDR_*`) stays available to the controller (`herdrEndpointEnv`, `terminal-slot.mjs`) and never reaches the seat.
4. Pane and headless paths both proved; one owning proof for the allowlist.

## Files

`src/runner/dispatch/adapters.mjs`, `packages/run-supervisor/contracts/worker-env-allowlist.v1.json` (the list, with a reason per name; `package.json` `files`), `src/runner/dispatch/terminal-slot.mjs`, `src/runner/dispatch/assignment-runner.mjs` and `herdr-round.mjs` (one line each), tests (`test/runner/dispatch/worker-env-case-context.test.mjs` owns the allowlist; `test/run-supervisor/terminal-cutover.test.mjs` is the pane wiring proof; `test/run-supervisor/fixtures/terminal-agent.mjs` records names), `test/session-identity/attempt-writer-id.test.mjs` (retired per-name proofs), runner business rules spec, `CHANGELOG.md`.

## Validation

Focused tests, architecture and doc-health tests, census scan, one real read-only `fgos run` seat with a canary variable, full `npm test`. Rollback: revert the merge commit.
