---
authoritative_for: fgos-fanout out-of-process firing path, dispatch.mjs execute --cwd flag, capability pin blocking native Agent dispatch
---

# Why `fgos-fanout` gained a real out-of-process firing path

`tsk-4bq` closed a bug found live during `tsk-u87`'s worktree-isolation
investigation (see `docs/explanation/worktree-isolation-existing-path-
hazard.md`): `fgos-fanout` could not fire a single native Task-tool Agent
for any real fanout batch.

## The bug

`fgos-fanout`'s own dispatch-decision rule requires `dispatch.mjs decide
--work <id>` to answer `mechanism: "in-process"` before it fires a
Task-tool Agent for a candidate — any other answer gets reported back as
"needing a person," no Agent fired. `executorIdForWork()` always resolves
a coding-domain item's dispatch to the literal skill name
`fgos-coding-implement`, and `.fgos/config.json`'s
`runner.capabilities.fgos-coding-implement` was pinned to `prefer: "agy"`
(out-of-process) by a very recent commit landing right before this
investigation. Confirmed directly, twice independently: with that pin in
place, `decide --work <id>` answers `out-of-process` for **every**
coding-domain candidate unconditionally — `fgos-fanout`, run exactly as
documented, would silently do nothing productive on a real batch.

The two use cases (a solo `/fgOS:pick` session's Implement step, and
`fgos-fanout`'s own batch dispatch) wanted opposite mechanisms from the
exact same capability pin — not a bug in the pin itself, a real product
question about which use case the pin should govern.

## The decision

Rather than exempting `fgos-fanout` from the pin, the user decided
`fgos-fanout` should gain a **real out-of-process firing path** of its
own — dispatch out-of-process candidates for real, not just detect and
defer them to a person. This reused the exact mechanism `tsk-u87`'s own
Step 4 had already proven live (3/3 real candidates, zero collision, see
the doc linked above).

## What shipped

1. **`dispatch.mjs execute` gained a `--cwd <path>` flag**
   (`src/runner/dispatch/cli.mjs`). `executeExecutorCli` already accepted
   `cwd` as a function parameter, defaulting to `process.cwd()` — only
   the bare CLI wrapper never exposed a flag for it. Purely additive:
   omitting `--cwd` keeps every existing caller byte-identical.
2. **`fgos-fanout`'s dispatch-decision branch split into two real cases**
   instead of one blanket "needs a person" refusal:
   - `mechanism === "out-of-process"`: claim the candidate via plain CLI
     (`fgos pick "<id>" --dir "$root"` — no `EnterWorktree` tool
     involved, confirmed safe by `tsk-u87`), read the worktree path from
     the claim's own JSON, build the prompt the same way
     `fgos-coding-implement`'s own dispatch step already does, then fire
     `dispatch.mjs execute <executorId> --cwd <worktree-path> --prompt
     <prompt> --has-live-task-access` for the whole out-of-process subset
     **concurrently via plain bash job control** (`( ... ) & ... wait`) —
     never a Task/Agent tool for this branch; real OS subprocesses, the
     same shape `tsk-u87`'s own test script used. Each one's exit is
     followed by `fgos return <id>` (the worker itself never calls it —
     driver-owns-return, per the coding-worker-contract).
   - `mechanism === "unavailable"` (unchanged): still reported back as
     needing a person.

**Why bash job control, not a bespoke script.** `fgos-fanout`'s entire
Workflow is expressed as CLI-call prose today, no embedded scripts —
introducing one Node script just for this branch would break that
convention for no real gain; `&`/`wait` achieves the identical thing (N
real OS processes, none touching Claude Code's own `EnterWorktree`/cwd
guard) with no new file.

**Why `--cwd` stays optional, not required.** Every existing
out-of-process caller (`fgos-coding-implement`'s own driver, `tsk-u87`'s
own dispatches) already calls `execute` from inside the item's own
already-`EnterWorktree`'d worktree, where `process.cwd()` is already
correct — making `--cwd` mandatory would be a breaking change to every
existing call site for zero benefit.
