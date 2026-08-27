---
framework: diataxis
mode: explanation
---
# Why `plan.mjs`'s refined pass skips its priority write when a human override decision exists

`work.priority` had no guard against being silently clobbered by the
automated clarify/decompose passes. `resolveDiscovery`
(`src/intake/discovery.mjs`) and `resolvePlan`'s refined pass
(`src/intake/plan.mjs`) both called `editWork(dir, { id, patch: {
priority }, role })` unconditionally on every pass — neither checked
whether the item already carried a priority a human had set explicitly
via `edit --priority` before that pass ran. The pre-existing override door
(`edit --priority` can always force a value) never guaranteed a forced
value would survive the *next* automated pass — every re-clarify after an
answer, and the decompose/plan refined pass, both recomputed and
overwrote unconditionally.

## The locked split: rough pass keeps overwriting, refined pass gets guarded

Two passes touch `priority`, and they were deliberately treated
differently rather than both gaining an identical guard:

- **`discovery.mjs`'s rough pass** — overwriting priority on new
  information is *intended* auto-triage behavior. Left untouched, no
  guard added.
- **`plan.mjs`'s refined pass (`resolvePlan`)** — this recompute is also
  genuinely valuable to keep running, not just tolerated: post-plan items
  release their claim (`releaseClaimOnExecuting`) and sit in
  `frontier.mjs`'s priority-ascending pick order for `/fgOS:pick` and
  `fgos-fanout`, so the more accurate effort/blastRadius-based recompute
  at this stage improves cross-item scheduling for everyone. So the fix
  is narrower than "stop recomputing" — it is "stop recomputing *only*
  when a human already made a deliberate, later choice for this specific
  item."

Guarding only the refined-pass call site was the locked decision (not
guarding both, and not blocking the recompute outright) — the rough
pass's overwrite behavior stays exactly as it always was.

## The mechanism: a `priority-override` decision, not a new field

No new work-object field, no schema change — the guard reuses the
existing decision-log infrastructure, the same call-site pattern as
sibling fixes tsk-1r3/tsk-4hb at this same location:

1. **`bin/fgos.mjs`'s `edit --priority` handler** now logs one
   `addDecision` call with `kind: 'priority-override'` whenever a priority
   patch is actually applied (`bin/fgos.mjs:1951`). This is the *only*
   writer of that decision kind.
2. **`plan.mjs`'s `resolvePlan` refined pass**, immediately before its own
   `editWork(dir, { id, patch: { priority }, role })` call
   (`src/intake/plan.mjs:695-706`), checks `view.decisionsById[id]` for
   any decision with `kind === 'priority-override'`. If one exists, the
   `editWork` call is skipped entirely, and a separate `engine`-kind
   decision is logged instead (`"priority: skipped refined-pass overwrite
   -- priority-override decision already present"`) — mirroring tsk-4hb's
   own "make the skip observable, never silent" pattern at this same call
   site. If none exists, the refined pass proceeds exactly as before —
   byte-identical behavior for every item that has never had `edit
   --priority` called on it, which is the common case.

## Why a bare existence check, not a timestamp comparison

The guard checks *whether any* `priority-override` decision exists for
the item, not whether it is newer than the last recompute. This is
sufficient because `resolvePlan`'s priority block — the `callerVerdict`
branch, not the tiny/small bare pass-through branch that returns before
reaching it — only runs once per item in the real flow:
`fgos-coding-validating`'s own hard rule always fires `fgos plan
--verdict ...` explicitly, for every mode including tiny/small. There is
exactly one recompute event to guard against, never a repeated one that
would need a timestamp comparison to distinguish "override happened
before this recompute" from "override happened after a prior recompute."

## Proof

`node --test test/intake/plan.test.mjs test/cli/fgos-edit.test.mjs` green
— a new regression test was added and proven failing-before/passing-after
(see the item's own `iron-law-evidence.md`). Full suite: 3119/3124 (5
pre-existing skips).
