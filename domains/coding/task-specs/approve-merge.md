# task-spec: approve-merge

domain: coding | role: reviewer | reason: review | authority: hard-gate | requires-skill: fgos-coding-validating

## Input
- An item at `awaiting-approval`, review already rendered by `review-item`.

## Output
- `approve` (merges into main, or the parent branch for a non-root leaf)
  or `reject` (back to `doing`, reason recorded).

## Gates
- CTR005 — hard, one-way (D5): once approved and merged, this is not
  reversible by re-crossing the gate; rework after merge is a new item.

## Verify-template
- The item's own `verify`, re-checked as part of the merge path — never
  redesigned here.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| No trigger — this task carries `authority: hard-gate` (D10/D12); only an agent-type/human whose `claims`/role grants that authority may exercise it, and it makes no calls of its own | — | | | |
