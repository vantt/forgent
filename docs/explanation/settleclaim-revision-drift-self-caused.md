---
authoritative_for: fgos edit not refreshing an active claim's preClaimRevision snapshot, so settleClaim's CAS check (from tsk-40m's runtime-claim/doing separation) rejected an item legitimately edited by its own claiming session between pick and return — "settleClaim: item durable revision changed from X to Y" — even though the SAME writer caused the change, not a real concurrent conflict; blocked the common pick -> edit --verify -> return workflow this session itself relies on; fixed via revisionDriftIsSelfCaused (tsk-1ht)
---

# A CAS check that couldn't tell "I changed this myself" from "someone else changed this"

`tsk-40m`'s runtime-claim/`doing` separation introduced a CAS
(compare-and-swap) check on `settleClaim`: before returning an item, it
compares the item's current durable revision against the revision
captured when the claim was acquired (`preClaimRevision`), refusing if
they differ — the mechanism that protects against a real concurrent
conflict.

## The gap: `fgos edit` never refreshes the snapshot it invalidates

`fgos edit` legitimately changes a claimed item's own durable content
(kind, docsRef, footprint, action, priority, stage) — but its write path
(`editWork`, `src/state/store.mjs`) never touches the claim record under
`.fgos/runtime/claims/<id>.json` to refresh `preClaimRevision` afterward.
So the very next `settleClaim` at `return` compares the STALE snapshot
against the new revision `edit` itself created, and refuses — even though
the same writer caused the change.

## Confirmed live, reproduced deterministically, twice

- **`tsk-2n2`**: `pick` → `fgos edit --verify ...` → `return` failed
  identically on every retry (not a transient race) with `settleClaim:
  item durable revision changed from X to Y`. Traced to
  `store.mjs:1101-1105`'s `preClaimRevision` check against
  `runtime-coordination.mjs`'s `getItemDurableRevision` (a sha256 of
  `JSON.stringify(item)`) — `editWork`'s write path never updates the
  claim record.
- **`tsk-1ef`**: claimed early at discovery (per `/fgOS:cook`'s own
  documented claim-before-discovery pattern), several `fgos edit` calls
  touched the item between claim and return, and `fgos return` refused
  twice identically (`exit 3`). Confirmed this wasn't tied to one specific
  caller — the mismatch between `tsk-40m`'s `settleClaim` design and
  `cook`'s own claim-before-discovery pattern was real and general.

The design doc itself
(`docs/architect/doing-coordination-redesign.md:666`) had already named
"an explicit reconcile path" as the intended answer for exactly this case
— but no such path existed at the time: `catchup` is blocked-only,
`take --id` refuses an already-claimed item, and `resync-worktree` is
unrelated (git-only).

## The cost while unfixed, and the workaround used

This blocked the extremely common `pick → edit --verify → return`
workflow — a workflow this same session had used successfully many times
before this CAS check landed. The unblock used on `tsk-2n2` (user-approved,
explicitly not a real fix): hand-correct the single `preClaimRevision`
field in the gitignored runtime claim file to the freshly-recomputed real
value (`foldEvents(readRawEvents(dir))` then `getItemDurableRevision`).
Never something that should require touching `.fgos/runtime/` by hand.

## The real fix, landed under `tsk-1ht`

`tsk-1hq` and `tsk-1ef` turned out to be the same bug already fixed on an
unmerged branch, `fgw/tsk-1ht` (commit `f6e7c63d` at diagnosis time, later
merged as `d6a2169c`) — a helper named `revisionDriftIsSelfCaused`
distinguishes a revision drift caused by the claim's own writer from a
genuine concurrent conflict, so `settleClaim` no longer refuses an item
whose only "drift" is its own legitimate edit. `tsk-1hq` itself shipped no
code — its own action was confirmed as a verified duplicate (D1: "no code
change — `tsk-1hq` is a verified duplicate of `tsk-1ht`... follow
`tsk-2uh`'s precedent and point verify at the existing regression suite").

## A recursive footnote

Diagnosing this bug hit the exact bug it was diagnosing: the discovery
engine's own internal write sequence (a priority-bump edit plus a stage
move) invalidated its own `preClaimRevision` before its own `settleClaim`
step, so the parking-to-`awaiting-human` leg threw the identical
`"durable revision changed"` error while investigating this very item.
