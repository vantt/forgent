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
