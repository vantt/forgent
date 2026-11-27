# Phase 6: Rendered definitions and prose

The layering definitions are rendered from the model (design principle 7), and the prose that
used the old vocabulary is corrected.

## Inputs

- `packages/component-authority/rust/src/render.rs` (`view_definitions` near 500-548, render
  tests near 970-1100).
- `docs/platform/architecture-map.md` §3 (lines 245-260 draw the original layers),
  `docs/platform/component-boundary.md` §4 (274-309), `docs/platform/vision.md` §6 Known gaps.
- CAS-D1, CAS-D11, CAS-D13.

## Files this phase may write

`packages/component-authority/rust/src/render.rs`, `docs/platform/architecture-map.md`,
`docs/platform/component-boundary.md`, `docs/platform/vision.md`.

## Steps

1. Add the view `architecture-map-layerings` to `view_definitions`: one section per layering
   with its questions, meaning, granularity, distinctFrom, rules, source and a value table; add
   a render test shaped like the existing ones.
2. Replace the hand-written layer description in `architecture-map.md` §3 with the new view's
   markers and render it; keep the historical note that the original layers came from v0.2
   (commit 7349a52bc).
3. `component-boundary.md` §4: split "component/module" into component (ownership unit) and
   module (packaging unit), per CAS-D1.
4. `vision.md` §6 Known gaps: close the Work and Domain order gap (CAS-D13) and name
   `orchestration-ring` as the layering that now carries the Execution, Workflow, Domain and
   Work order.

## Verify

`cargo test -p component-authority` and `npm run fgos:dev -- authority render --check` pass;
`grep -n "component/module" docs/platform/component-boundary.md` prints nothing.

## Rollback

Revert the phase commit.
