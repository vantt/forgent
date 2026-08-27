---
framework: diataxis
mode: explanation
---
# Why `fgos merge` now refuses outside the main checkout

`fgos merge list`/`fgos merge next`, run without `--dir` from a cwd that
is a linked git worktree (which never carries its own `.fgos/`, per
ADR0020), used to silently return a valid-looking empty result —
`{picked: null, reason: "nothing ready to merge"}`, `ready`/`waiting`/
`conflicts` all empty — instead of refusing, while the real store at the
main checkout had items genuinely ready to merge. `approve` already
refused correctly in the same situation (`.fgos/ not found ... check
you are not inside a linked worktree`, exit 4). An unattended
`merge-loop` run would therefore stop silently and misreport "done" when
it was actually just looking at the wrong, nonexistent directory.

## Pinned distinction — false negative vs. true negative

A **false negative** (this bug): the command returns no error and no
ready items while ready items genuinely exist in the real store. A
**true negative**: `{picked: null, ...}` when the frontier is actually
empty — that stays the correct, unchanged behavior once the store is
confirmed to exist. The fix only had to close the false-negative case.

## Live repro

Running `node bin/fgos.mjs merge next` (no `--dir`) from the nested
worktree `.claude/worktrees/tsk-52g-HE5JQf/.claude/worktrees/
tsk-52g-1-06hMYs` returned "nothing ready to merge," while
`merge list --dir /home/vantt/projects/forgentX` (the real main checkout)
returned `ready: [tsk-52g-1, tsk-65n]` at the same moment. `approve` run
from the same broken cwd correctly refused with
`"refusing to run from ... this is a git worktree."`

## Root cause

`merge`'s registry entry
(`src/cli/command-registry.mjs`) declared
`requiresExistingStore: false`. That flag drives a real branch in
`bin/fgos.mjs`'s `main()`: only `true` triggers the hard pre-handler
refusal (`.fgos/ not found...`, exit 4) before the verb's handler ever
runs; `false` lets `listWork(dir)` fold a nonexistent directory into an
empty-but-valid view instead. `merge` also wasn't in
`STORE_MISSING_WARNING_VERBS`, so it got neither the hard refusal nor
even the soft stderr warning those 9 read-only verbs get — it failed
silently on both counts.

## The fix — a one-line registry flag change

```js
// tsk-66x: both list and next read/write through dataDir()'s `dir` --
// without this, a missing store (e.g. cwd is a linked worktree with no
// --dir) folds silently into an empty-but-valid ready/waiting/conflicts
// result instead of refusing, the false negative this item closes.
requiresExistingStore: true,
```

This matches the sibling write verb `approve`'s entry exactly — the
already-correct, already-proven pattern, not a new mechanism. Both
`merge list` and `merge next` share this one registry entry, so both
start refusing together. This is correct for `next` too: it internally
calls `mergeReadiness(listWork(dir))` before ever reaching `approve`.

## Why scope stayed narrow to just `merge`

Every other registry entry with `touchesState: true` and
`requiresExistingStore: false` (`init`, `evolve`, `session`, `setup`,
`uninstall`, `doctor`) already carries an explicit exemption comment
justifying why it's intentionally `false` — `init` gets the opposite
linked-worktree check; `session`/`setup` write through independent
paths, never through `dir`; `evolve`'s dual-mode exemption is itself a
prior, already-decided item, explicitly scoped out of the worktree-write
hazard this item targets; `uninstall`/`doctor` never touch `.fgos/` at
all. `merge` was the only entry with no such comment — a genuine
oversight, not a pattern needing a wider audit.

## Why no handler or skill changes were needed

`merge next`'s recursive `runVerb('approve', ...)` call is only reached
after `main()`'s pre-handler guard has already passed for the outer
`merge` call — once `merge` itself is gated, that recursive call is
simply never reached on a missing store, so no double-gating was
needed. The `merge-next` skill already distinguished "the command itself
fails to execute (a real CLI error)" — show it and stop — from "a
reported blocked outcome" (JSON `data`); the new exit-4 refusal falls
cleanly into the already-handled first case, so `merge-loop`'s
stop-rule reading of `{picked: null, reason: "nothing ready to merge"}`
as a clean stop is simply never reached in the broken-store case
anymore — it now hits the pre-existing error path instead.
