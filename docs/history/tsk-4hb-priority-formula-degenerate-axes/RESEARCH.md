# RESEARCH: priority-formula's degenerate urgency/risk axes

## Round 1 (tsk-4hb, stage discovery)

**Asked:** does `src/state/priority-formula.mjs`'s real current state match
the item's own claim (urgency/risk axes silently degenerate), and do
sibling items `tsk-1r3`/`tsk-6d8` (same file family) constrain this item's
own fix shape?

**Checked:**
- `src/state/priority-formula.mjs:14-37` (repo, read in full).
- `docs/specs/work-state.md:46` (Data Dictionary #6, `risk` field).
- `tsk-1r3`/`tsk-6d8`'s own descriptions (`fgos list --id`).

**Found:**
- `URGENCY_WEIGHTS = {low:0.5, medium:1, high:2, critical:4}` and
  `RISK_DISCOUNTS = {light:1, standard:0.85, heavy:0.6}` (lines 14-15) —
  confirmed exactly as the item describes.
- `weightForUrgency(urgent)` (:31-33) and `discountForRisk(risk)` (:35-37)
  both use `?? <fallback>` — silent, no warning, no distinction between
  "absent" and "present but unrecognized".
- `docs/specs/work-state.md:46`: `risk` is documented as `free text`, not
  an enum — confirms unrecognized values are a real, spec-sanctioned
  possibility, not a data-entry bug elsewhere.
- Item's own real-log numbers (476/482 items never set `work.urgent`;
  risk: 415/482 recognized, 67/482 silently fold to `standard`) are cited
  from the scan report, not re-derived here — item's own file:line
  citations (`priority-formula.mjs:14-15,32,36`) match the real file
  exactly, no drift since the scan.
- **Scope boundary check (no overlap with siblings):** `tsk-1r3` is about
  `computeImpact`'s two writers (`discovery.mjs`/`decompose.mjs`)
  disagreeing on which terms they supply (missing `semanticRelatedness` on
  the second pass) — a different function (`computeImpact`, not
  `weightForUrgency`/`discountForRisk`) and a different bug shape (term
  dropped between two writers, not a silent fallback on one value). `tsk-6d8`
  is about both writers' empty `catch` blocks swallowing write failures —
  orthogonal to both. All three touch overlapping files
  (`priority-formula.mjs`, `discovery.mjs`, `decompose.mjs`) but distinct
  functions/line ranges — sequential, non-conflicting fixes.

**Verdict:** `{clear: true, verify: "node --test test/state/priority-formula.test.mjs && npm test"}`
