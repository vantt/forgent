---
authoritative_for: scripts/write-wrapper-script.mjs, the shared helper replacing hand-rolled dispatch wrapper .sh files
---

# Use `scripts/write-wrapper-script.mjs` instead of hand-authoring a wrapper file

`tsk-37l` replaced the hand-rolled-every-time wrapper `.sh` workaround
(`docs/how-to/handle-worktree-guard-refusal-of-compound-dispatch-command.md`)
with one small, reusable, general-purpose script. A scratchpad sweep
across 12+ real past sessions found the same pattern hand-authored
independently over and over — `dispatch-tsk-*.sh`, `run-verify*.sh`,
`run-gate-check.sh` (appearing independently in at least 3 separate
sessions), `poll-discover.sh`, `smoke-doctor.sh`/`smoke-handoff.sh` — each
one written inline via `Write` following the exact shape
`executor-dispatch-fallback.md`'s Step B already prescribes in prose.

## The tool

```bash
node scripts/write-wrapper-script.mjs --command "<the compound command>" [--dir <path>] [--name <base-name>]
```

Writes an executable (`chmod 0755`) shell wrapper file
(`#!/bin/sh\nset -eu\n<command>\n`) into `--dir` (defaults to `cwd`),
named `--name` (defaults to a random `wrapper-<hex>.sh`), and prints its
absolute path — one CLI call instead of authoring a `.sh` file via
`Write` every time. Pass that printed path as the single file to invoke
through Monitor in place of the refused compound line.

## When to use it

Same trigger condition as before: a worktree-isolated session's Bash/
Monitor tool refuses a compound command (e.g. `dispatch.mjs execute ...
--prompt "$(cat <file>)" ... 2>&1`) with "too complex to verify that it
stays inside the worktree" — even when the command has no `git`
subcommand in it. See `docs/how-to/handle-worktree-guard-refusal-of-
compound-dispatch-command.md` for the full background on why splitting
into two tool calls doesn't work for this shape (it would lose the
live-tee Monitor requirement).

## What this doesn't cover

Cleanup of the written wrapper file afterward is left to the caller —
this tool's own scope is print-a-path-and-let-the-caller-invoke, not
auto-invoke-and-self-clean (that shape was one option this item's own
discovery/planning considered and did not choose).
