# Phase 7: Rules block, hand guards folded

With every count at zero, the report tests become blocking checks and the hand-written layering
guards are replaced by the layering that owns them (CAS-D5, CAS-D23, L10; design principle 8:
one owning proof per behaviour).

Capability: `code:implement`.

## Inputs

- `test/architecture.test.mjs` after phase 5; `reports/measure-layerings-after.md` (all zero).
- DISCUSSION §4 CAS-D5, D23, D24 (2)(3) (which guards are layering rules and which stay).

## Files this phase may write

`test/architecture.test.mjs` only.

## Steps

1. Turn each report test into a blocking test: it fails with the list of violations, naming the
   layering, the rule, the file pair and the values.
2. Retire, in the same change, the tests whose behaviour the layering rules now own, and name
   the owner in the commit message: the import-one-way test (`hexagon` order-downward), the two
   tier tests (`stack` order-downward; keep the "every named exception still changes its value"
   check as part of the kind function), the domain-siloing loop (`domain-scope` isolation), "lower
   tiers do not import Dispatch" (`stack`: T0-T4 never import T5), the A4 reach guard with
   `WORK_LAYER_MODULES` (`stack`: T5/T6 never reach T8-delivery, through `import()`, `require()`
   and one-hop re-exports), and the `.mjs`-only coverage test (model coverage). Move their
   fixtures onto the kind functions where a case is not already covered.
3. Keep the content guards that are not dependency edges (Workflow step literal, Work-shaped
   input, config one-door, dynamic-load allowlist), per CAS-D24 (3).
4. Confirm `rg -n "WORK_LAYER_MODULES" test/` prints nothing.

## Verify

`node --test test/architecture.test.mjs` green; each retired test's behaviour has a named
fixture in a kind-function test. Pass: green and the commit message lists every retired test with
its owner.

## Rollback

Revert the phase merge; the report-mode tests and old guards come back.
