# Plan: make priority-formula's silent unrecognized-value fallback observable

Item: `tsk-4hb`. Mode: **tiny** — direct-entry fallback applied (no lane
handed off this session); `fgos-routing`'s own flag-count gives 0-1 real
flags (only "existing covered behavior" — `test/state/priority-formula.
test.mjs` already exercises these functions), well under the `standard`
threshold. No `CONTEXT.md` exists for this item — `RESEARCH.md`
(stage `discovery`) already confirmed the claim and the sibling-scope
boundary; no product ambiguity survived that pass, so no Socratic lock was
needed (this item's own branch predates `tsk-4b2`'s wiring, so it took the
direct `clarify -> decompose` edge unchanged — noted, not a defect).

## Approach

Two distinct root causes hide inside one symptom ("priority ≈ one
variable"), and only one is this item's own scope:

1. **`risk` — a real correctness bug.** Per Data Dictionary #6
   (`docs/specs/work-state.md:46`), `risk` is *free text*, so an
   unrecognized value (medium/low/high — 67/482 real items) is
   spec-legal, not a data-entry error. `discountForRisk`'s `?? RISK_
   DISCOUNTS.standard` fallback (`priority-formula.mjs:36`) cannot
   distinguish "absent" (a legitimate default) from "present but
   unrecognized" (silently masked) — both fold to the same discount with
   no signal anywhere. **In scope**: make that distinction queryable.
2. **`urgent` — a producer gap, not a formula bug.** 476/482 items never
   set `work.urgent` at all; the formula's default (`weightForUrgency
   (undefined) -> medium`) is exactly correct behavior for a genuinely
   absent value — there is no unrecognized-value case in the real data
   for this axis (`{vắng 476, low 1, critical 3, high 2}`, all four
   present values are real enum members). **Out of scope**: whether
   items should always carry an explicit urgency is a submit-time
   product decision (who sets it, when, what the default even should
   mean), not a formula-correctness fix — flagged as an assumption below,
   not silently absorbed.

**Fix shape:** `priority-formula.mjs` stays pure (its own header:
"No fs/Date.now/mutation" — same discipline as `impact.mjs`/`graph-
metrics.mjs`) — it must not log/warn itself. Export a small, pure query
`isRecognizedRisk(risk)` alongside the existing `discountForRisk`, so a
caller that already does side effects (`discovery.mjs`/`decompose.mjs`,
both already call `addDecision`) can log a decision when a real item
carries an unrecognized-but-present risk value — making the fold visible
in the audit trail instead of silent.

Files touched: `src/state/priority-formula.mjs` (add `isRecognizedRisk`),
`src/intake/discovery.mjs` and `src/intake/plan.mjs` (the two real
`computePriority` call sites — log via `addDecision` when
`work.risk` is present and `!isRecognizedRisk(work.risk)`).

**Footprint overlap with siblings, named explicitly:** `tsk-1r3` and
`tsk-6d8` both also touch `discovery.mjs`/`decompose.mjs`'s
`computePriority` call sites, but different lines/concerns (`tsk-1r3`:
the `computeImpact` argument mismatch between the two writers; `tsk-6d8`:
the empty `catch` around the `editWork` write) — this item only adds one
new `addDecision` call near each site, no line collision with either
sibling's own described fix. Sequential, not parallel.

Impact-analysis posture: **degraded** (GitNexus `present`, index stale,
consistent with this session's other checks) — low actual risk regardless:
`isRecognizedRisk` is a new, pure, additive export with exactly two real
call sites, both named above and both already read in full.

## Cases

- **Boundary**: `risk` absent (`undefined`) — `isRecognizedRisk(undefined)`
  returns `false` too (not in `RISK_DISCOUNTS`), but the call sites only
  log when `work.risk` is a truthy string AND unrecognized — absent stays
  silent, matching today's correct behavior for a genuinely new item.
- **Existing behavior unchanged**: `discountForRisk`'s actual return value
  for every input is byte-identical before/after — this item only adds an
  observability signal, never changes the discount math itself.
- **Concurrent/partial failure**: the new log call reuses the exact
  `addDecision` pattern already at each site — no new lock surface.

## Outstanding questions

None
