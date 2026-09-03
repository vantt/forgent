---
framework: diataxis
mode: reference
---
# `driftStatus`'s real return shape

`driftStatus(repoRoot, view)` (`src/state/drift-status.mjs`, `tsk-5m7`,
child of `tsk-3bn`) computes drift status for every root branch
reachable from `view`'s work state — read-only, git-inspecting.

## Where a "root" comes from

Any item that is some other item's `parent`:

```js
function findRootIds(work) {
  const rootIds = new Set();
  for (const item of Object.values(work)) {
    if (item.parent) rootIds.add(item.parent);
  }
  return rootIds;
}
```

## Return shape

`{ [rootId]: { branch, target, aheadOfTarget, behindTarget, lastSyncedTip, needsSync } }`

| Field | Type | Meaning |
|---|---|---|
| `branch` | string | `fgw/<rootId>` |
| `target` | string | `main`'s real detected name (`detectTrunk`, never a hardcoded `'main'` literal) — unless the root itself has a `parent` (nested root), in which case the target is `fgw/<parentId>`, supporting nesting deeper than one level |
| `aheadOfTarget` | number | commits on `branch` not yet in `target` |
| `behindTarget` | number | commits on `target` not yet in `branch` |
| `lastSyncedTip` | string \| null | `git merge-base(target, branch)`, or `null` if no common ancestor (orphan branch) |
| `needsSync` | boolean | `aheadOfTarget > 0 && !RESOLVED_STATUSES.has(rootItem?.status)` |

A root whose `fgw/<id>` branch doesn't exist locally (never created, or
already cleaned up after merge) is **omitted entirely** from the result
— never reported as an error. If the target branch itself doesn't exist
either (and isn't trunk), that root is also skipped.

## Why it lives outside `graph-harness.mjs`

```js
// drift-status.mjs — read-only, git-inspecting drift check per root branch
// (tsk-3bn, docs/history/tsk-3bn-merge-conductor-harness-v2/). Kept OUT of
// graph-harness.mjs deliberately: that file declares itself pure ("no fs,
// no Date.now(), no event append, no mutation"), while this module shells
// real git subprocesses — a different testing/mocking story.
```

`graph-harness.mjs` is pure by its own declared contract; `driftStatus`
genuinely shells real `git` subprocesses (`execFileSync`), which is a
different testing/mocking story entirely — kept in its own module rather
than blending purity classes inside one file.

## Why it's never cached

```js
// NOT cached (D4, docs/history/tsk-3bn-merge-conductor-harness-v2/
// CONTEXT.md): every field here is recomputed fresh from git refs on each
// call. `lastSyncedTip` in particular is `git merge-base` re-run live, not
// a stored "last-known-synced-tip" file — avoids a second state-consistency
// surface next to `events.jsonl`, which is already known fragile under
// concurrency (tsk-3wq).
```

Every field is recomputed fresh from git refs on each call — deliberately
avoiding a second state-consistency surface alongside `events.jsonl`,
which is already known fragile under concurrency.

## Real usage: how this item itself was closed

`tsk-5m7` is a pull-door-sourced child item (worked directly inside
`tsk-3bn`'s own worktree, not a separate `fgw/tsk-5m7` branch), which
changes how it gets closed:

> Closed via `fgos move` to delivered, not `approve`: item is
> pull-door-sourced (classifySource != runner, `headAtTake`/`headAtReturn`
> set, code committed directly on `fgw/tsk-3bn`... No separate branch
> exists to merge — `approve`'s own worktree guard also structurally
> refuses to run from inside this linked worktree. Iron Law already
> checked `required:false` (changedFiles=[] for the same pull-door
> reason). `return` already ran the real verify command (8/8 pass) and
> confirmed a real commit advance (aheadCount:1) before this transition.

For an item with no separate branch to merge, forcing it through
`approve` would hit a guard that exists to prevent false verification on
a different checked-out branch — the underlying work was already proven
by `return`'s own real verify run, so only the bookkeeping transition
(`move` to `delivered`) was still needed, not a merge.
