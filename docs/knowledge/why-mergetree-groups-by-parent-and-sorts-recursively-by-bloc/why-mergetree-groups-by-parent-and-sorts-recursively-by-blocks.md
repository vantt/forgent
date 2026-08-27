---
type: explanation
title: Why mergeTree groups by parent and sorts recursively by blocks
tags: []
source_capture_ids: [tsk-2x9k, tsk-59b]
framework: diataxis
mode: explanation
---
# Why `mergeTree` groups by parent and sorts recursively by `blocks`

`mergeTree(view, opts)` (`src/state/graph-harness.mjs`) turns
`mergeReadiness`'s flat buckets into a nested tree so a person (or
eventually herdr-orchestrator's own automation) can see the real merge
queue's dependency shape instead of five separate flat lists. It exists
because the flat view answers "what's ready" but not "what does the real
merge order look like, and what's blocking what."

## Only one execution model exists — the tree reflects that, not a new mechanism

Every item, leaf or root, merges through the same `approve` verb, which
resolves its own target branch dynamically (leaf → `fgw/<root>`, root →
`main`). There is no separate "parent merges its children" step — a
decomposed item's children merge their own branches directly into the
same resolved root. `mergeTree` groups strictly by `item.parent`, because
that field already *is* the real merge topology; no new grouping concept
was invented.

## The tree includes every bucket, not just `ready`

`mergeTree` draws from all of `mergeReadiness`'s buckets — `ready`,
`waiting`, `blockedOnSync`, every id inside `mergeSets`, and
`supersededOut` — not only the immediately-mergeable ones. A child stuck
in `waiting` or `blockedOnSync` still has to eventually merge into its
parent; hiding it from the tree would defeat the point of a
bottleneck-visualizing view. The tradeoff this accepts: the tree can be
larger and noisier than a "what can I merge right now" list, in exchange
for actually showing where the real congestion is.

## Bottleneck-priority sort is recursive, not top-level-only

Sort ordering by "how many other open items does merging this one
unblock" (`rankImpact`'s existing `blocks` field, reused as-is — no new
metric) applies at every nesting level: the top-level root set, and each
parent's own children group. A child group sorted only by insertion order
while the top level got the real bottleneck-priority treatment would
undersell exactly the case the tree exists to surface — a congested
subtree several levels deep.

## Why the sort/tree logic lives in JS, never in herdr-plugin's Rust rendering

The tree-construction and sort logic is built entirely in
`graph-harness.mjs` (or a sibling state-layer module) — herdr-plugin's
Rust code only parses and displays what the JS engine already computed.
The reason is a consistency guarantee, not a language preference:
`merge next`/`merge-loop` read `mergeReadiness(view).ready[0]` directly
to decide what actually gets merged next. If sort logic existed
independently in Rust for display purposes, the tree order a person sees
and the order automation actually executes could silently diverge —
looking correct on screen while doing something different underneath.

## `blockedOnSync` needed real wiring, not just a bare id

Before this change, `blockedOnSync.push(item.id)` (`graph-harness.mjs`)
only pushed the bare item id — `driftStatus`'s own detail for *why* that
root needed syncing was computed but never attached to what
`mergeReadiness` actually returned. A tree node showing "blocked" with no
reason forces a reader back to a separate `fgos drift`/`doctor` call to
find out why. This item wired that detail through so a blocked node can
show the specific reason (e.g. "blocked: root needs sync") directly,
matching the same level of detail `mergeSets`' own `reason` field and
`conflicts`' `{a, b, shared, suggestions}` shape already carried for
their own blocked cases — closing the one bucket that was still
comparatively coarse.

## What stayed unchanged on purpose

`mergeReadiness`'s own existing return shape was never touched —
`mergeTree` is purely additive, exposed as a new field (`tree`) through
`bin/fgos.mjs`'s `merge list` sub-verb, never a breaking change to what
any existing caller of `mergeReadiness` already reads.

## Why herdr-plugin's Rust side only parses and paints the tree, never re-sorts it

The MERGE LIST box in herdr-plugin used to mirror `fgos merge list --json`'s
`ready`/`waiting`/`blockedOnSync` as three flat lists
(`herdr-plugin/src/fgos.rs`, `app.rs`), with no `parent`/`mergeTier`
read at all. Once `mergeTree` existed as a field on that same JSON
response, `MergeListSummary`/`app.rs`'s rendering changed to walk the
tree instead — indenting each node by its real depth and drawing a
status badge per node (`ready`/`waiting`/`blocked-sync`/`conflicted`/
`superseded`), with a blocked or conflicted node showing the specific
reason and counterpart item rather than a bare status word.

The task's own scope statement is explicit that this is a pure
consumption change: "Rust KHÔNG tự sort hay tự tính lại thứ tự (D4) --
chỉ đọc và vẽ lại đúng những gì JS engine đã tính" ("Rust does not sort
or recompute order itself — it only reads and redraws exactly what the
JS engine already computed"). This mirrors the reason the sort/tree
logic lives in `graph-harness.mjs` in the first place (above): if the
Rust rendering layer sorted independently for display, the order a
person sees in the MERGE LIST box and the order `merge next`/
`merge-loop` actually execute could silently diverge. Keeping render as
a pure function of the JS-computed `tree` field — depth for indentation,
per-node status for the badge, `reason`/counterpart for blocked or
conflicted nodes — is what keeps the two views from ever disagreeing.

This item ran to completion on its first attempt with no recorded
friction: once the `tree` field's shape was locked by the engine task,
translating it into indentation and badges was mechanical, not a design
decision in its own right.

## Related

- `docs/history/merge-list-tree-bottleneck-priority/CONTEXT.md` — full
  decision record (D1–D7) this design implements.
- `docs/history/merge-list-tree-bottleneck-priority/DISCUSSION.md#task-merge-tree-render`
  — the render task's own scope and D-ID mapping.
- `docs/how-to/check-whether-a-suspected-mechanism-ever-fired-before-fixing-it.md`
  — D5's own separate lesson from the same design discussion (the
  retracted `fgos-fanout` hypothesis that motivated this feature's real
  scope).
