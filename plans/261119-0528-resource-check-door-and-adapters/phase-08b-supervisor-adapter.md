# Phase 8b: Supervisor adapter

> This phase belongs to the door plan `plans/261119-0528-resource-check-door-and-adapters`. Phases 1 to 7 and 7c are in plan A (`plans/261119-0030-resource-referee-graph-write-scope-stack`), whose decisions 1 to 29 apply.

## Inputs

- The set-level function and the error policy of plan A (phases 1 and 3).
- `packages/supervision/rust/src/portfolio.rs` (`normalize`, `overlaps`, `admissible`, their tests) and its doc comment saying the rule equals the JS copy. Nothing outside the crate's tests calls `admissible`, `overlaps` or `read_plan` today, and the draft plan `261118-1045-project-supervisor` owns the design of the crate.
- `packages/supervision/rust/src/land.rs`, which already calls `fgos_write_scope` (the pattern to follow).

## Files it may write

`packages/supervision/rust/**` only. The manifest of this crate was edited in plan A's phase 2.

## Steps

0. Tell the `project-supervisor` lane which file this phase changes, before starting.
1. Before the swap, write a table of old-versus-new cases for `portfolio.rs::overlaps`, including the glob-cut cases the old rule gets differently (`apps/fgos/tests/questions_*.rs` against `apps/fgos/tests/supervision_*.rs`), `src/**`, a bare `*`, an empty entry, an empty footprint list, `.`, `..`, an absolute path, a backslash and a trailing slash. Run it against the old function and record the outcomes.
2. Replace `overlaps` and `normalize` with calls to `fgos-write-scope`; keep `admissible` and its public signature. A plan with an entry that does not canonicalize, or with an empty or missing footprint, is not admissible, never a panic and never disjoint, and no other plan is affected (decision 17). A truncated answer makes every candidate not admissible with that reason.
3. Add a reporting function next to `admissible` that returns the named reason (`footprint-entry-invalid`, `footprint-empty`, `facts-truncated`) with the plan and the entry. It is proven by a crate test; no running door reads it yet and this phase adds no output surface.
4. Delete the old function and the comment that says the rule is kept equal to the JS copy. List every divergence from the old outcomes for the CHANGELOG (phase 9 writes it, noting that admission is not wired to a running door).
5. Tests: the table above, one adapter case for the malformed entry and one for the empty footprint with their reasons, and one case proving `admissible` still excludes a plan overlapping a running one. The owning test of the behaviour stays in plan A's `write-scope`.
6. List the census entries this phase changed against its footprint.

## Verify

`cargo test -p fgos-supervision` and `rg "fn overlaps" packages/supervision` finds nothing.

## Rollback

Restore the deleted function from git.
