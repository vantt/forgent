# `pickNextDiscoverItem`'s real sort-key order

`pickNextDiscoverItem` (`src/state/discover-pool.mjs`, tsk-3go-1) picks
the single next item for an interactive discover-loop iteration to run
`fgos discover`/`fgos plan` on. Pure — no `fs`, no `.fgos/` read,
same discipline as `frontier.mjs`/`impact.mjs`. It covers the
`stage:clarify`/`stage:decompose` pool that `frontier()` itself
deliberately excludes (`frontier()` only ever surfaces `stage:executing`
items).

## Candidate filter

Only `status: 'todo'` items in `stage: 'clarify'` or `stage: 'decompose'`
are candidates:

```js
const CANDIDATE_STAGES = new Set(['clarify', 'decompose']);

function isCandidate(item) {
  return item.status === 'todo' && CANDIDATE_STAGES.has(item.stage);
}
```

## Pool precedence

`stage: 'clarify'` candidates always win over `stage: 'decompose'` ones
when both pools are non-empty — clarify-stage ambiguity blocks
everything downstream for that item, including its own eventual
decompose pass.

## Clarify-pool order

`blocks` DESCENDING, then `urgent` (true first), then declaration order
(FIFO, via `Array.prototype.sort`'s guaranteed stability — the same
technique `frontier.mjs`'s `compareReadyOrder` relies on):

```js
function compareClarifyOrder(blocksById) {
  return (a, b) => {
    const blocksDiff = (blocksById.get(b.id) ?? 0) - (blocksById.get(a.id) ?? 0);
    if (blocksDiff !== 0) return blocksDiff;
    const urgentDiff = (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0);
    if (urgentDiff !== 0) return urgentDiff;
    return 0;
  };
}
```

`blocks` comes from `rankImpact` (dependency-graph-structural, no LLM
call needed). A clarify-stage item has never been discovered yet, so
`work.priority` is unset or a fixed constant and cannot drive ordering
on its own — that's why `priority` is not in this comparator at all.

## Decompose-pool order

`priority` ASCENDING, absent-last, then FIFO — the same shape as
`frontier.mjs`'s `compareReadyOrder`:

```js
function compareDecomposeOrder(a, b) {
  if (a.priority !== b.priority) {
    if (a.priority === undefined || a.priority === null) return 1;
    if (b.priority === undefined || b.priority === null) return -1;
    return a.priority - b.priority;
  }
  return 0;
}
```

`priority` is meaningful here (unlike the clarify pool) because every
item reaching `stage: decompose` has already been through one real
`discover` call, which always computes `priority` as a side effect
regardless of the clear/unclear outcome.

## Return shape

`{ id, stage }` for the picked item, or `null` when no
`stage: clarify`/`stage: decompose` item is `status: todo`.

## Sort keys, in actual priority order

| Pool | Priority | Field | Direction | Notes |
|---|---|---|---|---|
| clarify vs decompose | 0 | pool | clarify wins | clarify candidates always picked first if any exist |
| clarify | 1 | `blocks` | descending | from `rankImpact`, structural, no LLM needed |
| clarify | 2 | `urgent` | true first | only compared when `blocks` ties |
| clarify | 3 | declaration order | FIFO | final tie-break, via stable sort |
| decompose | 1 | `priority` | ascending, absent-last | only meaningful post-discover |
| decompose | 2 | declaration order | FIFO | final tie-break |
