# task-spec: shape-plan

domain: coding | stage: planning | position: implementer

## Input
- `CONTEXT.md` with its locked decisions table (the only source of truth
  this task may assume).
- The lane `fgos-routing`'s Mode-gate step already decided
  (tiny/small/standard/high-risk/spike), or the direct-entry fallback.

## Output
- `docs/history/<feature>/plan.md`: the literal token `Mode: <lane>` —
  `src/intake/plan.mjs`'s `passThroughModeMatch` regexes this exact string
  to skip a real model call on a tiny/small item, so it must never be
  renamed in prose without updating the engine that reads it. Approach,
  risk map, concrete cases worth proving, and — if the item needs a
  split — child specs as a fenced JSON array in `normalizeChild`'s exact
  shape (`title`, `verify`, `action` citing a real D-ID, `footprint`).
- The doc MUST end with a literal `## Outstanding questions` heading, same
  contract as `lock-decisions`' own CONTEXT.md.

## Gates
- None owned here — `validate-plan` (below) owns the single gate in this
  stage.

## Verify-template
- Each child spec's own `verify` is a real, runnable command — never a
  placeholder; `normalizeChild` rejects the whole verdict over one missing
  verify.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| A named library/pattern/precedent the session cannot resolve from context | consult (sync) | researcher | consult | finding |
| `CONTEXT.md` turns out silent on something material to the plan | advise (async) | human-advisor | advise | answer, appended to CONTEXT.md as a new D-ID (via the exploring hand-back path) |
| No trigger matches | — write the plan, hand off to validate-plan — | | | |
