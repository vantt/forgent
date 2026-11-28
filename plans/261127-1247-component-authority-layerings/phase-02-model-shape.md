# Phase 2: Model shape, values and every caller

The model takes its new shape in one step and every reader moves with it (L10). No new rule is
enforced yet: the existing checks keep their meaning, reading the new field names.

Capability: `code:implement`.

## Inputs

- The landed spec `docs/platform/component-authority/spec.md` (phase 1).
- DISCUSSION §4 CAS-D6..D9, D12, D13, D15 (2)(3), D16, D17 (1)(2), D18, D19, and the §7 scan
  table `#scan-layerings` (draft values per row).
- `packages/component-authority/model/{layers,components,contracts}.yaml`,
  `contracts/model.v1.json`, `rust/src/{model,declare,locate,render}.rs`,
  `rust/tests/model_checks.rs`, `apps/fgos/tests/authority.rs:522`,
  `test/architecture.test.mjs:60-120,225-370`, `test/report/decision-index.test.mjs:245-265`.
- `plans/261127-1247-component-authority-layerings/reports/host-runtime-row.json`.

## Files this phase may write

Its footprint row in plan.md: the model directory, the schema, the crate's `src/` and `tests/`,
`apps/fgos/tests/authority.rs`, `test/architecture.test.mjs`,
`test/report/decision-index.test.mjs`, and the seven rendered docs.

## Steps

1. Baseline: run `node --test test/architecture.test.mjs` and `cargo test -p component-authority`
   on the untouched worktree and record pass/fail counts in the phase report.
2. Host step (lead): `fgos authority declare --kind component --row plans/261127-1247-component-authority-layerings/reports/host-runtime-row.json --approved-by q-o2r2zblera --dir <worktree>`
   with the activated release, before any edit, so the row is checked by today's door. Move the
   11 contracts whose `provider` is `host-invocation-routing` to `host-runtime` in
   `contracts.yaml`.
3. `layers.yaml`: replace `layers`, `rules`, `tierNames`, `tierExceptions` with `layerings`
   (four rows, every CAS-D8 field). `hexagon` values entry, use-case, domain, kernel, infra;
   `stack` values `T9-surface` .. `T0-native` with `T4-agent-runtime`, `T7-domain`,
   `T8-delivery`, each `meaning` taken from the old `tierNames` text (rewritten for the swap);
   `orchestration-ring` values surface, orchestrator, launcher, router, driver, dispatcher, none
   with CAS-D16/D18 meanings and old ring names as `aliases`; `domain-scope` core/domain,
   `source: fromPaths`. Rules: hexagon `[order-downward, port-wiring]`, stack `[order-downward]`,
   ring `[order-downward]`, domain-scope `[isolation]`. Keep `domains`. Add `coverage: {roots:
   [src/, bin/, packages/, apps/, domains/], ignore: [...]}` in the model (ignore: build output,
   fixtures and vendored trees found by listing the roots; each ignore line commented with why).
4. `components.yaml` (mechanical): `layer` → `hexagon` (same value for now), `tier: N` →
   `stack: T<N>-<name>` with 7 and 8 swapped (Work rows to `T8-delivery`, Domain rows to
   `T7-domain`), exceptions `layer`/`tier` renamed the same way, `src/report/knowledge-resolver.mjs`
   exception to `T8-delivery` (CAS-D13). Add `orchestration-ring` to every live/designed row from
   the scan table (D16 values). Retired rows get no layering field. Merge `source` into `paths`
   and delete `source`; split the crate pairs of CAS-D17 (1) so the parent keeps the crate and the
   child the deeper directory.
5. Schema `model.v1.json`: new `layerings` and `coverage` defs; component and exception value
   fields typed as strings whose allowed values the Rust loader checks against `layerings`
   (the schema carries no enum of value names); `layer`, `tier`, `source`, `tierNames`,
   `tierExceptions`, `layers`, `rules` removed.
6. Rust: `model.rs` loads layerings, coverage and per-component values (a map keyed by layering
   id), and refuses each old field by name with the new field's name; `declare.rs` loses
   `LAYER_NAMES` and `TIER_RANGE` and validates values against the loaded layerings; the empty
   bootstrap model has no layering; `locate.rs` and `render.rs` read the new fields (render's
   tables show `hexagon`, `stack`, `orchestration-ring`; "Source links" reads `paths`). Move every
   fixture and test (`model_checks.rs`, crate unit tests, `apps/fgos/tests/authority.rs`).
7. `test/architecture.test.mjs`: the model reader (lines ~60-120) builds file → value maps from
   the new fields; the one-directional and tier tests read the value order from the model instead
   of their own lists; meaning unchanged. `test/report/decision-index.test.mjs` fixture model in
   the new shape.
8. Render: `npm run fgos:dev -- authority render` (worktree code), then `authority render --check`.

## Verify

`cargo test -p component-authority`, `cargo test -p fgos --test authority`,
`node --test test/architecture.test.mjs test/report/decision-index.test.mjs`, then
`rg -n "LAYER_NAMES|TIER_RANGE|tierNames|tierExceptions" packages/component-authority` prints
nothing outside the old-field refusal and its test. Pass: all green, same architecture-test
pass count as the baseline.

## Rollback

Revert the phase merge; it restores `layer`/`tier`/`source` and removes `host-runtime`.
