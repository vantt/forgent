---
authoritative_for: dispatch execute out-of-process silently discarding uncommitted worktree changes, checkoutDirtyPaths detect-and-warn, root cause presumed external executor not fgOS code
---

# An out-of-process dispatch could silently wipe the driver's own uncommitted edits — now detected and warned, not prevented

`tsk-3bh` closed a real gap discovered live, self-referentially, during
this very retrospective-loop saga's own work: `node
src/runner/dispatch.mjs execute <executorId>` had no dirty-tree check or
warning anywhere in its path, so an out-of-process executor could
silently discard the driver session's own uncommitted changes in the
shared item worktree.

## Confirmed live during `tsk-3df`'s own drive

The driver session had edited
`docs/history/tsk-3df-sync-root-guard-regression-gap/plan.md`
(uncommitted) immediately before calling `dispatch.mjs execute` against
the same `cwd` — no `--cwd`/`--dir` flag passed, so `executeExecutorCli`
defaulted to `process.cwd()`, the driver's own live worktree. After the
out-of-process executor (`agy`) returned `[DONE]`, the uncommitted
`plan.md` edit had vanished from disk, silently reverted to the last
committed state — no error, no warning anywhere in dispatch's own
stdout/stderr.

## Root cause deliberately left unconfirmed, not overclaimed

A grep across `src/runner/dispatch/*.mjs` and `src/runner/dispatch.mjs`
for `reset`/`clean`/`checkout`/`stash` calls found none on the fgOS side
— the wipe is presumed to come from the external executor's (`agy`) own
git hygiene before/around its run, not from fgOS code directly. The
item's own scope deliberately did not chase down `agy`'s own internals to
confirm this; only the observed outcome and the absence of any fgOS-side
guard were established as certain.

## What shipped — detect and warn, never refuse or auto-recover

Consistent with this repo's established "never auto-mutate the shared
checkout without a human reviewing first" posture (already the shape
[`tsk-40a`'s `no-stuck-merge-abort` check](no-stuck-merge-abort-doctor-check.md)
took, and the discipline already enforced for worktree resync via
`resyncClaimWorktree`):

- A new `checkoutDirtyPaths(repoRoot, worktreePath)` export
  (`src/runner/worktree.mjs`) returns the relative paths currently dirty
  (uncommitted or untracked) in a worktree, excluding `.fgos` artifacts —
  reusing the same `:!.fgos` pathspec exclusion `isCheckoutDirty` already
  used. Fails open (returns an empty array) on any git error.
- `executeExecutorCli` (`src/runner/dispatch/cli.mjs`) snapshots
  `checkoutDirtyPaths` before and after the out-of-process call. When the
  branch `HEAD` is unchanged (so no real commit explains the diff) and a
  path that was dirty before is no longer dirty after, it's flagged as
  lost: a warning is written to stderr (`fgos: warning: uncommitted
  path(s) lost across out-of-process dispatch: <paths>`) and the result
  object carries a `lostUncommittedPaths` field for programmatic callers
  — never a refusal, never an automatic restore attempt.

This session's own loss was docs-only and harmless — but the same gap
could just as easily discard real uncommitted code changes in a future
session, which is why the item was submitted even though nothing was
actually lost of consequence this time.
