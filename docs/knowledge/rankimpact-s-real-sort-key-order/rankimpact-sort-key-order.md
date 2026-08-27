---
framework: diataxis
mode: reference
---
# `rankImpact`'s real sort-key order

`rankImpact` (`src/state/impact.mjs`) ranks open work items for
blocking-fan-out impact. Its comparator (`src/state/impact.mjs:98-103`):

```js
ranked.sort((a, b) => (
  tierRank(a.goalTier) - tierRank(b.goalTier)
  || b.blocks - a.blocks
  || b.componentSize - a.componentSize
  || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
));
```

Sort keys, in actual priority order:

| Priority | Field | Direction | Notes |
|---|---|---|---|
| 1 | `goalTier` | `mvp` (0) before `milestone` (1) before ungrouped (2) | via `tierRank` — this is the PRIMARY key, not a tie-break |
| 2 | `blocks` | descending | blocking-fan-out count; only compared when `goalTier` ties |
| 3 | `componentSize` | descending | dependency/lineage cluster size; only compared when `blocks` ties too |
| 4 | `id` | ascending | final deterministic tie-break |

## Why this table exists

A declared goal (`mvp`/`milestone`) always outranks an equally- or
even more-impactful ungrouped item — `goalTier` is checked FIRST, full
stop. This is easy to get backwards from memory or from a summary written
without re-reading the comparator: `docs/history/merge-standardization/
CONTEXT.md`'s own D3 row originally described it as "blocking-fan-out
count, then `goalTier`" — the reverse of the real order — until building
`src/state/graph-harness.mjs`'s `mergeReadiness` (which reuses `rankImpact`
directly, `tsk-4j9-2`) prompted a re-read of the actual code. The `mergeReadiness`
code itself was never wrong (it calls `rankImpact(view)` and reuses its
real output rather than re-deriving the order), only the prose describing
it was.
