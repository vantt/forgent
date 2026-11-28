# Phase 4: Declare and locate see every layering

The declare door keeps the cleaned model clean and looks at all layerings at once; locate
answers in all four (CAS-D14, D15 (3), D20, D21).

Capability: `code:implement`.

## Inputs

- DISCUSSION §4 CAS-D14, D15 (3), D16, D20, D21.
- `packages/component-authority/rust/src/{declare,locate,model}.rs`, `rust/tests/model_checks.rs`,
  `apps/fgos/tests/authority.rs`, `packages/component-authority/model/layers.yaml`.

## Files this phase may write

Its footprint row in plan.md (runs in the same wave as phase 5; it never touches
`test/architecture.test.mjs`).

## Steps

1. `layers.yaml`: add `sameAs` on `orchestration-ring.surface` (→ `stack.T9-surface`) and
   `domain-scope.domain` (→ `stack.T7-domain`); `distinctFrom` on `hexagon.domain` naming
   `stack.T7-domain` and `domain-scope.domain`. List every value word shared across layerings
   and confirm no other pair exists.
2. `declare.rs`, refusals each with a code and a message naming what is wrong:
   - a component (new or `--update`) missing a value for any layering whose `source` is
     `declared` (CAS-D14 (1));
   - a row whose `orchestration-ring` puts it above another component that `stack` puts it
     below, along an existing dependency between them, naming both layerings and the pair
     (CAS-D14 (2)); dependencies are read from the model (contract provider/consumer edges and
     `parent`), not from code;
   - a `sameAs` pair whose two sides disagree on the row (CAS-D15 (3));
   - a row that owns nothing: no path under `coverage.roots`, no decision kind, no contract it
     provides, no door, and not designed/planned with a plan or backlog pointer (CAS-D20);
   - a `retired` status on declare, and a `live` contract whose provider is not live/designed
     (CAS-D21).
3. `model_checks.rs`: the same rules as whole-model checks, so a hand edit of the YAML fails
   `cargo test` too (one rule, called from both places, no copy).
4. `locate.rs`: each component match carries its four layering values (domain-scope derived from
   paths); a query equal to an alias that was an old id returns the successor first.
5. One test per refusal and per locate behaviour, in the file that owns it.

## Verify

`cargo test -p component-authority` and `cargo test -p fgos --test authority`; and
`npm run fgos:dev -- authority locate work-driver --json` returns `runner` first. Pass: green,
and the whole-model checks pass on the phase-3 model.

## Rollback

Revert the phase merge; data is untouched except `sameAs`/`distinctFrom` lines.
