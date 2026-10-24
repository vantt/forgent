# Phase 11: conductor and caller skills, how-tos, and the generated renders

Depends on: 06, 08 (the flags and the inheritance are final). Blocks: 12. Effort: 4h. Risk: Low-Medium (a conductor reading stale instructions forces the wrong degree; generated trees must not be hand-edited).

Run as (fgos-cook): one slice, activity `implement-item`, capability `docs:write`, pattern `solo` with `--verify "node scripts/run-tests.mjs test/setup/skill-wrappers.test.mjs test/setup/capability-catalog-doctrine.test.mjs"` (after phase 07 a solo run with a verify command verifies once and leaves a receipt; docs-only work needs no checker round), rigor `standard`. The renders are written by running `npm run build:skills`, never by hand (`.agents/skills/`, `plugins/fgOS/skills/` and `.claude/skills/` are generated; AGENTS.md).

## Context links

- Spec section 9.2 (callers), section 18 last sentence (COOK route-table text corrected in the implementing change), the owner's rule that the fix is not aimed at the single case `reviewed`.
- Current forcing text: `core/skills/fgos-cook/references/route-table-pending.md:18` (`a writing activity that declares none (fix-verify-red) also gets --pattern reviewed`) and `:26-31`; `core/skills/fgos-cook/references/case-and-doors.md:74-82` (the `--pattern` flag and "without `--pattern` the door runs solo. Either way the delivery milestone gets no receipt").
- Vocabulary D-ADR0073 (`docs/specs/workflow.md` section 17): workflow, case, unit, pattern, loop, params, request.
- Generator: `scripts/build-skill-wrappers.mjs` (assemble, wrappers, plugin mirror).

## Requirements

1. `fgos-cook` references stop telling the conductor to copy a pattern by hand: the door inherits the activity's `unit`; `--pattern`, `--params`, `--param` are passed **only to change the degree for this dispatch**, with `--reason` (the door refuses a case request without one), and the pin in the result shows what ran and why. The sentence that forces `reviewed` for `fix-verify-red` is removed (it declares no unit: a solo run with `--verify` now verifies once and can leave a receipt; with no command it leaves none, which the milestone then shows). The route table still says it is pending on the Seat Binding rules; only the pattern row changes.
2. `fgos-run` documents `--params` and `--param`, the catalog names (not only `solo | reviewed | panel`), that `--verify` is run by `reviewed` and by `solo` and refused on `panel`/`debate` (`verify-command-unsupported`), and drops "the preset pins none". `fgos-advise`, `fgos-group-thinking` and the two how-tos stop naming `src/runner/execution/patterns/presets.mjs` (deleted) and say "pattern" for what they call "preset"; `fgos workflow start <preset>` in `core/skills/_shared/coordination-driver.md:41,47` becomes `<workflow>` (vocabulary).
3. No skill names `research-fan-out-gated` (checked at scouting: none does).
4. Renders rebuilt by the generator; no hand edit of a generated file; the source headers stay.

## Files (writes)

Sources: `core/skills/fgos-cook/references/route-table-pending.md`, `core/skills/fgos-cook/references/case-and-doors.md`, `core/skills/fgos-run/SKILL.md` (lines 23, 25, 33, 78), `core/skills/fgos-advise/SKILL.md` (:10, :26-27, :115), `core/skills/fgos-advise/references/request-kinds-and-routes.md` (:4-5, :44-58), `core/skills/fgos-group-thinking/SKILL.md` (:8-14, :35, :54-64, :153-166), `core/skills/_shared/coordination-driver.md` (:41, :47), `docs/how-to/use-fgos-group-thinking.md` (:10, :18), `docs/how-to/run-a-coordination-session.md` (:5, check).
Generated (written by `npm run build:skills`; list the exact paths from `git status --porcelain` after the build, they are the slice's `--writes`): `.agents/skills/fgos-cook/references/{route-table-pending,case-and-doors}.md`, `.agents/skills/fgos-run/SKILL.md`, `.agents/skills/fgos-advise/**`, `.agents/skills/fgos-group-thinking/SKILL.md`, `.agents/skills/_shared/coordination-driver.md`, `plugins/fgOS/skills/_shared/coordination-driver.md` and any `plugins/fgOS/skills/**` the mirror touches, `.claude/skills/<skill>/SKILL.md` wrappers only if their generated text changes.
Re-grep first: `git grep -n -i "preset\|--pattern\|patterns/presets" -- core docs/how-to` (the "preset" hits in `capability-matching.md` and `CHANGELOG.md` history are not ours).

## Steps

1. Edit the sources; keep each skill's own structure (these are instructions to agents: complete sentences, no new sections beyond one short "changing the degree" paragraph in `case-and-doors.md`).
2. `npm run build:skills`; `git status --porcelain` shows only the expected sources and renders; a second build changes nothing.
3. Add the changelog lines for the flags in phase 12 (not here).

## Verify

`npm run build:skills && git diff --stat` (only expected paths), then `node scripts/run-tests.mjs test/setup/skill-wrappers.test.mjs test/setup/capability-catalog-doctrine.test.mjs test/setup/instruction-projections.test.mjs`.

## Risks and mitigations

| Risk | L x I | Mitigation |
|---|---|---|
| the case that runs this very plan reads the old skill text (the installed release still carries it) | H x L | expected: the conductor passes `--pattern reviewed` by hand until the new release is activated; the plan says so (plan.md) |
| a render is hand-edited or left stale | M x M | step 2 and the drift test |
| wording diverges from the area specs | L x M | the vocabulary table of spec section 2 is the source for words; phase 12 merges the same table |

## Rollback

Revert the source and render commit together (the renders are a function of the sources).

## Acceptance

No scenario number. Observable: `git grep -n "fix-verify-red" -- core/skills` shows no forcing sentence; `git grep -n "patterns/presets" -- core docs/how-to` is empty; a second `npm run build:skills` produces no diff.
