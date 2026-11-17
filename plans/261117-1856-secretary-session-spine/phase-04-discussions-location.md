# Phase 4: Discussions move to docs/discussions with Convention kind discussion

## Inputs (read first)
- SM-D8 in `docs/discussions/secretary-miu/DISCUSSION.md`.
- `packages/convention/contracts/convention.rules.v1.json` (one registry; `report`, `plan`, `journal` are name-template
  kinds, the rest placement-glob; `discussion-scratchpad` exists), `packages/convention/rust/src/{rules.rs,operations.rs}`
  (one shape per kind, `rules.rs:177-191`), `packages/convention/rust/tests/golden.rs`.
- `ls docs/history/*/DISCUSSION.md` (40 on the base commit; recount on your branch base).
- Consumers: `domains/coding/skills/fgos-coding-shaping/SKILL.md` (writer), `domains/coding/skills/fgos-coding-discovering/SKILL.md`
  (reader, ~l.127), `core/skills/_shared/plan-contract.md:48`, comments in `src/report/context-render.mjs:4`,
  `src/report/authoritative-match.mjs:16`, `src/state/work.mjs:123,677,737`, `src/state/frontier.mjs:208-209`,
  `src/state/worker-slots.mjs:11,128`, `plugins/fgOS/skills/terminal/rename.sh:24`.

## Files this phase may write
`packages/convention/**`, `docs/platform/convention/**`, `docs/history/*/DISCUSSION.md` (moved away),
`docs/discussions/**`, `domains/coding/skills/**`, `core/skills/_shared/plan-contract.md`, the five `src/` files above
(comments only), `plugins/fgOS/skills/**` (incl. `terminal/rename.sh`, plus renders),
`.agents/skills/**`, `.claude/skills/**` (renders).

## Steps
0. Leave the comment at `bin/fgos.mjs:1816` alone: phase 15 owns `bin/fgos.mjs` and fixes it.
1. Add kind `discussion` to the registry: placement `docs/discussions/<slug>/`, main file `DISCUSSION.md`; extend the
   golden test with `convention path --kind discussion --slug x`. Follow how `plan` builds a directory path.
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
