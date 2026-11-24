# Phase 3: Render and land

## Context

Component-authority spec section 5: every ownership view is rendered from the model.

## Files it writes

The rendered views listed in plan.md's footprint, through `fgos authority render` only; the document-identity spec's
section 14 status row and the documentation spec's subcomponent map only where they are not rendered.

## Steps

1. `fgos authority render`, then `fgos authority render --check`.
2. `node scripts/run-tests.mjs test/architecture.test.mjs`; `node scripts/doc-health.mjs` on each changed doc.
3. Message the component-authority-doors lead with the diff summary; rebase on origin/main; land.

## Validation

Acceptance criteria 2 and 3 of plan.md.

## Rollback

Revert the commit and render again.

## As built (2026-11-24)

- `fgos authority render --dir <worktree>` (release 71dd6eb7) changed four views: `component-boundary.md`,
  `architecture-map.md`, `system-overview/spec.md` and `docs/platform/README.md`, all on the `document-identity` row.
  `governance.md` does not change, because its holder table lists decision kinds and no decision kind moved.
  `--dir` keeps the write inside the worktree; the main checkout stayed untouched.
- `fgos authority render --check` exits 0. `node scripts/run-tests.mjs test/architecture.test.mjs`: 95 pass, 0 fail.
  `node scripts/doc-health.mjs` passes on each changed doc.
- Not rendered, checked by hand: document-identity spec line 8 and section 14 already say locate is built; the
  documentation spec's subcomponent map row gives the design signature date, which did not change. Neither is edited.
