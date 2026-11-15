# Phase 14: a registered workflow unit declares the tier it needs

Start after: S4 on main, plan approved. Wave 1, parallel with 01, 02, 13. Rules: [phase-lead-rules.md](phase-lead-rules.md).
Facts: F7, F10. Worktree `erd-p14`, report slug `erd-p14-unit-tier`. Effort: 1.5d.

## Why this phase exists, and its limit

- **Why:** step 2 (phase 05) removes the capability rows, which today give council units without a `seats:` block
  their tier, checker seats included. A unit cannot declare a tier today (`unit.mjs:10`, `definition.mjs:22`), so
  without this phase those checker seats would drop to `defaults.tier`.
- **Narrow fix:** this phase adds only the `tier` declaration on units of registered workflow definitions, read by
  `workflowTierOf` as the fallback after the seat's own tier: no other unit key, no ceiling (`maxTier`) key, no change
  to units files, stdin units or `fgos run`, no change to the Seat Binding crate.
- **Stop rule:** if the work grows past that (another key, a ceiling, a crate or precedence change, units outside
  registered workflow definitions), the phase lead stops and asks the plan lead before going on.

## Context

The owner's direction for capability step 2 (`docs/platform/vision.md` section 6): "A workflow step declares the tier
and rigor it needs". Units already declare `rigor`; a tier exists only per seat (`seats[].tier`), only in a registered
workflow definition (`seat-resolver.mjs:346-366`), and a unit `tier` is refused (`unit.mjs:10`, `definition.mjs:22`).
Council units with `pattern: solo|reviewed` declare no seats, and their checker seats get today's tier from the
capability row. Without a unit-level tier, removing the rows (05) would drop those seats to `defaults.tier`.

## Requirements

1. A registered workflow definition's unit may carry `tier` (one of the ladder's tiers). Units files, stdin units and
   `fgos run` keep refusing it, with the same reason the seat tier gives ("a recommendation only a registered workflow
   definition may make").
2. `workflowTierOf(seat, unit, workflowId)` (`seat-resolver.mjs:346`): the seat's own `tier`, else the unit's `tier`,
   else none; the source names which (`workflow:<id>/<unit>/<seat>` or `workflow:<id>/<unit>`). It applies to every
   seat the unit runs, checker seats the pattern generates included. The unit record keeps it so a replay asks what the
   run asked (`bindSeatOf` :355).
3. The tier stays a recommendation inside Seat Binding's precedence (row 8 of spec 6.3, "the workflow seat's tier"):
   no change to the crate.
4. Docs: `docs/platform/workflow/spec.md` (unit keys), `docs/platform/seat-binding/spec.md` 6.1 table ("Workflow unit"
   row gains `tier?`; 03 owns the rest of section 6 and lands after this phase, so this is one line).

## Files

- Modify: `src/workflow/definition.mjs`, `src/runner/execution/seat-resolver.mjs`, `src/runner/execution/unit.mjs`
  (message only, if it names seats only), their tests (`rg -l "workflowTierOf|seat-tier-not-allowed|definition.mjs" test`),
  `docs/platform/workflow/spec.md`, `docs/platform/seat-binding/spec.md` (one line in 6.1), mutation census.
- Create/Delete: none. Tests retired: none.
- Net size: about +30 / -5 Node lines, +40 test lines.

## Acceptance

- A registered workflow with `tier: flagship` on a `reviewed` unit binds its producer and its checker seats with tier
  source `workflow:<id>/<unit>`; a units file with a unit `tier` is refused by name.

## Risks / rollback

- `seat-binding/spec.md` also edited by 03 (L x L): 14 lands first (03 lands after 13, 14 and 02). Revert: one commit.
