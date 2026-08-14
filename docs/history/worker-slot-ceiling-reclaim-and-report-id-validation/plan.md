# plan.md — tsk-37t: worker-slot ceiling can't self-unstick + fgos report/decision accepts unknown ids

Mode: standard

2 flags counted — **existing covered behavior** (`src/runner/claim-port.mjs`
is described as "the single choke-point for all claim flows"; `addDecision`
is used by many mechanical callers) and **weak proof around the area**
(the ceiling-drift scenario needs a real drifted-over-ceiling fixture,
not an obvious one-line test). No hard-gate flag. No CONTEXT.md:
discovery verdict was clear.

## Approach

Two independent bugs, same item per the report's own filing (both found in
the same review pass, neither covered by tsk-1oz/tsk-qrs):

**(1) Worker-slot ceiling gate blocks its own escape hatch.**
`hasWorkerSlotRoom` (`src/state/worker-slots.mjs:159-161`, unchanged)
already excludes the target id from occupancy via `excludeId`, but
`free = Math.max(0, ceiling - occupied)` clamps to 0 once occupied (minus
the excluded id) exceeds ceiling — refusing EVERY claim, including a
reclaim of an item already `doing` that doesn't add net occupancy.
`claim-port.mjs`'s ceiling gate (`:197-207`, before this fix) runs before
the stale-claim reclaim pre-check block (`:249+`), so the exact claim a
person needs to clear a drifted-over-ceiling repo is refused before it
ever reaches the reclaim logic. **Chosen fix:** compute the same
reclaim-eligibility condition the existing block already checks
(`isolate && item.status === 'doing' && claimRole is human/session &&
actor is session/human && isReclaimEligible(...)`) BEFORE the ceiling
gate, and exempt the gate when it holds. Reclaiming a `doing` item never
changes `countWorkerSlots`' occupancy count (the item was counted before,
stays counted after), so exempting it from the ceiling never lets the
gate under-count a genuinely NEW claim.

**Alternative rejected:** "apply the gate only while occupied is at or
below ceiling" (the report's own second suggested direction) — rejected
because it would silently let ANY claim through once a repo drifts over
ceiling, not just a reclaim, defeating the ceiling's purpose for new
claims during exactly the window it matters most (a repo already over
capacity). The reclaim-specific exemption is narrower and matches the
item's own root cause precisely.

**(2) `addDecision` accepts a nonexistent id.** `editWork`/`moveWork`
(`src/state/store.mjs:294-301`, `:487-494`) both throw `work "<id>" not
found` before doing anything else; `addDecision` (`:870-879`, before this
fix) validated `text`/`rationale` but never `id`. **Chosen fix:** inside
the existing lock (`withEventsLockAndRefresh`'s callback), when
`payload.id` is present, look it up in a freshly rebuilt view and throw
the identical `work "<id>" not found` shape editWork/moveWork already use
before appending the event. `id` stays optional (a decision not scoped to
one item is legitimate) — only validated when given, matching every
`report`-verb call (which always requires one) and `fgos decision --id`
(optional).

**Risk map:**

| Component | How risky | Proof point |
|---|---|---|
| `claim-port.mjs`'s ceiling gate exemption | Heavy — the single claim choke-point; a wrong exemption condition could let a genuinely new claim slip past the ceiling | A drifted-over-ceiling fixture (ceiling < occupied) proving (a) a genuinely NEW claim is still refused, (b) a stale-claim reclaim of an item already `doing` succeeds |
| `addDecision` id validation | Heavy (Iron-Law-gated: `src/state/store.mjs`) — a core write path many callers use | Existing `store.test.mjs` decision-log tests stay green; new test proves a nonexistent id throws instead of writing an orphaned record |

**Impact-analysis posture:** `degraded` (GitNexus present but stale, same
posture recorded for tsk-2xj this session). Grep/Read used directly
instead — every claim above cites a real file:line.

## Shape

- `src/runner/claim-port.mjs` — add `isPotentialStaleClaimReclaim`,
  computed before the ceiling gate, exempting it.
- `src/state/store.mjs` — `addDecision` validates `payload.id` when
  present.
- `test/state/worker-slots.test.mjs` or `test/runner/claim-port.test.mjs`
  — new test(s): a repo drifted over ceiling (occupied > ceiling) refuses
  a genuinely new claim but allows a stale-claim reclaim of an
  already-`doing` item.
- `test/state/store.test.mjs` — new test: `addDecision` with a nonexistent
  `id` throws `work "<id>" not found`, same shape `editWork`/`moveWork`
  already throw.

**Concrete cases to prove against:**
- Empty/boundary: no ceiling configured — `hasWorkerSlotRoom` already
  returns `allowed: true` unconditionally; the new exemption never even
  gets evaluated in that path in practice (though it's still computed —
  cheap, no behavior change when `room.allowed` is already `true`).
- Existing behavior that must not regress: a normal (non-reclaim) claim
  attempted while genuinely at ceiling still refuses.
- The actual bug case: ceiling 8, 12 items `doing`, one is a genuinely
  stale claim eligible for reclaim — the reclaim now succeeds instead of
  refusing.
- `addDecision`: an id that IS a real work item still writes normally
  (existing tests already cover this); an id that is NOT a real work item
  now throws instead of writing.

## Split decision

No split — two small, independently-verifiable fixes in the same item per
how it was filed (one review pass, two related engine gaps), each with
its own test coverage.

## Outstanding questions

None
