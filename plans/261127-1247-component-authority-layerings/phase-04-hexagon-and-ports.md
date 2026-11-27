# Phase 4: Hexagon by CAS-D4 and ports

`hexagon` takes the CAS-D4 order and values; ports are declared on the contract index;
`port-wiring` is turned on, with named debt for the components not split yet (CAS-D10).

## Inputs

- DISCUSSION §3 rows 11a to 11e, 20, 21; CAS-D4, CAS-D10; §6 "Hệ quả khi thực hiện" (1) and (5).
- `packages/component-authority/model/components.yaml`, `layers.yaml`, `contracts.yaml`.
- `src/runner/` (`loop.mjs`, `anti-loop.mjs`, `recovery.mjs`, `claim-port.mjs`,
  `github-adapter.mjs`, `worktree.mjs`), `src/workflow/case-admission-port.mjs`,
  `packages/execution/rust/src/ports.rs`.
- Phase 3's `portWiringViolations`.

## Files this phase may write

`packages/component-authority/model/layers.yaml`, `packages/component-authority/model/components.yaml`,
`packages/component-authority/model/contracts.yaml`, the rendered docs listed in plan.md
(regenerated only), and `plans/261127-1247-component-authority-layerings/reports/`.

## Steps

1. Measure: with the CAS-D4 order (entry, use-case, domain, kernel, infra) applied to a scratch
   copy of the model, count `order-downward` and `port-wiring` violations per component; write
   the counts to `reports/hexagon-measure.md`.
2. Set the `hexagon` value order to CAS-D4 in `layers.yaml` and add `port-wiring` to its `rules`.
3. Reassign defaults by CAS-D4: components that reach outside fgOS (`durable-file`, `process`,
   `holder-lock`, `git`, `herdr-transport` and the like) take `infra`; `kernel` keeps only pure
   shared code (`canonical-json`, `yaml-document` parsing, `graph`, `write-scope`); `runner`,
   `workflow` and `execution-core` take `use-case`; the three Domain components that wrote
   `layer: domain` for the product meaning take the hexagon value their code actually has.
4. Split `runner` by path in `exceptions`: `github-adapter.mjs` and `worktree.mjs` take `infra`;
   `anti-loop.mjs` and `recovery.mjs` take `domain`; `claim-port.mjs` is a declared port. Prefer
   directory exceptions; use file ones when needed.
5. Declare ports on `contracts.yaml` rows with `port: {kind, implementers}` (the existing
   `*.port.v1` rows; `admission-peer` with `workflow` as implementer). Add a row only where a
   port has none, through `npm run fgos:dev -- authority declare --kind contract`.
6. Every component still breaking `port-wiring` after steps 3 to 5 goes into the `hexagon`
   layering's `debt` with a reason and a backlog id from `fgos identity mint backlog`; list the
   new backlog rows in the report for the secretary to land.
7. Regenerate the views; re-measure and append the after-counts to the report.

## Verify

`node --test test/architecture.test.mjs`, `cargo test -p component-authority` and
`npm run fgos:dev -- authority render --check` pass. The report shows zero violations outside
`debt`.

## Rollback

Revert the phase commits; phase 3's `port-wiring` check stays dormant because no layering
lists it.
