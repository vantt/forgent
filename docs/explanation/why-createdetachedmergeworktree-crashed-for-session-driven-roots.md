---
type: explanation
title: Why createDetachedMergeWorktree crashed for roots a live session dispatched
tags: [merge, worktree, branch-creation, session-driven-dispatch]
source_capture_ids: [tsk-6ch, tsk-5zg]
authoritative_for: why a session-driven root's fgw/<rootId> branch may not exist yet at merge time, and every call site that needed its own fallback for it
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

## The same root cause, one call site earlier (`tsk-5zg`)

`tsk-6ch`'s fallback only covers `createDetachedMergeWorktree` — but
`approve`'s leaf-into-root merge runs an **earlier** check first, in the
same function, before `createDetachedMergeWorktree` is ever reached: an
ancestor check at `bin/fgos.mjs` (~line 3483),
`execFileSync('git', ['merge-base', '--is-ancestor', rootBranch,
branchNameFor(id)], ...)`, with no branch-existence guard of its own.

Reproduced live (2026-08-13): approving `tsk-5vs` (a leaf of `tsk-5wr`)
before `tsk-5wr` itself had ever been claimed crashed with a raw `fatal:
Not a valid object name fgw/tsk-5wr` instead of falling back gracefully.
The mechanism is subtly different from a missing-branch check: `git
merge-base --is-ancestor` on a genuinely nonexistent ref exits with git's
own fatal code **128**, not the ordinary "not an ancestor" exit code
**1** — so the surrounding `catch` block's own `if (ancestorErr.status
!== 1) throw ancestorErr` re-threw the crash instead of treating it as
"not yet caught up," the same soft-fail path a real "not an ancestor"
result already takes.

This is the identical underlying gap `tsk-6ch` diagnosed (a session-driven
root's branch not existing yet at merge time) surfacing at a call site
`tsk-6ch`'s own fix never reached. **Fix**: apply the same
`createBranchRef` fallback (or an explicit branch-existence guard) at
this earlier ancestor-check site too, consistent with how the later
`createDetachedMergeWorktree` call already handles it. Until this
landed, the only workaround was manually claiming the root item first (which
creates its branch via `createWorktree`'s branch-reuse path) before
retrying `approve` on the leaf.

## Related

- `docs/history/tsk-6ch-merge-worktree-branch-fallback/CONTEXT.md` — full
  scout evidence, including the two other `withMergeEphemeralWorktree`
  call sites (catch-up-merge, `return`) that carried the same latent
  exposure for the same underlying reason.
- `src/runner/loop.mjs` — the runner's own early branch-creation
  precedent this fallback re-creates for the session-driven case.
