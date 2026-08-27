---
framework: diataxis
mode: explanation
---
# Why `mergeSets` groups conflicts instead of dropping them from `ready`

`mergeReadiness` used to silently drop a conflicting pair from `ready`
with no further signal about *why* or what to do about it.
`mergeSets` (`tsk-2u0`, the 4th and final child of `tsk-3bn`'s
merge-conductor-harness-v2 effort) replaces that silent drop with an
explicit `{items, order, reason}` entry — D2's stated goal: never lose
visibility into why something isn't merging, or how it eventually
should.

## Two distinct reasons, two distinct visibility rules

```js
// `mergeSets` — D2's replacement for "silently drop a conflicting pair
// from ready": `{items, order, reason}` entries, `reason:
// 'footprint-overlap' | 'shared-root'` (`'deps-chain'` stays
// conceptually inside `waiting` per this cell's own locked
// assumption, plan.md). `footprint-overlap` sets are the connected
// components of `conflicts` (a chain of overlapping pairs becomes ONE
// set, not several) — items here are NOT in `ready` (same exclusion
// `conflicts` already caused). `shared-root` sets are 2+ `ready`
// candidates resolving to the same root — items here STAY in `ready`
// too (informational ordering, not a new exclusion). `order` is
// `rankImpact`'s own relative order within the set (D2's permissive
// default: auto-serialize in that order; only escalate if a
// serialized re-check itself still conflicts — the re-check itself is
// Layer 2's job, not this pure function's).
```

- **`footprint-overlap`** — items here are *not* in `ready`, the same
  exclusion `conflicts` already caused before `mergeSets` existed. What
  changes is that the whole overlapping chain is now grouped into one
  set instead of being reported as disconnected pairs.
- **`shared-root`** — items here *stay* in `ready` — this is purely
  informational grouping, never a new exclusion. Two or more ready
  candidates resolving to the same root are surfaced together so a
  caller can see they'll compete for the same merge target, without
  being blocked from merging.

`'deps-chain'` was considered as a third reason but deliberately stayed
conceptually inside `waiting` instead — this cell's own locked scope
assumption, not a gap.

## Why footprint-overlap sets are computed with union-find

```js
const find = (parents, x) => {
  while (parents.get(x) !== x) x = parents.get(x);
  return x;
};
const parents = new Map();
for (const id of conflictedIds) parents.set(id, id);
for (const { a, b } of conflicts) {
  const ra = find(parents, a);
  const rb = find(parents, b);
  if (ra !== rb) parents.set(ra, rb);
}
```

A chain of overlapping pairs (A↔B, B↔C) becomes **one** `mergeSet`, not
two separate `{A,B}` and `{B,C}` entries — a minimal union-find, scoped
to this one call, never persisted. Reporting the chain as one connected
component is what lets a caller reason about the whole cluster at once
instead of reassembling the graph themselves from pairwise conflicts.

## Why the escalation default is permissive, not conservative

D2 (locked in `tsk-3bn`'s own decisions) chose a permissive default:
auto-serialize the conflicting items in `rankImpact`'s own relative
order (`order` field), and only escalate to a person if a serialized
re-check *itself* still conflicts. This pure function only computes the
grouping and the proposed order — actually attempting the serialized
re-check is explicitly Layer 2's job, not `mergeReadiness`'s own
concern; keeping the pure/impure boundary the same one `driftStatus`
already established for this same effort.

## `mergeTier`, restated for completeness

Every `proposed` item gets a `mergeTier` of `'leaf-to-root'` (has a
`parent`) or `'root-to-main'` (no `parent`) — the same field `tsk-3bn`'s
own design locked under the name `mergeTier`, not the canonical reports'
bare `tier`, specifically to avoid colliding with the pre-existing,
unrelated `work.tier` cost-tier field.

## How this item itself was closed

Same pull-door reasoning as its three siblings (`tsk-5m7`, `tsk-50i`,
`tsk-62y`): code committed directly on `fgw/tsk-3bn`, no separate
`fgw/tsk-2u0` branch, `approve`'s worktree guard structurally refuses
from here — closed via `fgos move` to `delivered` instead. Iron Law was
`required: false`, and `return` had already verified 2232/2232 tests
passing (5 pre-existing skips) before this transition — completing all
four children of `tsk-3bn`'s original merge-conductor-harness-v2 design.
