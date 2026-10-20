# Phase 11: spec status, pointer edits, spec errata, component-boundary row

Owner: Sonnet lead in a worktree from the track. Size S (0.5d). After 10.

## Context

- [RT-16b] `docs/specs/seat-binding.md` is on main (status "approved, not implemented"), and D-ADR0072 with the supersede pointers for RUL80, RUL91, RUL98, RUL102, RUL103, RUL106 already landed (seat-binding.md §15, runner.md history). This phase does not write them again.
- `.claude/rules/documentation-management.md` (component boundary check); AGENTS.md L5 question 6.

## Requirements

- `docs/specs/seat-binding.md`: status → implemented; §13 "today" notes updated; a short implementation pointer list (crate, route, client, doctor rows, exec budget numbers from the 04/08 reports); no restated logic. **Spec errata** [RT-8]: §7.1 composition wording states reviewed composition **by checker seat** (`tester` seat, role `reviewer` for taste, non-verdict posture); errata for any other wording the wave proved wrong, each with its evidence.
- `docs/platform/component-boundary.md:64` (Execution Core row, currently marked "planned"): drops "ai làm / model / persona" authority and names Seat Binding; new Seat Binding row (spec §3 authority sentence; crate `fgos-seat-binding`, route `fgos internal seat-binding`, client `src/seat-binding/client.mjs`; depends only on `fgos-host-runtime`; agent seats only; account state through the provider-capacity port). Workflow row unchanged.
- Pointer edits: `docs/specs/runner.md` and `docs/specs/workflow.md` text on tier-from-rigor, ceiling, bare verb, inline lead, `panelist-N` → pointers to seat-binding.md; `docs/specs/work-state.md:54`; `docs/how-to/install-fgos-in-a-project-and-use-doctor.md:233,237` (doctor rows and `rigorToTier`); `docs/specs/reading-map.md` (source paths).
- `CHANGELOG.md` `[Unreleased]`: setup converts project config with backup; `rigorToTier` gone (dropped from the global layer at load); tier declared per capability/role/persona/seat; `max-tier-cap`; refusals by name; `--tier`, door-selected raises and `acceptDependence` refused; panel/debate need `seats:`; [RT-16d] **unit `rigor`, `--rigor`, guide `rigorFloor` and Work `risk: heavy` no longer raise tier, only checker count**; [P00-C14] rigor no longer sets a default reasoning effort (effort comes from the cell or the invocation default); [P00-C10, D-e] new `unit.json` snapshots no longer store `llmAccounts`/`providers`; [D-a] pre-fence unit records are refused on resume (`record-predates-seat-binding`) and stay readable; [P00-C1, D-c] doctor row `mutating-assignment-binding-snapshot` removed; new and removed doctor rows.
- `core/skills/**` prose teaching `rigorToTier` or `panelist-N`: fix, except `core/skills/fgos-cook/**` (message the COOK lane instead); `npm run build:skills`.
- Regenerate `docs/decisions/index.md` with `fgos decision-index </dev/null` only if a record changed.

## Files

- Modify: `docs/specs/{seat-binding,runner,workflow,work-state,reading-map}.md`, `docs/platform/component-boundary.md`, `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`, `CHANGELOG.md`, `core/skills/**` hits (not `fgos-cook`), generated skill surfaces.

## Steps

1. Merge main into the track (conversion drift check, [RT-15]).
2. Status, errata, boundary row, pointer edits, CHANGELOG.
3. Skill prose sweep + rebuild.
4. Reviewer pass: plan acceptance criterion 2 against the boundary row.

## Tests

`npm test`; `fgos convention check --all </dev/null` clean.

## Risks / rollback

- L×L. Rollback: revert on the track.
