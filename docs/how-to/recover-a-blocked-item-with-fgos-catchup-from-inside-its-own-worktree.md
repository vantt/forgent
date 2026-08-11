---
type: how-to
title: How to recover a `blocked` item with `fgos catchup` from inside its own worktree
tags: [catchup, worktree, blocked, verify-fail-post-merge]
timestamp: 2026-08-11T12:02:00.000Z
source_capture_ids: [tsk-5vl]
---

# How to recover a `blocked` item with `fgos catchup` from inside its own worktree

Use this when an item lands `status: blocked` with a merge-related
`reason` (`merge-conflict`/`verify-fail-post-merge`/
`verify-timeout-post-merge`/`integration-drift`/`merge-failed-
unclassified`/`merge-blocked-other-item`) — most often because `fgos
approve`'s post-merge verify failed and rolled the merge back safely,
leaving `main` untouched but the item parked.

## Why `fgos return` won't work here

`fgos-coding-implement`'s own Return-step hard rule used to say "if
`return` reports `blocked`, treat that exactly like a failed verify:
diagnose, fix, and return again" — correct for the case where `return`
*itself* just moved the item to `blocked` while `status` was still
`doing`. It's incomplete for the case where the item is *already*
`blocked` by the time you go to call `return` (e.g. `approve`'s own
post-merge rollback already parked it with `reason:
verify-fail-post-merge`): `return` requires `status: doing`, and this
item's `blocked -> awaiting-approval` recovery edge never passes through
`doing` (RUL33/RUL34, `docs/specs/work-state.md`). Calling `return` here
just refuses.

The correct recovery verb is `fgos catchup <id>`: it re-runs `verify` on
a staged merge into the item's actual target branch, and on green moves
the item straight to `awaiting-approval` — no detour through `doing`.

## The worktree gotcha

If you're running `fgos catchup <id>` from inside a shell whose current
directory is still the item's own linked worktree (e.g. the same session
that just hit `verify-fail-post-merge` and never left its own `pick`'d
worktree), it used to fail with git's own refusal:

```
Cannot force update the current branch
```

The cause: `catchup`'s internal `repoRoot` was read from raw
`process.cwd()` instead of the `--dir`-resolved main checkout — the same
bug class `tsk-k8u` had already fixed for `take`/`pick`. `catchup`
force-updates the item's own branch ref (`git branch -f`, via
`withMergeEphemeralWorktree` in `src/runner/worktree.mjs`) as part of
staging the retry merge; git refuses to force-update a branch that's
currently checked out in the very worktree the command is running from.

This is fixed now — `catchup` derives `repoRoot` from `path.dirname(dir)`
(the `--dir`-resolved main checkout), never `process.cwd()`, so it works
correctly regardless of which worktree the calling shell happens to be
sitting in. You no longer need to `ExitWorktree` first before running
`fgos catchup`.

## Steps

1. Confirm the item is `blocked` with a merge-related `reason` (`fgos
   list --id <id> --json`, read `data.work[id].reason`) — `catchup`
   refuses for any other blocked reason (e.g. anti-loop-max-visits,
   runner-crash-reclaim), which needs a real `take`/`return` rework
   instead.
2. Run `fgos catchup <id> [--timeout <ms>|--no-timeout]` — from any
   directory; no need to leave the item's own worktree first.
3. On green, the item lands at `awaiting-approval` directly. On a repeat
   genuine failure, it's worth first ruling out an unrelated pre-existing
   bug the same way `docs/how-to/diagnose-a-verify-fail-post-merge-block-
   on-approve.md` describes for `approve`'s own equivalent case, before
   assuming `catchup` itself is broken.

## Related

- `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md` —
  diagnosing *why* the post-merge verify failed in the first place
  (unrelated pre-existing bug vs. load flake vs. a genuine gap), before
  retrying via `catchup`.
- `docs/how-to/recover-a-blocked-merge-conflict-when-catchup-cannot-
  reconcile-it.md` — what to do when `catchup` itself can't resolve a
  real conflict.
