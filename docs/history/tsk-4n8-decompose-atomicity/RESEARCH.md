# RESEARCH — tsk-4n8: decompose-atomicity bug

## Round 1 (2026-08-13, discovery stage)

**Asked:** Does any code path in `resolvePlan` (`src/intake/plan.mjs`)
allow children to be partially materialized before a footprint-overlap ask
fires within the SAME call? Is there any existing mechanism recording the
originally-intended child count, so a later call can tell "fully
decomposed" apart from "partially decomposed"? Does childId computation
account for pre-existing siblings when adding more children later?

**Checked:**
- `src/intake/plan.mjs:835-912` (footprint-overlap gate + child-write loop),
  read directly.
- `grep -rn "addWork(" src/` — every call site in the repo.
- `grep -rniE "childCount|expectedChildren|intendedChildren|totalChildren|declaredChildren" src/state src/intake bin` — no matches.
- `src/runner/loop.mjs:695-720` — the only other `addWork` call site, read
  to rule it out.

**Found:**
1. `footprintOverlapAmong` (plan.mjs:847) is computed over the WHOLE
   `verdict.children` array and gates with an early `return` (plan.mjs:848-853)
   strictly BEFORE the `addWork` `forEach` loop (plan.mjs:886-912). There is
   exactly one `addWork` call site for decompose children
   (plan.mjs:887) — no other code path feeds children incrementally. The
   only other `addWork` call in the repo is `src/runner/loop.mjs:708`,
   which writes discovery-report items (`discoveredFrom`), an unrelated
   flow. **Conclusion: within a single `resolvePlan` call, children are
   written all-or-nothing — a footprint conflict on any pair blocks writing
   ANY child in that same call.** The "child index 0 already created before
   the ask surfaced" part of the reported evidence cannot happen within one
   call on current HEAD; it must describe two separate CLI invocations (an
   earlier decompose call that succeeded, creating one child; a later,
   different `--children` submission that then hit a footprint conflict and
   parked) — consistent with the description's own "In the same session...
   after answering the ask twice... every resubmission" language, which
   already implies multiple separate calls.
2. No field anywhere in `src/state/*.mjs` or `src/intake/*.mjs` records an
   "intended total child count" for a work item. `grep` for
   `childCount`/`expectedChildren`/`intendedChildren`/`totalChildren`/
   `declaredChildren` returns zero hits.
3. `resolvePlan`'s `hasChildren` check (plan.mjs:530: `Object.values(view.work).some((item) => item.parent === id)`)
   is a pure existence check — ANY child, regardless of count or
   completeness, makes it `true`. When true, plan.mjs:581-584 unconditionally
   moves the parent to `executing` and returns `already-decomposed` —
   **before** `childIds` (plan.mjs:833) or the footprint gate
   (plan.mjs:847) are ever reached. So a resubmission meant to add the
   still-missing children never gets far enough to compute new positional
   ids or re-check footprints — it is rejected outright. The reported
   "no supported way to add the remaining children" is fully explained by
   this: once one child exists, every later decompose attempt short-circuits
   here, regardless of intent.
4. Because of (3), the childId-collision question is moot for the
   documented failure mode — the code never reaches `childIds` computation
   on a resubmission once any sibling exists, so no id ever gets
   recomputed against existing siblings to check for collision. (If a fix
   allows resubmission past `hasChildren`, id collision on the recomputed
   `${work.id}-${index+1}` sequence would become a real question a fix
   must address — noted for planning, not resolved here.)

**Still open (for planning, not discovery):** how a fix distinguishes
"fully decomposed, stop" from "partially decomposed, N more to add" without
an intended-child-count field — e.g. comparing existing children's count
against the CURRENT verdict's `children.length` (children-to-add, not
children-total), or persisting an explicit "decompose complete" marker
instead of inferring it from `hasChildren`. This is a design choice, not a
discovery-stage ambiguity — the failure mode itself is fully grounded in
evidence above.

**Verdict:** `clear` — the two real bugs (hasChildren over-broad
existence check; the reported footprint-ordering issue already doesn't
reproduce on current HEAD within a single call, so no fix needed there)
are both grounded in cited code, not speculation. No `docs/history` /
CONTEXT.md exists yet for this item to conflict with.
