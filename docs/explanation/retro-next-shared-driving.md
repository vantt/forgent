---
authoritative_for: retro-next launcher/driver split, status-as-full-lifecycle-axis, awaiting-approval default-overridable ceiling, launcher/orchestrator/driver vocabulary
---

# `/fgOS:retro-next` became a thin launcher — and the whole retro-loop this doc set was written by runs on it

`tsk-3cx` locked the design that turned `/fgOS:retro-next` (and
`/fgOS:cleanup-next`) from hand-rolled, one-off invoke-skill/move/
classify sequences into thin launchers delegating to
`fgos-coding-driving`, the same shared mechanism `/fgOS:pick`,
`/fgOS:discover`, `/fgOS:decompose`, and `/fgOS:discover-next` already
used. Every retrospective-synthesis doc in this repo's `docs/explanation/`
tree written during this session's own retro-loop run was produced
through the exact mechanism this item designed.

## The problem this closed

`retro-next` already resolved `skillMap.retrospective` correctly
(registry-based, matching `fgos-coding-driving`'s own lookup), but then
ran its own ad hoc invoke-skill / `fgos move --to cleanup` /
classify-by-raw-exit-code sequence instead of delegating. That meant
thinner park/anchor handling than the shared driving loop, and no
automatic inheritance of future driving improvements.

## Round 1 got the framing backwards — and the correction became the design

The item's own first research round treated `status`'s post-merge chain
(`retrospective → cleanup → done`) as a tail segment bolted onto the
"real" lifecycle, and the driver's `awaiting-approval` stop as a wall
nothing could legitimately cross — under that framing, delegating
`retro-next` to the driver looked identical to a shape a prior, unrelated
decision (`stage-status-driving-coordination`) had already rejected, and
the round returned `unclear`.

The user rejected that framing and supplied the vocabulary the rest of
the design locked around: **orchestrator** (chooses/coordinates across
many items), **launcher** (activates one item, sets its ceiling),
**driver** (drives the process on one item — skip what's already passed,
land on the current step, stop at the ceiling). Re-derived against that
vocabulary, `status` turned out to be the *whole* lifecycle axis
(`todo → doing → awaiting-approval → delivered → retrospective → cleanup
→ done`, plus the `blocked`/`awaiting-human`/`wontfix` branches — ten
values spanning the entire item lifetime), with `stage` only a sub-axis
meaningful pre-merge. Round 1 had it backwards: `status` was called "the
post-merge chain" when it is actually the full axis `stage` sits inside
of. Three of round 1's four "structural break" objections dissolved
under the corrected framing; the fourth (the human merge gate) became a
locked design element instead of a rejection reason.

## The five locked decisions

- **D1** — the driver's advance-axis generalizes to resolve each
  iteration's next step from the item's **current position** (`stage`
  pre-merge, `status` post-merge), not hardcoded to `domain.stages`. Not
  a new axis — `skillMap` (`workflow-stage-graphs.mjs`) already held both
  vocabularies in one frozen object by decision `0027` D5; only the
  driver hadn't caught up to that registry shape.
- **D2** — `awaiting-approval` changes from an unconditional hard stop
  into the **default, overridable ceiling**. A ceiling-less launcher
  still stops there (unchanged observable behavior); an explicit further
  ceiling (e.g. `status:cleanup`) drives past it. Named cost, explicit
  on purpose: the human merge gate is no longer structurally enforced by
  the driver refusing — it's protected *by convention* (no launcher
  ships a default ceiling past `awaiting-approval`). Accepted
  deliberately: ceiling becomes the single mechanism deciding drive
  distance, no hardcoded exception inside the driver.
- **D3** — `/fgOS:retro-next` sets `ceiling: status:cleanup`. Observable
  behavior stays byte-identical (sweep → pick one → run the domain's
  retrospective skill → land at cleanup → stop); only the mechanism
  underneath changes.
- **D4** — `/fgOS:cleanup-next` folded into the same redesign, shrinking
  to a launcher the same way. `skillMap` deliberately has no `cleanup`
  entry, so the driver resolves no skill there and stops, letting the
  caller's own mechanical verb finish the job.
- **D5** — no new `waiting-ttl` park reason needed. A round-2 proposal to
  add one (to stop the driver misreading `cleanup → blocked` as a real
  failure) was scout-falsified: `pickNextCleanupItem` is already
  pre-filtered to only pass TTL-elapsed items, so the driver never
  receives an item still waiting on TTL.

## Where the actual code landed

`tsk-3cx` itself locked the design and split implementation into three
children, all delivered and already cleaned up: `tsk-2sr` (generalized
`fgos-coding-driving`'s advance-axis per D1/D2), `tsk-3i4` (shrank
`/fgOS:retro-next` to the launcher shape per D3), and `tsk-kia` (aligned
`/fgOS:cleanup-next` to the same launcher vocabulary per D4, including
the `stop-reason: lock-timeout` marker line the retro-loop skill itself
keys its own stop condition on).
