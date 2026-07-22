---
type: how-to
title: How to check a root item's progress with `fgos rollup`
tags: []
timestamp: 2026-07-22T00:00:00.000Z
source_capture_ids: [doc-fgos-rollup-howto]
---
# How to check a root item's progress with `fgos rollup`

Use this when you have submitted a work item that later got broken into child
items (via decompose), and you want a quick answer to "how far along is this,
overall?" without manually filtering `fgos list` and counting by hand.

## Before you start

- You need the root item's id (the id you get back from `fgos add`/`fgos submit`,
  not a child's id).
- `fgos rollup` is read-only — it never mutates state, so it is always safe to
  run.

## Steps

1. Run the verb with the root item's id:

   ```
   fgos rollup <id>
   ```

2. Read the printed envelope. The `data` object always has this shape:

   ```json
   {
     "id": "<the id you passed>",
     "title": "<the root item's title>",
     "status": "<the root item's current status>",
     "doneCount": <number of direct children with status "done">,
     "totalCount": <number of direct children>,
     "children": [
       { "id": "...", "title": "...", "status": "..." }
     ]
   }
   ```

3. Read `doneCount`/`totalCount` as your "k/n done" answer. `children` lists
   each direct child (matched by its `parent` field) with its own status, so
   you can see exactly which ones are still open without opening `fgos list`
   and filtering yourself.

4. If the item has no children yet, you get a `0/0` result rather than an
   error — that's expected, not a failure. Only a genuinely unknown id fails,
   with a clear `validation` error.

## Example: real output from the live store

This is the actual `fgos rollup` output for a real fgOS work item
(`them-view-rollup-theo-bo-cho-item-goc-6ct`) that shipped the `rollup` verb
itself and, at the time of writing, has no children recorded against it yet:

```json
{
  "data": {
    "id": "them-view-rollup-theo-bo-cho-item-goc-6ct",
    "title": "Thêm view rollup theo bộ cho item gốc",
    "status": "done",
    "doneCount": 0,
    "totalCount": 0,
    "children": []
  }
}
```

That `0/0` with an empty `children` array is exactly the "no children yet"
case described in Step 4 — you can tell at a glance that this item was never
decomposed, rather than wondering whether the command silently failed.

## Scope: one level only

`fgos rollup` only ever counts **direct** children — it does not walk
further down into grandchildren. This is a deliberate scope, quoted here
verbatim from the verb's own implementation comment so it stays exact:

> "Rollup view (P24): direct children only (`w.parent === id`) — decompose
> (P16) is a single-level split, a root's own children never carry further
> `parent` chains of their own in current data, so walking deeper would add
> complexity with nothing real to show yet (YAGNI over frontier.mjs's
> multi-level `hasOpenDescendant` walk, which exists for a different job —
> gating the frontier, not reporting progress)."
> — real source comment, `bin/fgos.mjs` (`collectRollupData`)

In practice: if a child item is itself later decomposed into its own
children, `fgos rollup <root-id>` still reports that child as one entry in
`children` — it does not recurse into that child's own children to fold
them into the root's `doneCount`/`totalCount`. Use `fgos rollup <child-id>`
directly on that child if you need its own sub-progress.

## Why this exists

The verb exists because filing and progress-tracking a root item with several
children used to require manual work. The original request that shipped this
verb, captured in the live dogfood store, put it this way:

> "Một work-item gốc (có field parent trên các item con, dựng từ P16
> decompose) hiện không có cách xem nhanh tiến độ tổng: người phải tự lọc
> list theo parent rồi đếm tay."
> — real `work.add` capture, id `them-view-rollup-theo-bo-cho-item-goc-6ct`

(In short: a root item with children had no quick way to see total progress —
you had to filter the list by parent and count by hand yourself.)

That same item's own real outcome capture shows it shipped clean on its
second pass, one attempt, no errors:

> `"actual":{"outcome":"proposed","passed":true,"attempts":1,"errorClass":null,"aheadCount":1,"visits":2}`
> — real `work.outcome` capture, id `them-view-rollup-theo-bo-cho-item-goc-6ct`

and closed through the normal settlement path — a `clarify-pass` by the
runner, then a human `close`:

> `{"kind":"clarify-pass","actor":"runner", ...}`, `{"kind":"close","actor":"human", ...}`
> — real settlement capture, id `them-view-rollup-theo-bo-cho-item-goc-6ct`

## Related

- `fgos check <id>` — full outcome/friction/settlement history for an item,
  including the entries quoted above.
- `fgos list` — the full work list, if you need more than one root item's
  direct children.

## Document history (compound-learn capture linkage)

This doc's path (`docs/how-to/check-rollup-progress.md`) is itself linked
to a real compound-learn capture, gathered via `fgos doc-sources
docs/how-to/check-rollup-progress.md`:

> ```json
> {
>   "id": "doc-fgos-rollup-howto",
>   "predicted": null,
>   "actual": null,
>   "docType": "how-to",
>   "docPath": "docs/how-to/check-rollup-progress.md"
> }
> ```
> — real `work.outcome` capture, id `doc-fgos-rollup-howto`

That capture's own work item is the task that asked for this very document:

> "Write end-user how-to doc for fgos rollup verb"
> — real work item title, id `doc-fgos-rollup-howto`

This capture carries only a `docType`/`docPath` tag (no `predicted`/`actual`
metrics of its own) — a light exercise of the grow-per-docPath mechanism
rather than a rich merge. If a later capture links to this same docPath,
the export skill accumulates it here too, additively, without losing this
section or anything above it.
