# Phase 10: Resource claim space in the referee

Decision: OS-D14 (heavy machine resources are caps judged by the resource referee through its existing door; no
second referee).

## Inputs

- `packages/resource-referee/contracts/resource-referee.v1.json` (claim spaces `path`, `ref`, `port`; the referee
  compares nothing itself, the door computes collisions per space).
- `packages/resource-referee/rust/src/catalog.rs`, `facts.rs`; `apps/fgos/src/wiring/resource_check.rs` (the door).
- `docs/platform/resource-referee/spec.md`.

## Footprint

`packages/resource-referee/contracts/resource-referee.v1.json`, `packages/resource-referee/rust/src/catalog.rs`,
`packages/resource-referee/rust/src/facts.rs`, `packages/resource-referee/rust/tests/referee.rs`,
`apps/fgos/src/wiring/resource_check.rs`.

## Steps

1. Add claim space `resource` to the contract: `{ "space": "resource", "comparison": "equality", "meaning": "a named
   machine resource slot, such as gpu#1; a resource with capacity N is declared as N slots" }`.
2. In the door, compute `resource` collisions by exact equality, as for `ref` and `port`.
3. Add a door entry the keeper can call later (phase 5): given the claims of running players and the claims of one
   candidate, answer `free` or `held` with the colliding slot. It is the same evaluation as `--units` with two
   nodes; do not add a second evaluator.

## Verify

`cargo test -p fgos-resource-referee --test referee` and `cargo test -p fgos --test cli_tests resource_check`
(or the existing resource-check CLI test). Pass: two units claiming `gpu#1` collide; `gpu#1` and `gpu#2` do not; an
unknown space is still refused by name (`claim-space-unknown`).

## Rollback

Revert the phase commit; no stored state uses the new space.
