# Phase 3: Rule kinds in code

`test/architecture.test.mjs` checks every layering through one function per rule kind, chosen
by the layering's `rules` in the model (CAS-D5: rule kinds fixed in code, no rule interpreter).

## Inputs

- Phase 2's model shape (`layerings` rows in `fgos authority model --json`).
- `test/architecture.test.mjs`: the one-way import test (241-270), the tier tests (295-345),
  domain-siloing (380-420), and the edge helpers `relativeSpecifiers`, `resolvedRelativeImports`,
  `manifestEdges`.
- DISCUSSION §3 row 11e and CAS-D4 for `port-wiring`.

## Files this phase may write

- `test/architecture.test.mjs`

## Steps

1. Write `orderDownwardViolations(edges, valueOf, values)`: an edge whose importing file sits at
   the same value or above the imported file's value passes; an edge that imports an upper
   value is a violation. Use it for every layering whose `rules` holds `order-downward`; it
   replaces the one-way import test and `findTierViolations`.
2. Write `isolationViolations(edges, scopeOf)`: core never reaches a named domain, a domain never
   reaches another domain. It wraps today's `checkDomainSiloingViolation` and runs for layerings
   whose `rules` holds `isolation` (`domain-scope`, values from paths).
3. Write `portWiringViolations(edges, hexagonOf, ports, componentOf, debt)`: (a) a file outside
   `entry` and `infra` imports no `infra` file; (b) an `infra` file imports an upper value only
   when the imported file is a declared port path whose `implementers` hold the infra file's
   component; (c) components in the layering's `debt` are skipped. It runs only for layerings
   whose `rules` holds `port-wiring` (none yet; phase 4 turns it on).
4. One test per rule kind drives its function with a small fixture holding one violation and one
   allowed edge (acceptance 3), titled by behaviour.
5. One test walks the model's layerings and runs each declared rule on the real edges. Delete
   the tests it replaces, and say in the commit message which test now owns each retired one.

## Verify

`node --test test/architecture.test.mjs` passes. Each fixture test fails when its function is
stubbed to return `[]` (check once by hand, then restore).

## Rollback

Revert the phase commit.
