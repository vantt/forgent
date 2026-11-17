# Phase 10: Domain registry names the domains that exist

The owner pulled `p-pgmxt7n7hx` into this plan (2026-11-17). This phase delivers its registry half; phase 7 already
delivers the unsure verdict. Phase 18's report names the row as delivered (the planner does not edit the backlog).

## Inputs (read first)
- Backlog row `p-pgmxt7n7hx` in `docs/backlog.md` (its acceptance text is this phase's bar).
- `src/state/domain-registry.mjs` (`DEFAULT_DOMAIN` l.28, entries `synthetic` l.103, `fixture-marketing` l.136), its
  consumers (`rg -ln "domain-registry" src test`), `domains/*/` (coding, council, marketing).
- `core/skills/fgos-clarifying/SKILL.md` after phase 7.

## Files this phase may write
`src/state/domain-registry.mjs`, `test/state/**`, `test/intake/**`, `core/skills/fgos-clarifying/**`, renders.

## Steps
1. Make the vocabulary clarifying reads come from one source that lists the domains of `domains/` plus the test-only
   fixtures (state the difference in code if fixtures stay registry-only), so `marketing` and `council` appear.
2. Keep `DEFAULT_DOMAIN` only where a downstream lazy fallback still needs it; clarifying never uses it (phase 7).
3. One owning test: "the clarifying vocabulary names every domain directory". Update the clarifying text's example list.
4. `npm run build:skills` if the skill text changed.

## Verify
- `node --test test/intake/classify.test.mjs test/intake/discovery.test.mjs` and the new test pass.

## Rollback
`git revert` the phase commit.
