# tsk-6ch — createDetachedMergeWorktree crashes when a root's fgw/<rootId> branch was never created early

## Feature boundary

`createDetachedMergeWorktree` (`src/runner/worktree.mjs:735`) throws
`WorktreeError('cannot create ephemeral merge checkout — branch "..." does
not exist.')` whenever the target branch isn't already a real ref. Every
caller reaches it through `withMergeEphemeralWorktree(repoRoot, id, fn)`
(`worktree.mjs:764`), which computes `branch = branchNameFor(id)` and
passes that plain string down — `createDetachedMergeWorktree` itself never
sees `id`, only the already-formatted branch name.

**Why the throw fires in practice**: `bin/fgos.mjs`'s `approve` verb
(~line 2917) calls `withMergeEphemeralWorktree(repoRoot, rootId, ...)` for
a leaf-into-root merge, and its own comment claims `fgw/<rootId>` is
"guaranteed to exist by the time a leaf reaches awaiting-approval —
dispatch-side wiring". That guarantee is real for a root the automated
runner loop actually dispatched (`src/runner/loop.mjs:696` calls
`createBranchRef(repoRoot, rootId, { baseRef: 'main' })` as its own
leaf-dispatch step, idempotent, "nhánh tạo sớm" per D17) — but a root that
was only ever driven by a live session (`/fgOS:pick` → `fgos-coding-planning`'s
`fgos add --parent` split, `fgos-fanout`, etc., never through
`loop.mjs`'s dispatch path) never gets that early `createBranchRef` call.
The first time such a root's branch is needed is exactly this merge step,
and it isn't there — the crash is real, not hypothetical, and it's a
session-driven-dispatch gap, not a data corruption.

`promote-engine.mjs`'s own `resolveIntegrationBranch` (called from
`bin/fgos.mjs:3419`, the `promote-to-component` verb) already calls
`createBranchRef` unconditionally before ever reaching
`withMergeEphemeralWorktree` — that call path is unaffected by this gap.
`bin/fgos.mjs:3326`/`3554` (other `withMergeEphemeralWorktree` call sites,
catch-up-merge/return flows) carry the same latent exposure whenever their
own target branch wasn't created early, for the same underlying reason.

**The fix** (item's own description, already fully specified — no product
decision needed): `createDetachedMergeWorktree` falls back to
`createBranchRef` instead of throwing, when the branch doesn't exist yet.

## Why this item skipped `fgos-coding-exploring`

`fgos-clarifying` judged intent as understood directly from the item's own
title/description (no product-level gray area — this is a pure internal
bug fix with one already-named fix), so this item went straight from
`clarify` to `decompose` via a caller-supplied `clear` verdict
(`fgos discover --verdict clear`). No `CONTEXT.md` gray area exists to
lock as a Locked decision — this document exists only to carry the scout
evidence `fgos-coding-planning`'s own plan.md cites, not a Socratic record.

## Scout evidence

- `src/runner/worktree.mjs:735-738` — `createDetachedMergeWorktree(repoRoot,
  branch)`: `if (!branchExists(repoRoot, branch)) throw new WorktreeError(...)`.
  Not exported; its only caller is `withMergeEphemeralWorktree` in the same
  file (`worktree.mjs:766`).
- `src/runner/worktree.mjs:764-762` — `withMergeEphemeralWorktree(repoRoot,
  id, fn)` computes `branch = branchNameFor(id)` then calls
  `createDetachedMergeWorktree(repoRoot, branch)`. `id` is known at this
  call site; `createDetachedMergeWorktree` currently is not, since it only
  receives the pre-formatted `branch` string.
- `src/runner/worktree.mjs:374-392` — `createBranchRef(repoRoot, id, opts)`:
  idempotent (no-op if the branch already exists), creates `fgw/<id>` from
  `opts.baseRef ?? 'main'` via `git branch <branch> <baseRef>`.
- `src/runner/worktree.mjs:78-80` — `branchNameFor(id)` is a pure
  `` `fgw/${id}` `` formatter; not safely reversible in general (no id can
  be assumed never to contain `/`), so the fix must carry `id` through
  rather than parse it back out of `branch`.
- `src/runner/loop.mjs:693-696` — the runner's own "early" branch creation:
  `createBranchRef(repoRoot, rootId, { baseRef: 'main' })`, idempotent,
  fired as part of leaf dispatch. This is the precedent this item's
  fallback re-creates for the case where that dispatch-side call never
  ran.
- `src/runner/promote-engine.mjs:14-31` — `resolveIntegrationBranch` also
  calls `createBranchRef`, but with `baseRef: detectTrunk(repoRoot)`
  instead of the literal `'main'` — a deliberately different choice for
  `promote-to-component`'s own flow (`docs/history/promote-to-component/
  CONTEXT.md` D1), not evidence this item's fallback should match it.
- `src/runner/merge.mjs:46` — `merge.mjs` already imports from
  `worktree.mjs` (`branchNameFor`, `branchExists`,
  `reclaimOrphanedCheckout`). `worktree.mjs` importing back from
  `merge.mjs` (e.g. for `detectTrunk`) would be a fresh circular import
  between the two modules — a real reason to prefer the literal `'main'`
  baseRef already used by `loop.mjs`'s own early-creation call over
  reaching for `detectTrunk`.
- `bin/fgos.mjs:2917-2957` — `approve` verb's leaf-into-root merge path:
  the comment asserting the "guaranteed to exist" precondition, and the
  `withMergeEphemeralWorktree(repoRoot, rootId, ...)` call this item's fix
  protects.
- `bin/fgos.mjs:3326`, `bin/fgos.mjs:3554` — two further
  `withMergeEphemeralWorktree` call sites (catch-up-merge, return) that
  benefit from the same fallback for the same underlying reason; neither
  is in this item's own declared footprint (fix lives entirely inside
  `worktree.mjs`, transparent to every caller).
- GitNexus `impact(createDetachedMergeWorktree, upstream)`: `risk: LOW`,
  `impactedCount: 1` — the sole caller is `withMergeEphemeralWorktree` in
  the same file; posture **full** (GitNexus `present`, freshly queried
  2026-08-10).

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` returned
GitNexus `present` (freshly checked 2026-08-10). Posture: **full**.
`impact(createDetachedMergeWorktree, upstream)` confirms LOW risk, one
caller, one affected module (`Runner`) — matches this item's own "a couple
of files, one direct task" tiny-mode framing.

## Canonical references

- `src/runner/worktree.mjs`
- `src/runner/loop.mjs`
- `src/runner/promote-engine.mjs`
- `bin/fgos.mjs`
- `test/runner/worktree.test.mjs`

## Outstanding questions

None
