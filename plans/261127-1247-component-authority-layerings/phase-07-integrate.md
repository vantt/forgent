# Phase 7: Integrate

Merge the phase branches, re-run the full gate on the combined tree, and record the
user-visible change.

## Inputs

- plan.md acceptance criteria 1 to 7.
- Phase 4's `reports/hexagon-measure.md`.

## Files this phase may write

`CHANGELOG.md`, `plans/261127-1247-component-authority-layerings/reports/`.

## Steps

1. Add one line under `## [Unreleased]` in `CHANGELOG.md`: component rows of an authority model
   now carry one field per declared layering (`hexagon`, `stack`, `orchestration-ring`) in place
   of `layer` and `tier`; `layers.yaml` declares `layerings`; the loader refuses the old fields
   by name, and a project model renames them.
2. Run the full gate on the integrated tree: `npm test`, `cargo test --workspace` and
   `npm run fgos:dev -- authority render --check`.
3. Walk acceptance criteria 1 to 7, each with its command output, into `reports/integration.md`.

## Verify

All three commands pass on the integrated tree; the report lists every acceptance criterion
with its evidence.

## Rollback

Revert the CHANGELOG line; earlier phases revert on their own.
