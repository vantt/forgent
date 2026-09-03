---
framework: diataxis
mode: explanation
---
# Why `reclaimOrphanedCheckout` refuses a checkout the calling session is live inside

`fgos approve`'s merge cleanup (`cleanupMergedBranch` ->
`reclaimOrphanedCheckout`, `src/runner/worktree.mjs`) could destroy a git
worktree the calling session — or an ancestor session in a chained
`EnterWorktree` lineage — was still actively standing inside.

## The real incident

Discovered live during `tsk-4iv-1`'s own merge: the overall approve/merge
operation only *partially* succeeded — the `git merge` itself landed, but
the item's own state transition to `done` then failed with a separate
error ("cannot move to done from stage executing — must pass through
compound-learn stage first", exit code 2). No data was lost (branches and
commits survived in the object database), but the worktree directories
vanished from disk mid-operation without warning, breaking the active
session's own `cwd` — including an ancestor worktree the session was
actively working in, plus its nested child worktree.

## Root cause

`reclaimOrphanedCheckout` force-removed any checkout of a merged branch it
found via `git worktree list`, with no check for whether that checkout
was the calling session's own live worktree. This is destructive under
the documented `tsk-424` chained-`EnterWorktree` pattern (root worktree ->
`EnterWorktree` into a child item's worktree): approving the child, then
its root, from inside that chain reclaimed each one's own live worktree
out from under the session mid-operation.

Before this fix, `reclaimOrphanedCheckout` only guarded against two
cases before force-removing a checkout: the target resolving to
`repoRoot` itself (`tsk-k8u`, the repo-root guard), and the target being
dirty (`tsk-1os`, the data-loss guard via `isCheckoutDirty`). Neither
guard checked whether the calling session was itself standing inside the
target checkout (or an ancestor of it) — the real, still-live gap this
item closed.

## What was explicitly ruled out of scope

Two other root-cause candidates from the original bug report were
investigated and ruled out as *not* the real fix:

- **The symlink + `.fgos` dirty-check gap** — already fixed upstream,
  unrelated to this bug. `isCheckoutDirty` already excludes `.fgos` via a
  `:!.fgos` pathspec (landed commit `1a21f07`, predating this bug's own
  discovery). `node_modules` is no longer symlinked into worktrees either
  (`tsk-2vd` replaced the symlink with real per-worktree `npm ci`/`npm
  install`).
- **Reordering cleanup to wait on the full approve operation's success**
  — would reverse a separate, deliberate prior decision (`tsk-480`): "the
  merge above is already real and permanent — cleanup must run either
  way, so it is no longer gated on the status write succeeding." Gating
  cleanup on full approve success would leak the branch instead of losing
  data, since the `git merge` is already permanent once landed. `tsk-480`
  was not reopened by this item.

## The fix (commit `1fe42d2`)

Adds an optional `callerCwd` param (defaults to `process.cwd()`, which
always equals the real invoking session's cwd — `fgos`'s shell wrapper
never `cd`'s, and this codebase never calls `process.chdir()`) and
refuses — same `WorktreeError` shape as the existing repo-root/dirty-
checkout guards — whenever the checkout about to be removed matches or
nests the caller's cwd. Never a silent-skip-with-warning: `approve`
propagates the failure, and the branch/worktree stays in place for manual
cleanup.

## Terms

- **Live session worktree** — a worktree the current calling process (or,
  in a chained-`EnterWorktree` lineage, any ancestor worktree the current
  session switched into this one from) is presently using as its
  cwd/claim context. Distinct from "dirty" (uncommitted changes) — a live
  worktree can be perfectly clean and still be actively in use.
- **Crash-orphan** — a checkout left behind by a process that died
  mid-operation. Always clean (its commit landed before the crash). A
  checkout that is either dirty OR still live-in-use is NOT a
  crash-orphan and must not be force-removed.

## Related

- `docs/history/reclaim-refuse-live-session-worktree/CONTEXT.md` — full
  decision record and scout evidence.
- `tsk-424` — the chained-`EnterWorktree` pattern (`/fgOS:pick`) whose
  usage exposed this gap.
- `tsk-480` — the "cleanup runs either way" decision this item explicitly
  does not reopen.
