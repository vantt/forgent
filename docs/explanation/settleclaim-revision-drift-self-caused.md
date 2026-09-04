---
authoritative_for: fgos edit not refreshing an active claim's preClaimRevision snapshot, so settleClaim's CAS check (from tsk-40m's runtime-claim/doing separation) rejected an item legitimately edited by its own claiming session between pick and return — "settleClaim: item durable revision changed from X to Y" — even though the SAME writer caused the change, not a real concurrent conflict; fixed via revisionDriftIsSelfCaused (tsk-1ht); also covers a second, independent failure mode of the same helper — missing payload.writer on work.add/decision/discovery/gate-approve events making it fail closed — fixed by stamping item.writer on addWork (tsk-1sr), with the still-open gap of no CLI verb to release a single orphaned runtime claim file
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

## The scope was wider than just `return` (`tsk-1ht`'s own live repro)

While diagnosing this against `tsk-1sl`, trying to park that item with
`fgos ask` after finding the `return`-side bug hit the identical CAS
conflict (`settleClaim` revision-drift, exit 3) — not a `return`-specific
bug. Every exit path off a claimed-and-edited item (`return`, `ask`/park)
runs through `settleClaim`, so before this fix there was no sanctioned way
to move a mid-lifecycle-edited claimed item out of `status:doing` at all,
not even to park it for a person to answer. `tsk-1sl` itself was stuck in
exactly this state at diagnosis time — confirming the gap was general to
`settleClaim`, not local to one caller.

## A second, distinct way the same helper fails closed: missing `payload.writer` (`tsk-1sr`)

`revisionDriftIsSelfCaused` (`store.mjs:1043`) itself has a second gap,
independent of the stale-`preClaimRevision` bug above: it compares
`event.payload?.writer?.id !== claim.writerId` for every in-window event,
and treats a MISSING `writer` field as a DIFFERENT writer — so it fails
closed the moment it hits ANY event that simply never stamps
`payload.writer` in the first place, even when every event in the window
came from the exact same session. `work.add`/`work.decision`/
`work.discovery`/`work.gate-approve` all omitted `payload.writer` (only
`work.edit`/`work.stage` populated it) — an inconsistency across verbs,
not an intentional two-tier design.

Confirmed live three independent times on 2026-08-26: once on `tsk-4jo`
(recovering from a `main-checkout-reset`-discarded `events.jsonl`, then
resubmitting the same id fresh — the stale `.fgos/runtime/claims/<id>.json`
survived the reset since it's gitignored/untracked, carrying the OLD
`preClaimRevision`, and the very first unstamped event the self-heal
examined made it fail closed), and independently again on `tsk-10n` (same
shape: an unrelated `events.jsonl` loss, a resubmit whose `work.add` had
no `payload.writer`, `revisionDriftIsSelfCaused` failing closed on it).
Both were recovered by hand — `tsk-4jo` by deleting the orphaned claim
file directly (`rm .fgos/runtime/claims/tsk-4jo.json`; `readClaim` treats
`ENOENT` as "no active claim", so this is a de-facto but unsupported
release path), `tsk-10n` by hand-bumping the claim's `acquiredAt` past the
unstamped event — both workarounds, not fixes.

**The fix**: `addWork` now stamps `item.writer = resolveWriterIdentity(dir)`
on the item before `appendEventLocked`, mirroring the three existing
sibling call sites (`editWork`/`moveWork`/`replay.mjs`) that already did
this — a single-line additive change, plus a regression test in
`test/state/runtime-coordination.test.mjs` proving a post-claim
`work.add` now reconciles instead of failing closed. Landed under
`tsk-1sr`, commit `a111c239`.

**Still open, not fixed by this item**: there is still no CLI verb to
release a single orphaned runtime claim
(`.fgos/runtime/claims/<id>.json`) once it's genuinely stale — `pick`/
`take` refuse with "already claimed", and the reclaim-eligibility path
(`isReclaimEligible`, `claim-liveness.mjs`) is gated on a ~24h
activity-staleness threshold that a just-orphaned claim won't clear for a
long time. `tsk-1sr` names `fgos-unlock`'s own shape (verify liveness,
refuse and report the holder identity if genuinely live) as the right
pattern to reuse for a single item's claim file, currently scoped only to
`main-checkout.lock` — left as a suggested direction, not implemented.
