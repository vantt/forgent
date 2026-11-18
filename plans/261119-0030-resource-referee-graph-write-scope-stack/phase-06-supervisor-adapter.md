# Phase 6: Supervisor adapter

## Inputs

- The set-level function from phase 3.
- `packages/supervision/rust/src/portfolio.rs` (`overlaps`, `admissible`, their tests) and its doc comment saying the rule equals the JS copy.
- `packages/supervision/rust/src/land.rs`, which already calls `fgos_write_scope` (the pattern to follow).

## Files it may write

`packages/supervision/rust/**` only. The `Cargo.toml` of this crate is not edited here: phase 2 already declared the dependencies.

## Steps

1. Replace the private `overlaps` and its normaliser with a call to `fgos-write-scope`; keep `admissible` and its public signature.
2. Delete the old function and the comment that says the rule is kept equal to the JS copy.
3. Extend the existing `portfolio` tests rather than copying overlap cases: the cases live with `write-scope`; here one test proves `admissible` still excludes a plan overlapping a running one.

## Verify

`cargo test -p fgos-supervision` and `rg "fn overlaps" packages/supervision` finds nothing.

## Rollback

Restore the deleted function from git.
