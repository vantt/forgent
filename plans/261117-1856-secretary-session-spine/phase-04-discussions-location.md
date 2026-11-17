# Phase 4: Discussions move to docs/discussions with Convention kind discussion

## Inputs (read first)
<!-- Updated: Validation Session 1 - reuse the existing discussion-scratchpad kind, full consumer list, wider footprint -->
- SM-D8 in `docs/history/secretary-miu/DISCUSSION.md` (on main it is back under `docs/history/`: commit `4defbff48`
  found Convention refuses `docs/discussions/**` as `unplaced-docs`; this phase is what makes the move legal).
- `packages/convention/contracts/convention.rules.v1.json` (one registry; `report`, `plan`, `journal` are name-template
  kinds, the rest placement-glob; `discussion-scratchpad` exists), `packages/convention/rust/src/{rules.rs,operations.rs}`
  (one shape per kind, `rules.rs:177-191`), `packages/convention/rust/tests/golden.rs`.
- Prior art (validation): the registry already has kind `discussion-scratchpad` (placement-glob, singleton,
  `docs/history/<feature>/DISCUSSION.md`, `convention.rules.v1.json:124`) and the collection rule `doc-history-5`
  (`docs/history/<feature>/**`, l.130); `golden.rs:281` names it; `docs/platform/documentation/subcomponents/document-identity/spec.md:369`
  classes it `past-state`.
- `ls docs/history/*/DISCUSSION.md` (41 on main at validation, incl. `secretary-miu`; recount on your branch base).
- Consumers: `domains/coding/skills/fgos-coding-shaping/SKILL.md` (writer), `domains/coding/skills/fgos-coding-discovering/SKILL.md`
  (reader, ~l.127), `core/skills/_shared/plan-contract.md:48`, comments in `src/report/context-render.mjs:4`,
  `src/report/authoritative-match.mjs:16`, `src/state/work.mjs:123,677,737`, `src/state/frontier.mjs:208-209`,
  `src/state/worker-slots.mjs:11,128`, `plugins/fgOS/skills/terminal/rename.sh:24`.
- Every other in-repo link to a moved file (validation `rg`, excluding `plans/`, `archive/`, `docs/history/`): ~30 files in
  `docs/knowledge/**`, `docs/explanation/**`, `docs/distillery/**`, `docs/platform/documentation/**`,
  `docs/platform/proposals/**`, `docs/platform/work-state/decisions/**`, `docs/platform/runner/decisions/**`,
  `docs/platform/platform-foundations.md` (a link path only, no law text changes), `docs/platform/herdr-web-dashboard/spec.md`,
  `core/skills/_shared/{citation-format,executor-dispatch-fallback}.md`, `src/setup/skill-wrappers.mjs`,
  `src/runner/agent-roster.mjs`, `scripts/check-decision-citation-drift.baseline.json` (regenerate it with its script,
  never hand-edit).

## Files this phase may write
`packages/convention/**`, `docs/platform/convention/**`, `docs/history/*/DISCUSSION.md` (moved away),
`docs/discussions/**`, `domains/coding/skills/**`, `core/skills/_shared/**`, the five `src/` files above
(comments only), `src/setup/skill-wrappers.mjs`, `src/runner/agent-roster.mjs`, `scripts/check-decision-citation-drift.baseline.json`,
`docs/knowledge/**`, `docs/explanation/**`, `docs/distillery/**`, `docs/platform/documentation/**`, `docs/platform/proposals/**`,
`docs/platform/work-state/decisions/**`, `docs/platform/runner/decisions/**`, `docs/platform/platform-foundations.md`,
`docs/platform/herdr-web-dashboard/spec.md` (link paths only in all of these), `plugins/fgOS/skills/**` (incl.
`terminal/rename.sh`, plus renders), `.agents/skills/**`, `.claude/skills/**` (renders).

## Steps
0. Leave the comment at `bin/fgos.mjs:1816` alone: phase 15 owns `bin/fgos.mjs` and fixes it.
1. Reuse, do not add beside: the existing `discussion-scratchpad` placement rule moves to
   `docs/discussions/<slug>/DISCUSSION.md`, and a collection rule for `docs/discussions/<slug>/**` (room for `QUESTIONS.md`,
   SM-D8) replaces nothing in `doc-history-5` (other history files stay). Add the name-template kind `discussion`
   (root `docs/discussions/`, template `{slug}`) so `convention path --kind discussion --slug x` answers
   `docs/discussions/x/`, following how `plan` builds a directory path. One shape per kind (`rules.rs:177-191`): if the
   placement rule and the name template cannot share the name `discussion`, keep `discussion-scratchpad` for the
   placement rule and say so in the convention spec. Update the document-identity class row (`spec.md:369`) to the new
   kind names. Extend the golden test.
2. `git mv docs/history/<slug>/DISCUSSION.md docs/discussions/<slug>/DISCUSSION.md` for every file (keep other files of
   `docs/history/<slug>/` where they are). If a slug already exists under `docs/discussions/`, stop and report.
3. Rewrite every consumer above to the new location, and every in-repo link to a moved file
   (`rg -l "docs/history/[^/]+/DISCUSSION.md" --glob '!archive/**' --glob '!plans/**'`; plans are records, leave them).
   The shaping skill takes its path from `fgos convention path --kind discussion`, never a hand-built path.
4. `npm run build:skills`; commit sources and renders together.

## Verify
- `cargo test -p fgos-convention` passes; `npm run fgos:dev -- convention path --kind discussion --slug x --json` answers `docs/discussions/x/`.
- `ls docs/history/*/DISCUSSION.md 2>/dev/null | wc -l` prints 0.
- `rg -n "docs/history/[^/]+/DISCUSSION" --glob '!archive/**' --glob '!plans/**' --glob '!docs/history/**'` finds nothing.
- `node --test test/setup/skill-wrappers*.test.mjs` (render freshness; `rg -l "build:skills|renderSkillSurfaces" test`) passes.

## Rollback
`git revert` the phase commit (restores every moved file and consumer in one step); rebuild renders.
