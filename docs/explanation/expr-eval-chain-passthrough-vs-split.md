---
authoritative_for: pass-through vs split-into-deps-chain decomposition judgment, tsk-2ua expr-eval-chain dogfood scenario
---

# A same-PR import dependency is not grounds for a `deps`-chain split

`tsk-2ua` (dogfood-fixture's `expr-eval-chain` replay scenario — an
arithmetic expression evaluator: `tokenize.mjs` → `evaluate.mjs` →
`index.mjs`, each importing the previous) shipped as one pass-through
item, not split into three claimed work items with a `deps` chain.

## The tension

`dogfood-fixture/scenarios/expr-eval-chain.md` names a multi-child
decompose (three claimed items linked by `deps`) as its own "Expected
shape" — the scenario exists specifically to exercise fgOS's decompose/
`deps`-chain lifecycle for MVP2 interactive-vs-headless parity testing.
But the same scenario doc explicitly allows a pass-through as legitimate
signal too, rather than mandating the split outcome.

## The judgment made

Three functions of ~15-20 lines each, one cohesive feature, no
independent ownership boundary that benefits from separate worktrees,
branches, or merges. `evaluate.mjs` importing `tokenize.mjs`'s output
shape is ordinary same-PR file sequencing — the same kind of dependency
that exists between any two files in a single commit — not a reason on
its own to fragment into three separately claimed, separately merged work
items. Splitting here would have been fragmentation for the scenario's
sake, not a real ownership or review boundary.

## Why this is worth stating explicitly

The general rule this item's own planning made concrete: **a `deps` chain
between work items should track a real boundary** (independent claim/
review/merge, or genuinely separable scope) **— not merely "file B imports
file A."** Import dependency alone is resolved by normal same-PR write
ordering, not by the work-item decomposition mechanism. A future planner
sizing a similarly small, single-PR-sized feature with an internal
call/import chain should default to pass-through unless something beyond
the import relationship (ownership, review surface, independent
mergeability) actually motivates a split.
