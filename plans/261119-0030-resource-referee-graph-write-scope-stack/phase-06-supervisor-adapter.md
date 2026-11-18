# Phase 6: Supervisor adapter

## Inputs

- The set-level function and the error policy from phase 3.
- `packages/supervision/rust/src/portfolio.rs` (`normalize`, `overlaps`, `admissible`, their tests) and its doc comment saying the rule equals the JS copy.
- `packages/supervision/rust/src/land.rs`, which already calls `fgos_write_scope` (the pattern to follow).

## Files it may write

`packages/supervision/rust/**` only. The manifest of this crate is not edited here: phase 2 already declared the dependencies.

## Steps

1. Before the swap, write a table of old-versus-new cases for `portfolio.rs::overlaps`: `src/**`, a bare `*`, an empty entry, `.`, `..`, an absolute path, a backslash, a trailing slash, a glob under a directory. Run it against the old function and record the outcomes.
2. Replace `overlaps` and `normalize` with calls to `fgos-write-scope`; keep `admissible` and its public signature. A plan with an entry that does not canonicalize is not admissible, never a panic and never disjoint, and no other plan is affected (decision 17).
3. Add a reporting function next to `admissible` that returns the named reason `footprint-entry-invalid` with the plan and the entry, and surface it through the supervisor's existing status or report output (find the place; it is the way an operator learns why a ready plan does not start).
4. Delete the old function and the comment that says the rule is kept equal to the JS copy. List every divergence from the old outcomes for the CHANGELOG (phase 9 writes it).
5. Tests: the table above, one adapter case for the malformed entry with its reported reason, and one case proving `admissible` still excludes a plan overlapping a running one. The owning test of the behaviour stays in `write-scope`.
6. Run the census scan without `--write-census` and list the changed entries against this phase's footprint.

## Verify

`cargo test -p fgos-supervision` and `rg "fn overlaps" packages/supervision` finds nothing.

## Rollback

Restore the deleted function from git.
