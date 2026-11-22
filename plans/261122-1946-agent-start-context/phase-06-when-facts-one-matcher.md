# Phase 6: Units select by `when:` facts; one matcher

The static door of ASC-D6, and the setup-time matcher folded into the composer (the council's condition).

## Inputs

- `src/setup/instruction-registry.mjs` (frontmatter validation, `appliesTo` at about line 307) and
  `src/setup/instruction-composition.mjs`.
- `packages/agent-start-context/contracts/start-facts.v1.json`.
- Unit roots: `core/instructions/`, `components/*/instructions/`, `domains/*/instructions/`.

## Footprint

`src/setup/instruction-registry.mjs`, `src/setup/instruction-composition.mjs`, `test/setup/instruction-*.test.mjs`,
`core/instructions/**`, `components/*/instructions/**`, `domains/*/instructions/**`.

## Steps

1. Extend unit frontmatter with `when:`, a map from fact key to a list of allowed values. Validate it in the
   registry against `start-facts.v1.json`, using the same live value sources as the Rust `FactRegistry`. An unknown
   key or value is a build error.
2. Give each existing unit a `when:` that keeps today's selection. `appliesTo` and `when:` must not drift apart:
   either map `appliesTo` onto `when:` and remove it, or derive one from the other in a single place. Choose
   whichever leaves one source.
3. `instruction-composition.mjs` stops selecting and ordering by itself. It asks
   `fgos internal start-context compose` (delivery `agent-file`, or the projection target) and renders what it gets
   back. Delete the duplicate selection and order code.
4. Add `test/setup/instruction-when-facts.test.mjs`. A unit with an unknown key or value fails, and every unit in the
   three roots passes.

## Verify

- `node scripts/run-tests.mjs test/setup` passes.
- `npm run build:skills` produces a byte-identical "fgOS Effective Instructions" projection, compared with
  `git diff --exit-code AGENTS.md`.

## Rollback

Revert the commit. The Node matcher comes back with it.
