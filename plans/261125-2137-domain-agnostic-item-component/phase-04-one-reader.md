# Phase 4: One reader

Status: draft (waits on phase 1 for the component's paths). Decision: A7.

## Inputs
- `apps/fgos/src/wiring/portfolio.rs` (1145 lines: parse, check, index, `create_item`, `edit_item`).
- `packages/supervision/rust/src/portfolio.rs` (525 lines, plan reader) and its consumers `wake.rs`, `supervisor.rs`, `tests/portfolio.rs`, `tests/wake.rs`.
- Consumers in `apps/fgos/src/wiring/`: `resource_check.rs`, `session_write_publish.rs`, `supervision.rs`, `migrate.rs`; `apps/fgos/tests/portfolio_check.rs`.
- The v2 contract from phase 2.

## Footprint
- `packages/portfolio/rust/**` (new crate `fgos-portfolio`), `Cargo.toml`, `Cargo.lock`
- `packages/portfolio/{item,discussion,index-generator,portfolio-check,vocabulary}.mjs` (deleted), `test/portfolio/**`
- `apps/fgos/**`, `packages/supervision/rust/**`

## Steps
1. Create crate `packages/portfolio/rust` (`fgos-portfolio`) and add it to the workspace members.
2. Move the parse, check and index code of `apps/fgos/src/wiring/portfolio.rs` into the crate, reading v2 (initiatives in both folders, plans with `initiative:`, phases from the phase table, discussions) and the lenient id rule.
3. Merge Supervision's plan reader into the same crate as one reader; give Supervision a dependency on the crate.
4. Move every consumer listed in Inputs to the crate and keep `land`, `migrate portfolio` and `resource-check` behaviour unchanged.
5. Delete `apps/fgos/src/wiring/portfolio.rs`, `packages/supervision/rust/src/portfolio.rs`, the Node twin `packages/portfolio/*.mjs` and `test/portfolio/portfolio-check.test.mjs`; move their behaviour proofs into the crate's tests (one owning proof each, design principle 8) and name in the commit which test now owns each.
6. Run the crate and workspace tests.

## Verify
`cargo test --workspace` passes; `rg -l "wiring::portfolio|supervision::portfolio" apps packages` finds nothing; `npm test` passes.

## Rollback
`git revert` the phase commit; both old readers return.
