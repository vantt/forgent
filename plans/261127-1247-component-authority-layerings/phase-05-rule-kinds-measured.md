# Phase 5: Rule kinds in report mode, measured

The three rule kinds and the new edge readers land in code, but run on the real tree in report
mode only: they count, they do not fail (CAS-D23). Their fixtures do fail, so each kind is proven
to catch a violation.

Capability: `code:implement`.

## Inputs

- DISCUSSION §4 CAS-D4, D5, D17 (2)(3), D23; §6.
- `test/architecture.test.mjs` (model reader ~60-120, import extraction ~215-225, one-way test
  241, lower-tiers test 275, tier tests 325-366, domain-siloing 384-430, A4 guards 921-1047,
  Cargo.toml reading 1947-1990); `scripts/lib/rust-source.mjs` (`lexRust`).

## Files this phase may write

`test/architecture.test.mjs` and `reports/measure-layerings.md` of this plan.

## Steps

1. One function per rule kind, taking a layering row from the model and an edge list:
   `orderDownward` (an edge from value A to value B is a violation when B stands above A in
   `values`), `isolation` (an edge between two different values of the same level),
   `portWiring` (CAS-D4 rules 3-5, with ports read from `contracts.yaml` `port`). Layering values
   per file come from the phase-2 model reader (default by component, longest-prefix exception).
2. Edge readers: Node imports (the existing extractor, extended to `require()` and a one-hop
   re-export, as the A4 guard reads them today); Rust `use crate::…`/`mod` with `lexRust` for
   `hexagon`; Cargo.toml crate dependencies mapped to the owning component for `stack`. Reuse the
   existing helpers; add nothing beside them.
3. Coverage: every file (any type) under `coverage.roots` minus `coverage.ignore` maps to exactly
   one component by longest prefix (replaces the `.mjs`-only test at line 225 when phase 7 makes
   it blocking).
4. Fixtures: one violation per rule kind that its function catches, plus an upward crate
   dependency for `stack` and a wrong-rank Rust `use` for `hexagon`. These assert and fail.
5. Report mode: one test per layering × rule and one for coverage runs the function on the real
   tree and writes the count and the list to `reports/measure-layerings.md` (counts by layering,
   rule, component); it never fails. The old checks stay as they are.
6. Run it after the CAS-D4 re-rank is applied in memory as well (infra for `durable-file`,
   `process`, `holder-lock`, `git`, `herdr-transport`; kernel only for pure shared code; the three
   Domain rows' wrong `layer: domain` fixed), so the report has both "as declared" and
   "after re-rank" `hexagon` counts.
7. Stop rule: if resolving the "after re-rank" `hexagon` count would need more than 150 new
   `exceptions` lines, stop and tell the lead, who asks the owner with the report attached
   (plan.md, "Decided by the planner"). Do not loosen a rule.

## Verify

`node --test test/architecture.test.mjs` green (fixtures fail as designed inside their tests,
report tests always pass), and `reports/measure-layerings.md` exists with a count for every
layering × rule and for coverage.

## Rollback

Revert the phase merge; the old checks were not touched.
