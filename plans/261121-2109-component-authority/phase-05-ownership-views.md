# Phase 5: Generated ownership views and decision-index on the model

## Inputs
- `src/report/decision-index.mjs` (the generate-and-`--check` pattern; `narrativeHolderResolver` at :30) and `test/report/decision-index.test.mjs`.
- `packages/component-authority/model/components.json` and `decision-kinds.json` (phase 3).
- The current views: `docs/platform/component-boundary.md`, `docs/platform/README.md` §2,
  `docs/platform/governance.md` §"Decision scope to holder table", `docs/platform/system-overview/spec.md`
  §Area Map and §Shared Entities, and §Shared Entities in `docs/platform/observe/spec.md` and
  `docs/platform/workflow/spec.md`.
- `scripts/run-tests.mjs`, to see how a check joins `npm test`.
- `plans/261121-2109-component-authority/reports/docos-boundary-answer.md`: DOCOS keeps the holder table's shape
  (scope to holder file or directory) and wants to see the generated holder view before it replaces the
  hand-written table.

## Files it may write
scripts/component-authority-render.mjs, test/component-authority/render.test.mjs, src/report/decision-index.mjs, test/report/decision-index.test.mjs, docs/platform/component-boundary.md, docs/platform/README.md, docs/platform/governance.md, docs/platform/system-overview/spec.md, docs/platform/observe/spec.md, docs/platform/workflow/spec.md, plans/261121-2109-component-authority/reports/holder-view-preview.md

## Steps
1. Write `scripts/component-authority-render.mjs` with exports `computeViews(repoRoot)` and `main(argv)`, plus a
   `--check` mode that exits 1 and names any view that differs. Each view is a block between
   `<!-- generated:component-authority:<view> -->` and `<!-- /generated:component-authority:<view> -->`. Text outside
   the markers stays the author's. `component-boundary.md` keeps a short hand-written header saying it is generated
   and pointing at the model.
2. Views:
   - `component-boundary.md`: full component list with Owns / Must not own, door count and source links.
   - README §2: the owner table.
   - governance holder table: same columns and the same scope-to-holder shape as today, so the scope aliases
     remain and `fgos decision-index` keeps working. Before this block replaces the hand-written table, write the
     generated table to `reports/holder-view-preview.md` with a row-by-row diff against the current table, and send
     it to DOCOS through the supervisor (the route its boundary answer came by). Replace the table only after DOCOS
     answers; until then the table stays hand-written and the other views land without waiting.
   - system-overview Area Map and Shared Entities.
   - observe and workflow Shared Entities: the rows whose owner is that area.
3. `src/report/decision-index.mjs`: `narrativeHolderResolver` reads `decision-kinds.json` (canonical, aliases and
   narrative) instead of parsing governance.md. Move its test fixtures to a temp model. Keep the fallback to
   `docs/platform/<name>.md` as it is.
4. `test/component-authority/render.test.mjs` runs `main(['--check'])` on the repo, which proves the views match the
   model. It also covers a synthetic case: editing a generated block by hand fails the check with the view's name.
   `npm test` picks up this file through `test/**`, so no wiring is needed.

## Verify
`node scripts/component-authority-render.mjs --check` exits 0, and
`node --test test/component-authority/render.test.mjs test/report/decision-index.test.mjs` is green, and
`fgos decision-index --check` reports `docs/decisions/index.md` unchanged (the holder shape did not move). Running
`node scripts/component-authority-render.mjs` (write mode) twice leaves `git diff` empty the second time.

## Rollback
Revert the phase commit. That restores the hand-written views and the governance parser.
