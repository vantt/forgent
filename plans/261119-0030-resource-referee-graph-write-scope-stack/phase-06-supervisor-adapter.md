# Phase 6: Supervisor adapter

## Inputs

- The set-level function and the error policy from phase 3.
- `packages/supervision/rust/src/portfolio.rs` (`normalize`, `overlaps`, `admissible`, their tests) and its doc comment saying the rule equals the JS copy.
- `packages/supervision/rust/src/land.rs`, which already calls `fgos_write_scope` (the pattern to follow).

## Files it may write

`packages/supervision/rust/**` only. The manifest of this crate is not edited here: phase 2 already declared the dependencies.

## Steps

1. Before the swap, write a table of old-versus-new cases for `portfolio.rs::overlaps`: `src/**`, a bare `*`, an empty entry, `.`, `..`, an absolute path, a backslash, a trailing slash, a glob under a directory. Run it against the old function and record the outcomes.
2. Replace `overlaps` and `normalize` with calls to `fgos-write-scope`; keep `admissible` and its public signature. An entry that does not canonicalize counts as overlapping everything (decision 17), never as disjoint and never a panic.
3. Delete the old function and the comment that says the rule is kept equal to the JS copy. List every divergence from the old outcomes for the CHANGELOG (phase 9 writes it).
4. Extend the existing `portfolio` tests rather than copying overlap cases: the cases live with `write-scope`; here the adapter tests are the case table, the malformed-entry rule, and one case proving `admissible` still excludes a plan overlapping a running one.

## Verify

`cargo test -p fgos-supervision` and `rg "fn overlaps" packages/supervision` finds nothing.

## Rollback

Restore the deleted function from git.
