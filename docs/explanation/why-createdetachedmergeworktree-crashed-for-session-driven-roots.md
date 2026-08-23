---
type: explanation
title: Why createDetachedMergeWorktree crashed for roots a live session dispatched
tags: []
source_capture_ids: [tsk-6ch]
---
# Why `createDetachedMergeWorktree` crashed for roots a live session dispatched

`createDetachedMergeWorktree` (`src/runner/worktree.mjs`) threw
`"cannot create ephemeral merge checkout — branch ... does not exist"`
whenever its target `fgw/<id>` branch wasn't already a real git ref. Every
`withMergeEphemeralWorktree` caller — `approve`'s leaf-into-root merge,
the catch-up-merge flow, and `return` — hit this the moment a root's
branch had never been created ahead of time.

## Two dispatch paths, only one creates the branch early

`src/runner/loop.mjs`'s automated dispatch calls
`createBranchRef(repoRoot, rootId, { baseRef: 'main' })` as part of leaf
dispatch, idempotent, before that leaf ever reaches merge — the runner
loop's own early branch-creation guarantee. `approve`'s own code comment
asserted that guarantee held universally:

> "guaranteed to exist by the time a leaf reaches awaiting-approval —
> dispatch-side wiring"
> — real code comment, `bin/fgos.mjs` (`approve` verb, leaf-into-root merge)

That's real for a root the runner loop actually dispatched. It's false for
a root only ever driven by a live session — `/fgOS:pick` into
`fgos-coding-planning`'s `fgos add --parent` split, `fgos-fanout`, or similar —
which never routes through `loop.mjs`'s dispatch path and so never gets
the early `createBranchRef` call. The first place such a root's branch was
ever needed was exactly this merge step, and by then it simply wasn't
there:

> "a root that was only ever driven by a live session ... never gets that
> early `createBranchRef` call. The first time such a root's branch is
> needed is exactly this merge step, and it isn't there — the crash is
> real, not hypothetical, and it's a session-driven-dispatch gap, not a
> data corruption."
> — real `CONTEXT.md`, `docs/history/tsk-6ch-merge-worktree-branch-fallback/CONTEXT.md`

## The fix: fall back instead of asserting a precondition that isn't universal

Rather than threading a second early-creation call through every
session-driven dispatch path, the fix moved the guarantee into the
low-level helper itself: `createDetachedMergeWorktree` now falls back to
`createBranchRef` when the branch doesn't exist, instead of throwing.
`branchNameFor(id)` formats `fgw/<id>` but isn't safely reversible (no id
can be assumed never to contain `/`), so the fix carries the real `id`
through `withMergeEphemeralWorktree` down to the low-level function,
rather than trying to parse it back out of the already-formatted branch
string.

## Why this wasn't scoped to `promote-to-component`'s own path

`promote-engine.mjs`'s `resolveIntegrationBranch` already calls
`createBranchRef` unconditionally before ever reaching
`withMergeEphemeralWorktree` — that call path was never exposed to this
gap. It uses `detectTrunk(repoRoot)` as its `baseRef` rather than the
literal `'main'` `loop.mjs`'s early-creation call uses, a deliberate
choice for `promote-to-component`'s own flow — not evidence the general
fallback should match it. Reaching for `detectTrunk` inside
`worktree.mjs` would also have created a fresh circular import
(`merge.mjs` already imports from `worktree.mjs`), a second real reason
the fallback keeps the literal `'main'` baseRef `loop.mjs` already uses.

## Related

- `docs/history/tsk-6ch-merge-worktree-branch-fallback/CONTEXT.md` — full
  scout evidence, including the two other `withMergeEphemeralWorktree`
  call sites (catch-up-merge, `return`) that carried the same latent
  exposure for the same underlying reason.
- `src/runner/loop.mjs` — the runner's own early branch-creation
  precedent this fallback re-creates for the session-driven case.
