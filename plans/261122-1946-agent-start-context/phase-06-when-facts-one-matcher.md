# Phase 6: Units select by `when:` facts; one matcher

The static door of ASC-D6, and the setup-time matcher folded into the composer (the council's condition).

**Gate: owner question 1 in plan.md.** The owner noted on 2026-11-22 that the discussion covered only the door and
injection, not rule choice, and that this phase goes further. Its scope is confirmed with the owner before it is
built, and DOCOS is told when the `when:` field list is fixed (owner approval, point 4). Until then this phase stays
`draft` even when phase 5 is done.

## Inputs

- `src/setup/instruction-registry.mjs` (frontmatter validation, `appliesTo` at lines 308-317, carried as both
  `appliesTo` and `applicability` at lines 379-380) and `src/setup/instruction-composition.mjs` (547 lines; authority
  order at line 66).
- `packages/agent-start-context/contracts/start-facts.v1.json`.
- Unit roots: `core/instructions/` (4 units today), `components/*/instructions/` (one root:
  `components/packaging-distribution/instructions/`), `domains/*/instructions/` (one root:
  `domains/coding/instructions/`).
- The projection's only generator: `npm run build:skills` (`materializeInstructionProjection`,
  `src/setup/instruction-projections.mjs:330`).

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
   back. Delete the duplicate selection and order code. State how the build finds the host binary
   (`FGOS_HOST_BIN` or the activated release) and fail with a named error when none is found.
4. Add `test/setup/instruction-when-facts.test.mjs`. A unit with an unknown key or value fails, and every unit in the
   three roots passes.

## Verify

- `node scripts/run-tests.mjs test/setup` passes.
- `npm run build:skills` produces a byte-identical "fgOS Effective Instructions" projection, compared with
  `git diff --exit-code AGENTS.md`.

## Rollback

Revert the commit. The Node matcher comes back with it.
