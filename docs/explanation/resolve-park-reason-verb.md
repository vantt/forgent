---
authoritative_for: resolve-park-reason verb, clearing stale reason/parkReason on done/wontfix items, distinct from tsk-2jz's detection-layer fix
---

# A new verb clears stale park text left on closed items — the field could never be cleared before

`tsk-3hks` closed a real gap: `fgos edit` had no field to clear a stale
`reason`/`parkReason` left over from a `system-error` park event, even
after the item reached `status:done` and was closed by a human.

## Confirmed live on 3 items already known safe

Three done+closed items — `tsk-64h`, `tsk-2sr`, `tsk-3um` (the same
items behind [`tsk-2jz`'s own blind-spot investigation](cleanup-harness-checkmerge-blind-spots.md))
— each still carried the old park text ("commit X is no longer
reachable from `fgw/<parent>` — the merge may have been force-pushed
away or history rewritten") in their `reason` field, even though for
`tsk-64h` and `tsk-3um` the content was directly confirmed present on
`main` (`git merge-base --is-ancestor`/grep checks), and `tsk-2sr`'s
underlying substance appeared carried forward by later edits under
different wording.

## The precedent this extends, and the gap it left

Same class of stale field `tsk-3ft` already diagnosed for `tsk-47e` (D2:
diagnostic-only, never auto-recover) — but `tsk-3ft`'s own fix scope only
made `checkMergeStillResolves`'s failure message distinguish "reset to
divergent history" from "genuinely lost." It never added a way to clear
the stale text once a human manually confirmed safety and closed the
item — so a future reader of `fgos show`/`fgos list` could keep
mistaking historical park text for a live problem.

## Explicitly not a dependency of the adjacent detection-layer fix

Named directly in the item's own description: `tsk-2jz` was
independently investigating the same underlying false-block mechanism
for these same 3 items, but at the **detection layer**
(`checkMergeStillResolves` itself, so the false block never happens
again). This item is the separate, narrower **after-the-fact field-
clearing** capability — for an item that already got manually confirmed
safe and closed before any detection-layer fix existed. Neither item
depended on the other.

## What shipped

A new `resolve-park-reason` verb (`resolveParkReason`,
`src/state/store.mjs`) — not an extension of `fgos edit`'s patchable
field set, the narrower of the two directions the item's description
proposed. Gated strictly: only callable on a **terminal** item
(`status === 'done'` or `'wontfix'`) — refuses on any other status.
Requires a mandatory, non-empty `--note` explaining the resolution,
recorded as its own `work.resolve-park-reason` event rather than
silently overwriting history — the note itself, not just the clearing
action, becomes part of the item's permanent record.
