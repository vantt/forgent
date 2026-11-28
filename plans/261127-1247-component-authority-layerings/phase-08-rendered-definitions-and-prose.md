# Phase 8: Rendered definitions and prose

The layering definitions are rendered from the model, and the prose that used the old words is
corrected (CAS-D8, design principle 7; hand-off acceptance (6), (7)).

Capability: `code:implement`.

## Inputs

- `packages/component-authority/rust/src/render.rs` (`view_definitions`, markers).
- `docs/platform/architecture-map.md` §3, `docs/platform/component-boundary.md` §4,
  `docs/platform/vision.md` §6 Known gaps.
- DISCUSSION §4 CAS-D1, D8, D13, D15 (1).

## Files this phase may write

Its footprint row in plan.md.

## Steps

1. `render.rs`: new view `architecture-map-layerings` in `architecture-map.md`, one block per
   layering: questions, meaning, granularity, values with meaning, rules, source, `sameAs`/
   `distinctFrom`. A render unit test on a small model.
2. `architecture-map.md` §3: replace the hand text with the markers; keep only prose the model
   does not hold.
3. `component-boundary.md` §4: module = packaging unit, component = ownership unit, every
   module in one component (CAS-D1); "layer" never alone.
4. `vision.md` §6 Known gaps: close the Work/Domain order gap (CAS-D13) and reword the rest in
   the new vocabulary.
5. Render with the worktree code and check.

## Verify

`cargo test -p component-authority`, `npm run fgos:dev -- authority render --check`,
`rg -n "\btier [0-9]|\blayer\b" docs/platform/component-boundary.md docs/platform/architecture-map.md`
shows no bare "layer" outside history quotes. Pass: green, no drift.

## Rollback

Revert the phase merge.
