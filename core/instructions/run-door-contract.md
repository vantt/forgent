---
id: run-door-contract
kind: procedure
owner: core
scope: repo
mode: append
specificity: 10
title: Run Door Contract
description: The two doors that execute work (fgos run and fgos workflow start) - read-only without writes, writes need a linked worktree, the runner commits and the worker never does, and how to wait for a call
lifecycle: live
valid_from: 2026-11-26
related:
  - "[[dispatch-decide-door]]"
  - "[[capability-routing-rules]]"
---

# Run Door Contract

`fgos run` is the primary door for executing new work in the execution core.

**Two doors, one runUnit — the preferred path for new work.** One task: `fgos run "<prompt>" [--provider <id>] [--writes <paths> --worktree <path>]` builds a Unit from the prompt (read-only without `--writes`; `--writes` needs a linked worktree; `--provider` is a soft preference, not a pin). Planned work: `fgos workflow start <preset>|--units <file>`, one step per Unit. Both bind through `bind()`; the runner commits only the Unit's declared `writes` after a passing round, and the worker never runs `git add`/`git commit`. These two doors are the only ones that execute work; `fgos dispatch` keeps only the lower-level reads (`decide`, `inspect`, `reconcile`, `probe-account`).

Without `--writes` the Unit is read-only and runs sandboxed. `--writes` needs a linked worktree and is refused from the main checkout before anything runs. `--provider` is a soft preference that `bind()` tries first and fails over from; `--capability` defaults to `execute`. Work already written as a Unit file runs as `fgos run --unit <file>`.

The worker edits files and stops, never running `git add`/`git commit`. After a passing round the runner commits only paths inside the Unit's `writes` (subject from the first line of the worker's `summary`); a path the worker needs outside that scope goes in `needsWrites`, not on disk.

When herdr is present the worker runs in a watched pane, so a person can follow it live; otherwise the call blocks until the Unit settles. Run a long call backgrounded (`run_in_background: true`) and wait for the harness's own completion notification — do NOT use `ScheduleWakeup` or polling.

That wait rule is for a `fgos run` call, which blocks until the Unit settles. `fgos workflow start` returns at once with the `workflowRunId` and a `detached` block (`pid`, `logPath`, `statusCommand`) while the run continues in a detached process: its output is never the result, so poll `fgos workflow status <workflowRunId>` until the run is `completed`, `failed` or parked at a gate. `answer` and `resume` return the same way; pass `--foreground` only when the caller must wait in place.
