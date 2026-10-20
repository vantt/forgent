# Phase 11: docs, decision records, component-boundary row

Owner: Sonnet lead in a worktree from the track. Size S (0.5d). After 10.

## Context

- Spec §8 step 9; `.claude/rules/documentation-management.md` (component boundary check); AGENTS.md L5 question 6 and "Changing a locked law" (supersede, never edit in place).
- `docs/specs/seat-binding.md` is created on main by a parallel agent (same content as the approved draft); it arrives on the track with the main merge before this phase.

## Requirements

- `docs/specs/seat-binding.md`: status from draft-approved to implemented; a short "Implementation" section linking crate, route, client, doctor rows, exec budget numbers (from 04/08 reports); no restated logic.
- `docs/platform/component-boundary.md`: new Seat Binding row (authority sentence from spec §3.1; crate `fgos-seat-binding`, route `fgos internal seat-binding`, client `src/seat-binding/client.mjs`; depends only on `fgos-host-runtime`; scope agent seats only; account state through the provider-capacity port). Execution Core row (line 65 today) drops "ai làm / model / persona" authority and names Seat Binding as the authority it asks. Workflow row unchanged ("never owns who/model/persona" stays true).
- Decision records: new entries in the "Lịch sử quyết định" of `docs/specs/seat-binding.md` superseding the seat-choice parts of RUL80, RUL91, RUL98, RUL102, RUL103, RUL106 (`docs/specs/runner.md:1109-1130` area); the old entries get a "superseded by" pointer only. Run `fgos decision-index </dev/null` to regenerate `docs/decisions/index.md`.
- `docs/specs/runner.md`: replace tier-from-rigor, ceiling, bare-verb and inline-lead text with pointers to seat-binding.md; `docs/specs/workflow.md`: `seats:` declaration, recommendation semantics.
- `docs/specs/reading-map.md`: seat-binding spec + source paths.
- `CHANGELOG.md` `[Unreleased]`: user-visible changes (setup converts config with backup; `rigorToTier` gone; tier declared per capability/role/persona/seat; `max-tier-cap`; refusals by name; `--tier`/`acceptDependence` override raises refused; panel/debate need `seats:`; new doctor rows).
- `.claude/skills`/`core/skills` prose that teaches `rigorToTier` or `panelist-N`: `rg` and fix in `core/skills/**` except `core/skills/fgos-cook/**` (COOK P5 owns it; leave a note to that lane if it mentions them), then `npm run build:skills`.

## Files

- Modify: `docs/specs/{seat-binding,runner,workflow,reading-map}.md`, `docs/platform/component-boundary.md`, `docs/decisions/index.md` (generated), `CHANGELOG.md`, `core/skills/**` hits (not `fgos-cook`), generated skill surfaces via `npm run build:skills`.

## Steps

1. Merge main into the track (brings `docs/specs/seat-binding.md`).
2. Boundary row move; specs; records; index regeneration.
3. Skill prose sweep + rebuild.
4. Reviewer pass: plan acceptance criterion 2 (no JS seat policy left) checked against the boundary row.

## Tests

`npm test` (doc/convention/decision-citation checks included); `fgos convention check --all </dev/null` clean for new files.

## Risks / rollback

- L×L. Rollback: revert the merge on the track.
