# Phase 8: Rendered definitions and prose

The layering definitions are rendered from the model, and the prose that used the old words is
corrected (CAS-D8, CAS-D26 (2)(4), design principle 7; hand-off acceptance (6), (7), (18)).

Capability: `code:implement`.

## Inputs

- `packages/component-authority/rust/src/render.rs` (`view_definitions`, markers).
- `docs/platform/architecture-map.md` §3, `docs/platform/component-boundary.md` §4,
  `docs/platform/vision.md` §6 Known gaps.
- DISCUSSION §4 CAS-D1, D8, D13, D15 (1), D26.
- `docs/reading-map.md` (the reading path).

## Files this phase may write

Its footprint row in plan.md.

## Steps

1. `render.rs`: new view `architecture-map-layerings` in `architecture-map.md`, one section per
   layering in the CAS-D26 (2) layout: the heading is the question it answers; one meaning
   paragraph; a Mermaid diagram generated from the value order; each value with its meaning and
   two or three representative components (the first live rows carrying it, in model order,
   each with its `summary`); a "distinct from" line from `distinctFrom`/`sameAs`; each rule
   written as a sentence from a fixed template per rule kind. No prose is generated beyond
   those templates. A render unit test on a small model.
2. `architecture-map.md` §3: replace the hand text with the markers; keep a short hand-written
   head above them (what the page answers, how to read it, how to change it: edit the model,
   then `fgos authority render`), CAS-D26 (1). The rest of the page stays for backlog row
   p-xtgvunuvxy.
3. `component-boundary.md` §4: module = packaging unit, component = ownership unit, every
   module in one component (CAS-D1); "layer" never alone.
4. `vision.md` §6 Known gaps: close the Work/Domain order gap (CAS-D13) and reword the rest in
   the new vocabulary.
5. `docs/reading-map.md`: the reading path is `reading-map.md` → `architecture-map.md` →
   `component-boundary.md` → the component spec, and `fgos authority locate` for a question about
   one file (CAS-D26 (4)).
6. Render with the worktree code and check.

## Verify

`cargo test -p component-authority`, `npm run fgos:dev -- authority render --check`,
`rg -n "\btier [0-9]|\blayer\b" docs/platform/component-boundary.md docs/platform/architecture-map.md`
shows no bare "layer" outside history quotes. Pass: green, no drift.

## Rollback

Revert the phase merge.
