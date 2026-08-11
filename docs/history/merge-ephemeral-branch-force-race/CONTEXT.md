# Fast-forward race in withMergeEphemeralWorktree's final branch -f

## Feature boundary

Fix the specific data-loss race where two concurrent merges into the same
`fgw/<rootId>` branch (e.g. two leaf approves landing near-simultaneously)
can silently clobber each other: the second `git branch -f` to run wins,
overwriting the branch tip and discarding the first merge's commit with no
error, no conflict, and both sessions reporting success. Not in scope:
`createWorktree`'s reclaim/relocate path (a different, already-fixed
concern — `docs/history/merge-worktree-reclaim-clobbers-kept-checkout/`),
picking/claiming a worktree, or designing this item's `verify` command
(left to `fgos-coding-planning`).

## Root cause (scout evidence, verified against live code)

- `withMergeEphemeralWorktree` (`src/runner/worktree.mjs:639-658`) captures
  `startCommit` — the branch's tip at that moment — via
  `createDetachedMergeWorktree` (`worktree.mjs:610-637`), *before* any lock
  is acquired.
- The caller's `fn` (`mergeRunnerItem`, `src/runner/merge.mjs:619-679`)
  acquires `acquireMainCheckoutLock` only around
  `mergeRunnerItemLocked` — the merge + commit inside the *ephemeral*
  detached checkout — then releases it in its own `finally` before control
  returns to `withMergeEphemeralWorktree`.
- Back in `withMergeEphemeralWorktree`, once `fn` resolves,
  `git branch -f branch endCommit` (`worktree.mjs:652`) runs completely
  outside any lock and with no check that `branch`'s live tip still equals
  the `startCommit` this session captured — it unconditionally force-moves
  the branch to `endCommit` (which was built on top of the *stale*
  `startCommit`).
- Net effect for two sessions A and B merging different leaves into the
  same root at nearly the same time: both capture the same `startCommit`
  C0 (before either's lock acquisition). The main-checkout lock only
  serializes their merge+commit steps, not the final ref update. Whichever
  session's `branch -f` runs second overwrites the branch to point at its
  own `endCommit` (built on the stale C0), making the first session's
  `endCommit` unreachable from the branch tip — silent loss, verified
  empirically per the item's own description (`merge-base --is-ancestor`
  check on the first commit against the final tip fails).
- `acquireMainCheckoutLock` (`src/runner/main-checkout-lock.mjs`) is a
  **single global lock for the whole repo checkout**, not scoped per
  branch — used to detect any writer touching the main checkout's own
  `.git/index` (STR65). Its own module doc frames it as meant to be held
  as briefly as possible.

## GitNexus impact-analysis posture

`impact-analysis: full` — GitNexus registered and `present`
(`fgos tool query --capability impact-analysis --status present`), checked
fresh this session. `mergeRunnerItem` callers confirmed via GitNexus graph:
called by `retargetMember` and `merge.test.mjs` only; `mergeRunnerItemLocked`
called only by `mergeRunnerItem`.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix via a compare-and-swap check on the branch's live tip, done right before `git branch -f` in `withMergeEphemeralWorktree` — **not** by widening `acquireMainCheckoutLock`'s held duration to cover the whole function. Rationale: the lock is a single global (not per-branch) lock explicitly designed to be held briefly; widening it to also cover `mergeRunnerItemLocked`'s verify step (which can run tests/builds, seconds to minutes) would bottleneck every writer in the repo for that whole duration, while the actual race is confined to one line. CAS matches the fix's scope to the bug's real scope. |
| D2 | When the CAS check in D1 finds the branch has moved since `startCommit`, fail loudly through the existing `merge-fail` error category — no automatic in-function retry. Rationale: an automatic retry inside `mergeRunnerItem` would silently re-run `runGoalCheck`/verify a second time, which can be expensive (network/test suite) with no visibility to the caller. `merge-loop` already owns retry/stop semantics for this exact shape of failure (its "same item blocked twice in a row" rule) — that is the correct layer to own retries, not a second ad hoc mechanism inside `merge.mjs`. |

## Pinned terms

- **CAS (compare-and-swap) check** — re-reading `branch`'s live tip
  (`git rev-parse branch`) immediately before `git branch -f`, and only
  force-moving when it still equals the `startCommit` captured at the
  start of `withMergeEphemeralWorktree`. If it has moved, the merge is
  stale and must not overwrite the branch.
- **Race window** — the span between `createDetachedMergeWorktree`
  capturing `startCommit` (`worktree.mjs:614`) and `branch -f`
  (`worktree.mjs:652`), regardless of the main-checkout lock's own
  acquire/release inside that span.

## Scout paths and evidence

- `src/runner/worktree.mjs:588-658` — `withMergeEphemeralWorktree`,
  `createDetachedMergeWorktree`.
- `src/runner/merge.mjs:619-679` — `mergeRunnerItem`'s lock acquire/release
  scope.
- `src/runner/main-checkout-lock.mjs:1-40` — lock is global per repo
  checkout, not per branch; module doc states the "hold briefly" design
  intent.
- `src/runner/promote-engine.mjs:72-73` — confirms `withMergeEphemeralWorktree`
  wraps `mergeRunnerItem` for the leaf-into-root merge path this bug
  targets.
- `docs/history/merge-worktree-reclaim-clobbers-kept-checkout/CONTEXT.md` —
  prior, separate fix in the same area (tsk-5yp); this item's race is a
  different failure mode in the same merge flow, introduced/exposed by
  that fix per the item's own description.

## Outstanding, deferred to planning

- Exact implementation of the CAS check (where to insert the tip re-read,
  what git command, how the mismatch is surfaced as a `MergeError`) — an
  implementation choice, not a product decision.
- The item's `verify` field (currently a placeholder,
  "chưa xác định — P15 bổ sung") needs a concrete, runnable command —
  left to `fgos-coding-planning`, per this skill's own scope boundary.
