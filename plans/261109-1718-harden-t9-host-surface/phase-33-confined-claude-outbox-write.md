---
phase: 33
title: "A confined headless claude seat writes its outbox"
status: landed
depends_on: []
parallel: "P32 also edits assignment-runner.mjs; this phase touches only the args-selection hunk and lands or rebases after it"
---

# Phase 33 - Confined claude outbox write - Dispatch (T5)

**Authority moved:** none moved. Dispatch (`withRunDirAccess`, `src/runner/dispatch/cli.mjs`) is the one owner of which directories a claude seat is told it may use; the standard config owns the permission mode.

## Context

Claude's own permission gate refused every outbox write of a `claude-cli-bwrap` seat: no `--permission-mode`, and the outbox lies outside the seat's cwd. Only the unconfined `claude-cli` carried `acceptEdits`; historically every claude worker invocation did, so the omission looks accidental. Direct probes: the write succeeds only with `acceptEdits` and `--add-dir` of the outbox directory.

## Requirements

1. `claude-cli-bwrap` args carry `--permission-mode acceptEdits` (never `--dangerously-skip-permissions`; it also drops Bash gating).
2. `withRunDirReadAccess` becomes `withRunDirAccess` (it grants read of the brief and write of the outbox, not only read). A headless claude gets `--add-dir <its outbox directory>` only; the pane grant is unchanged. Every caller moves; no second mechanism.
3. The pane (`claude-herdr-bwrap`) needs no change: a real pane run wrote its outbox with the existing run-directory grant and no permission mode.

## Files

`core/config-standard/runner.yaml`, `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/assignment-runner.mjs` (args-selection hunk and the rename), `packages/git/contracts/mutation-census.v1.json` (regenerated); test `test/runner/execution/run-herdr.test.mjs` (owns the grant).

## Validation

Launch-args test from the shipped standard; real `fgos run ... --provider claude` headless (confined) and in a pane, both `output.complete: true`; focused tests, architecture, doc-health, citation drift, census, cargo config and fgos tests, full `npm test`. Rollback: revert the merge commit.
