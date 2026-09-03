---
framework: diataxis
mode: explanation
---
# Why `mergeReadiness` excludes superseded items

Two independent items can end up solving the exact same problem, with
only one of them actually needing to reach `main`. Before this fix,
nothing in fgOS's merge-readiness graph knew that — a duplicate could
surface as `ready` right alongside the item it duplicated.

## Real evidence, not a hypothetical

- **`tsk-4fu-2`**: a session held `claimRole: session`, but the runner
  independently built and merged the *same* item in parallel — neither
  side aware of the other, racing each other.
- **`tsk-2ib`**: genuinely closed as "duplicate of `tsk-3yl`," but had to
  detour through two FSM hops (`proposed -> todo -> wontfix`) because no
  direct edge existed for "this is a duplicate" — repeated across
  multiple sessions before it finally closed.
- **`tsk-1ua`** (already done) had added `wontfix`/`superseded`/
  `cancelled` statuses to the FSM — but that's the *done-item* layer,
  cleanup after a merge already happened. This item targets a different
  layer: the *graph*, warning *before* merge, not tidying up after.

## Scope boundary

This item only covers detection and warning at the graph/harness layer.
It deliberately does **not** fix `tsk-4fu-2`'s own root cause — the
runner dispatching without consulting session-role claims is a separate
bug at the claim-port/dispatch layer, out of scope here.

## Schema shape

Two new fields, similar in kind to the existing `deps`/`parent`:
`supersededBy: <id>` (directed — this item is superseded by that one)
and `duplicates: [ids]` (undirected — informational only, never gates
anything).

## The real guard, in `mergeReadiness`

```js
// supersededOut (tsk-2ie D2, docs/history/tsk-2ie-duplicate-superseded-
// guard/): exclude any readyIdSet member whose supersededBy target is
// RESOLVED (RESOLVED_STATUSES, same gate deps/mergeAfter already reuse)
// OR itself present in this SAME readyIdSet snapshot (about to merge this
// same round) -- a single pass against the ORIGINAL readyIdSet, checked
// before any deletion, so a mutual pair (A supersededBy B, B supersededBy
// A) is excluded on both sides deterministically rather than depending on
// iteration order. `duplicates` is read by nothing here (D4 --
// informational only).
const supersededOutIds = [];
for (const id of readyIdSet) {
  const target = work[id]?.supersededBy;
  if (typeof target !== 'string') continue;
  if (RESOLVED_STATUSES.has(work[target]?.status) || readyIdSet.has(target)) {
    supersededOutIds.push(id);
  }
}
for (const id of supersededOutIds) {
  readyIdSet.delete(id);
}
```

Two exclusion conditions, either one is enough: the `supersededBy`
target is already `RESOLVED` (reusing the exact same `RESOLVED_STATUSES`
gate `deps`/`mergeAfter` already check), or the target is *itself*
present in this same round's ready set — about to merge in the same
pass. Both checks run against the *original* `readyIdSet` snapshot,
before any deletion happens — this is what makes a mutual pair
(A supersededBy B, B supersededBy A) get excluded deterministically on
both sides, rather than depending on which one the loop happens to visit
first.

`supersededOut` items are permanently excluded from `ready`, and
deliberately never placed in `waiting` either — `waiting` means
"eventually mergeable once a dependency resolves," a different semantic
than "permanently superseded." A `supersededBy` target is required to
actually exist (schema validation); `duplicates` carries no such
requirement and is read by nothing in this guard — purely informational,
per D4.

## Why this stayed a single-plan, no-split item

`judgeDecompose` returned pass-through: the design (D1–D4) was already
locked, `fgos-coding-validating` had already confirmed READY with a real test
run (2233 pass / 0 fail), and the change was scoped to exactly four
files (`work.mjs` validation, `store.mjs` `EDITABLE_FIELDS`,
`graph-harness.mjs`'s new `supersededOut` bucket, `bin/fgos.mjs` CLI
flags) — small and cohesive enough that no split was warranted, with
`tsk-2u0`'s own `mergeAfter` addition as a direct precedent for adding a
new graph-level field the same way.

## A dependency-graph bug this item's own dep chain caught

While tightening this item's `deps`, an ultrathink review caught a real
bug: an earlier `deps: [tsk-3hk]` pointed at an item that had since
closed `wontfix` — satisfying `deps.every(RESOLVED)` even though the
real capability (`graph-harness.mjs`'s clustering/`mergeAfter`/tier
layer this item builds on) didn't actually exist yet, since it had moved
to a different item (`tsk-3bn`) instead. `isDepsAndLineageReady` was
returning `true` before this fix — verified directly via `frontier.mjs`
calls before and after. The dependency was repointed to `tsk-3bn`, then
further tightened to `tsk-3bn`'s specific child holding that layer
(`tsk-2u0`), to avoid unnecessary serialization on `tsk-3bn`'s three
other, unrelated children (drift/sync-root/close-out-guard).
